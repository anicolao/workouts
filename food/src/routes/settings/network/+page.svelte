<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { base } from "$app/paths";
  import { getPendingEvents } from "$lib/db";
  import { syncManager } from "$lib/sync-manager";
  import { store, setConfig } from "$lib/store";
  import { getFileMetadata, renameFile, findDatabaseFiles } from "$lib/sheets";

  // --- Versioning & SW Logic ---
  const version = `v${import.meta.env.VITE_APP_VERSION}`;
  const buildInfo = `${new Date(import.meta.env.VITE_APP_BUILD_DATE).toLocaleDateString()} ${import.meta.env.VITE_APP_DIRTY_FLAG ? "⚠ " : ""}(${import.meta.env.VITE_APP_COMMIT_HASH})`;

  let updateReady = false;
  let cacheSize = "Unknown";
  let dbSize = "Unknown";

  async function checkStorage() {
    if (navigator.storage && navigator.storage.estimate) {
      const { usage, quota } = await navigator.storage.estimate();
      cacheSize = formatBytes(usage || 0);
    }
  }

  function formatBytes(bytes: number, decimals = 2) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  }

  function checkForUpdate() {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg && reg.waiting) {
          updateReady = true;
        }
      });
      // Listen for messages from SW
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data && event.data.type === "UPDATE_READY") {
          updateReady = true;
        }
      });
    }
  }

  function applyUpdate() {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg && reg.waiting) {
          reg.waiting.postMessage({ type: "SKIP_WAITING" });
          // Reload will happen automatically or we can force it
          // window.location.reload();
          // Better to wait for controller change?
        }
      });
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        window.location.reload();
      });
    }
  }

  let isOnline = true;
  let pendingCount = 0;
  let isSyncing = false;
  let syncError: string | null = null;
  let interval: any;
  let pendingEvents: any[] = [];

  // Config state
  let spreadsheetId = "";
  let sheetName = "";
  let isRenaming = false;

  // Picker state
  let availableFiles: any[] = [];
  let showPicker = false;
  let isLoadingFiles = false;

  async function checkStatus() {
    isOnline = navigator.onLine;
    isSyncing = syncManager.isSyncing;
    syncError = syncManager.syncError;
    pendingEvents = await getPendingEvents();
    pendingCount = pendingEvents.length;

    const state = store.getState();
    spreadsheetId = state.config.spreadsheetId || "";

    // Initial fetch of sheet name if we have ID but no name yet
    if (spreadsheetId && !sheetName && !isRenaming && isOnline) {
      try {
        const meta = await getFileMetadata(spreadsheetId);
        sheetName = meta.name;
      } catch (e) {
        console.error("Failed to fetch sheet name", e);
        sheetName = "Unknown (Error fetching)";
      }
    }
  }

  onMount(() => {
    isOnline = navigator.onLine;
    window.addEventListener("online", checkStatus);
    window.addEventListener("offline", checkStatus);

    interval = setInterval(checkStatus, 2000);
    checkStatus();
    checkStorage();
    checkForUpdate();
  });

  onDestroy(() => {
    if (typeof window !== "undefined") {
      window.removeEventListener("online", checkStatus);
      window.removeEventListener("offline", checkStatus);
      clearInterval(interval);
    }
  });

  async function loadAvailableFiles() {
    if (!isOnline) return;
    isLoadingFiles = true;
    try {
      // Find all tagged files. (We don't need parentId for global search if we rely on tags,
      // but providing folderId is safer if we knew it. For now, tag search is robust enough globally or we assume FoodLog folder context implicitly).
      // Actually, sheets.ts findDatabaseFiles accepts optional parentId.
      // We'll search globally for simplicity or we'd need to fetch folderId again.
      // Let's rely on tag search which is specific enough.
      availableFiles = await findDatabaseFiles();
    } catch (e) {
      console.error("Failed to load files", e);
    } finally {
      isLoadingFiles = false;
    }
  }

  function togglePicker() {
    showPicker = !showPicker;
    if (showPicker) {
      loadAvailableFiles();
    }
  }

  async function switchDatabase(fileId: string) {
    if (fileId === spreadsheetId) return;

    if (
      confirm(
        "Switching databases will reset your local cache and resync from the selected file. Continue?",
      )
    ) {
      // update store config
      const current = store.getState().config;
      setConfig({ ...current, spreadsheetId: fileId });
      spreadsheetId = fileId;
      sheetName = ""; // Force refresh
      showPicker = false;

      // Hard resync logic to clear old data and fetch new
      await syncManager.hardResync();
    }
  }

  async function handleForceSync() {
    await syncManager.sync();
    await checkStatus();
  }

  async function handleHardResync() {
    if (
      confirm(
        "This will delete your local cache of synced events and re-download everything from Google Sheets. Your pending items will be preserved. Continue?",
      )
    ) {
      await syncManager.hardResync();
    }
  }

  async function handleRename() {
    if (!spreadsheetId) return;
    const newName = prompt("Enter new name for the Google Sheet:", sheetName);
    if (newName && newName !== sheetName) {
      try {
        isRenaming = true;
        await renameFile(spreadsheetId, newName);
        sheetName = newName;
      } catch (e) {
        console.error("Rename failed", e);
        console.error("Failed to rename spreadsheet.");
      } finally {
        isRenaming = false;
      }
    }
  }
