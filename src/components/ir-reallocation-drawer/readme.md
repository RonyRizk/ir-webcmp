# ir-reallocation-drawer



<!-- Auto Generated Below -->


## Properties

| Property         | Attribute         | Description | Type      | Default     |
| ---------------- | ----------------- | ----------- | --------- | ----------- |
| `booking`        | --                |             | `Booking` | `undefined` |
| `open`           | `open`            |             | `boolean` | `undefined` |
| `pool`           | `pool`            |             | `string`  | `undefined` |
| `roomIdentifier` | `room-identifier` |             | `string`  | `undefined` |


## Events

| Event        | Description | Type                |
| ------------ | ----------- | ------------------- |
| `closeModal` |             | `CustomEvent<void>` |


## Dependencies

### Used by

 - [igloo-calendar](../igloo-calendar)

### Depends on

- [ir-drawer](../ir-drawer)
- [ir-reallocation-form](ir-reallocation-form)
- [ir-custom-button](../ui/ir-custom-button)

### Graph
```mermaid
graph TD;
  ir-reallocation-drawer --> ir-drawer
  ir-reallocation-drawer --> ir-reallocation-form
  ir-reallocation-drawer --> ir-custom-button
  ir-reallocation-form --> ir-spinner
  ir-reallocation-form --> ir-date-view
  ir-reallocation-form --> ir-empty-state
  ir-reallocation-form --> ir-validator
  igloo-calendar --> ir-reallocation-drawer
  style ir-reallocation-drawer fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
