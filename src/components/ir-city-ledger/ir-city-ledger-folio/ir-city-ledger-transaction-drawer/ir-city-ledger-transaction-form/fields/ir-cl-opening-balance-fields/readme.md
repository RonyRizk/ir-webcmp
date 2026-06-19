# ir-cl-opening-balance-fields



<!-- Auto Generated Below -->


## Properties

| Property    | Attribute    | Description | Type                 | Default |
| ----------- | ------------ | ----------- | -------------------- | ------- |
| `entryType` | `entry-type` |             | `"" \| "CR" \| "DB"` | `''`    |


## Events

| Event         | Description | Type                                          |
| ------------- | ----------- | --------------------------------------------- |
| `fieldChange` |             | `CustomEvent<CityLedgerTransactionFormDraft>` |


## Dependencies

### Used by

 - [ir-city-ledger-transaction-form](../..)

### Depends on

- [ir-validator](../../../../../../ui/ir-validator)

### Graph
```mermaid
graph TD;
  ir-cl-opening-balance-fields --> ir-validator
  ir-city-ledger-transaction-form --> ir-cl-opening-balance-fields
  style ir-cl-opening-balance-fields fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
