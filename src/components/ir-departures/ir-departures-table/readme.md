# ir-departures-table



<!-- Auto Generated Below -->


## Properties

| Property         | Attribute         | Description                                                                                                                                                                             | Type      | Default |
| ---------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ------- |
| `hidePagination` | `hide-pagination` | Hides the pagination footer, for hosts that load the whole day in one page (the dashboard).                                                                                             | `boolean` | `false` |
| `pmsDisabled`    | `pms-disabled`    | For properties without front desk (PMS): check-out status isn't tracked, so every room departing on the store's day is listed in one list, without overdue marks or the actions column. | `boolean` | `false` |


## Events

| Event                   | Description | Type                                                     |
| ----------------------- | ----------- | -------------------------------------------------------- |
| `checkoutRoom`          |             | `CustomEvent<{ booking: Booking; identifier: string; }>` |
| `requestPageChange`     |             | `CustomEvent<PaginationChangeEvent>`                     |
| `requestPageSizeChange` |             | `CustomEvent<PaginationChangeEvent>`                     |


## Dependencies

### Used by

 - [ir-dashboard-departures](../../ir-dashboard/ir-dashboard-departures)
 - [ir-departures](..)

### Depends on

- [ir-booking-number-cell](../../table-cells/booking/ir-booking-number-cell)
- [ir-booked-by-cell](../../table-cells/booking/ir-booked-by-cell)
- [ir-guest-name-cell](../../table-cells/booking/ir-guest-name-cell)
- [ir-unit-cell](../../table-cells/booking/ir-unit-cell)
- [ir-dates-cell](../../table-cells/booking/ir-dates-cell)
- [ir-balance-cell](../../table-cells/booking/ir-balance-cell)
- [ir-actions-cell](../../table-cells/booking/ir-actions-cell)
- [ir-empty-state](../../ir-empty-state)
- [ir-custom-button](../../ui/ir-custom-button)
- [ir-pagination](../../ir-pagination)

### Graph
```mermaid
graph TD;
  ir-departures-table --> ir-booking-number-cell
  ir-departures-table --> ir-booked-by-cell
  ir-departures-table --> ir-guest-name-cell
  ir-departures-table --> ir-unit-cell
  ir-departures-table --> ir-dates-cell
  ir-departures-table --> ir-balance-cell
  ir-departures-table --> ir-actions-cell
  ir-departures-table --> ir-empty-state
  ir-departures-table --> ir-custom-button
  ir-departures-table --> ir-pagination
  ir-unit-cell --> ir-unit-tag
  ir-balance-cell --> ir-custom-button
  ir-actions-cell --> ir-custom-button
  ir-pagination --> ir-custom-button
  ir-dashboard-departures --> ir-departures-table
  ir-departures --> ir-departures-table
  style ir-departures-table fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
