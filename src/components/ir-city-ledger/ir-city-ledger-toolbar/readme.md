# ir-city-ledger-toolbar



<!-- Auto Generated Below -->


## Properties

| Property         | Attribute         | Description | Type     | Default |
| ---------------- | ----------------- | ----------- | -------- | ------- |
| `agentId`        | `agent-id`        |             | `number` | `null`  |
| `currencySymbol` | `currency-symbol` |             | `string` | `'$'`   |


## Events

| Event           | Description | Type                |
| --------------- | ----------- | ------------------- |
| `createInvoice` |             | `CustomEvent<void>` |


## Methods

### `refresh() => Promise<void>`



#### Returns

Type: `Promise<void>`




## Dependencies

### Used by

 - [ir-city-ledger](..)

### Depends on

- [ir-custom-button](../../ui/ir-custom-button)

### Graph
```mermaid
graph TD;
  ir-city-ledger-toolbar --> ir-custom-button
  ir-city-ledger --> ir-city-ledger-toolbar
  style ir-city-ledger-toolbar fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
