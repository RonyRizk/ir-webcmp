---
name: Feature - Sales by Country
description: Revenue breakdown per guest country with flags; report-page pattern; ir-sales-by-country
type: project
originSessionId: 45deeb2b-f37e-4995-ad1f-918b39198abe
---
**Screenshot:** `screenshots/Sales_By_Country.PNG`
**Top-level component:** `src/components/ir-sales-by-country/ir-sales-by-country.tsx` — tag `ir-sales-by-country`
**Host page:** `src/pages/index-sales-by-country.html`

### Layout (from screenshot)
- **Top KPI cards (3):** Total Room Nights, Total Guests, Total Revenue.
- **Left filters panel:** Rooms (Booked dropdown), Selected period preset OR date range, Compare with previous year, Reset/Apply.
- **Right table:** Country (with flag icon next to name; "Not specified" used when missing), Room nights, No of guests, Revenue, % with horizontal bar.
- Bottom-centre "Load More" button (pagination by appending rows).
- Legend at bottom-right.
- **Top-right:** Export button.

### Architecture
- `propertyid` prop is typed `number` here (contrast with `string` in sales-by-channel).
- Filters typed `CountrySalesFilter`. Default base filters: last 7 days, `BOOK_CASE = '001'`, `WINDOW = 7`, `include_previous_year: false`.
- Loads `MappedCountries = new Map()` — country list for translation/flag lookup is keyed by ISO code.
- Services: `RoomService`, `PropertyService`, `BookingService`.
- Children: `ir-sales-by-country-summary` (three KPI cards), `ir-sales-filters` (yes, the folder is `ir-sales-filters` — not `ir-sales-by-country-filters` — shared name), `ir-sales-table`.

**How to apply:** When adding a column to either Sales report, check both `ir-sales-table` (country) and `ir-sales-by-channel-table` (channel) and decide whether the change should land on both or just one. The "Load More" pagination here differs from the page-based pagination in arrivals/listing; replicate the pattern from `salesData` accumulation if extending it.
