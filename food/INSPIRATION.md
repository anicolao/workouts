# Inspiration

This project's architecture and best practices are heavily inspired by the following repositories:

## `tabletop-game-template` (@anicolao)
-   **E2E Framework**: Source of the "Unified Step Pattern" and "Zero-Pixel Tolerance" philosophy.
-   **Documentation**: Sets the standard for self-documenting tests.

## `nix-tabletop` (@anicolao)
-   **Development Environment**: Inspiration for maintaining a reproducible development environment via Nix.

## `outpost7` (@anicolao)
-   **Redux & Event Sourcing**: Demonstrates the pattern of using Reducers as interpreters of a history of actions ("facts on the ground").
-   **Project Structure**: SvelteKit application structure.

## `iostt` (@anicolao)
-   **Native Wrapping**: Serves as the reference for wrapping the web application in a thin iOS native layer using `WKWebView`.

## General Philosophy
-   **Agentic Design**: Building with the assumption that AI agents will be reading and modifying the code, necessitating clear documentation and strong typing.
