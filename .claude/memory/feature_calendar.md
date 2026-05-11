---
name: Feature - Front Desk / Igloo Calendar
description: Timeline calendar grid; the most complex feature; tag igloo-calendar uses socket.io for real-time updates
type: project
originSessionId: 45deeb2b-f37e-4995-ad1f-918b39198abe
---
**Screenshot:** `screenshots/FrontDesk.PNG`
**Top-level component:** `src/components/igloo-calendar/igloo-calendar.tsx` — tag `igloo-calendar`
**Host page:** `src/pages/index-calendar.html`

### What it is
The PMS front-desk view: a horizontal timeline grid. Rows are room categories ("Double room with B...", "Suite for 4 with bal...", etc.); columns are dates. Coloured booking blocks span their stay; left "Legend" panel describes block colour coding. Right-side panel can show "To Be Assigned" bookings.

### Architecture notes (non-obvious)
- Uses `socket.io-client` for live updates from the backend.
- Mutates `from_date` via `@Prop({ mutable: true })` — unusual in this codebase, called out because it's how the date range scrolls.
- Touches **four** shared stores simultaneously: `calendar_data`, `calendar_dates.store`, `unassigned_dates.store`, `housekeeping.store`. Most other pages touch one.
- Pulls in **five services**: `RoomService`, `BookingService`, `EventsService`, `ToBeAssignedService`, `HouseKeepingService`.
- Booking colours are picked from constants in `src/services/room.service.ts` (`FRONT_DESK_STRIPE_COLORS`, `FRONT_DESK_CHECKOUT_COLORS`) — match this palette when adding new booking states.

### Child component map (igl-* family)
- `igl-cal-header` / `igl-cal-body` / `igl-cal-footer` — grid skeleton
- `igl-legend` — bottom legend bar
- `igl-to-be-assigned` (+ `igl-tba-category-view`, `igl-tba-booking-view`) — right side panel
- `igl-booking-event` (+ `igl-booking-event-hover`) — individual booking blocks
- `igl-book-property` (+ container, header, footer, form, overview, room-type, rate-plan, application-info, property-booked-by) — new-booking dialog
- `igl-bulk-operations` (+ drawer, bulk-block, bulk-stop-sale, ir-rectifier) — bulk actions
- `igl-split-booking`, `igl-reallocation-dialog`, `igl-housekeeping-dialog`, `igl-hk-issues-dialog`, `igl-blocked-date-drawer`, `igl-block-dates-view`, `igl-date-range`, `igl-cal-body/igl-housekeeping-dialog`
- Editor variant: `ir-booking-editor` family (drawer/form/header/guest-form) — note the `ir-*` prefix exception inside `igloo-calendar/`
- `ir-room-nights` — extend-stay UI

**How to apply:** When a new calendar feature is requested, prefer adding an `igl-*` child component inside `src/components/igloo-calendar/` and wire it through `igloo-calendar.tsx`. Reuse one of the existing stores rather than creating a new one — calendar state is already heavily centralised. The `igl-*` prefix is mandatory for children of this folder (except the `ir-booking-editor` and `ir-room-nights` exceptions, which exist for historical reasons).
