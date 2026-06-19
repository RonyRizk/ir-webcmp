# igl-bulk-block



<!-- Auto Generated Below -->


## Properties

| Property         | Attribute          | Description | Type     | Default     |
| ---------------- | ------------------ | ----------- | -------- | ----------- |
| `formId`         | `form-id`          |             | `string` | `undefined` |
| `maxDatesLength` | `max-dates-length` |             | `number` | `8`         |
| `property_id`    | `property_id`      |             | `number` | `undefined` |


## Events

| Event            | Description | Type                   |
| ---------------- | ----------- | ---------------------- |
| `closeDrawer`    |             | `CustomEvent<null>`    |
| `loadingChanged` |             | `CustomEvent<boolean>` |


## Dependencies

### Used by

 - [igl-bulk-operations](..)
 - [igl-bulk-operations-drawer](../igl-bulk-operations-drawer)

### Depends on

- [ir-custom-button](../../../ui/ir-custom-button)
- [ir-date-select](../../../ui/date-picker/ir-date-select)

### Graph
```mermaid
graph TD;
  igl-bulk-block --> ir-custom-button
  igl-bulk-block --> ir-date-select
  ir-date-select --> ir-input
  ir-date-select --> ir-air-date-picker
  igl-bulk-operations --> igl-bulk-block
  igl-bulk-operations-drawer --> igl-bulk-block
  style igl-bulk-block fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
