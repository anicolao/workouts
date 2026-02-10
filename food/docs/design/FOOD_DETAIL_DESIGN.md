# Food Detail Design

## Objective
To expand the application's data model and AI prompting to capture a comprehensive nutritional profile for food entries, aligning with **Canadian Nutrition Facts** standards. This allows for tracking of micronutrients, self-macros (trans fat, sugar, fiber), and other relevant compounds like caffeine.

## Canadian Nutrition Standards (2025 Requirements)
Based on Health Canada regulations (including the 2025 updates for Front-of-Pack labeling and updated Daily Values), the following nutrients are **mandatory** on standard Nutrition Facts tables:

1.  **Calories**
2.  **Fat** (Total)
    *   Saturated Fat
    *   Trans Fat
    *   (Sum of Saturated + Trans is often highlighted)
3.  **Cholesterol**
4.  **Sodium**
5.  **Carbohydrate** (Total)
    *   Fibre
    *   Sugars
6.  **Protein**
7.  **Potassium**
8.  **Calcium**
9.  **Iron**

*Note: Vitamin A and Vitamin C are no longer mandatory but often appear.*

### Additional User Requests
*   **Caffeine** (Not mandatory on labels unless added, but highly desired for tracking)

## Data Model Design

### Current State
`LogEntry` (in `src/lib/store.ts`) currently flattens macros:
```typescript
interface LogEntry {
  // ...
  calories: number;
  fat: number;
  carbs: number;
  protein: number;
  // ...
}
```

### Proposed Schema
We will introduce a `detailedNutrients` object to `LogEntry`. We will **retain the top-level macro fields** (`calories`, `fat`, `carbs`, `protein`) for backward compatibility, efficient indexing, and simple UI displays. The detailed object will be optional (populated when data is available).

```typescript
// New Interface
export interface DetailedNutrients {
  // Lipids
  saturatedFat?: number; // g
  transFat?: number;     // g
  cholesterol?: number;  // mg

  // Electrolytes / Minerals
  sodium?: number;       // mg
  potassium?: number;    // mg
  calcium?: number;      // % DV or mg (prefer mg for storage)
  iron?: number;         // % DV or mg (prefer mg for storage)

  // Carbohydrate Breakdown
  fiber?: number;        // g
  sugar?: number;        // g
  addedSugar?: number;   // g (2025 standard distinction)

  // Other
  caffeine?: number;     // mg
  alcohol?: number;      // g (optional, but standard for completeness)
}

// Updated LogEntry
export interface LogEntry {
  // ... existing fields ...
  calories: number;
  fat: number;
  carbs: number;
  protein: number;

  // New Field
  details?: DetailedNutrients;
}
```

## Prompt Engineering (`src/lib/gemini.ts`)

We need to modify the `SYSTEM_PROMPT` to enforce extraction of these fields. The prompt currently instructs the LLM to standard Canadian values. We will make this explicit for the new fields.

### Revised System Prompt (Draft)

```typescript
const SYSTEM_PROMPT = `
You are an expert dietician. Analyze the provided input (image or text description).
1. If multiple images are provided, treat them as different angles or components of a **single meal/entry**. Aggregate the nutrition facts into one total estimate.
2. If it is a **Nutrition Facts label**, extract the data exactly as shown.
3. If it is a **food item/meal**, estimate the nutrition facts based on visible portion sizes and **standard Canadian nutrient values**.
4. If the input is **text only**, estimate based on standard portions for the described items.
5. **ALWAYS** provide a "searchQuery" field: a short, descriptive string to search for an image of this food.

6. **CRITICAL**: Return the data **exclusively** in the following JSON format. Ensure all numerical values are numbers, not strings. Null values are acceptable if the data is genuinely unknown, but **estimate them** if possible for standard foods.

Structure:
{
  "is_label": boolean,
  "item_name": "string",
  "rationale": "string",  // Briefly explain the estimates (e.g. "Based on standard medium banana")
  "calories": number,
  
  // MACROS (Top Level)
  "fat": {
    "total": number,
    "saturated": number | null,
    "trans": number | null
  },
  "cholesterol": number | null, // mg
  "sodium": number | null,      // mg
  "carbohydrates": {
    "total": number,
    "fiber": number | null,
    "sugar": number | null,
    "added_sugar": number | null // Estimate if discernible (e.g. candy vs fruit)
  },
  "protein": number,
  
  // MICROS
  "potassium": number | null,   // mg
  "calcium_mg": number | null, // Estimate in mg. If label shows %DV, convert assuming 1100mg DV (Canada 2025 standard)
  "iron_mg": number | null,    // Estimate in mg. If label shows %DV, convert assuming 14mg DV (Canada 2025 standard)
  
  // OTHER
  "caffeine": number | null,    // mg
  
  "searchQuery": "string"
}
`;
```

### Type Definition Update (`src/lib/gemini.ts`)

```typescript
export interface NutritionEstimate {
    is_label: boolean;
    item_name: string;
    rationale?: string;
    searchQuery?: string;
    
    // Core
    calories: number;
    protein: number;
    
    // Complex
    fat: { 
        total: number;
        saturated?: number;
        trans?: number;
    };
    carbohydrates: { 
        total: number;
        fiber?: number;
        sugar?: number;
        added_sugar?: number;
    };
    
    // Micros
    cholesterol?: number;
    sodium?: number;
    potassium?: number;
    calcium_mg?: number;
    iron_mg?: number;
    caffeine?: number;
}
```

## Migration Strategy
1.  **Code Update**: Update `gemini.ts` types and prompt.
2.  **Store Update**: Update `LogEntry` interface in `store.ts` (the new fields are optional, so no data migration of IDB is required strictly, but old entries will lack details).
3.  **UI Update**: New distinct UI component or "More Details" expansion in the Log Detail view.

## Verification
*   **Unit Tests**: Update `gemini.ts` tests (if any) to validate the new schema.
*   **E2E**: Verify that the AI returns the new fields and they are persisted to the Redux store.
