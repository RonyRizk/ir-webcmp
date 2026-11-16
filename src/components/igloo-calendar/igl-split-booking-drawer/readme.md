# igl-split-booking-drawer



<!-- Auto Generated Below -->


## Properties

| Property     | Attribute    | Description | Type      | Default     |
| ------------ | ------------ | ----------- | --------- | ----------- |
| `booking`    | --           |             | `Booking` | `undefined` |
| `identifier` | `identifier` |             | `string`  | `undefined` |
| `open`       | `open`       |             | `boolean` | `undefined` |


## Events

| Event        | Description | Type                |
| ------------ | ----------- | ------------------- |
| `closeModal` |             | `CustomEvent<null>` |


## Dependencies

### Used by

 - [igloo-calendar](..)

### Depends on

- [ir-drawer](../../ir-drawer)
- [igl-split-booking-form](igl-split-booking-form)
- [ir-custom-button](../../ui/ir-custom-button)

### Graph
```mermaid
graph TD;
  igl-split-booking-drawer --> ir-drawer
  igl-split-booking-drawer --> igl-split-booking-form
  igl-split-booking-drawer --> ir-custom-button
  igl-split-booking-form --> ir-date-select
  igl-split-booking-form --> ir-custom-button
  igl-split-booking-form --> ir-empty-state
  igl-split-booking-form --> ir-validator
  ir-date-select --> ir-input
  ir-date-select --> ir-air-date-picker
  igloo-calendar --> igl-split-booking-drawer
  style igl-split-booking-drawer fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
