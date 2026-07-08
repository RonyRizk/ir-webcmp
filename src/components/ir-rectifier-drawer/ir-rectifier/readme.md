# ir-rectifier



<!-- Auto Generated Below -->


## Properties

| Property | Attribute | Description | Type     | Default     |
| -------- | --------- | ----------- | -------- | ----------- |
| `formId` | `form-id` |             | `string` | `undefined` |


## Events

| Event            | Description | Type                   |
| ---------------- | ----------- | ---------------------- |
| `closeDrawer`    |             | `CustomEvent<void>`    |
| `loadingChanged` |             | `CustomEvent<boolean>` |


## Dependencies

### Used by

 - [ir-rectifier-drawer](..)

### Depends on

- [ir-validator](../../ui/ir-validator)
- [ir-date-select](../../ui/date-picker/ir-date-select)

### Graph
```mermaid
graph TD;
  ir-rectifier --> ir-validator
  ir-rectifier --> ir-date-select
  ir-date-select --> ir-input
  ir-date-select --> ir-air-date-picker
  ir-rectifier-drawer --> ir-rectifier
  style ir-rectifier fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
