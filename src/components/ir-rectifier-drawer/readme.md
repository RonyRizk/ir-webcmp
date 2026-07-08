# ir-rectifier-drawer



<!-- Auto Generated Below -->


## Properties

| Property | Attribute | Description | Type      | Default     |
| -------- | --------- | ----------- | --------- | ----------- |
| `open`   | `open`    |             | `boolean` | `undefined` |


## Events

| Event         | Description | Type                |
| ------------- | ----------- | ------------------- |
| `closeDrawer` |             | `CustomEvent<void>` |


## Dependencies

### Used by

 - [igloo-calendar](../igloo-calendar)

### Depends on

- [ir-drawer](../ir-drawer)
- [ir-rectifier](ir-rectifier)
- [ir-custom-button](../ui/ir-custom-button)

### Graph
```mermaid
graph TD;
  ir-rectifier-drawer --> ir-drawer
  ir-rectifier-drawer --> ir-rectifier
  ir-rectifier-drawer --> ir-custom-button
  ir-rectifier --> ir-validator
  ir-rectifier --> ir-date-select
  ir-date-select --> ir-input
  ir-date-select --> ir-air-date-picker
  igloo-calendar --> ir-rectifier-drawer
  style ir-rectifier-drawer fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
