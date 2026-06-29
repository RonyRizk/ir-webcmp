# ir-cl-fiscal-document-preview



<!-- Auto Generated Below -->


## Properties

| Property     | Attribute     | Description | Type     | Default     |
| ------------ | ------------- | ----------- | -------- | ----------- |
| `propertyId` | `property-id` |             | `number` | `undefined` |
| `ticket`     | `ticket`      |             | `string` | `undefined` |


## Events

| Event               | Description | Type                |
| ------------------- | ----------- | ------------------- |
| `documentConverted` |             | `CustomEvent<void>` |


## Dependencies

### Used by

 - [ir-city-ledger](../..)
 - [ir-fiscal-document-preview](../../../ir-fiscal-documents/ir-fiscal-document-preview)

### Depends on

- [ir-spinner](../../../ui/ir-spinner)
- [ir-pdf-viewer](../../../ir-pdf-viewer)
- [ir-preview-screen-dialog](../../../ir-preview-screen-dialog)
- [ir-custom-button](../../../ui/ir-custom-button)
- [ir-fd-confirm-dialog](../ir-city-ledger-fiscal-documents-table/ir-fd-confirm-dialog)

### Graph
```mermaid
graph TD;
  ir-cl-fiscal-document-preview --> ir-spinner
  ir-cl-fiscal-document-preview --> ir-pdf-viewer
  ir-cl-fiscal-document-preview --> ir-preview-screen-dialog
  ir-cl-fiscal-document-preview --> ir-custom-button
  ir-cl-fiscal-document-preview --> ir-fd-confirm-dialog
  ir-preview-screen-dialog --> ir-dialog
  ir-preview-screen-dialog --> ir-custom-button
  ir-fd-confirm-dialog --> ir-dialog
  ir-fd-confirm-dialog --> ir-input
  ir-fd-confirm-dialog --> ir-custom-button
  ir-city-ledger --> ir-cl-fiscal-document-preview
  ir-fiscal-document-preview --> ir-cl-fiscal-document-preview
  style ir-cl-fiscal-document-preview fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
