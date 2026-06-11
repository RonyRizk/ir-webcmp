# ir-city-ledger-fiscal-documents-filters



<!-- Auto Generated Below -->


## Properties

| Property  | Attribute | Description | Type                      | Default                                                                                                                                      |
| --------- | --------- | ----------- | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `filters` | --        |             | `ClFiscalDocumentFilters` | `{     fromDate: undefined,     toDate: undefined,     docNumber: '',     taxableOnly: false,     type: 'all',     proformaOnly: false,   }` |


## Events

| Event           | Description | Type                                   |
| --------------- | ----------- | -------------------------------------- |
| `applyFilters`  |             | `CustomEvent<ClFiscalDocumentFilters>` |
| `filtersChange` |             | `CustomEvent<ClFiscalDocumentFilters>` |


## Dependencies

### Used by

 - [ir-city-ledger-fiscal-documents](..)

### Depends on

- [ir-validator](../../../ui/ir-validator)
- [ir-date-range-filter](../../../ui/ir-date-range-filter)
- [ir-input](../../../ui/ir-input)
- [ir-custom-button](../../../ui/ir-custom-button)

### Graph
```mermaid
graph TD;
  ir-city-ledger-fiscal-documents-filters --> ir-validator
  ir-city-ledger-fiscal-documents-filters --> ir-date-range-filter
  ir-city-ledger-fiscal-documents-filters --> ir-input
  ir-city-ledger-fiscal-documents-filters --> ir-custom-button
  ir-date-range-filter --> ir-date-select
  ir-date-range-filter --> ir-custom-button
  ir-date-select --> ir-input
  ir-date-select --> ir-air-date-picker
  ir-city-ledger-fiscal-documents --> ir-city-ledger-fiscal-documents-filters
  style ir-city-ledger-fiscal-documents-filters fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
