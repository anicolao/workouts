# Test: 013-detailed-nutrition: Log and Edit Detailed Nutrition

## Setup: Mock Drive and Gemini

![Setup: Mock Drive and Gemini](./screenshots/000-setup-mock.png)

**Verifications:**
- [x] Drive and Gemini APIs mocked

---

## Action: Navigate to Log and Enter Text

![Action: Navigate to Log and Enter Text](./screenshots/001-navigate-and-log.png)

**Verifications:**
- [x] Log page reachable and analysis returns details

---

## Verification: Check Unified Form with Details

![Verification: Check Unified Form with Details](./screenshots/002-verify-form.png)

**Verifications:**
- [x] Item name populated
- [x] Calories match
- [x] Detailed fields visible after toggle

---

## Action: Save Entry

![Action: Save Entry](./screenshots/003-save-entry.png)

**Verifications:**
- [x] Save redirects to home

---

## Action: Open Entry in Detail View

![Action: Open Entry in Detail View](./screenshots/004-open-detail.png)

**Verifications:**
- [x] Entry opens

---

## Verification: Check Details Persisted

![Verification: Check Details Persisted](./screenshots/005-verify-persistence.png)

**Verifications:**
- [x] Details align with mocked data

---

## Action: Edit Detail (Independent Fields)

![Action: Edit Detail (Independent Fields)](./screenshots/006-edit-detail.png)

**Verifications:**
- [x] Edit Fiber does NOT update Total Carbs (Decoupled)

---

## Verification: Verify Edit Persisted

![Verification: Verify Edit Persisted](./screenshots/007-verify-edit.png)

**Verifications:**
- [x] Caffeine value is now 50
- [x] Fiber is 40 and Carbs is 30

---

