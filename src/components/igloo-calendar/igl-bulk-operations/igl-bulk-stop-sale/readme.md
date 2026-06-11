# igl-bulk-stop-sale



<!-- Auto Generated Below -->


## Properties

| Property         | Attribute          | Description | Type     | Default     |
| ---------------- | ------------------ | ----------- | -------- | ----------- |
| `formId`         | `form-id`          |             | `string` | `undefined` |
| `maxDatesLength` | `max-dates-length` |             | `number` | `8`         |
| `property_id`    | `property_id`      |             | `number` | `undefined` |


## Events

| Event            | Description | Type                                                                                                 |
| ---------------- | ----------- | ---------------------------------------------------------------------------------------------------- |
| `closeDrawer`    |             | `CustomEvent<null>`                                                                                  |
| `loadingChanged` |             | `CustomEvent<boolean>`                                                                               |
| `toast`          |             | `CustomEvent<ICustomToast & Partial<IToastWithButton> \| IDefaultToast & Partial<IToastWithButton>>` |


## Dependencies

### Used by

 - [igl-bulk-operations](..)
 - [igl-bulk-operations-drawer](../igl-bulk-operations-drawer)

### Depends on

- [ir-weekday-selector](../../../ui/ir-weekday-selector)
- [ir-custom-button](../../../ui/ir-custom-button)
- [ir-date-select](../../../ui/date-picker/ir-date-select)

### Graph
```mermaid
graph TD;
  igl-bulk-stop-sale --> ir-weekday-selector
  igl-bulk-stop-sale --> ir-custom-button
  igl-bulk-stop-sale --> ir-date-select
  ir-date-select --> ir-input
  ir-date-select --> ir-air-date-picker
  igl-bulk-operations --> igl-bulk-stop-sale
  igl-bulk-operations-drawer --> igl-bulk-stop-sale
  style igl-bulk-stop-sale fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
