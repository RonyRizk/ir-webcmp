# ir-daily-revenue-filters



<!-- Auto Generated Below -->


## Properties

| Property    | Attribute    | Description | Type                          | Default     |
| ----------- | ------------ | ----------- | ----------------------------- | ----------- |
| `isLoading` | `is-loading` |             | `boolean`                     | `undefined` |
| `payments`  | --           |             | `Map<string, FolioPayment[]>` | `undefined` |


## Events

| Event             | Description | Type                                                                                   |
| ----------------- | ----------- | -------------------------------------------------------------------------------------- |
| `fetchNewReports` |             | `CustomEvent<{ from_date?: string; to_date?: string; date?: string; users: string; }>` |


## Dependencies

### Used by

 - [ir-daily-revenue](..)

### Depends on

- [ir-filter-card](../../ir-filter-card)
- [ir-date-range-filter](../../ui/ir-date-range-filter)
- [ir-custom-button](../../ui/ir-custom-button)

### Graph
```mermaid
graph TD;
  ir-daily-revenue-filters --> ir-filter-card
  ir-daily-revenue-filters --> ir-date-range-filter
  ir-daily-revenue-filters --> ir-custom-button
  ir-filter-card --> ir-custom-button
  ir-date-range-filter --> ir-date-select
  ir-date-range-filter --> ir-custom-button
  ir-date-select --> ir-input
  ir-date-select --> ir-air-date-picker
  ir-daily-revenue --> ir-daily-revenue-filters
  style ir-daily-revenue-filters fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
