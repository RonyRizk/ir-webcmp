---
name: Screenshots folder for visual component references
description: Repo has screenshots/ folder; filename → component mapping (confirmed)
type: project
originSessionId: 45deeb2b-f37e-4995-ad1f-918b39198abe
---
The user maintains `screenshots/` at repo root with PNGs that show the rendered UI for each major feature. Filename → component mappings (all confirmed):

| Filename | Component / heading | Notes |
|---|---|---|
| `Agent_Listing_And_Details.PNG` | `ir-agents` | Embedded in PMS shell; right drawer "Edit Agent/Group" |
| `Availability_Alert.PNG` | `ir-unbookable-rooms` | UI title "Availability Alert" — name mismatch |
| `Booking_Details.PNG` | `ir-booking-details` | Per-booking view |
| `Bookings_Listing.PNG` | `ir-booking-listing` | Paginated table with channel icons |
| `Daily_Occupancy.PNG` | `ir-monthly-bookings-report` | UI title "Daily Occupancy" — name mismatch |
| `Daily_Revenue.PNG` | `ir-daily-revenue` | Payments by method, expandable |
| `FrontDesk.PNG` | `igloo-calendar` | Timeline grid, socket.io live updates |
| `HouseKeeping_Daily_Tasks.PNG` | `ir-hk-tasks` | NOT `ir-housekeeping` |
| `HouseKeeping_and_CheckIn_Setup.PNG` | `ir-housekeeping` | NOT `ir-hk-tasks` |
| `Sales_By_Channel.PNG` | `ir-sales-by-channel` | No KPI cards |
| `Sales_By_Country.PNG` | `ir-sales-by-country` | With KPI cards + flag icons |

### Two name mismatches to remember
- **"Availability Alert"** (filename + UI title) → component is `ir-unbookable-rooms`
- **"Daily Occupancy"** (filename + UI title) → component is `ir-monthly-bookings-report`

**Why:** The user added these images deliberately so Claude has visual context for matching the existing style. He stated tokens are not a concern — opening screenshots when relevant is welcome.

**How to apply:** When asked to create/modify a screen, open the matching screenshot before designing the layout. For each feature there is also a dedicated `feature_<name>.md` memory describing its child components, services, stores, and non-obvious conventions — load those when working on the feature.
