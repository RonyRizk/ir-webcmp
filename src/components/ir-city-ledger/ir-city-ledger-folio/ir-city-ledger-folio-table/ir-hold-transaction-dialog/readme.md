# ir-hold-transaction-dialog



<!-- Auto Generated Below -->


## Properties

| Property         | Attribute         | Description | Type       | Default |
| ---------------- | ----------------- | ----------- | ---------- | ------- |
| `currencySymbol` | `currency-symbol` |             | `string`   | `'$'`   |
| `row`            | --                |             | `FolioRow` | `null`  |


## Events

| Event         | Description | Type                                                  |
| ------------- | ----------- | ----------------------------------------------------- |
| `holdToggled` |             | `CustomEvent<{ rowId: string; newIsHold: boolean; }>` |


## Methods

### `closeModal() => Promise<void>`



#### Returns

Type: `Promise<void>`



### `openModal() => Promise<void>`



#### Returns

Type: `Promise<void>`




## Dependencies

### Used by

 - [ir-city-ledger-folio-table](..)

### Depends on

- [ir-dialog](../../../../ui/ir-dialog)
- [ir-custom-button](../../../../ui/ir-custom-button)

### Graph
```mermaid
graph TD;
  ir-hold-transaction-dialog --> ir-dialog
  ir-hold-transaction-dialog --> ir-custom-button
  ir-city-ledger-folio-table --> ir-hold-transaction-dialog
  style ir-hold-transaction-dialog fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
