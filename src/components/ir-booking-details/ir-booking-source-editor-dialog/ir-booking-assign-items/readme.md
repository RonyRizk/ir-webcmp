# ir-booking-assign-items



<!-- Auto Generated Below -->


## Properties

| Property | Attribute | Description | Type               | Default |
| -------- | --------- | ----------- | ------------------ | ------- |
| `items`  | --        |             | `AssignableItem[]` | `[]`    |


## Events

| Event                    | Description | Type                       |
| ------------------------ | ----------- | -------------------------- |
| `bookingSelectionChange` |             | `CustomEvent<Set<string>>` |


## Dependencies

### Used by

 - [ir-booking-source-editor-form](../ir-booking-source-editor-form)

### Depends on

- [ir-unit-tag](../../../ir-unit-tag)
- [ir-date-view](../../../ir-date-view)

### Graph
```mermaid
graph TD;
  ir-booking-assign-items --> ir-unit-tag
  ir-booking-assign-items --> ir-date-view
  ir-booking-source-editor-form --> ir-booking-assign-items
  style ir-booking-assign-items fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
