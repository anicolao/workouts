<script lang="ts">
  import { onMount } from "svelte";
  import { analyzeFood, type NutritionEstimate } from "$lib/gemini";
  import { searchFoodImage } from "$lib/image-search";
  import { uploadImage, type GoogleDriveFile } from "$lib/sheets";
  import {
    dispatchEvent,
    store,
    type RootState,
    type LogEntry,
    type FavouriteItem,
  } from "$lib/store";
  import { signIn } from "$lib/auth";
  import { toasts } from "$lib/toast";
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import { page } from "$app/stores";
  import exifr from "exifr";
  import {
    createPickerSession,
    pollPickerSession,
    listSessionMediaItems,
  } from "$lib/google-photos";

  import LogSheet from "$lib/components/ui/LogSheet.svelte";
  import InputGrid from "$lib/components/ui/InputGrid.svelte";
  import TextInputModal from "$lib/components/ui/TextInputModal.svelte";
  import VoiceRecorder from "$lib/components/ui/VoiceRecorder.svelte";
  import NutritionForm from "$lib/components/ui/NutritionForm.svelte";
  import FavouritesPicker from "$lib/components/ui/FavouritesPicker.svelte";

  let fileInput = $state<HTMLInputElement>();
  let cameraInput = $state<HTMLInputElement>();

  type LogMode =
    | "IDLE"
    | "CAMERA"
    | "VOICE"
    | "TEXT"
    | "LIBRARY"
    | "LOG_AGAIN"
    | "FAVOURITES";
  let currentMode = $state<LogMode>("IDLE");

  // let showPhotosSelector = $state(false); // Unused, logic handled by picker

  type AttachedMedia = {
    tempId: string;
    file: File;
    previewUrl: string;
    uploadPromise: Promise<GoogleDriveFile | null>;
  };

  let attachedMedia: AttachedMedia[] = $state([]);
  let imagePreviews = $derived(attachedMedia.map((m) => m.previewUrl)); // Compatibility derived

  let contextEntry = $state<LogEntry | null>(null);
  let showFavouritesPicker = $state(false);
  let favourites = $state<FavouriteItem[]>([]);

  let analyzing = $state(false);

  // Flat State for inputs to avoid reactivity issues with Svelte 5 nested objects
  let itemName = $state("");
  let rationale = $state("");
  let nutrition = $state({
    calories: 0,
    fat: 0,
    carbs: 0,
    protein: 0,
    details: {} as any,
  });

  let mealType: "Breakfast" | "Lunch" | "Dinner" | "Snack" = $state("Snack");
  // Init with local date YYYY-MM-DD
  let entryDate = $state(
    (() => {
      const d = new Date();
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    })(),
  );
  let entryTime = $state(
    new Date().toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  );

  // Derived display values for custom inputs
  let displayDate = $derived(entryDate); // ISO string is already what we want: YYYY-MM-DD
  let displayTime = $derived(
    (() => {
      if (!entryTime) return "--:--";
      const [h, m] = entryTime.split(":").map(Number);
      const suffix = h >= 12 ? "PM" : "AM";
      const h12 = h % 12 || 12;
      return `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${suffix}`;
    })(),
  );

  let showCorrectionInput = $state(false);
  let userCorrection = $state("");
  let isSaving = $state(false);

  // Sheet State
  // We consider the sheet 'open' (preview mode) if we have images, pending text data with "AI Found" image, OR if we are analyzing
  let sheetOpen = $derived(
    attachedMedia.length > 0 || analyzing || itemName.length > 0,
  );

  function updateMealType(dateObj: Date) {
    const hour = dateObj.getHours();
    if (hour < 11) mealType = "Breakfast";
    else if (hour < 16) mealType = "Lunch";
    else if (hour < 22) mealType = "Dinner";
    else mealType = "Snack";
  }

  // --- Google Photos Logic ---
  let pickerUri = $state<string | null>(null);
  let pickerSessionId = $state<string | null>(null);
  let pickerWindow = $state<Window | null>(null);
  let pickerPollInterval = $state<any>(null);

  // Pre-fetch session when page mounts to enable synchronous Click-to-Open
  onMount(() => {
    // Check for Log Again context
    const fromId = $page.url.searchParams.get("from_entry");
    if (fromId) {
      const state = store.getState();
      const found = state.projections.log.find((e: LogEntry) => e.id === fromId);
      if (found) contextEntry = JSON.parse(JSON.stringify(found));
    }

    updateMealType(new Date());
    initPickerSession();

    const handleVisibility = () => {
      if (document.visibilityState === "visible" && pickerSessionId) {
        console.log("App visible, checking picker status...");
        checkPickerSession();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      stopPollingPicker();
    };
  });

  async function initPickerSession() {
    try {
      // Check if signed in first to avoid immediate prompt on load if not needed
      const token = await import("$lib/auth").then((m) => m.ensureValidToken());
      if (!token) return; // Wait for explicit sign in if no token

      console.log("Pre-fetching Google Photos Picker session...");
      const session = await createPickerSession();
      pickerSessionId = session.id;
      let uri = session.pickerUri;
      if (!uri.endsWith("/autoclose"))
        uri = uri.endsWith("/") ? `${uri}autoclose` : `${uri}/autoclose`;
      pickerUri = uri;
    } catch (e) {
      console.warn("Failed to pre-fetch picker session", e);
    }
  }

  async function handleGooglePhotosPick() {
    if (!pickerUri) {
      // If no URI yet (e.g. not signed in), try to sign in and initiate
      const token = await import("$lib/auth").then((m) => m.ensureValidToken());
      if (!token) {
        signIn();
        // After sign in, we can't synchronously open, but we can try to init for next time
        setTimeout(initPickerSession, 1000);
      } else {
        // Token exists but init failed? Retry once
        await initPickerSession();
        if (pickerUri) {
          toasts.info("Photos ready. Please tap again.");
        } else {
          toasts.error(
            "Could not initialize Google Photos. Please check network.",
          );
        }
      }
      return;
    }

    // Synchronous open
    pickerWindow = window.open(pickerUri, "_blank");
    startPollingPicker();
  }

  function startPollingPicker() {
    stopPollingPicker();
    pickerPollInterval = setInterval(() => checkPickerSession(), 2000);
  }

  function stopPollingPicker() {
    if (pickerPollInterval) {
      clearInterval(pickerPollInterval);
      pickerPollInterval = null;
    }
  }

  async function checkPickerSession() {
    if (!pickerSessionId) return;
    try {
      const sessionStatus = await pollPickerSession(pickerSessionId);
      if (sessionStatus.mediaItemsSet) {
        stopPollingPicker();
        if (pickerWindow && !pickerWindow.closed) pickerWindow.close();

        const items = await listSessionMediaItems(pickerSessionId);
        if (items.length > 0) {
          const token = await import("$lib/auth").then(
            async (m) => (await m.ensureValidToken()) || "",
          );
          for (const item of items) {
            await processPickedItem(item, token);
          }
          // Reset session for next time
          pickerSessionId = null;
          pickerUri = null;
          initPickerSession();
        }
      }
    } catch (e) {
      console.error("Picker poll failed", e);
    }
  }

  async function processPickedItem(item: any, token: string) {
    if (!item.baseUrl) return;
    if (item.creationTime && attachedMedia.length === 0) {
      const date = new Date(item.creationTime);
      entryDate = date.toISOString().split("T")[0];
      entryTime = date.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      });
      updateMealType(date);
    }
    let fetchUrl = item.baseUrl;
    if (fetchUrl.includes("drive.google.com/thumbnail")) {
      const match = fetchUrl.match(/id=([^&]+)/);
      if (match)
        fetchUrl = `https://www.googleapis.com/drive/v3/files/${match[1]}?alt=media`;
    } else if (fetchUrl.includes("googleusercontent.com")) {
      fetchUrl = `${fetchUrl}=w2048-h2048`;
    }
    try {
      const res = await fetch(fetchUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const blob = await res.blob();
        const file = new File(
          [blob],
          item.filename || `photo-${Date.now()}.jpg`,
          { type: item.mimeType || blob.type || "image/jpeg" },
        );
        await addImage(file);
      }
    } catch (e) {
      console.error("Failed to download media", e);
    }
  }

  async function handleFileSelect(e: Event) {
    const target = e.target as HTMLInputElement;
    if (target.files) {
      for (let i = 0; i < target.files.length; i++) {
        await addImage(target.files[i]);
      }
    }
  }

  let analysisTimer: NodeJS.Timeout;

  async function addImage(
    file: File,
    triggerAnalysis: boolean = true,
    skipExif: boolean = false,
  ) {
    if (!skipExif) {
      try {
        const exifData = await exifr.parse(file);
        if (exifData && (exifData.DateTimeOriginal || exifData.CreateDate)) {
          const date = exifData.DateTimeOriginal || exifData.CreateDate;
          // Date to Local YYYY-MM-DD
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");
          entryDate = `${year}-${month}-${day}`;

          entryTime = date.toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          });
          updateMealType(date);
        } else if (attachedMedia.length === 0) {
          const date = new Date(file.lastModified || Date.now());
          // Date to Local YYYY-MM-DD
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");
          entryDate = `${year}-${month}-${day}`;

          entryTime = date.toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          });
          updateMealType(date);
        }
      } catch (e) {
        console.warn("EXIF parse failed", e);
      }
    }

    const tempId = crypto.randomUUID();
    const folderId =
      (store.getState() as RootState).config?.folderId || undefined;

    // Start Upload Immediately
    store.dispatch(
      dispatchEvent("media/uploadStarted", {
        tempId,
        mimeType: file.type,
        name: file.name,
        size: file.size,
        context: "log_entry",
        timestamp: new Date().toISOString(),
      }),
    );

    const uploadPromise = uploadImage(
      file,
      `FoodLog-${Date.now()}-${file.name}`,
      folderId,
    )
      .then((driveFile) => {
        store.dispatch(
          dispatchEvent("media/uploadCompleted", {
            tempId,
            providerId: driveFile.id,
            url: driveFile.thumbnailLink || driveFile.webViewLink,
            timestamp: new Date().toISOString(),
          }),
        );
        return driveFile;
      })
      .catch((e) => {
        store.dispatch(
          dispatchEvent("media/uploadFailed", {
            tempId,
            reason: e instanceof Error ? e.message : String(e),
            timestamp: new Date().toISOString(),
          }),
        );
        return null;
      });

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        const previewUrl = e.target.result as string;

        attachedMedia = [
          ...attachedMedia,
          {
            tempId,
            file,
            previewUrl,
            uploadPromise,
          },
        ];

        if (triggerAnalysis) {
          if (analysisTimer) clearTimeout(analysisTimer);
          analysisTimer = setTimeout(() => {
            runAnalysis();
          }, 500);
        }
      }
    };
    reader.readAsDataURL(file);
  }

  async function runAnalysis(correction?: string) {
    if (imagePreviews.length === 0) return;

    analyzing = true;
    const requestId = crypto.randomUUID();

    try {
      // Force render tick to ensure 'analyzing' state is visible even if analyzeImage fails fast
      await new Promise((r) => setTimeout(r, 1));

      store.dispatch(
        dispatchEvent("ai/analysisRequested", {
          requestId,
          inputType: "image",
          contentLength: attachedMedia.length,
          mediaIds: attachedMedia.map((m) => m.tempId),
        }),
      );

      const images = attachedMedia.map((media, i) => {
        try {
          return {
            base64: media.previewUrl.split(",")[1],
            mimeType: media.previewUrl.split(";")[0].split(":")[1],
          };
        } catch (e) {
          console.error(`Failed to parse image ${i}`, e);
          toasts.error("Failed to process one or more images");
          throw e;
        }
      });

      const previousRationale = rationale;
      // Use analyzeFood which supports both
      const result = await analyzeFood(
        {
          images: images.length > 0 ? images : undefined,
          text:
            currentMode === "TEXT" || currentMode === "VOICE"
              ? rationale
              : undefined,
        },
        correction ? previousRationale : undefined,
        correction,
      );

      itemName = result.item_name || "";
      rationale = result.rationale || "";
      nutrition.calories = result.calories || 0;
      nutrition.protein = result.protein || 0;
      nutrition.carbs = result.carbohydrates?.total || 0;
      nutrition.fat = result.fat?.total || 0;
      nutrition.details = result.details || {};

      if (correction) {
        showCorrectionInput = false;
        userCorrection = "";
      }

      store.dispatch(
        dispatchEvent("log/aiEstimateReceived", {
          requestId, // tracing
          imagesCount: attachedMedia.length,
          rawJson: result,
        }),
      );
    } catch (e) {
      console.error("Analysis failed", e);
      store.dispatch(
        dispatchEvent("ai/analysisFailed", {
          requestId,
          error: e instanceof Error ? e.message : String(e),
        }),
      );
      toasts.error("Gemini analysis failed. Please try again.");
    } finally {
      analyzing = false;
    }
  }

  async function handleTextAnalyze(text: string) {
    currentMode = "IDLE"; // Close modal
    sheetOpen = true; // Open the log sheet to show progress/results

    analyzing = true;
    const requestId = crypto.randomUUID();

    try {
      store.dispatch(
        dispatchEvent("ai/analysisRequested", {
          requestId,
          inputType: "text",
          contentLength: text.length,
        }),
      );

      // 1. Get Nutrition Analysis
      const result = await analyzeFood({ text });
      applyAnalysisResult(result, requestId);

      // 2. Fetch Representative Image
      if (result.searchQuery) {
        const imageUrl = await searchFoodImage(result.searchQuery);

        if (!imageUrl) {
          console.log("No representative image found.");
          return;
        }

        // Fetch the image to convert to a File object (needed for Drive upload)
        // If fails (CORS/403), use URL directly (fallback)
        try {
          const res = await fetch(imageUrl);

          // Double check it's not a 404 before proceeding
          if (res.status === 404) {
            console.warn("Image URL is 404, valid image not found.");
            return;
          }

          if (res.ok) {
            const blob = await res.blob();
            const file = new File(
              [blob],
              `${result.searchQuery.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.jpg`,
              { type: blob.type },
            );
            // PASS FALSE to skip re-analysis!
            // PASS TRUE to skip EXIF (use current time for search/generated images)
            await addImage(file, false, true);
          } else {
            // Only fallback if it's NOT a 404 (e.g. 403 or opaque might be loadable via img tag)
            console.warn("Failed to fetch matched image, using direct URL");
            // if (attachedMedia.length === 0) ... complex fallback, simplified to skip for now to maintain type safety
          }
        } catch (err) {
          // Network/CORS error on verification - optimistic usage
          console.error(
            "Network error fetching matched image, using direct URL",
            err,
          );
          // Direct URL fallback not supported with Upload on Pick as we need a File object
          // But we might be able to create a dummy file? Or just fallback to NO image upload but showing it?
          // For now, let's just create a dummy file wrapper if we strongly want to support this edge case
          // or just skip image.
        }
      }
    } catch (e) {
      console.error(e);
      store.dispatch(
        dispatchEvent("ai/analysisFailed", {
          requestId,
          error: e instanceof Error ? e.message : String(e),
        }),
      );
      toasts.error("Analysis failed");
    } finally {
      analyzing = false;
    }
  }

  function applyAnalysisResult(result: NutritionEstimate, requestId?: string) {
    itemName = result.item_name || "";
    rationale = result.rationale || "";
    nutrition.calories = result.calories || 0;
    nutrition.protein = result.protein || 0;
    nutrition.carbs = result.carbohydrates?.total || 0;
    nutrition.fat = result.fat?.total || 0;
    nutrition.details = result.details || {};

    store.dispatch(
      dispatchEvent("log/aiEstimateReceived", {
        requestId,
        imagesCount: attachedMedia.length,
        rawJson: result,
        inputType: "text",
      }),
    );
  }

  function handleReanalyze() {
    if (!userCorrection) return;
    runAnalysis(userCorrection);
  }

  async function handleSubmit() {
    // We allow saving if we have images OR if we have populated data (itemName)
    if ((attachedMedia.length === 0 && !itemName) || isSaving) return;
    isSaving = true;
    try {
      let driveUrls = "";

      const mediaIds = attachedMedia.map((m) => m.tempId);

      // Wait for existing uploads
      const uploadPromises = attachedMedia.map((m) => m.uploadPromise);

      // Use Promise.race to maintain responsiveness
      const timeoutProm = new Promise<null>((resolve) =>
        setTimeout(() => resolve(null), 3000),
      );

      // We use allSettled to get what we can (implicitly via existing catch blocks in addImage)
      const raceResult = await Promise.race([
        Promise.all(uploadPromises),
        timeoutProm,
      ]);

      if (raceResult) {
        // All finished (or failed) within 3s
        const files = raceResult;
        driveUrls = attachedMedia
          .map((m, i) => {
            const f = files[i];
            // 1. If we have a new upload file, use it
            if (f) {
              if (f.thumbnailLink) return f.thumbnailLink;
              if (f.id)
                return `https://drive.google.com/thumbnail?id=${f.id}&sz=w2048`;
              if (f.webViewLink) return f.webViewLink;
            }
            // 2. If no new upload (null result), check if it was an existing remote image
            if (m.previewUrl && m.previewUrl.startsWith("http")) {
              return m.previewUrl;
            }
            return null;
          })
          .filter((u) => u !== null)
          .join(", ");
      } else {
        console.warn(
          "Image upload timed out (backgrounding). Saving entry with pending media.",
        );
        // Fallback: Best effort to save what we have locally
      }

      const isoDateTime = new Date(`${entryDate}T${entryTime}`).toISOString();

      // Construct object for Redux/Storage, avoiding proxy issues by using plain collected values
      const form = {
        item_name: itemName,
        rationale,

        calories: nutrition.calories,
        protein: nutrition.protein,
        carbohydrates: { total: nutrition.carbs },
        fat: { total: nutrition.fat },
        details: nutrition.details,
      };

      const entry = {
        id: crypto.randomUUID(),
        date: entryDate,
        time: entryTime,
        mealType,
        description: itemName,
        rationale,
        calories: nutrition.calories,
        fat: nutrition.fat,
        carbs: nutrition.carbs,
        protein: nutrition.protein,
        imageDriveUrl: driveUrls,
        mediaIds: mediaIds, // Link to lifecycle events
        rawJson: JSON.parse(JSON.stringify(form)),
        details: JSON.parse(JSON.stringify(nutrition.details)),
      };

      store.dispatch(
        dispatchEvent("log/entryConfirmed", {
          entry: JSON.parse(JSON.stringify(entry)),
        }),
      );

      // Old direct append removed. Using middleware.

      goto(`${base}/`);
    } catch (e) {
      console.error("Failed to save", e);
      // Should we navigate anyway? Or show error?
      // If critical save error, stay here.
      isSaving = false;
    }
  }

  function handleCloseSheet() {
    if (confirm("Discard entry?")) {
      resetForm();
    }
  }

  function resetForm() {
    attachedMedia = [];
    itemName = "";
    rationale = "";
    nutrition.calories = 0;
    nutrition.protein = 0;
    nutrition.carbs = 0;
    nutrition.fat = 0;
    nutrition.details = {};
    showCorrectionInput = false;
    userCorrection = "";
    currentMode = "IDLE";
  }

  function handleModeSelect(mode: LogMode) {
    if (mode === "IDLE") return;
    if (mode === "CAMERA") {
      // Trigger native camera capture
      cameraInput?.click();
    } else if (mode === "LIBRARY") {
      handleGooglePhotosPick();
    } else if (mode === "LOG_AGAIN") {
      if (!contextEntry) return; // Should be hidden anyway

      itemName = contextEntry.description;
      rationale = contextEntry.rationale || "";
      nutrition.calories = contextEntry.calories;
      nutrition.protein = contextEntry.protein;
      nutrition.carbs = contextEntry.carbs;
      nutrition.fat = contextEntry.fat;
      nutrition.details = contextEntry.details || {};

      // Copy images if any
      if (contextEntry.imageDriveUrl) {
        const urls = contextEntry.imageDriveUrl
          .split(",")
          .map((u) => u.trim())
          .filter((u) => u);
        attachedMedia = urls.map((url) => ({
          tempId: crypto.randomUUID(),
          file: new File([""], "existing-image", { type: "image/jpeg" }), // Dummy file, logic handles URL
          previewUrl: url,
          uploadPromise: Promise.resolve(null), // Already uploaded
        }));
      }

      // Dispatch Log Again Event to track metrics/favourites
      store.dispatch(
        dispatchEvent("log/logAgain", {
          sourceEntryId: contextEntry.id,
          description: contextEntry.description,
          timestamp: new Date().toISOString(),
        }),
      );

      // Sheet opens automatically due to $derived sheetOpen checking itemName length
    } else if (mode === "FAVOURITES") {
      const state = store.getState();
      const favs = state.projections.favourites || [];
      if (favs.length === 0) {
        toasts.info("Create favourites by visiting an old entry and logging.");
      } else {
        favourites = favs;
        showFavouritesPicker = true;
      }
    } else {
      currentMode = mode;
    }
  }

  function handleFavouriteSelect(e: CustomEvent<FavouriteItem>) {
    const item = e.detail;
    showFavouritesPicker = false;

    itemName = item.description;
    nutrition.calories = item.defaultNutrition.calories;
    nutrition.protein = item.defaultNutrition.protein;
    nutrition.carbs = item.defaultNutrition.carbs;
    nutrition.fat = item.defaultNutrition.fat;
    nutrition.details = item.defaultNutrition.details || {};

    // Copy images if any
    if (item.defaultImage) {
      const urls = item.defaultImage
        .split(",")
        .map((u) => u.trim())
        .filter((u) => u);
      attachedMedia = urls.map((url) => ({
        tempId: crypto.randomUUID(),
        file: new File([""], "existing-image", { type: "image/jpeg" }), // Dummy file, logic handles URL
        previewUrl: url,
        uploadPromise: Promise.resolve(null), // Already uploaded
      }));
    }

    // Dispatch logAgain to increment usage count
    store.dispatch(
      dispatchEvent("log/logAgain", {
        sourceEntryId: "favourite",
        description: item.description,
        timestamp: new Date().toISOString(),
      }),
    );
  }
