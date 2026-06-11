# ir-booking-source-editor-form



<!-- Auto Generated Below -->


## Properties

| Property  | Attribute | Description | Type      | Default     |
| --------- | --------- | ----------- | --------- | ----------- |
| `booking` | --        |             | `Booking` | `undefined` |


## Events

| Event                | Description | Type                   |
| -------------------- | ----------- | ---------------------- |
| `bookingSourceSaved` |             | `CustomEvent<null>`    |
| `loadingChange`      |             | `CustomEvent<boolean>` |


## Dependencies

### Used by

 - [ir-booking-source-editor-dialog](..)

### Depends on

- [ir-booking-assign-items](../ir-booking-assign-items)

### Graph
```mermaid
graph TD;
  ir-booking-source-editor-form --> ir-booking-assign-items
  ir-booking-assign-items --> ir-unit-tag
  ir-booking-assign-items --> ir-date-view
  ir-booking-source-editor-dialog --> ir-booking-source-editor-form
  style ir-booking-source-editor-form fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
