---
name: Feature - Housekeeping & Check-In Setup
description: One-page settings UI for housekeeping rules and team; ir-housekeeping (different from ir-hk-tasks)
type: project
originSessionId: 45deeb2b-f37e-4995-ad1f-918b39198abe
---
**Screenshot:** `screenshots/HouseKeeping_and_CheckIn_Setup.PNG`
**Top-level component:** `src/components/ir-housekeeping/ir-housekeeping.tsx` — tag `ir-housekeeping`
**Host page:** `src/pages/index-housekeeping.html`

### Naming clash — important
There are **two distinct housekeeping pages**:
- `ir-housekeeping` (this one) — setup/settings.
- `ir-hk-tasks` — daily task list. See `feature_hk_tasks.md`.

Both live under `src/components/ir-housekeeping/` (the folder), which is confusing. When the user says "housekeeping", clarify whether they mean **setup** or **tasks**.

### Layout (from screenshot)
- Page title "Housekeeping & Check-In Setup".
- **Operations Settings card:**
  - Automatic Check-in & Check-out: dropdown (e.g., "No, I will do it manually.") with subtitle "Process guests automatically based on property rules".
  - Recurring Tasks: rows with coloured task code pills (`CL` Cleaning, `T1` Change Bed Sheets, `T2` Towels) + frequency dropdowns ("Daily cleaning", "Every 4 days", "Every Other Day").
- **Housekeeping team card:**
  - Header shows total/assigned units ("34 Total units · 34 Assigned").
  - Table: Name (+ note indicator), Mobile, Username, Units assigned (number + Edit button), `+` add row, per-row Edit + Delete actions.

### Architecture
- Service: `HouseKeepingService`. Init flow uses `getExposedHKSetup(propertyid)`. The `resetData` event listener re-fetches the setup.
- Store: `housekeeping.store.ts` (NOT `hk-tasks.store.ts`). `updateHKStore` mutates it.
- Frequencies dropdown options come from `IEntries[]` loaded at init.
- Emits `@Event() toast` for success/error UI.

### Child component map
- `ir-hk-team` — housekeeping team table
- `ir-hk-user` — single row in team table (+ row actions)
- `ir-hk-user-drawer` (+ `ir-hk-user-drawer-form`) — Edit/Add user drawer
- `ir-hk-unassigned-units` (+ `ir-hk-unassigned-units-drawer` + `ir-hk-unassigned-units-drawer-form`) — units-assignment management
- `ir-hk-delete-dialog` — confirm-delete dialog
- `ir-hk-operations-card` — Operations Settings card
- `ir-unit-status` — small unit-status indicator chip

**How to apply:** When asked to add a recurring task type or change frequency options, modify `ir-hk-operations-card`. New team-member fields go in `ir-hk-user-drawer-form` + the underlying `HouseKeepingService` type. Don't put task-list features here — they belong in `ir-hk-tasks` (different page).
