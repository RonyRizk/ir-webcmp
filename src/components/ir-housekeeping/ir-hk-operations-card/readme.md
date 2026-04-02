# ir-hk-operations-card



<!-- Auto Generated Below -->


## Properties

| Property      | Attribute | Description | Type         | Default |
| ------------- | --------- | ----------- | ------------ | ------- |
| `frequencies` | --        |             | `IEntries[]` | `[]`    |


## Events

| Event   | Description | Type                                                                                                 |
| ------- | ----------- | ---------------------------------------------------------------------------------------------------- |
| `toast` |             | `CustomEvent<ICustomToast & Partial<IToastWithButton> \| IDefaultToast & Partial<IToastWithButton>>` |


## Dependencies

### Used by

 - [ir-housekeeping](..)

### Depends on

- [ir-input](../../ui/ir-input)
- [ir-dialog](../../ui/ir-dialog)
- [ir-custom-button](../../ui/ir-custom-button)

### Graph
```mermaid
graph TD;
  ir-hk-operations-card --> ir-input
  ir-hk-operations-card --> ir-dialog
  ir-hk-operations-card --> ir-custom-button
  ir-housekeeping --> ir-hk-operations-card
  style ir-hk-operations-card fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
