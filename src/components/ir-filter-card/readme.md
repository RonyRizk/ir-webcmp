# ir-filter-card



<!-- Auto Generated Below -->


## Shadow Parts

| Part            | Description |
| --------------- | ----------- |
| `"filter-body"` |             |
| `"footer"`      |             |
| `"header"`      |             |


## Dependencies

### Used by

 - [ir-daily-revenue-filters](../ir-daily-revenue/ir-daily-revenue-filters)
 - [ir-meal-report-filters](../ir-meal-report/ir-meal-report-filters)
 - [ir-monthly-bookings-report-filter](../ir-monthly-bookings-report/ir-monthly-bookings-report-filter)
 - [ir-sales-by-channel-filters](../ir-sales-by-channel/ir-sales-by-channel-filters)
 - [ir-sales-filters](../ir-sales-by-country/ir-sales-filters)
 - [ir-tasks-filters](../ir-housekeeping/ir-hk-tasks/ir-tasks-filters)

### Depends on

- [ir-custom-button](../ui/ir-custom-button)

### Graph
```mermaid
graph TD;
  ir-filter-card --> ir-custom-button
  ir-daily-revenue-filters --> ir-filter-card
  ir-meal-report-filters --> ir-filter-card
  ir-monthly-bookings-report-filter --> ir-filter-card
  ir-sales-by-channel-filters --> ir-filter-card
  ir-sales-filters --> ir-filter-card
  ir-tasks-filters --> ir-filter-card
  style ir-filter-card fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
