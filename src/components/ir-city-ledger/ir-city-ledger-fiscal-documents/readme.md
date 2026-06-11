# ir-city-ledger-fiscal-documents



<!-- Auto Generated Below -->


## Properties

| Property         | Attribute         | Description | Type                      | Default     |
| ---------------- | ----------------- | ----------- | ------------------------- | ----------- |
| `agentId`        | `agent-id`        |             | `number`                  | `null`      |
| `currencies`     | --                |             | `ICurrency[]`             | `[]`        |
| `currencySymbol` | `currency-symbol` |             | `string`                  | `'$'`       |
| `initialFilters` | --                |             | `ClFiscalDocumentFilters` | `undefined` |
| `propertyId`     | `property-id`     |             | `number`                  | `undefined` |
| `ticket`         | `ticket`          |             | `string`                  | `undefined` |


## Events

| Event                   | Description | Type                                   |
| ----------------------- | ----------- | -------------------------------------- |
| `clFiscalFiltersChange` |             | `CustomEvent<ClFiscalDocumentFilters>` |


## Dependencies

### Used by

 - [ir-city-ledger](..)

### Depends on

- [ir-city-ledger-fiscal-documents-filters](ir-city-ledger-fiscal-documents-filters)
- [ir-city-ledger-fiscal-documents-table](ir-city-ledger-fiscal-documents-table)

### Graph
```mermaid
graph TD;
  ir-city-ledger-fiscal-documents --> ir-city-ledger-fiscal-documents-filters
  ir-city-ledger-fiscal-documents --> ir-city-ledger-fiscal-documents-table
  ir-city-ledger-fiscal-documents-filters --> ir-validator
  ir-city-ledger-fiscal-documents-filters --> ir-date-range-filter
  ir-city-ledger-fiscal-documents-filters --> ir-input
  ir-city-ledger-fiscal-documents-filters --> ir-custom-button
  ir-date-range-filter --> ir-date-select
  ir-date-range-filter --> ir-custom-button
  ir-date-select --> ir-input
  ir-date-select --> ir-air-date-picker
  ir-city-ledger-fiscal-documents-table --> ir-cl-status-tag
  ir-city-ledger-fiscal-documents-table --> ir-custom-button
  ir-city-ledger-fiscal-documents-table --> ir-spinner
  ir-city-ledger-fiscal-documents-table --> ir-fd-confirm-dialog
  ir-fd-confirm-dialog --> ir-dialog
  ir-fd-confirm-dialog --> ir-custom-button
  ir-city-ledger --> ir-city-ledger-fiscal-documents
  style ir-city-ledger-fiscal-documents fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
