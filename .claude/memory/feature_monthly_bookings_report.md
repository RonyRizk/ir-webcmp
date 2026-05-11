---
name: Feature - Daily Occupancy (a.k.a. Monthly Bookings Report)
description: Monthly occupancy report; UI title is "Daily Occupancy" but component is ir-monthly-bookings-report
type: project
originSessionId: 45deeb2b-f37e-4995-ad1f-918b39198abe
---
**Screenshot:** `screenshots/Daily_Occupancy.PNG`
**Top-level component:** `src/components/ir-monthly-bookings-report/ir-monthly-bookings-report.tsx` — tag `ir-monthly-bookings-report`
**Host page:** `src/pages/index-monthly-bookings-report.html`

### Naming discrepancy — important
The page **renders "Daily Occupancy" as its title** (`<h3>Daily Occupancy</h3>` at line ~175 of the .tsx). The component, folder, and page filename all say `monthly-bookings-report`. The team kept the technical name but renamed the heading. **When the user references "Daily Occupancy", they mean this component.**

### Layout (from screenshot)
- **Top KPI cards (4):** Average Occupancy (with delta vs last month), Total Units (Booked), Total Guests (Stayed), Peak Days (with peak occupancy %).
- **Left filters panel:** "For" month dropdown (e.g., "May 2026"), "Compare with previous year" checkbox, Reset/Apply.
- **Right table:** Date, Units booked, Total guests, ADR, Rooms revenue, Occupancy (% + horizontal bar).
- **Top-right:** Export button.

### Architecture
- Filters typed as `DailyReportFilter` (date with description/firstOfMonth/lastOfMonth, `include_previous_year`).
- Data fetched via `PropertyService` → returns `MonthlyStatsResults` with `DailyStats` array.
- KPI cards reuse `ir-stats-card` from `src/components/ui/`.
- Children: `ir-monthly-bookings-report-filter`, `ir-monthly-bookings-report-table`.

**How to apply:** When asked to modify "Daily Occupancy", look in `ir-monthly-bookings-report/`. Follow the report-page pattern in `memory/patterns_report_pages.md`. The base filter shape (description + firstOfMonth + lastOfMonth) is set in `componentWillLoad` — extend it there if adding new filter fields.
