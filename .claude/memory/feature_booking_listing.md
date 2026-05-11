---
name: Feature - Bookings Listing
description: Paginated list of bookings with filter bar; ir-booking-listing uses booking_listing store + custom pagination
type: project
originSessionId: 45deeb2b-f37e-4995-ad1f-918b39198abe
---
**Screenshot:** `screenshots/Bookings_Listing.PNG`
**Top-level component:** `src/components/ir-booking-listing/ir-booking-listing.tsx` — tag `ir-booking-listing`
**Host page:** `src/pages/index-booking-listing.html`

### Layout (from screenshot)
- Page title "Bookings".
- **Filter bar:** Date type (Date of Reservation), date range, All statuses dropdown, All channels dropdown, Paid or Unpaid dropdown, search icon, clear/eraser icon, export icon.
- **Table columns:** Booking# (with channel icon + reference, e.g., "BDC-..." for Booking.com, "EXP-..." for Expedia, "AGO-..." for Agoda), Booked on (date/time), Booked by (guest name + adults pill), Dates, Services (room type + room# pill), Amount (with Balance pill in red), Status (CONFIRMED / PENDING / CANCELLED / CONFIRMED Modified), edit + delete actions.

### Architecture notes (non-obvious)
- **Custom pagination model**: lives in `src/stores/booking_listing.store.ts` — exposes `setPaginationPage`, `setPaginationPageSize`, `updatePaginationFromSelection`. Default `rowCount = 20`.
- Accepts a `baseUrl` prop and sets it on the `Token` singleton via `token.setBaseUrl(baseUrl)` before fetching. Lets the page be embedded against a non-default backend.
- `userType` prop + `isPrivilegedUser` util: certain rows/actions are hidden for non-privileged user types.
- Uses `PropertyService.allowedProperties` to scope what's visible if the user manages multiple properties.

### Child component map
- `ir-listing-header` — top filter bar
- `ir-booking-listing-table` — desktop table; uses table cells from `src/components/table-cells/booking/` (`ir-booked-by-cell`, `ir-booked-on-cell`, `ir-booking-number-cell`, `ir-dates-cell`, `ir-unit-cell`, `ir-balance-cell`, `ir-actions-cell`, `ir-arrival-time-cell`, `ir-status-activity-cell`, `ir-guest-name-cell`)
- `ir-booking-listing-mobile-card` — mobile view alternative
- `ir-listing-modal` — modal triggered from row actions
- Reuses `ir-booking-details-drawer` for the edit drawer, `ir-payment-folio` for payment actions

**How to apply:** When adding a column or filter to the listing, add it to `ir-booking-listing-table` (column) or `ir-listing-header` (filter). New table cells belong in `src/components/table-cells/booking/` following the existing `ir-*-cell` pattern. Use `booking_listing.store.ts` setters rather than mutating store fields directly.
