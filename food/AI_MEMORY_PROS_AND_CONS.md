# AI Semantic Memory: Pros, Cons, and Decision

**Decision:** REMOVE the `generative-language.retriever` scope for now.

## Research Findings
- **Current Usage:** The `generative-language.retriever` scope is requested in `src/lib/auth.ts` but is **never used** in the application logic. Code search confirmed zero calls to `createCorpus`, `createDocument`, or any Retriever API endpoints.
- **Privacy Impact:** Requesting this scope gives the app permission to manage semantic data in the user's account, which might alert privacy-conscious users even if we don't use it.
- **User Experience:** The "Semantic Memory" section in the Privacy Policy is currently misleading, as the feature behaves differently than described (it doesn't exist yet).

## Options Analysis

### Option A: Implement "Semantic Memory"
Turn the feature on by indexing food logs into a Gemini Corpus.
*   **Pros:**
    *   Allows "Chat with your food log" (e.g., "What did I eat last Tuesday?").
    *   Enhances the "AI Assistant" feel.
*   **Cons:**
    *   **High Complexity:** Requires building a sync engine to push SQLite list updates to the Vector DB (Corpus).
    *   **Data Duplication:** Data lives in Drive (Sheets) AND Gemini (Corpus), risking sync conflicts.
    *   **Quota Limits:** The Retriever API has separate quotas and billing implications for the user.
    *   **Development Cost:** Significant effort to build and maintain for an MVP.

### Option B: Remove Scope (Recommended)
Remove the scope request and the corresponding section from the Privacy Policy.
*   **Pros:**
    *   **Privacy First:** We request fewer permissions. "Least Privilege" principle.
    *   **Accuracy:** The Privacy Policy will match the actual code.
    *   **Simplicity:** Reduces OAuth consent screen friction.
*   **Cons:**
    *   Removes the *potential* for this feature without code changes later (but adding a scope later is easy).

## Recommendation

**Execute Option B immediately.**
1.  Remove `https://www.googleapis.com/auth/generative-language.retriever` from `src/lib/auth.ts`.
2.  Remove the "Semantic Memory" section from `PRIVACY.md` and `/privacy`.
3.  Remove the mention from `GENERATIVE_API_DETAILS.md`.

This aligns with the goal of "Privacy First" and accurate documentation. We can revisit Option A as a dedicated feature release in the future.
