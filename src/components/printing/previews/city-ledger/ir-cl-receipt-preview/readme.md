# ir-cl-receipt-preview



<!-- Auto Generated Below -->


## Properties

| Property         | Attribute         | Description | Type     | Default     |
| ---------------- | ----------------- | ----------- | -------- | ----------- |
| `agentId`        | `agent-id`        |             | `number` | `undefined` |
| `agentName`      | `agent-name`      |             | `string` | `undefined` |
| `baseurl`        | `baseurl`         |             | `string` | `undefined` |
| `documentNumber` | `document-number` |             | `string` | `undefined` |
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

### Graph
```mermaid
graph TD;
  ir-cl-receipt-preview --> ir-spinner
  ir-cl-receipt-preview --> ir-cl-document-header
  style ir-cl-receipt-preview fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
