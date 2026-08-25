# ir-unvoiced-bookings-filters



<!-- Auto Generated Below -->


## Events

| Event                             | Description | Type                                                         |
| --------------------------------- | ----------- | ------------------------------------------------------------ |
| `uninvoicedBookingsFiltersChange` |             | `CustomEvent<{ from: string; to: string; source: string; }>` |


## Dependencies

### Used by

 - [ir-uninvoiced-bookings](..)

### Depends on

- [ir-date-range-filter](../../ui/ir-date-range-filter)
- [ir-custom-button](../../ui/ir-custom-button)

### Graph
```mermaid
graph TD;
  ir-unvoiced-bookings-filters --> ir-date-range-filter
  ir-unvoiced-bookings-filters --> ir-custom-button
  ir-date-range-filter --> ir-date-select
  ir-date-range-filter --> ir-custom-button
  ir-date-select --> ir-input
  ir-date-select --> ir-air-date-picker
  ir-uninvoiced-bookings --> ir-unvoiced-bookings-filters
  style ir-unvoiced-bookings-filters fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
