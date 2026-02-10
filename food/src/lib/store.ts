import { configureStore, createSlice, type PayloadAction, type Middleware } from '@reduxjs/toolkit';

import { syncMiddleware } from './redux-sync-middleware';

// --- Event Types ---
export interface FoodEvent {
  eventId: string;
  type: string;
  timestamp: string;
  payload: any;
}

// --- Initial State (Projections) ---
export interface DetailedNutrients {
  // Lipids
  saturatedFat?: number; // g
  transFat?: number;     // g
  cholesterol?: number;  // mg

  // Electrolytes / Minerals
  sodium?: number;       // mg
  potassium?: number;    // mg
  calcium?: number;      // mg 
  iron?: number;         // mg

  // Carbohydrate Breakdown
  fiber?: number;        // g
  sugar?: number;        // g
  addedSugar?: number;   // g 

  // Other
  caffeine?: number;     // mg
  alcohol?: number;      // g 
}

export interface FavouriteItem {
  description: string;
  defaultNutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    details: DetailedNutrients;
  };
  lastUsed: string;
  usageCount: number;
  defaultImage?: string; // Optional: Keep track of an image to reuse
}

export interface LogEntry {
  id: string;
  date: string;
  time: string;
  mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  description: string;
  calories: number;
  fat: number;
  carbs: number;
  protein: number;
  imageDriveUrl?: string; // URL in Google Drive
  rawJson?: any; // Full Gemini response
  rationale?: string; // Explainer text for the estimation
  details?: DetailedNutrients;
  mediaIds?: string[]; // IDs for media lifecycle event correlation
}

interface DailyStats {
  date: string;
  totalCalories: number;
  totalProtein: number;
  totalFat: number;
  totalCarbs: number;
}

interface AppState {
  events: FoodEvent[];
  log: LogEntry[];
  stats: Record<string, DailyStats>; // Keyed by YYYY-MM-DD
  favourites: FavouriteItem[];
}

const initialState: AppState = {
  events: [],
  log: [],
  stats: {},
  favourites: []
};

// --- Slices ---

// 1. Event Log (Source of Truth)
const eventLogSlice = createSlice({
  name: 'eventLog',
  initialState: initialState.events,
  reducers: {
    appendEvent: (state, action: PayloadAction<FoodEvent>) => {
      state.push(action.payload);
    },
    hydrateEvent: (state, action: PayloadAction<FoodEvent>) => {
      // Just add to state, no side effects expected from middleware for this action name
      state.push(action.payload);
    },
    hydrateAllEvents: (state, action: PayloadAction<FoodEvent[]>) => {
      state.push(...action.payload);
    }
  }
});

// 2. Projections (Derived State)
// Note: In a pure Event Sourcing setup, these would be derived by replaying events.
// For the MVP with Redux, we updates them incrementally as events are dispatched.
// Ideally, we'd use a meta-reducer or just derive selectors, but for UI performance:

