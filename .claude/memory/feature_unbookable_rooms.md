---
name: Feature - Availability Alert (a.k.a. Unbookable Rooms)
description: Shows date ranges where a room type cannot be booked; UI title "Availability Alert" but component is ir-unbookable-rooms
type: project
originSessionId: 45deeb2b-f37e-4995-ad1f-918b39198abe
---
**Screenshot:** `screenshots/Availability_Alert.PNG`
**Top-level component:** `src/components/ir-unbookable-rooms/ir-unbookable-rooms.tsx` — tag `ir-unbookable-rooms`
**Host page:** `src/pages/index-unbookable-rooms.html`

### Naming discrepancy — important
The page heading is **"Availability Alert"** but the component is `ir-unbookable-rooms`. When the user says "Availability Alert", they mean this component.

### Layout (from screenshot)
- **Left filters panel:** "Look ahead" months dropdown (default 2-5 months), "Minimum consecutive nights" number input (default 14, help text: "Period where room types are closed for booking"), Reset / Save buttons.
- **Right content area:** Per-room-type horizontal timeline. Each room type ("Double room without Balcony", "Virtual room") gets a row with a red bar spanning the unbookable period (e.g., "May 11 → Oct 11"). Blue legend = "Bookable period"; Red legend = "Not bookable period".

### Architecture (non-obvious)
- Has a **`mode` prop** with `{ reflect: true }`: `'default' | 'mpo'`. Reflecting means it appears as an HTML attribute — likely used for CSS targeting. The page behaviour branches on `resolveMode()`. `'mpo'` is presumably "multi-property overview" (not confirmed).
- `period_to_check` is in **months**; `consecutive_period` is in **days** — both have JSDoc comments stating units. Don't conflate.
- `normalizePositiveNumber(value, fallback)` is used to coerce input numbers — re-use it for new numeric props.
- Has two filter copies in state: `filters` (committed) and `progressFilters` (live during typing). Apply on Save.
- Service: `PropertyService.FetchUnBookableRoomsResult`.

### Child component map
- `ir-unbookable-rooms-filters` — left panel
- `ir-unbookable-rooms-data` — right timeline rows

**How to apply:** When adding a filter, update both the `UnbookableRoomsFilters` type and `progressFilters` shape; commit values to `filters` only on Save. The `mode` prop is for backwards-compat — don't change its default. The red/blue colour pair is the visual signature of this page; reuse it if adding new bands.