</script>

<div class="network-settings">
  <header>
    <h1>Network & Sync</h1>
  </header>

  {#if syncError}
    <section class="card glass-panel error-panel">
      <h2>⚠ Problem Detected</h2>
      <div class="error-content">
        <p class="error-msg">{syncError}</p>
        <p class="suggestion">
          We're having trouble syncing with Google Sheets. Check your internet
          connection. If this persists, the cache might be out of sync.
        </p>
        <button class="primary-btn danger-glow" on:click={handleHardResync}>
          Reset Cache & Resync
        </button>
      </div>
    </section>
  {/if}

  <section class="card glass-panel">
    <h2>Connection</h2>
    <div class="status-row">
      <span class="label">Status</span>
      <div class="status-value-group">
        <span class="value {isOnline ? 'online' : 'offline'}">
          {isOnline ? "Online" : "Offline"}
        </span>
        {#if updateReady}
          <button
            class="update-badge"
            on:click={applyUpdate}
            title="Tap to update"
          >
            ⬇ Update Ready
          </button>
        {/if}
      </div>
    </div>
    <div class="status-row">
      <span class="label">Sync Activity</span>
      <span class="value">
        {isSyncing ? "Syncing..." : "Idle"}
      </span>
    </div>
  </section>

  <section class="card glass-panel">
    <h2>Unsynced Data</h2>
    <div class="status-row">
      <span class="label">Pending Items</span>
      <span class="value">{pendingCount}</span>
    </div>

    {#if pendingCount > 0}
      <div class="pending-list">
        {#each pendingEvents.slice(0, 5) as event}
          <div class="pending-item">
            <span class="type">{event.type}</span>
            <span class="time"
              >{new Date(event.timestamp).toLocaleTimeString()}</span
            >
          </div>
        {/each}
        {#if pendingCount > 5}
          <div class="more">... and {pendingCount - 5} more</div>
        {/if}
      </div>

      <button
        class="primary-btn neon-gradient"
        on:click={handleForceSync}
        disabled={!isOnline || isSyncing}
      >
        {isSyncing ? "Syncing..." : "Force Sync Now"}
      </button>
    {/if}
  </section>

  <section class="card glass-panel">
    <h2>Configuration</h2>
    <div class="field">
      <label for="sheetName">Spreadsheet Name</label>
      <div class="input-group">
        <input id="sheetName" type="text" value={sheetName} readonly />
        <button
          class="icon-btn"
          on:click={handleRename}
          disabled={!isOnline || isRenaming}
          aria-label="Rename"
        >
          ✏️
        </button>
      </div>
    </div>

    <div class="field">
      <label for="picker">Active Database File</label>
      <div class="picker-controls">
        <button class="secondary-btn small" on:click={togglePicker}>
          {showPicker ? "Hide Options" : "Change Database File"}
        </button>
      </div>

      {#if showPicker}
        <div class="file-picker glass-panel">
          {#if isLoadingFiles}
            <p class="loading">Finding databases...</p>
          {:else if availableFiles.length === 0}
            <p class="empty">No other database files found.</p>
          {:else}
            <ul class="file-list">
              {#each availableFiles as file}
                <li>
                  <button
                    class="file-option {file.id === spreadsheetId
                      ? 'active'
                      : ''}"
                    on:click={() => switchDatabase(file.id)}
                    disabled={file.id === spreadsheetId}
                  >
                    <div class="file-info">
                      <span class="fname">{file.name}</span>
                      <span class="fmeta"
                        >Last modified: {new Date(
                          file.modifiedTime,
                        ).toLocaleDateString()}</span
                      >
                    </div>
                    {#if file.id === spreadsheetId}
                      <span class="check">✓</span>
                    {/if}
                  </button>
                </li>
              {/each}
            </ul>
          {/if}
        </div>
      {/if}
    </div>

    <div class="field mt-4">
      <label for="sheetId">Spreadsheet ID</label>
      <input
        id="sheetId"
        type="text"
        value={spreadsheetId}
        disabled
        class="dimmed"
      />
    </div>
    <p class="help">Managed via Google Drive integration.</p>
  </section>

  <section class="card glass-panel">
    <h2>Application Info</h2>
    <div class="status-row">
      <span class="label">Version</span>
      <div class="version-info">
        <span class="value mono">{version}</span>
        <span class="value mono small">{buildInfo}</span>
      </div>
    </div>
    <div class="status-row">
      <span class="label">Storage Usage</span>
      <span class="value">{cacheSize}</span>
    </div>
  </section>

  <section class="card glass-panel">
    <h2>Open Source & Privacy First</h2>
    <p class="mb-4 text-sm text-secondary">
      We do not share or store your data: it is on your device and in your
      Google account only.
    </p>
    <a href="{base}/privacy" class="text-accent hover:underline"
      >Read Privacy Policy</a
    >
  </section>

  <section class="actions">
    <button
      class="text-btn danger"
      on:click={handleHardResync}
      disabled={!isOnline || isSyncing}
    >
      Reset Cache & Resync
    </button>
    <p class="help">Use this if your data is out of sync with Google Sheets.</p>
  </section>
</div>

<style>
  .network-settings {
    padding: 1rem;
    max-width: 600px;
    margin: 0 auto;
    color: white;
  }

  header {
    margin-bottom: 2rem;
  }

  h1 {
    font-size: 1.5rem;
    font-weight: 600;
    color: white;
  }

  .card {
    background: var(--bg-card-glass, rgba(28, 30, 36, 0.7));
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 20px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    color: white;
  }

  h2 {
    font-size: 1.1rem;
    font-weight: 500;
    margin-bottom: 1rem;
    color: var(--text-primary, #fff);
  }

  .status-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
    color: var(--text-secondary, #a0a0a0);
  }

  .value {
    color: white;
    font-weight: 500;
  }
  .value.online {
    color: #2ecc71;
  }
  .value.offline {
    color: #e74c3c;
  }

  .pending-list {
    margin: 1rem 0;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 8px;
    padding: 1rem;
  }

  .pending-item {
    display: flex;
    justify-content: space-between;
    font-size: 0.9rem;
    padding: 0.25rem 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    color: var(--text-secondary, #ccc);
  }

  .pending-item:last-child {
    border-bottom: none;
  }

  .type {
    font-family: monospace;
    color: var(--text-accent, #ff9966);
  }
  .time {
    color: #888;
  }

  button {
    width: 100%;
    padding: 0.75rem;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.2s;
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .primary-btn {
    background: var(--primary-color, #3498db);
    color: white;
  }

  .text-btn.danger {
    background: rgba(231, 76, 60, 0.1);
    color: #e74c3c;
    border: 1px solid rgba(231, 76, 60, 0.3);
  }

  .field {
    margin-bottom: 0.5rem;
  }

  label {
    display: block;
    font-size: 0.8rem;
    color: var(--text-secondary, #aaa);
    margin-bottom: 4px;
  }

  input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    background: rgba(0, 0, 0, 0.3);
    color: white;
    font-family: monospace;
  }

  .help {
    font-size: 0.8rem;
    color: #666;
    margin-top: 0.5rem;
    text-align: center;
  }

  .actions {
    margin-top: 2rem;
  }

  .input-group {
    display: flex;
    gap: 0.5rem;
  }

  .icon-btn {
    width: auto;
    padding: 0.75rem;
    background: rgba(255, 255, 255, 0.1);
  }

  .dimmed {
    opacity: 0.6;
    font-size: 0.8rem;
  }

  .file-picker {
    margin-top: 1rem;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    max-height: 200px;
    overflow-y: auto;
  }

  .file-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .file-option {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
    background: none;
    border: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    color: white;
    text-align: left;
  }

  .file-option:last-child {
    border-bottom: none;
  }

  .file-option:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.05);
  }

  .file-option.active {
    background: rgba(52, 152, 219, 0.2);
  }

  .file-info {
    display: flex;
    flex-direction: column;
  }

  .fname {
    font-weight: 500;
    font-size: 0.9rem;
  }
  .fmeta {
    font-size: 0.75rem;
    color: #888;
  }

  .check {
    color: #2ecc71;
    font-weight: bold;
  }

  .picker-controls {
    margin-top: 0.5rem;
  }

  .secondary-btn.small {
    padding: 0.4rem 0.8rem;
    font-size: 0.8rem;
    width: auto;
  }

  .mt-4 {
    margin-top: 1rem;
  }
  .loading,
  .empty {
    padding: 1rem;
    text-align: center;
    color: #888;
  }

  .status-value-group {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .update-badge {
    background: #2ecc71;
    color: white;
    border: none;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 700;
    cursor: pointer;
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0% {
      transform: scale(1);
      box-shadow: 0 0 0 0 rgba(46, 204, 113, 0.7);
    }
    70% {
      transform: scale(1.05);
      box-shadow: 0 0 0 6px rgba(46, 204, 113, 0);
    }
    100% {
      transform: scale(1);
      box-shadow: 0 0 0 0 rgba(46, 204, 113, 0);
    }
  }

  .mono {
    font-family: monospace;
    font-size: 0.9rem;
  }

  .version-info {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }

  .error-panel {
    border: 1px solid rgba(231, 76, 60, 0.4);
    background: rgba(231, 76, 60, 0.1);
  }

  .error-panel h2 {
    color: #e74c3c;
  }

  .error-content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .error-msg {
    font-family: monospace;
    background: rgba(0, 0, 0, 0.3);
    padding: 0.5rem;
    border-radius: 4px;
    color: #ff9999;
    font-size: 0.9rem;
    word-break: break-all;
  }

  .suggestion {
    font-size: 0.9rem;
    color: #ccc;
    line-height: 1.4;
  }

  .danger-glow {
    background: #c0392b;
    box-shadow: 0 0 10px rgba(231, 76, 60, 0.4);
    animation: danger-pulse 2s infinite;
  }

  @keyframes danger-pulse {
    0% {
      box-shadow: 0 0 5px rgba(231, 76, 60, 0.4);
    }
    50% {
      box-shadow: 0 0 15px rgba(231, 76, 60, 0.7);
    }
    100% {
      box-shadow: 0 0 5px rgba(231, 76, 60, 0.4);
    }
  }

  .text-center {
    text-align: center;
  }
  .mb-4 {
    margin-bottom: 1rem;
  }
  .text-sm {
    font-size: 0.85rem;
  }
  .text-secondary {
    color: var(--text-secondary, #a0a0a0);
  }
  .text-accent {
    color: var(--text-accent, #ff9966);
    text-decoration: none;
  }
  .hover\:underline:hover {
    text-decoration: underline;
  }
</style>
