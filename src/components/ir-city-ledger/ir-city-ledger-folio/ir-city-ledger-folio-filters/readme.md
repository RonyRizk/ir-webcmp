# ir-city-ledger-folio-filters



<!-- Auto Generated Below -->


## Properties

| Property      | Attribute      | Description | Type      | Default     |
| ------------- | -------------- | ----------- | --------- | ----------- |
| `isExporting` | `is-exporting` |             | `boolean` | `undefined` |


## Events

| Event           | Description | Type                        |
| --------------- | ----------- | --------------------------- |
| `addEntry`      |             | `CustomEvent<void>`         |
| `applyFilters`  |             | `CustomEvent<FolioFilters>` |
| `exportFolio`   |             | `CustomEvent<void>`         |
| `filtersChange` |             | `CustomEvent<FolioFilters>` |


## Dependencies

### Used by

 - [ir-city-ledger-folio](..)

### Depends on

- [ir-validator](../../../ui/ir-validator)
- [ir-date-range-filter](../../../ui/ir-date-range-filter)
- [ir-input](../../../ui/ir-input)
- [ir-custom-button](../../../ui/ir-custom-button)

### Graph
```mermaid
graph TD;
  ir-city-ledger-folio-filters --> ir-validator
  ir-city-ledger-folio-filters --> ir-date-range-filter
  ir-city-ledger-folio-filters --> ir-input
  ir-city-ledger-folio-filters --> ir-custom-button
  ir-date-range-filter --> ir-date-select
  ir-date-range-filter --> ir-custom-button
  ir-date-select --> ir-input
  ir-date-select --> ir-air-date-picker
  ir-city-ledger-folio --> ir-city-ledger-folio-filters
  style ir-city-ledger-folio-filters fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
