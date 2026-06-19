# ir-sales-filters



<!-- Auto Generated Below -->


## Properties

| Property      | Attribute    | Description | Type                                                                                              | Default     |
| ------------- | ------------ | ----------- | ------------------------------------------------------------------------------------------------- | ----------- |
| `baseFilters` | --           |             | `Omit<CountrySalesParams, "AC_ID" \| "is_export_to_excel"> & { include_previous_year: boolean; }` | `undefined` |
| `isLoading`   | `is-loading` |             | `boolean`                                                                                         | `undefined` |


## Events

| Event          | Description | Type                                                                                                           |
| -------------- | ----------- | -------------------------------------------------------------------------------------------------------------- |
| `applyFilters` |             | `CustomEvent<Omit<CountrySalesParams, "AC_ID" \| "is_export_to_excel"> & { include_previous_year: boolean; }>` |


## Dependencies

### Used by

 - [ir-sales-by-country](..)

### Depends on

- [ir-filter-card](../../ir-filter-card)
- [ir-date-range-filter](../../ui/ir-date-range-filter)
- [ir-custom-button](../../ui/ir-custom-button)

### Graph
```mermaid
graph TD;
  ir-sales-filters --> ir-filter-card
  ir-sales-filters --> ir-date-range-filter
  ir-sales-filters --> ir-custom-button
  ir-filter-card --> ir-custom-button
  ir-date-range-filter --> ir-date-select
  ir-date-range-filter --> ir-custom-button
  ir-date-select --> ir-input
  ir-date-select --> ir-air-date-picker
  ir-sales-by-country --> ir-sales-filters
  style ir-sales-filters fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
