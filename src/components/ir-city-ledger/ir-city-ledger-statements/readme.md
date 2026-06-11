# ir-city-ledger-statements



<!-- Auto Generated Below -->


## Properties

| Property         | Attribute         | Description | Type               | Default     |
| ---------------- | ----------------- | ----------- | ------------------ | ----------- |
| `agentId`        | `agent-id`        |             | `number`           | `null`      |
| `agentName`      | `agent-name`      |             | `string`           | `''`        |
| `currencies`     | --                |             | `ICurrency[]`      | `[]`        |
| `currencySymbol` | `currency-symbol` |             | `string`           | `'$'`       |
| `initialFilters` | --                |             | `StatementFilters` | `undefined` |
| `propertyId`     | `property-id`     |             | `number`           | `undefined` |
| `ticket`         | `ticket`          |             | `string`           | `undefined` |


## Events

| Event                 | Description | Type                            |
| --------------------- | ----------- | ------------------------------- |
| `clStmtFiltersChange` |             | `CustomEvent<StatementFilters>` |


## Dependencies

### Used by

 - [ir-city-ledger](..)

### Depends on

- [ir-city-ledger-statements-filter](ir-city-ledger-statements-filter)
- [ir-city-ledger-statements-table](ir-city-ledger-statements-table)
- [ir-preview-screen-dialog](../../ir-preview-screen-dialog)
- [ir-custom-button](../../ui/ir-custom-button)
- [ir-spinner](../../ui/ir-spinner)
- [ir-pdf-viewer](../../ir-pdf-viewer)

### Graph
```mermaid
graph TD;
  ir-city-ledger-statements --> ir-city-ledger-statements-filter
  ir-city-ledger-statements --> ir-city-ledger-statements-table
  ir-city-ledger-statements --> ir-preview-screen-dialog
  ir-city-ledger-statements --> ir-custom-button
  ir-city-ledger-statements --> ir-spinner
  ir-city-ledger-statements --> ir-pdf-viewer
  ir-city-ledger-statements-filter --> ir-validator
  ir-city-ledger-statements-filter --> ir-date-range-filter
  ir-city-ledger-statements-filter --> ir-custom-button
  ir-date-range-filter --> ir-date-select
  ir-date-range-filter --> ir-custom-button
  ir-date-select --> ir-input
  ir-date-select --> ir-air-date-picker
  ir-city-ledger-statements-table --> ir-spinner
  ir-preview-screen-dialog --> ir-dialog
  ir-preview-screen-dialog --> ir-custom-button
  ir-city-ledger --> ir-city-ledger-statements
  style ir-city-ledger-statements fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
