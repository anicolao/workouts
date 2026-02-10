# Test: US-023: Date Navigation

## Default view is Today

![Default view is Today](./screenshots/000-view-today.png)

**Verifications:**
- [x] Header says Today
- [x] Next button disabled
- [x] Today food visible
- [x] Yesterday food NOT visible
- [x] Total Cals = 500

---

## Navigated to Yesterday

![Navigated to Yesterday](./screenshots/001-view-yesterday.png)

**Verifications:**
- [x] Header says Yesterday
- [x] Next button enabled
- [x] Yesterday food visible
- [x] Today food NOT visible
- [x] Total Cals = 300

---

## Navigated back to Today

![Navigated back to Today](./screenshots/002-return-today.png)

**Verifications:**
- [x] Header says Today
- [x] Total Cals restored

---

