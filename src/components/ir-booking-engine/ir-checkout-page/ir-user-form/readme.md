# ir-user-form



<!-- Auto Generated Below -->


## Properties

| Property | Attribute | Description | Type                         | Default     |
| -------- | --------- | ----------- | ---------------------------- | ----------- |
| `errors` | --        |             | `{ [x: string]: ZodIssue; }` | `undefined` |


## Dependencies

### Used by

 - [ir-checkout-page](..)

### Depends on

- [ir-button](../../../ui/ir-button)
- [ir-input](../../../ui/ir-input)
- [ir-phone-input](../../../ui/ir-phone-input)
- [ir-select](../../../ui/ir-select)
- [ir-checkbox](../../../ui/ir-checkbox)
- [ir-dialog](../../../ui/ir-dialog)
- [ir-auth](../../ir-nav/ir-auth)

### Graph
```mermaid
graph TD;
  ir-user-form --> ir-button
  ir-user-form --> ir-input
  ir-user-form --> ir-phone-input
  ir-user-form --> ir-select
  ir-user-form --> ir-checkbox
  ir-user-form --> ir-dialog
  ir-user-form --> ir-auth
  ir-phone-input --> ir-icons
  ir-auth --> ir-signin
  ir-auth --> ir-signup
  ir-signin --> ir-badge-group
  ir-signin --> ir-input
  ir-signin --> ir-button
  ir-badge-group --> ir-icons
  ir-signup --> ir-input
  ir-signup --> ir-button
  ir-checkout-page --> ir-user-form
  style ir-user-form fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
