# igl-bulk-operations



<!-- Auto Generated Below -->


## Properties

| Property         | Attribute          | Description | Type     | Default     |
| ---------------- | ------------------ | ----------- | -------- | ----------- |
| `maxDatesLength` | `max-dates-length` |             | `number` | `8`         |
| `property_id`    | `property_id`      |             | `number` | `undefined` |


## Events

| Event        | Description | Type                   |
| ------------ | ----------- | ---------------------- |
| `closeModal` |             | `CustomEvent<null>`    |
| `toast`      |             | `CustomEvent<IrToast>` |


## Dependencies

### Depends on

- [ir-title](../../ir-title)
- [ir-tabs](../../ui/ir-tabs)
- [igl-bulk-stop-sale](igl-bulk-stop-sale)
- [igl-bulk-block](igl-bulk-block)

### Graph
```mermaid
graph TD;
  igl-bulk-operations --> ir-title
  igl-bulk-operations --> ir-tabs
  igl-bulk-operations --> igl-bulk-stop-sale
  igl-bulk-operations --> igl-bulk-block
  ir-title --> ir-icon
  igl-bulk-stop-sale --> ir-weekday-selector
  igl-bulk-stop-sale --> ir-custom-button
  igl-bulk-stop-sale --> ir-custom-date-picker
  ir-custom-date-picker --> ir-input
  igl-bulk-block --> ir-custom-button
  igl-bulk-block --> ir-custom-date-picker
  style igl-bulk-operations fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
