# ir-dashboard-bookings-table

<!-- Auto Generated Below -->


## Overview

Read-only booking list used by the dashboard's In-house, Bookings and Cancellations panels, built from the shared
booking table cells. In-house lists one row per occupied room; Bookings and Cancellations list one row per booking,
with its rooms' units stacked in the Unit cell.

## Properties

| Property       | Attribute       | Description                                                                                                                      | Type                                            | Default     |
| -------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- | ----------- |
| `bookings`     | --              |                                                                                                                                  | `Booking[]`                                     | `[]`        |
| `date`         | `date`          | The dashboard's selected day: balance payments (e.g. a cancellation's charge or refund) are recorded on it rather than on today. | `string`                                        | `undefined` |
| `emptyMessage` | `empty-message` |                                                                                                                                  | `string`                                        | `undefined` |
| `variant`      | `variant`       | In-house drops the Balance and Status columns that Bookings and Cancellations end with.                                          | `"cancellations" \| "inHouse" \| "newBookings"` | `'inHouse'` |


## Dependencies

### Used by

 - [ir-dashboard](..)

### Depends on

- [ir-booking-number-cell](../../table-cells/booking/ir-booking-number-cell)
- [ir-booked-by-cell](../../table-cells/booking/ir-booked-by-cell)
- [ir-unit-cell](../../table-cells/booking/ir-unit-cell)
- [ir-dates-cell](../../table-cells/booking/ir-dates-cell)
- [ir-balance-cell](../../table-cells/booking/ir-balance-cell)
- [ir-status-activity-cell](../../table-cells/booking/ir-status-activity-cell)
- [ir-guest-name-cell](../../table-cells/booking/ir-guest-name-cell)
- [ir-empty-state](../../ir-empty-state)

### Graph
```mermaid
graph TD;
  ir-dashboard-bookings-table --> ir-booking-number-cell
  ir-dashboard-bookings-table --> ir-booked-by-cell
  ir-dashboard-bookings-table --> ir-unit-cell
  ir-dashboard-bookings-table --> ir-dates-cell
  ir-dashboard-bookings-table --> ir-balance-cell
  ir-dashboard-bookings-table --> ir-status-activity-cell
  ir-dashboard-bookings-table --> ir-guest-name-cell
  ir-dashboard-bookings-table --> ir-empty-state
  ir-unit-cell --> ir-unit-tag
  ir-balance-cell --> ir-custom-button
  ir-status-activity-cell --> ir-booking-status-tag
  ir-dashboard --> ir-dashboard-bookings-table
  style ir-dashboard-bookings-table fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
