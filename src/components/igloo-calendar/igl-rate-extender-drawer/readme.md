# igl-rate-extender-drawer



<!-- Auto Generated Below -->


## Properties

| Property        | Attribute        | Description | Type                                      | Default     |
| --------------- | ---------------- | ----------- | ----------------------------------------- | ----------- |
| `bookingNumber` | `booking-number` |             | `string`                                  | `undefined` |
| `defaultDates`  | --               |             | `{ from_date: string; to_date: string; }` | `undefined` |
| `fromDate`      | `from-date`      |             | `string`                                  | `undefined` |
| `identifier`    | `identifier`     |             | `string`                                  | `undefined` |
| `language`      | `language`       |             | `string`                                  | `undefined` |
| `open`          | `open`           |             | `boolean`                                 | `false`     |
| `pool`          | `pool`           |             | `string`                                  | `undefined` |
| `propertyId`    | `property-id`    |             | `number`                                  | `undefined` |
| `ticket`        | `ticket`         |             | `string`                                  | `undefined` |
| `toDate`        | `to-date`        |             | `string`                                  | `undefined` |


## Events

| Event                   | Description | Type                                       |
| ----------------------- | ----------- | ------------------------------------------ |
| `closeRoomNightsDialog` |             | `CustomEvent<IRoomNightsDataEventPayload>` |


## Dependencies

### Used by

 - [igloo-calendar](..)

### Depends on

- [ir-drawer](../../ir-drawer)
- [igl-rate-extender-form](igl-rate-extender-form)
- [ir-custom-button](../../ui/ir-custom-button)

### Graph
```mermaid
graph TD;
  igl-rate-extender-drawer --> ir-drawer
  igl-rate-extender-drawer --> igl-rate-extender-form
  igl-rate-extender-drawer --> ir-custom-button
  igl-rate-extender-form --> ir-spinner
  igl-rate-extender-form --> ir-unit-tag
  igl-rate-extender-form --> ir-validator
  igl-rate-extender-form --> ir-input
  igloo-calendar --> igl-rate-extender-drawer
  style igl-rate-extender-drawer fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
