# Test: US-023: Auth Persistence

## Reload page and verify session

![Reload page and verify session](./screenshots/000-persisted.png)

**Verifications:**
- [x] Token in localStorage
- [x] User still logged in after reload

---

## Simulate token expiration within 48h window

![Simulate token expiration within 48h window](./screenshots/001-silent-recovery.png)

**Verifications:**
- [x] Silent refresh keeps user logged in

---

## Simulate token expiration beyond 48h window

![Simulate token expiration beyond 48h window](./screenshots/002-hard-expiry.png)

**Verifications:**
- [x] Logged out after 48h expiry

---

