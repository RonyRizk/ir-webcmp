# ir-cl-credit-note-preview



<!-- Auto Generated Below -->


## Properties

| Property         | Attribute         | Description | Type     | Default     |
| ---------------- | ----------------- | ----------- | -------- | ----------- |
| `agentId`        | `agent-id`        |             | `number` | `undefined` |
| `agentName`      | `agent-name`      |             | `string` | `undefined` |
| `baseurl`        | `baseurl`         |             | `string` | `undefined` |
| `documentNumber` | `document-number` |             | `string` | `undefined` |
| `externalRef`    | `external-ref`    |             | `string` | `undefined` |
| `propertyId`     | `property-id`     |             | `number` | `undefined` |
| `ticket`         | `ticket`          |             | `string` | `undefined` |


## Events

| Event            | Description | Type                |
| ---------------- | ----------- | ------------------- |
| `clPreviewReady` |             | `CustomEvent<void>` |


## Dependencies

### Depends on

- [ir-spinner](../../../../ui/ir-spinner)
- [ir-cl-document-header](../ir-cl-document-header)
- [ir-cl-fiscal-document-table](../ir-cl-fiscal-document-table)

### Graph
```mermaid
graph TD;
  ir-cl-credit-note-preview --> ir-spinner
  ir-cl-credit-note-preview --> ir-cl-document-header
  ir-cl-credit-note-preview --> ir-cl-fiscal-document-table
  ir-cl-fiscal-document-table --> ir-cl-invoice-date-cell
  ir-cl-fiscal-document-table --> ir-cl-invoice-description-cell
  ir-cl-fiscal-document-table --> ir-cl-invoice-net-price-cell
  ir-cl-fiscal-document-table --> ir-cl-invoice-vat-pct-cell
  ir-cl-fiscal-document-table --> ir-cl-invoice-vat-amount-cell
  ir-cl-fiscal-document-table --> ir-cl-invoice-city-tax-pct-cell
  ir-cl-fiscal-document-table --> ir-cl-invoice-city-tax-amount-cell
  ir-cl-fiscal-document-table --> ir-cl-invoice-total-cell
  style ir-cl-credit-note-preview fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
