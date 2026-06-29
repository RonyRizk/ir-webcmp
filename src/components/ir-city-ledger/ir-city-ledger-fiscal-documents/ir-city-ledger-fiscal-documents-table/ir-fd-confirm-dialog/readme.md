# ir-fd-confirm-dialog



<!-- Auto Generated Below -->


## Properties

| Property       | Attribute       | Description | Type                                               | Default           |
| -------------- | --------------- | ----------- | -------------------------------------------------- | ----------------- |
| `action`       | `action`        |             | `"convert-to-invoice" \| "delete-draft" \| "void"` | `null`            |
| `amount`       | `amount`        |             | `number`                                           | `undefined`       |
| `docNumber`    | `doc-number`    |             | `string`                                           | `'this document'` |
| `fdType`       | `fd-type`       |             | `string`                                           | `undefined`       |
| `isConfirming` | `is-confirming` |             | `boolean`                                          | `false`           |
| `open`         | `open`          |             | `boolean`                                          | `false`           |


## Events

| Event       | Description | Type                                                                 |
| ----------- | ----------- | -------------------------------------------------------------------- |
| `cancelled` |             | `CustomEvent<void>`                                                  |
| `confirmed` |             | `CustomEvent<{ amount: number; voidType: FdConfirmationVoidType; }>` |


## Dependencies

### Used by

 - [ir-city-ledger-fiscal-documents-table](..)
 - [ir-cl-fiscal-document-preview](../../ir-cl-fiscal-document-preview)

### Depends on

- [ir-dialog](../../../../ui/ir-dialog)
- [ir-input](../../../../ui/ir-input)
- [ir-custom-button](../../../../ui/ir-custom-button)

### Graph
```mermaid
graph TD;
  ir-fd-confirm-dialog --> ir-dialog
  ir-fd-confirm-dialog --> ir-input
  ir-fd-confirm-dialog --> ir-custom-button
  ir-city-ledger-fiscal-documents-table --> ir-fd-confirm-dialog
  ir-cl-fiscal-document-preview --> ir-fd-confirm-dialog
  style ir-fd-confirm-dialog fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
