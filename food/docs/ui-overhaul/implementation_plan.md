# UI Overhaul Implementation Plan

# Goal Description
Transform the current utilitarian UI into a premium, modern, dark-mode experience with glassmorphism and vibrant data visualization. The design is Phone-First but Laptop-Responsive.

## User Review Required
> [!IMPORTANT]
> This is a complete visual overhaul. Existing visual regression tests will fail and need to be updated.

## Proposed Changes

### Foundation
#### [MODIFY] [app.css](file:///Users/anicolao/projects/antigravity/food/src/app.css)
- Define CSS variables for colors, gradients, spacing, and glassmorphism.
- Set global background and typography.

### Components
#### [NEW] [StatsRing.svelte](file:///Users/anicolao/projects/antigravity/food/src/lib/components/ui/StatsRing.svelte)
- SVG-based circular progress chart.

#### [NEW] [FoodCard.svelte](file:///Users/anicolao/projects/antigravity/food/src/lib/components/ui/FoodCard.svelte)
- Card component for displaying logged food items.

#### [NEW] [LogSheet.svelte](file:///Users/anicolao/projects/antigravity/food/src/lib/components/ui/LogSheet.svelte)
- Slide-up bottom sheet for editing logs on mobile.

#### [NEW] [MobileNav.svelte](file:///Users/anicolao/projects/antigravity/food/src/lib/components/ui/MobileNav.svelte)
- Bottom navigation bar with FAB.

#### [NEW] [DesktopSidebar.svelte](file:///Users/anicolao/projects/antigravity/food/src/lib/components/ui/DesktopSidebar.svelte)
- Sidebar navigation for laptop view.

### Layout
#### [MODIFY] [Layout](file:///Users/anicolao/projects/antigravity/food/src/routes/+layout.svelte)
- Implement responsive logic to switch between MobileNav and DesktopSidebar.

### Pages
#### [MODIFY] [Dashboard](file:///Users/anicolao/projects/antigravity/food/src/routes/+page.svelte)
- Implement Hero Stats Ring and Meal Feed.

## Verification Plan

### Automated Tests
- Run existing E2E tests to ensure functionality remains (selectors might need updates).
- `npx playwright test`

### Manual Verification
- Verify responsive behavior by resizing browser.
- Verify "Glassmorphism" effects and Dark Mode aesthetics.
