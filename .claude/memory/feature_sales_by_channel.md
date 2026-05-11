---
name: Feature - Sales by Channel
description: Revenue breakdown per booking channel; report-page pattern; ir-sales-by-channel
type: project
originSessionId: 45deeb2b-f37e-4995-ad1f-918b39198abe
---
**Screenshot:** `screenshots/Sales_By_Channel.PNG`
**Top-level component:** `src/components/ir-sales-by-channel/ir-sales-by-channel.tsx` — tag `ir-sales-by-channel`
**Host page:** `src/pages/index-sales-by-channel.html`

### Layout (from screenshot)
- **No KPI cards** (unlike Sales by Country / Daily Revenue / Daily Occupancy).
- **Left filters panel:** Rooms (Booked / other modes), Selected period (preset dropdown — "For the past 7 days") OR date range, Compare with previous year, Reset/Apply.
- **Right table:** Channel (e.g., "iCHANNEL | Booking.com", "Direct | manual", "iCHANNEL | Expedia"), Room nights, Room Revenue, % with horizontal bar.
- Legend at bottom-right: Selected period / Previous year colours.
- **Top-right:** Export button.

### Architecture
- **`propertyid` prop is typed `string`** here — inconsistent with other pages that use `number`. Don't "fix" this; check before using.
- Has a required `mode!: SalesByChannelMode` prop (likely toggles which metric is shown — "Room nights" vs "Revenue" vs "Bookings"). Confirm by reading `./types.ts` before adding modes.
- Filters typed `ChannelSaleFilter`: `{ FROM_DATE, TO_DATE, BOOK_CASE, WINDOW, include_previous_year, is_export_to_excel }`. Note **UPPERCASE keys** — they map to the backend payload shape, not camelCase. Sales by Country uses the same uppercase keys.
- Default filter window: last 7 days, `BOOK_CASE = '001'`, `WINDOW = 7`.
- Children: `ir-sales-by-channel-filters`, `ir-sales-by-channel-table`, `ir-sales-by-channel-summary`.

**How to apply:** Mirror the structure of `ir-sales-by-country` when extending this — they're a pair. The `BOOK_CASE` codes are backend-defined (`'001'` is the default "booked" case); ask the user before adding new codes.
