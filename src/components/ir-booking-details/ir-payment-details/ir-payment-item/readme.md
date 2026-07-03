# ir-payment-item



<!-- Auto Generated Below -->


## Properties

| Property  | Attribute | Description | Type       | Default     |
| --------- | --------- | ----------- | ---------- | ----------- |
| `payment` | --        |             | `IPayment` | `undefined` |


## Events

| Event           | Description | Type                    |
| --------------- | ----------- | ----------------------- |
| `deletePayment` |             | `CustomEvent<IPayment>` |
| `editPayment`   |             | `CustomEvent<IPayment>` |
| `issueReceipt`  |             | `CustomEvent<IPayment>` |
| `voidReceipt`   |             | `CustomEvent<IPayment>` |


## Shadow Parts

| Part               | Description |
| ------------------ | ----------- |
| `"payment-body"`   |             |
| `"payment-fields"` |             |


## Dependencies

### Used by

 - [ir-payments-folio](../ir-payments-folio)

### Graph
```mermaid
graph TD;
  ir-payments-folio --> ir-payment-item
  style ir-payment-item fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
