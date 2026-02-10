
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { store, processEvent, type FoodEvent, type LogEntry } from '../../src/lib/store';

describe('Store Reducer Logic', () => {
    it('should correctly update entry after edit action', () => {
        // We will use the store dispatch to simulating the event stream.
        // Note: The store is a singleton in the module, so state might persist if not carefully managed or reset,
        // but for a single run unit test it is fine.

        const actions = [
            // 1. Unknown / Draft type
            {
                type: 'log/draftGenerated', // Guessing type, shouldn't affect projection
                payload: { "imagesCount": 0, "rawJson": { "is_label": false, "item_name": "Breakfast Oatmeal with Chia and Skim Milk", "rationale": "Estimated nutrition based on standard Canadian values for 1/3 cup dry old-fashioned oatmeal, 1/2 tbsp chia seeds, 1/2 tbsp oat flour, and 1 cup skim milk, considering typical portion sizes and nutritional content for each ingredient.", "calories": 236, "fat": { "total": 4.5 }, "carbohydrates": { "total": 36 }, "protein": 13.4, "searchQuery": "Oatmeal with chia seeds and skim milk" }, "inputType": "text" }
            },
            // 2. Confirmed
            {
                type: 'log/entryConfirmed',
                payload: { "entry": { "id": "721341fa-83a6-40c3-b0f8-7b8225d239f1", "date": "2026-01-15", "time": "06:36", "mealType": "Breakfast", "description": "Breakfast Oatmeal with Chia and Skim Milk", "rationale": "Estimated nutrition based on standard Canadian values for 1/3 cup dry old-fashioned oatmeal, 1/2 tbsp chia seeds, 1/2 tbsp oat flour, and 1 cup skim milk, considering typical portion sizes and nutritional content for each ingredient.", "calories": 236, "fat": 4.5, "carbs": 36, "protein": 13.4, "imageDriveUrl": "", "rawJson": { "item_name": "Breakfast Oatmeal with Chia and Skim Milk", "rationale": "Estimated nutrition based on standard Canadian values for 1/3 cup dry old-fashioned oatmeal, 1/2 tbsp chia seeds, 1/2 tbsp oat flour, and 1 cup skim milk, considering typical portion sizes and nutritional content for each ingredient.", "calories": 236, "protein": 13.4, "carbohydrates": { "total": 36 }, "fat": { "total": 4.5 } } } }
            },
            // 3. Draft
            {
                type: 'log/draftGenerated',
                payload: { "imagesCount": 0, "rawJson": { "is_label": false, "item_name": "Ham and creamy sauce low carb tortilla wrap", "rationale": "The estimation is based on two Mission Carb Balance soft taco tortillas (approx. 60 kcal, 2g fat, 15g carbs, 4g protein each), 4 oz (113g) of lean deli ham (approx. 125 kcal, 3.5g fat, 2g carbs, 21.5g protein), and 1 tablespoon of a generic creamy sauce, assuming 'bichon sauce' is a typo for a light creamy dressing like light mayonnaise or ranch (approx. 40 kcal, 4g fat, 1g carbs, 0.5g protein).", "calories": 285, "fat": { "total": 11.5 }, "carbohydrates": { "total": 33 }, "protein": 30, "searchQuery": "Ham and creamy sauce low carb tortilla wrap" }, "inputType": "text" }
            },
            // 4. Confirmed
            {
                type: 'log/entryConfirmed',
                payload: { "entry": { "id": "0377c20a-6251-4bf5-9ef5-3c59c5cf093c", "date": "2026-01-15", "time": "11:51", "mealType": "Lunch", "description": "Ham and creamy sauce low carb tortilla wrap", "rationale": "The estimation is based on two Mission Carb Balance soft taco tortillas (approx. 60 kcal, 2g fat, 15g carbs, 4g protein each), 4 oz (113g) of lean deli ham (approx. 125 kcal, 3.5g fat, 2g carbs, 21.5g protein), and 1 tablespoon of a generic creamy sauce, assuming 'bichon sauce' is a typo for a light creamy dressing like light mayonnaise or ranch (approx. 40 kcal, 4g fat, 1g carbs, 0.5g protein).", "calories": 285, "fat": 11.5, "carbs": 33, "protein": 30, "imageDriveUrl": "https://drive.google.com/thumbnail?id=1KOB5aVi9PhJzweWb_bga_iV5HAXxN-97&sz=w2048", "rawJson": { "item_name": "Ham and creamy sauce low carb tortilla wrap", "rationale": "The estimation is based on two Mission Carb Balance soft taco tortillas (approx. 60 kcal, 2g fat, 15g carbs, 4g protein each), 4 oz (113g) of lean deli ham (approx. 125 kcal, 3.5g fat, 2g carbs, 21.5g protein), and 1 tablespoon of a generic creamy sauce, assuming 'bichon sauce' is a typo for a light creamy dressing like light mayonnaise or ranch (approx. 40 kcal, 4g fat, 1g carbs, 0.5g protein).", "calories": 285, "protein": 30, "carbohydrates": { "total": 33 }, "fat": { "total": 11.5 } } } }
            },
            // 5. Confirmed (Target for Edit)
            {
                type: 'log/entryConfirmed',
                payload: { "entry": { "id": "ec693587-27f8-4172-8958-a7c0ff00b101", "date": "2026-01-15", "time": "11:51", "mealType": "Lunch", "description": "Ham and creamy sauce low carb tortilla wrap", "rationale": "The estimation is based on two Mission Carb Balance soft taco tortillas (approx. 60 kcal, 2g fat, 15g carbs, 4g protein each), 4 oz (113g) of lean deli ham (approx. 125 kcal, 3.5g fat, 2g carbs, 21.5g protein), and 1 tablespoon of a generic creamy sauce, assuming 'bichon sauce' is a typo for a light creamy dressing like light mayonnaise or ranch (approx. 40 kcal, 4g fat, 1g carbs, 0.5g protein).", "calories": 285, "fat": 11.5, "carbs": 33, "protein": 30, "imageDriveUrl": "https://drive.google.com/thumbnail?id=1cSPbOJAVil802a-wFpQwGG0dzQe5JBKx&sz=w2048", "rawJson": { "item_name": "Ham and creamy sauce low carb tortilla wrap", "rationale": "The estimation is based on two Mission Carb Balance soft taco tortillas (approx. 60 kcal, 2g fat, 15g carbs, 4g protein each), 4 oz (113g) of lean deli ham (approx. 125 kcal, 3.5g fat, 2g carbs, 21.5g protein), and 1 tablespoon of a generic creamy sauce, assuming 'bichon sauce' is a typo for a light creamy dressing like light mayonnaise or ranch (approx. 40 kcal, 4g fat, 1g carbs, 0.5g protein).", "calories": 285, "protein": 30, "carbohydrates": { "total": 33 }, "fat": { "total": 11.5 } } } }
            },
            // 6. EDIT ACTION
            {
                type: 'log/entryUpdated',
                payload: { "entryId": "ec693587-27f8-4172-8958-a7c0ff00b101", "changes": { "mealType": "Lunch", "description": "Ham and creamy sauce low carb tortilla wrap", "rationale": "The estimation is based on two Mission Carb Balance soft taco tortillas (approx. 60 kcal, 2g fat, 15g carbs, 4g protein each), 4 oz (113g) of lean deli ham (approx. 125 kcal, 3.5g fat, 2g carbs, 21.5g protein), and 1 tablespoon of Bitch'n sauce", "calories": 285, "protein": 30, "carbs": 33, "fat": 11.5 } }
            },
            // 7. Draft for next
            {
                type: 'log/draftGenerated',
                payload: { "imagesCount": 1, "rawJson": { "is_label": false, "item_name": "Breakfast Plate with English Muffin and Potato & Egg Bake", "rationale": "The meal consists of two main components: 1) An English muffin, split and topped with peanut butter and jam. We estimate 1 whole English muffin, 2 tablespoons of peanut butter, and 2 tablespoons of jam. 2) A large slice of what appears to be a potato and egg bake or frittata. This estimate accounts for eggs, shredded potatoes, and some added fat from cooking, potentially cheese. All estimates are based on visible portion sizes and standard Canadian nutritional values.", "calories": 750, "fat": { "total": 37 }, "carbohydrates": { "total": 85 }, "protein": 28, "searchQuery": "English muffin with peanut butter and jam and potato egg bake" } }
            },
            // 8. Confirmed
            {
                type: 'log/entryConfirmed',
                payload: { "entry": { "id": "86a73dbd-932f-4243-be77-2ab57054ddea", "date": "2026-01-16", "time": "07:19", "mealType": "Breakfast", "description": "Breakfast Plate with English Muffin and Potato & Egg Bake", "rationale": "The meal consists of two main components: 1) An English muffin, split and topped with peanut butter and jam. We estimate 1 whole English muffin, 2 tablespoons of peanut butter, and 2 tablespoons of jam. 2) A large slice of what appears to be a potato and egg bake or frittata. This estimate accounts for eggs, shredded potatoes, and some added fat from cooking, potentially cheese. All estimates are based on visible portion sizes and standard Canadian nutritional values.", "calories": 750, "fat": 37, "carbs": 85, "protein": 28, "imageDriveUrl": "https://drive.google.com/thumbnail?id=16_3FhsMXkniCi9ZpcqJn-57V3zzf3n2n&sz=w2048", "rawJson": { "item_name": "Breakfast Plate with English Muffin and Potato & Egg Bake", "rationale": "The meal consists of two main components: 1) An English muffin, split and topped with peanut butter and jam. We estimate 1 whole English muffin, 2 tablespoons of peanut butter, and 2 tablespoons of jam. 2) A large slice of what appears to be a potato and egg bake or frittata. This estimate accounts for eggs, shredded potatoes, and some added fat from cooking, potentially cheese. All estimates are based on visible portion sizes and standard Canadian nutritional values.", "calories": 750, "protein": 28, "carbohydrates": { "total": 85 }, "fat": { "total": 37 } } } }
            }
        ];

        // Dispatch all actions
        for (const action of actions) {
            const date = new Date().toISOString();
            const event: FoodEvent = {
                eventId: crypto.randomUUID(),
                type: action.type,
                timestamp: date,
                payload: action.payload
            };
            store.dispatch(processEvent(event));
        }

        // Check state
        const state = store.getState().projections;

        // Find the edited entry
        const entryId = "ec693587-27f8-4172-8958-a7c0ff00b101";
        const entry = state.log.find((e: LogEntry) => e.id === entryId);

        assert.ok(entry, "Entry should exist");
        assert.strictEqual(entry.description, "Ham and creamy sauce low carb tortilla wrap");

        // The rationale should include "Bitch'n sauce" which was in the edit
        const expectedRationale = "The estimation is based on two Mission Carb Balance soft taco tortillas (approx. 60 kcal, 2g fat, 15g carbs, 4g protein each), 4 oz (113g) of lean deli ham (approx. 125 kcal, 3.5g fat, 2g carbs, 21.5g protein), and 1 tablespoon of Bitch'n sauce";

        assert.strictEqual(entry.rationale, expectedRationale, "Rationale should be updated");
    });
});
