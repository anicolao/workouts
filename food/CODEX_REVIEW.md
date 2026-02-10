# Codex Review

## Findings

### High
- Resolved: `media/uploadCompleted` now updates the projection so entries that saved before uploads finished backfill `imageDriveUrl` when the upload completes.

### Medium
- Resolved: Removed the unused `FavouriteItem.id` field and stopped generating UUIDs in the reducer to keep event replays deterministic.
- Resolved: Sync pointers are now namespaced by `spreadsheetId`, with a one-time migration from legacy global keys.

### Low
- `src/lib/components/ui/NutrientInput.svelte:37-43`: Clearing an input sets `val` to `undefined`, but `onupdate` is skipped when `val` is `undefined`. This makes it impossible to clear a numeric field without it reverting to its previous value. Consider firing updates for empty values and letting the parent decide how to handle `undefined`/`null`.
- `src/lib/images.ts:3-30`: `resolveDriveImage` caches `URL.createObjectURL` results indefinitely without revocation. Over long sessions this can leak memory. Consider evicting old entries and calling `URL.revokeObjectURL` when images are no longer needed.

## Questions / Assumptions
None.

## Notes
- No automated tests were run for this review.
