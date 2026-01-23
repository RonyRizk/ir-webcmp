# igl-bulk-operations-drawer



<!-- Auto Generated Below -->


## Properties

| Property         | Attribute          | Description | Type      | Default     |
| ---------------- | ------------------ | ----------- | --------- | ----------- |
| `maxDatesLength` | `max-dates-length` |             | `number`  | `8`         |
| `open`           | `open`             |             | `boolean` | `undefined` |
| `property_id`    | `property_id`      |             | `number`  | `undefined` |


## Events

| Event         | Description | Type                   |
| ------------- | ----------- | ---------------------- |
| `closeDrawer` |             | `CustomEvent<null>`    |
| `toast`       |             | `CustomEvent<IrToast>` |


## Dependencies

### Used by

 - [igloo-calendar](../..)

### Depends on

- [ir-drawer](../../../ir-drawer)
- [igl-bulk-stop-sale](../igl-bulk-stop-sale)
- [igl-bulk-block](../igl-bulk-block)
- [ir-rectifier](../ir-rectifier)
- [ir-custom-button](../../../ui/ir-custom-button)

### Graph
```mermaid
graph TD;
  igl-bulk-operations-drawer --> ir-drawer
  igl-bulk-operations-drawer --> igl-bulk-stop-sale
  igl-bulk-operations-drawer --> igl-bulk-block
  igl-bulk-operations-drawer --> ir-rectifier
  igl-bulk-operations-drawer --> ir-custom-button
  igl-bulk-stop-sale --> ir-weekday-selector
  igl-bulk-stop-sale --> ir-custom-button
  igl-bulk-stop-sale --> ir-custom-date-picker
  ir-custom-date-picker --> ir-input
  igl-bulk-block --> ir-custom-button
  igl-bulk-block --> ir-custom-date-picker
  ir-rectifier --> ir-validator
  ir-rectifier --> ir-custom-date-picker
  igloo-calendar --> igl-bulk-operations-drawer
  style igl-bulk-operations-drawer fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
