# Project Workflow

This document outlines the standard workflow for contributing to the `food` project.

## Development Process

1.  **Branching**:
    - Always create a new branch for each task or feature.
    - Branch names should be descriptive (e.g., `feature/mvp-implementation`, `fix/auth-flow`).

2.  **Iterative Development**:
    - Commit often.
    - Push to your branch frequently to record history.

3.  **Pull Requests**:
    - **Create** a Pull Request (PR) for your changes using `gh pr create`.
    - Use `PR_DESCRIPTION.md` as the PR body: `gh pr create --title "..." --body-file PR_DESCRIPTION.md`
    - **Crucial**: The PR body MUST include the **original User Prompt(s)** and any **relevant User Comments** that initiated or directed the work.
    - **VERBATIM**: Copy the text exactly as written. Do not summarize, edit, or truncate.
    - **ENTIRETY**: Include the full text of the prompt.
    - This ensures context is preserved in the history without ambiguity.
    - Update the PR description as the task evolves.

4.  **Artifacts**:
    - All planning and documentation artifacts (e.g., `implementation_plan.md`, `walkthrough.md`) must be committed to the repository (e.g., in `docs/`) to be visible to reviewers. Local brainstorming files are not sufficient for review.

## Documentation
- **Bot Submission**: N/A for this project.
- **E2E Testing**: See [E2E_GUIDE.md](./E2E_GUIDE.md).
