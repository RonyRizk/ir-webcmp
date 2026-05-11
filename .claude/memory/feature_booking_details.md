---
name: Feature - Booking Details
description: Per-booking detail view; ir-booking-details with many sub-cards (header, rooms, payment, folio, extras)
type: project
originSessionId: 45deeb2b-f37e-4995-ad1f-918b39198abe
---
**Screenshot:** `screenshots/Booking_Details.PNG`
**Top-level component:** `src/components/ir-booking-details/ir-booking-details.tsx` — tag `ir-booking-details`
**Drawer variant:** `ir-booking-details-drawer` (same content rendered inside a drawer; used from Arrivals/Departures/Listing pages)
**Host page:** `src/pages/index-bookingdetails.html`

### Layout (from screenshot)
- **Header row:** Booking number, channel reference (BDC-...), status pill ("CONFIRMED" + "Update status" dropdown), action buttons: Events log / PMS / Billing / Print / Email / Close.
- **Left column:** Reservation Information card (Source, Booked on/by, Company, Phone, Email, Country, Channel notes, Booking private note) → then per-night accordion with rooms ("Double room with Balcony", guests, expected departure time) → "Extra Services" section.
- **Right column:** Balance + Collected card → "Booking guarantee" (card type, holder, number, balance) → "Guest Folio" section.

### Toggleable feature props
Booking-details exposes capability flags so the same component is reused in restricted/permissive contexts:
- `hasPrint`, `hasReceipt`, `hasDelete`, `hasMenu`
- Per-room: `hasRoomEdit`, `hasRoomDelete`, `hasRoomAdd`, `hasCheckIn`, `hasCheckOut`
- `hasCloseButton`, `is_from_front_desk`

Set these to `true` only where the host page allows that action.

### Child component map
- `ir-booking-header` — top status row (+ `events-log/ir-events-log`, `ir-pms-logs` triggered from buttons)
- `ir-reservation-information` — left-column main card
- `ir-room` + `ir-room-guests` + `ir-room-guests-form` — per-room section
- `ir-extra-services` (+ `ir-extra-service`, `ir-extra-service-config`, `ir-extra-service-config-form`)
- `ir-ota-services` (+ `ir-ota-service`)
- `ir-payment-details` (orchestrator) with: `ir-payment-summary`, `ir-payment-item`, `ir-payment-folio` + `ir-payment-folio-form`, `ir-payments-folio`, `ir-payment-actions` + `ir-payment-action`, `ir-applicable-policies`, `ir-booking-guarantee`
- `ir-booking-extra-note`
- `ir-arrival-time-dialog`, `ir-pickup` (+ form + `ir-pickup-view`)

### Architecture notes (non-obvious)
- Uses `isRequestPending` from `ir-interceptor.store` to gate UI on in-flight calls.
- Has a hardcoded `printingBaseUrl = 'https://gateway.igloorooms.com/PrintBooking/%1/printing?id=%2'` — used when generating print URLs; the `%1` and `%2` are placeholders.
- `IPaymentAction[]` drives the payment actions menu — comes from `PaymentService`.
- `buildSplitIndex` / `SplitIndex` from `utils/booking` is used to manage split-booking UI state.

**How to apply:** When adding a new sub-section to booking details, create it as its own `ir-*` component under `src/components/ir-booking-details/` and render it from `ir-booking-details.tsx`. Pipe the same `Booking` object down via a `@Prop()`. If the section involves payments, add it under `ir-payment-details/` instead. New action buttons go in `ir-booking-header.tsx`.