const applyEventToState = (state: any, event: FoodEvent) => {
  switch (event.type) {
    case 'log/entryConfirmed': {
      // Payload expected: { entry: LogEntry }
      const entry = event.payload.entry as LogEntry;

      // Idempotency Check: using business ID (entry.id)
      // Idempotency Check: using business ID (entry.id)
      if (state.log.some((e: LogEntry) => e.id === entry.id)) {
        return;
      }

      // Sanitize entry to ensure strictly valid LogEntry
      const sanitizedEntry: LogEntry = {
        ...entry,
        calories: Number(entry.calories || 0),
        protein: Number(entry.protein || 0),
        fat: Number(entry.fat || 0),
        carbs: Number(entry.carbs || 0)
      };

      state.log.push(sanitizedEntry);

      // Update Stats
      if (!state.stats[entry.date]) {
        state.stats[entry.date] = { date: entry.date, totalCalories: 0, totalProtein: 0, totalFat: 0, totalCarbs: 0 };
      }
      const stat = state.stats[entry.date];
      stat.totalCalories += sanitizedEntry.calories;
      stat.totalProtein += sanitizedEntry.protein;
      stat.totalFat += sanitizedEntry.fat;
      stat.totalCarbs += sanitizedEntry.carbs;
      break;
    }

    case 'log/entryUpdated': {
      const { entryId, changes } = event.payload;
      const index = state.log.findIndex((e: LogEntry) => e.id === entryId);
      if (index !== -1) {
        const oldEntry = state.log[index];

        // 1. Decrement old stats
        if (state.stats[oldEntry.date]) {
          const stat = state.stats[oldEntry.date];
          stat.totalCalories -= Number(oldEntry.calories || 0);
          stat.totalProtein -= Number(oldEntry.protein || 0);
          stat.totalFat -= Number(oldEntry.fat || 0);
          stat.totalCarbs -= Number(oldEntry.carbs || 0);
        }

        // 2. Update Entry (Sanitize new values)
        const rawNewEntry = { ...oldEntry, ...changes };
        const newEntry: LogEntry = {
          ...rawNewEntry,
          calories: Number(rawNewEntry.calories || 0),
          protein: Number(rawNewEntry.protein || 0),
          fat: Number(rawNewEntry.fat || 0),
          carbs: Number(rawNewEntry.carbs || 0)
        };
        state.log[index] = newEntry;

        // 3. Increment new stats
        if (!state.stats[newEntry.date]) {
          state.stats[newEntry.date] = { date: newEntry.date, totalCalories: 0, totalProtein: 0, totalFat: 0, totalCarbs: 0 };
        }
        const stat = state.stats[newEntry.date];
        stat.totalCalories += Number(newEntry.calories || 0);
        stat.totalProtein += Number(newEntry.protein || 0);
        stat.totalFat += Number(newEntry.fat || 0);
        stat.totalCarbs += Number(newEntry.carbs || 0);
      }
      break;
    }
    case 'log/entryDeleted': {
      const { entryId } = event.payload;
      const index = state.log.findIndex((e: LogEntry) => e.id === entryId);
      if (index !== -1) {
        const entry = state.log[index];

        // Decrement stats
        if (state.stats[entry.date]) {
          const stat = state.stats[entry.date];
          stat.totalCalories -= Number(entry.calories || 0);
          stat.totalProtein -= Number(entry.protein || 0);
          stat.totalFat -= Number(entry.fat || 0);
          stat.totalCarbs -= Number(entry.carbs || 0);
        }

        // Remove from log
        state.log.splice(index, 1);
      }
      break;
    }
    case 'log/logAgain': {
      const { description, sourceEntryId, timestamp } = event.payload;

      // Upsert into Favourites
      // We need to find the full entry details to store default nutrition
      // Since this is a projection, we can look up the source entry in the *current* state (if we are consistent)
      // OR, the payload should ideally carry the nutrition info to be self-contained. 
      // However, for the "Log Again" logic, the event denotes the ACTION.
      // ACTUALLY: For the reducer to work purely, we might need to rely on the fact that the entry exists in the log.

      const sourceEntry = state.log.find((e: LogEntry) => e.id === sourceEntryId);

      const existingIndex = state.favourites.findIndex((f: FavouriteItem) => f.description.toLowerCase() === description.toLowerCase());

      if (existingIndex !== -1) {
        // Update existing
        state.favourites[existingIndex].usageCount += 1;
        state.favourites[existingIndex].lastUsed = timestamp;
        // Optionally update image if the new log had one? Let's say yes, keep it fresh.
        if (sourceEntry && sourceEntry.imageDriveUrl) {
          state.favourites[existingIndex].defaultImage = sourceEntry.imageDriveUrl;
        }
      } else if (sourceEntry) {
        // Create new from source
        if (!state.favourites) state.favourites = [];
        state.favourites.push({
          description: sourceEntry.description,
          defaultNutrition: {
            calories: sourceEntry.calories,
            protein: sourceEntry.protein,
            carbs: sourceEntry.carbs,
            fat: sourceEntry.fat,
            details: sourceEntry.details || {}
          },
          lastUsed: timestamp,
          usageCount: 1,
          defaultImage: sourceEntry.imageDriveUrl
        });
      }
      break;
    }
    case 'media/uploadCompleted': {
      const { tempId, url } = event.payload;
      if (!tempId || !url) break;

      state.log.forEach((entry: LogEntry) => {
        if (!entry.mediaIds?.includes(tempId)) return;

        const existingUrls = entry.imageDriveUrl
          ? entry.imageDriveUrl.split(',').map((u) => u.trim()).filter(Boolean)
          : [];

        if (!existingUrls.includes(url)) {
          existingUrls.push(url);
          entry.imageDriveUrl = existingUrls.join(', ');
        }
      });
      break;
    }
  }
};

const projectionsSlice = createSlice({
  name: 'projections',
  initialState: { log: initialState.log, stats: initialState.stats, favourites: initialState.favourites },
  reducers: {
    processEvent: (state, action: PayloadAction<FoodEvent>) => {
      applyEventToState(state, action.payload);
    },
    processAllEvents: (state, action: PayloadAction<FoodEvent[]>) => {
      action.payload.forEach(event => applyEventToState(state, event));
    }
  }
});


// 3. Configuration (Session State)
interface ConfigState {
  spreadsheetId: string | null;
  folderId: string | null;
  isReadOnly: boolean;
}

