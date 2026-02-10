# UI Tidy Up & Log State Management

- [x] Removal of redundant "Log Now" link <!-- id: 0 -->
- [x] Implement URL-based Date State <!-- id: 1 -->
    - [x] Sync `?date=` query param with current view date
    - [x] Handle page load with `?date=` param
- [x] Implement Deep Linking & State Persistence <!-- id: 2 -->
    - [x] Persist scroll position to URL (or history state)
    - [x] Persist expanded/collapsed card state to URL (or history state)
    - [x] Restore state on navigation return
- [x] Animate Log Navigation <!-- id: 3 -->
    - [x] Implement directional slide transitions (future/past) depending on user navigation
