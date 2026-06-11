# ir-city-ledger-statements-filter



<!-- Auto Generated Below -->


## Properties

| Property          | Attribute           | Description | Type     | Default |
| ----------------- | ------------------- | ----------- | -------- | ------- |
| `initialFromDate` | `initial-from-date` |             | `string` | `null`  |
| `initialToDate`   | `initial-to-date`   |             | `string` | `null`  |


## Events

| Event             | Description | Type                            |
| ----------------- | ----------- | ------------------------------- |
| `createStatement` |             | `CustomEvent<StatementFilters>` |
| `filtersChange`   |             | `CustomEvent<StatementFilters>` |
| `printStatement`  |             | `CustomEvent<StatementFilters>` |


## Dependencies

### Used by

 - [ir-city-ledger-statements](..)

### Depends on

- [ir-validator](../../../ui/ir-validator)
- [ir-date-range-filter](../../../ui/ir-date-range-filter)
- [ir-custom-button](../../../ui/ir-custom-button)

### Graph
```mermaid
graph TD;
  ir-city-ledger-statements-filter --> ir-validator
  ir-city-ledger-statements-filter --> ir-date-range-filter
  ir-city-ledger-statements-filter --> ir-custom-button
  ir-date-range-filter --> ir-date-select
  ir-date-range-filter --> ir-custom-button
  ir-date-select --> ir-input
  ir-date-select --> ir-air-date-picker
  ir-city-ledger-statements --> ir-city-ledger-statements-filter
  style ir-city-ledger-statements-filter fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
