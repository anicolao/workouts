# Development Standards

## Technology Stack

-   **Frontend**: SvelteKit (Svelte 5)
-   **State Management**: Redux (Event Sourcing Pattern)
-   **Testing**: Playwright (Zero-Tolerance)
-   **Styling**: Plain Svelte-Scoped CSS (No Tailwind)
-   **Package Manager**: `bun`
-   **Environment**: Nix

## Development Environment

We use [Nix](https://nixos.org/) to enforce a consistent development environment.

1.  Install Nix.
2.  Enable flakes.
3.  Run `nix develop` to enter the shell with `bun` and other dependencies installed.

## Architecture: Event Sourcing with Redux

We strictly adhere to an Event Sourcing pattern using Redux.

-   **Facts on the Ground**: The state is a result of a series of actions (events). We record *what happened* (e.g., `SET_COMPLETED`), not just the resulting state.
-   **Reducers as Interpreters**: Reducers are pure functions that interpret these actions to produce the current application state.
-   **Debuggability**: Logic errors are fixed by rewriting reducers to correctly interpret the history of actions.

## Styling

We use **Plain Svelte-Scoped CSS**.
-   **No Tailwind**: Tailwind classes are explicitly forbidden.
-   **Structure**: Use `<style>` blocks within `.svelte` components.
-   **Variables**: Global theme variables should be defined in a root layout/stylesheet.

## Zero-Tolerance E2E Testing

We assume that if a feature is not tested, it is broken.

-   **Pixel-Perfect Consistency**: We use software rendering in E2E tests to ensure consistent snapshots across environments.
-   **GitHub Workflows**: Every PR is validated by the E2E suite.
-   **PR Previews**: Deployments are generated for every PR to allow manual verification.
-   **User Stories**: Every user story must be accompanied by at least one E2E test case.