const configSlice = createSlice({
  name: 'config',
  initialState: { spreadsheetId: null, folderId: null, isReadOnly: false } as ConfigState,
  reducers: {
    setConfig: (state, action: PayloadAction<Partial<ConfigState>>) => {
      // Merges partial updates
      return { ...state, ...action.payload };
    },
    setContext: (state, action: PayloadAction<{ isReadOnly: boolean; folderId: string | null }>) => {
      state.isReadOnly = action.payload.isReadOnly;
      state.folderId = action.payload.folderId;
    }
  }
});

// 4. Settings (Macro Goals)
export interface MacroRatios {
  protein: number; // 0.0 - 1.0
  fat: number;     // 0.0 - 1.0
  carbs: number;   // 0.0 - 1.0
}

export interface SettingsState {
  targetCalories: number;
  macroRatios: MacroRatios;
}

const initialSettings: SettingsState = {
  targetCalories: 2000,
  macroRatios: {
    protein: 0.3, // 30%
    fat: 0.35,    // 35%
    carbs: 0.35   // 35%
  }
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState: initialSettings,
  reducers: {
    updateGoals: (state, action: PayloadAction<SettingsState>) => {
      state.targetCalories = action.payload.targetCalories;
      state.macroRatios = action.payload.macroRatios;
    }
  }
});

// --- Root Reducer with Reset Capability ---
const combinedReducer = {
  events: eventLogSlice.reducer,
  projections: projectionsSlice.reducer,
  config: configSlice.reducer,
  settings: settingsSlice.reducer
};

const rootReducer = (state: any, action: any) => {
  if (action.type === 'global/resetState') {
    // Keep config but reset everything else? 
    // Actually, distinct context switch might want total clear, but we usually set config immediately after.
    // Let's go for FULL reset to initial state, forcing re-hydration.
    state = undefined;
  }

  // Manual combineReducers to handle undefined state for init
  const nextState: any = {};

  Object.keys(combinedReducer).forEach(key => {
    // @ts-ignore
    nextState[key] = combinedReducer[key](state ? state[key] : undefined, action);
  });

  return nextState;
};

// --- Store ---
export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(syncMiddleware)
});

export const { appendEvent } = eventLogSlice.actions;
export const { processEvent } = projectionsSlice.actions;
export const { setConfig, setContext } = configSlice.actions;
export const { updateGoals } = settingsSlice.actions;

// --- Selectors ---
export const selectSettings = (state: RootState) => state.settings;

export const CALORIES_PER_GRAM = {
  PROTEIN: 4,
  FAT: 9,
  CARBS: 4
};

export const selectMacroTargetsGrams = (state: RootState) => {
  const { targetCalories, macroRatios } = state.settings;
  return {
    protein: Math.round((targetCalories * macroRatios.protein) / CALORIES_PER_GRAM.PROTEIN),
    fat: Math.round((targetCalories * macroRatios.fat) / CALORIES_PER_GRAM.FAT),
    carbs: Math.round((targetCalories * macroRatios.carbs) / CALORIES_PER_GRAM.CARBS)
  };
};

// --- Thunks / Helpers ---
export const dispatchEvent = (type: string, payload: any) => async (dispatch: any, getState: any) => {
  const event: FoodEvent = {
    eventId: crypto.randomUUID(),
    type,
    timestamp: new Date().toISOString(),
    payload
  };

  // 1. Append to Source of Truth (Middleware will catch this and persist to IDB + Trigger Sync)
  dispatch(appendEvent(event));

  // 2. Update Projections
  dispatch(processEvent(event));

  // 3. Update Settings if applicable
  if (type === 'settings/goalsUpdated') {
    dispatch(updateGoals(payload));
  }
};

export const ingestSyncedEvent = (event: FoodEvent) => async (dispatch: any) => {
  // 1. Process for Projections
  if (event.type === 'settings/goalsUpdated') {
    dispatch(updateGoals(event.payload));
  } else {
    dispatch(processEvent(event));
  }

  // 2. Append to Log in memory
  dispatch(eventLogSlice.actions.hydrateEvent(event));
};

export const batchHydrateEvents = (events: FoodEvent[]) => async (dispatch: any) => {
  // 1. Process all projections
  const projectionEvents: FoodEvent[] = [];

  events.forEach(event => {
    if (event.type === 'settings/goalsUpdated') {
      dispatch(updateGoals(event.payload));
    } else {
      projectionEvents.push(event);
    }

    // Also hydrate to memory log
    // We can do this in batch below
  });

  if (projectionEvents.length > 0) {
    dispatch(projectionsSlice.actions.processAllEvents(projectionEvents));
  }

  // 2. Hydrate all events to memory
  dispatch(eventLogSlice.actions.hydrateAllEvents(events));
};

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
