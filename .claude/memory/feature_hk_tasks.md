---
name: Feature - Housekeeping Daily Tasks
description: Per-day cleaning task list with bulk actions; ir-hk-tasks
type: project
originSessionId: 45deeb2b-f37e-4995-ad1f-918b39198abe
---
**Screenshot:** `screenshots/HouseKeeping_Daily_Tasks.PNG`
**Top-level component:** `src/components/ir-housekeeping/ir-hk-tasks/ir-hk-tasks.tsx` — tag `ir-hk-tasks`
**Host page:** `src/pages/index-hk-tasks.html`

### Layout (from screenshot)
- Page title "Housekeeping Tasks".
- **Left filters panel:** Period dropdown ("For today" / range), Include dusty units (Yes/No), Highlight check-ins from (Yes/No), Reset/Apply.
- **Right content:** Search unit input; Export / Archives / Clean & Inspect / Cleaned buttons (right-aligned); table with columns: checkbox / Period / Unit / Status (sortable) / Hint / Tasks (pills like "CL") / Ad / Ch / In counters. Bottom: "View 1 - 2 of 2 tasks".

### Architecture (non-obvious)
- Lives **inside** `src/components/ir-housekeeping/` (not at top level) but renders as a full-page component with its own HTML host. Its sibling `ir-housekeeping` is the *setup* page (see `feature_housekeeping_setup.md`).
- Uses a **dedicated store** `src/stores/hk-tasks.store.ts` (separate from `housekeeping.store.ts`) — `hkTasksStore`, `updateTasks`, `updateSelectedTasks`, `clearSelectedTasks`, `setLoading`. Don't confuse the two.
- Maintains `table_sorting: Map<string, 'ASC' | 'DESC'>` instance field — the Status column header's sort arrows toggle through this map.
- Emits a bubbling `clearSelectedHkTasks` event (composed) to coordinate selection-clearing across sibling components.
- Caches housekeeper names in `hkNameCache: Record<number, string>` to avoid repeated lookups while rendering table rows.
- Task pills (CL, T1, T2, etc.) come from the housekeeping setup — they're configured in `ir-housekeeping` (the setup page) and consumed here.

### Child component map
- `ir-tasks-filters` — left panel
- `ir-tasks-header` — top action bar (Export / Archives / Clean & Inspect / Cleaned + search)
- `ir-tasks-table` — desktop table (uses `ir-tasks-card` for mobile rows, `ir-tasks-table-pagination` for the footer)
- `ir-hk-archive` (+ `ir-range-picker`) — the Archives drawer

**How to apply:** When adding a column/filter, update `ir-tasks-table` / `ir-tasks-filters` and the `TaskFilters` type. New task statuses are defined server-side (housekeeping codes) — coordinate with backend, don't invent. Use the existing `hk-tasks.store.ts` setters rather than mutating state directly.
