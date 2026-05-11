---
name: Feature - Daily Revenue
description: Payments/refunds report grouped by payment method; expandable rows
type: project
originSessionId: 45deeb2b-f37e-4995-ad1f-918b39198abe
---
**Screenshot:** `screenshots/Daily_Revenue.PNG`
**Top-level component:** `src/components/ir-daily-revenue/ir-daily-revenue.tsx` — tag `ir-daily-revenue`
**Host page:** `src/pages/index-daily-revenue.html`

### Layout (from screenshot)
- **Top KPI cards (3):** Payments (green, with previous-day comparison), Refunds (red), Difference (green). Trend arrows up/down.
- **Left filters panel:** "Selected period" single-date dropdown OR from→to date range; Reset/Apply.
- **Right table:** Grouped by payment method (Cash / OTA virtual card / Online / Manual card). Each group has a "Payment N" expandable sub-row with the count of payments.
- **Top-right:** Export button.

### Architecture
- Filters typed `DailyPaymentFilter`: `{ date, from_date, to_date, users }`. Single date is the default mode; date range mode populates `from_date`/`to_date` and nulls `date` (or vice versa — check `componentWillLoad`).
- `DailyRevenue` was recently updated to accept from/to dates (see commit `73cde1d`).
- Uses `PropertyService`, `BookingService`, `RoomService`.
- Emits `@Event() preventPageLoad` and listens for `revenueOpenSidebar` / `fetchNewReports`.
- Children: `ir-daily-revenue-filters`, `ir-revenue-summary` (the three KPI cards), `ir-revenue-table` (the grouped table), `ir-revenue-row` (each method group, expandable), `ir-revenue-row-details` (the expanded sub-rows).

**How to apply:** New report columns or payment categories belong in `ir-revenue-table` / `ir-revenue-row`. New filter dimensions go in `ir-daily-revenue-filters` and the `DailyPaymentFilter` type. Follow the report-page pattern in `memory/patterns_report_pages.md`.
