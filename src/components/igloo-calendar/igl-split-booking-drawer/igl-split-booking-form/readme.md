# igl-split-booking-form



<!-- Auto Generated Below -->


## Properties

| Property     | Attribute    | Description | Type      | Default     |
| ------------ | ------------ | ----------- | --------- | ----------- |
| `booking`    | --           |             | `Booking` | `undefined` |
| `formId`     | `form-id`    |             | `string`  | `undefined` |
| `identifier` | `identifier` |             | `string`  | `undefined` |


## Events

| Event        | Description | Type                |
| ------------ | ----------- | ------------------- |
| `closeModal` |             | `CustomEvent<null>` |


## Dependencies

### Used by

 - [igl-split-booking-drawer](..)

### Depends on

- [ir-date-select](../../../ui/date-picker/ir-date-select)
- [ir-custom-button](../../../ui/ir-custom-button)
- [ir-empty-state](../../../ir-empty-state)
- [ir-validator](../../../ui/ir-validator)

### Graph
```mermaid
graph TD;
  igl-split-booking-form --> ir-date-select
  igl-split-booking-form --> ir-custom-button
  igl-split-booking-form --> ir-empty-state
  igl-split-booking-form --> ir-validator
  ir-date-select --> ir-input
  ir-date-select --> ir-air-date-picker
  igl-split-booking-drawer --> igl-split-booking-form
  style igl-split-booking-form fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
