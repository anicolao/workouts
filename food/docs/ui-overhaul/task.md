# UI Overhaul Task List

- [x] **Foundation**
    - [x] Create/Update `src/app.css` with new CSS variables (Dark Mode, Glassmorphism).
    - [x] Set up global font (Inter/San Francisco).
- [x] **Core Components**
    - [x] Create `StatsRing.svelte` (SVG-based circular progress).
    - [x] Create `FoodCard.svelte` (List item with image/stats).
    - [x] Create `LogSheet.svelte` (Bottom sheet for mobile).
    - [x] Create `MacroBubble.svelte` (Secondary stats).
- [x] **Layout & Navigation**
    - [x] Update `src/routes/+layout.svelte` for responsive implementation.
    - [x] Implement `MobileNav.svelte` (Bottom bar + FAB).
    - [x] Implement `DesktopSidebar.svelte` (Side nav for laptop).
- [x] **Pages**
    - [x] Overhaul Dashboard (`src/routes/+page.svelte`).
    - [x] Overhaul Food Logging Flow (`src/routes/log/+page.svelte` or similar).
- [x] **Verification**
    - [x] Update E2E tests to reflect new UI structure.
    - [x] Screen verification (manual or snapshot).
