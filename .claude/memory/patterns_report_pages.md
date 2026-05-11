---
name: Pattern - Report pages (filters + KPI cards + table + export)
description: Common shape shared by Sales reports, Daily Revenue, Daily Occupancy, Availability Alert
type: project
originSessionId: 45deeb2b-f37e-4995-ad1f-918b39198abe
---
Several report pages share a strongly consistent layout. When asked to build a "new report" or a "new analytics page", default to this pattern unless the user specifies otherwise.

### Pages following this pattern
- `ir-sales-by-country` + `ir-sales-by-channel`
- `ir-daily-revenue`
- `ir-monthly-bookings-report` (heading "Daily Occupancy")
- `ir-unbookable-rooms` (heading "Availability Alert") — variant: timeline rows instead of a numbers table

### Visual structure
1. **Page title** (h1/h3) at top-left.
2. **Export button** at top-right (with paper icon).
3. **KPI cards row** below the title (0–4 cards) — `ir-stats-card`. Each card shows a number + small subtitle/trend.
4. **Two-column body:**
   - Left: **Filters panel** with `Filters` heading + funnel icon. Contains date range / period preset / mode toggles / "Compare with previous year" checkbox / Reset + Apply buttons (Apply is blue, Reset is grey).
   - Right: **Data table / timeline** filling the rest of the width.
5. Optional **Legend** strip at bottom-right ("Selected period" vs "Previous year" colour chips).
6. Optional **Load More** centre-bottom button (sales-by-country) OR conventional pagination footer.

### Code shape
- Top-level component holds: `language`, `ticket`, `propertyid` (number — except `ir-sales-by-channel` uses string), `p`, plus `@State() isPageLoading`, `@State() isLoading: 'filter' | 'export' | null`, and a typed `filters` State.
- `componentWillLoad` → set base filters → if `ticket` present, `token.setToken(ticket)` → `initializeApp()`/`init()`.
- `@Watch('ticket')` re-initialises on token change.
- Sales-family filters use **UPPERCASE keys** (`FROM_DATE`, `TO_DATE`, `BOOK_CASE`, `WINDOW`, `include_previous_year`) because they map directly to the backend payload.
- Children always split into `<feature>-filters`, `<feature>-table`, `<feature>-summary` (when KPI cards exist).
- Default period: last 7 days (`moment().add(-7, 'days')` → `moment()`), `BOOK_CASE = '001'`, `WINDOW = 7`.

### When extending or creating a new report
1. Create a folder under `src/components/ir-<report-name>/`.
2. Top-level `ir-<report-name>.tsx` with `scoped: true`, the four standard props, and an `isPageLoading`/`isLoading` state pair.
3. Three children: `ir-<report-name>-filters`, `ir-<report-name>-table`, `ir-<report-name>-summary` (if KPI cards).
4. Add a typed `<Name>Filter` interface in `./types.ts`.
5. Add the API call to the matching service (often `PropertyService`) with a Zod `*PropsSchema` if non-trivial.
6. Render `<ir-toast>` and gate first paint on `<ir-loading-screen>` while `isPageLoading`.
7. Add a host page `src/pages/index-<report-name>.html` mirroring `index-daily-revenue.html`.

**Why:** Every report in the app follows this shape — deviating creates churn and confuses users who already know the muscle memory. **How to apply:** When the user asks for a new report, propose this structure first; only deviate when they describe something explicitly different (e.g., a chart-first dashboard).
