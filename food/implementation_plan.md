# Implementation Plan - Extended Nutrition Data

## Goal Description
Implement the extended nutrition data schema designed in `FOOD_DETAIL_DESIGN.md`. This involves updating the Redux store to support detailed nutrient fields (saturated fat, fiber, sugar, etc.), modifying the Gemini AI prompt to extract this data, and creating a unified `NutritionForm.svelte` component to display and edit these fields in both the logging and detail views.

## User Review Required
> [!IMPORTANT]
> This change introduces a new `DetailedNutrients` object to the `LogEntry`. Existing entries will have this field undefined. The UI must handle missing data gracefully.

## Proposed Changes

### Data Layer (`src/lib`)

#### [MODIFY] [store.ts](file:///Users/anicolao/projects/antigravity/food/src/lib/store.ts)
-   Update `LogEntry` interface to include `details?: DetailedNutrients`.
-   Define `DetailedNutrients` interface with fields: `saturatedFat`, `transFat`, `cholesterol`, `sodium`, `potassium`, `calcium`, `iron`, `fiber`, `sugar`, `addedSugar`, `caffeine`, `alcohol`.
-   Update `initialState` (no change needed for schema, just types).

#### [MODIFY] [gemini.ts](file:///Users/anicolao/projects/antigravity/food/src/lib/gemini.ts)
-   Update `NutritionEstimate` interface to match the new schema.
-   Update `SYSTEM_PROMPT` to instruct the LLM to extract/estimate these new fields in the specified JSON structure.

### UI Components (`src/lib/components/ui`)

#### [NEW] [NutritionForm.svelte](file:///Users/anicolao/projects/antigravity/food/src/lib/components/ui/NutritionForm.svelte)
-   Create a reusable component that handles the editing of nutrition data.
-   **Props**: `metrics` (bindable object with all nutrient fields), `readOnly?` (boolean).
-   **Layout**:
    -   Top level: Calories, Protein, Carbs, Fat (High visibility).
    -   Collapsible/Accordion "More Details" section (or just listed below if space permits, potentially standard Canadian label style).
    -   Input fields for all new detailed nutrients.

### Routes (`src/routes`)

#### [MODIFY] [log/+page.svelte](file:///Users/anicolao/projects/antigravity/food/src/routes/log/+page.svelte)
-   Import and use `NutritionForm`.
-   Replace the existing manual macro inputs (`.macros-row`) with `<NutritionForm bind:metrics={currentMetrics} />`.
-   Update `handleAnalysisResult` to map the expanded API result to `currentMetrics`.
-   Update `handleSubmit` to include the `details` object in the payload.

#### [MODIFY] [entry/+page.svelte](file:///Users/anicolao/projects/antigravity/food/src/routes/entry/+page.svelte)
-   Import and use `NutritionForm`.
-   Replace the existing manual macro inputs with `<NutritionForm bind:metrics={formMetrics} />`.
-   Update `handleSave` to include the `details` object in the update payload.

## Verification Plan

### Automated Tests
-   **Unit Tests**:
    -   Create/Update `gemini.test.ts` (if exists) or manual verification script to check LLM output format.
-   **E2E Tests (`tests/e2e`)**:
    -   Update `005-details-edit-delete.spec.ts` to verify the presence of new fields in the edit form.
    -   **New Test**: `013-detailed-nutrition.spec.ts` (or extend existing) to:
        1.  Log an item (mocked AI response with details).
        2.  Verify details appear in `NutritionForm` on Log page.
        3.  Save entry.
        4.  Open entry in Detail view.
        5.  Verify details appear in `NutritionForm` on Detail page.
        6.  Edit a detailed field (e.g., sodium).
        7.  Save and verify persistence.

### Manual Verification
1.  **Logging Flow**: Take a picture of a nutrition label. Verify that the AI extracts fields like Sodium and Fiber correctly and populates the form.
2.  **Edit Flow**: Manually open a past entry. Add "Caffeine" to it. Save. Re-open and ensure it's still there.
3.  **Visual Check**: Ensure the form looks good on mobile (Canadian Nutrition Facts style preferred or consistent with current glassmorphism).
