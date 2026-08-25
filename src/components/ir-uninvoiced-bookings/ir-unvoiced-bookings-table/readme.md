# ir-unvoiced-bookings-table



<!-- Auto Generated Below -->


## Events

| Event                          | Description | Type                |
| ------------------------------ | ----------- | ------------------- |
| `uninvoicedBookingsPageChange` |             | `CustomEvent<void>` |


## Dependencies

### Used by

 - [ir-uninvoiced-bookings](..)

### Depends on

- [ir-booking-number-cell](../../table-cells/booking/ir-booking-number-cell)
- [ir-booked-by-cell](../../table-cells/booking/ir-booked-by-cell)
- [ir-dates-cell](../../table-cells/booking/ir-dates-cell)
- [ir-status-activity-cell](../../table-cells/booking/ir-status-activity-cell)
- [ir-spinner](../../ui/ir-spinner)
- [ir-empty-state](../../ir-empty-state)
- [ir-pagination](../../ir-pagination)

### Graph
```mermaid
graph TD;
  ir-unvoiced-bookings-table --> ir-booking-number-cell
  ir-unvoiced-bookings-table --> ir-booked-by-cell
  ir-unvoiced-bookings-table --> ir-dates-cell
  ir-unvoiced-bookings-table --> ir-status-activity-cell
  ir-unvoiced-bookings-table --> ir-spinner
  ir-unvoiced-bookings-table --> ir-empty-state
  ir-unvoiced-bookings-table --> ir-pagination
  ir-status-activity-cell --> ir-booking-status-tag
  ir-pagination --> ir-custom-button
  ir-uninvoiced-bookings --> ir-unvoiced-bookings-table
  style ir-unvoiced-bookings-table fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