</script>

<div class="log-page">
  <!-- Unified Grid -->
  <div class="start-ui">
    <h1>Log Food</h1>

    <InputGrid {contextEntry} on:select={(e) => handleModeSelect(e.detail)} />

    {#if currentMode === "TEXT"}
      <TextInputModal
        on:close={() => (currentMode = "IDLE")}
        on:analyze={(e) => handleTextAnalyze(e.detail)}
      />
    {/if}

    {#if currentMode === "VOICE"}
      <VoiceRecorder
        on:close={() => (currentMode = "IDLE")}
        on:analyze={(e: CustomEvent) => handleTextAnalyze(e.detail)}
      />
    {/if}

    {#if showFavouritesPicker}
      <FavouritesPicker
        {favourites}
        on:select={handleFavouriteSelect}
        on:close={() => (showFavouritesPicker = false)}
      />
    {/if}

    <input
      type="file"
      accept="image/*"
      multiple
      bind:this={fileInput}
      onchange={handleFileSelect}
      hidden
    />
    <input
      type="file"
      accept="image/*"
      capture="environment"
      bind:this={cameraInput}
      onchange={handleFileSelect}
      hidden
    />
  </div>

  <LogSheet open={sheetOpen} onClose={handleCloseSheet}>
    <div class="sheet-content">
      <div class="preview-strip">
        {#each imagePreviews as preview}
          <img
            src={preview}
            alt="Thumb"
            class="sheet-thumb"
            referrerpolicy="no-referrer"
            onerror={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        {/each}
        <button class="add-more-btn" onclick={() => fileInput?.click()}
          >+</button
        >
      </div>

      {#if analyzing}
        <div class="analyzing-state">
          <div class="magic-sparkle">✨</div>
          <p>Analyzing {imagePreviews.length} images with Gemini...</p>
        </div>
      {:else}
        <div class="form-grid">
          <div class="split-row">
            <div class="field">
              <label
                >Date
                <div class="custom-input-wrapper bg-input">
                  <span class="value-text">{displayDate}</span>
                  <span class="input-icon">📅</span>
                  <input
                    type="date"
                    bind:value={entryDate}
                    class="native-input-overlay"
                  />
                </div>
              </label>
            </div>
            <div class="field">
              <label
                >Time
                <div class="custom-input-wrapper bg-input">
                  <span class="value-text">{displayTime}</span>
                  <span class="input-icon">🕒</span>
                  <input
                    type="time"
                    bind:value={entryTime}
                    class="native-input-overlay"
                  />
                </div>
              </label>
            </div>
          </div>

          <div class="field">
            <label
              >Meal
              <select bind:value={mealType} class="bg-input">
                <option>Breakfast</option>
                <option>Lunch</option>
                <option>Dinner</option>
                <option>Snack</option>
              </select>
            </label>
          </div>

          <div class="field">
            <label
              >Log Description
              <input
                type="text"
                bind:value={itemName}
                class="bg-input big-text"
                placeholder="What is this?"
              />
            </label>
          </div>

          <NutritionForm bind:metrics={nutrition} />

          <div class="rationale-box">
            <p class="rationale-text">{rationale}</p>
            <button
              class="correct-btn"
              onclick={() => (showCorrectionInput = !showCorrectionInput)}
            >
              {showCorrectionInput ? "Cancel Correction" : "Correct AI"}
            </button>
          </div>

          {#if showCorrectionInput}
            <div class="correction-area">
              <textarea
                bind:value={userCorrection}
                placeholder="e.g. It was 2 eggs, not 3"
                rows="2"
                class="bg-input"
              ></textarea>
              <button
                class="primary-btn small"
                onclick={handleReanalyze}
                disabled={!userCorrection}>Retry</button
              >
            </div>
          {/if}

          <button
            class="save-btn-primary"
            onclick={handleSubmit}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save Entry"}
          </button>
        </div>
      {/if}
    </div>
  </LogSheet>
</div>

<style>
  .log-page {
    min-height: 100vh;
    padding-bottom: 120px;
  }

  .start-ui {
    padding: 40px 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 40px;
  }

  /* Sheet Content */
  .sheet-content {
    padding-bottom: 40px;
  }

  .preview-strip {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
    overflow-x: auto;
  }

  .sheet-thumb {
    width: 80px;
    height: 80px;
    border-radius: var(--radius-s);
    object-fit: cover;
    border: 2px solid rgba(255, 255, 255, 0.1);
  }

  .add-more-btn {
    width: 80px;
    height: 80px;
    border-radius: var(--radius-s);
    background: rgba(255, 255, 255, 0.1);
    color: white;
    border: none;
    font-size: 2rem;
  }

  .form-grid {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .split-row {
    display: flex;
    gap: 16px;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex: 1;
  }

  label {
    font-size: 0.75rem;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .bg-input {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: white;
    padding: 12px;
    border-radius: var(--radius-m);
    font-size: 1rem;
  }

  /* Custom Input Wrapper */
  .custom-input-wrapper {
    position: relative;
    display: flex;
    justify-content: space-between;
    align-items: center;
    overflow: hidden; /* Ensure overlay doesn't spill */
  }

  .value-text {
    font-variant-numeric: tabular-nums;
    z-index: 1;
  }

  .input-icon {
    opacity: 0.7;
    z-index: 1;
    font-size: 1.1rem;
  }

  .native-input-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
    background: transparent;
    border: none;
    appearance: none;
    -webkit-appearance: none;
    z-index: 2; /* On top of text */
  }

  .bg-input:focus-within {
    border-color: var(--color-primary);
    background: rgba(255, 255, 255, 0.1);
  }

  .big-text {
    font-size: 1.2rem;
    font-weight: 600;
  }

  .rationale-box {
    background: rgba(255, 255, 255, 0.03);
    padding: 12px;
    border-radius: var(--radius-m);
    margin-top: 10px;
  }

  .rationale-text {
    font-size: 0.9rem;
    color: var(--text-secondary);
    line-height: 1.5;
    font-style: italic;
    margin-bottom: 8px;
  }

  .correct-btn {
    background: none;
    border: none;
    color: var(--color-primary);
    font-size: 0.85rem;
    padding: 4px;
    cursor: pointer;
    text-decoration: underline;
  }

  .correction-area {
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: flex-end;
  }

  textarea.bg-input {
    width: 100%;
    resize: vertical;
  }

  .save-btn-primary {
    background: var(--color-primary);
    color: white;
    padding: 16px;
    border-radius: var(--radius-m);
    border: none;
    font-size: 1.1rem;
    font-weight: 600;
    margin-top: 10px;
    cursor: pointer;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  }

  .analyzing-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px;
    gap: 20px;
  }

  .magic-sparkle {
    font-size: 3rem;
    animation: pulse 1.5s infinite;
  }

  @keyframes pulse {
    0% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.2);
      opacity: 0.7;
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }
</style>
