# ir-auth



<!-- Auto Generated Below -->


## Events

| Event         | Description | Type                |
| ------------- | ----------- | ------------------- |
| `closeDialog` |             | `CustomEvent<null>` |


## Dependencies

### Used by

 - [ir-nav](..)
 - [ir-user-form](../../ir-checkout-page/ir-user-form)

### Depends on

- [ir-signin](ir-signin)
- [ir-signup](ir-signup)

### Graph
```mermaid
graph TD;
  ir-auth --> ir-signin
  ir-auth --> ir-signup
  ir-signin --> ir-badge-group
  ir-signin --> ir-input
  ir-signin --> ir-button
  ir-badge-group --> ir-icons
  ir-signup --> ir-input
  ir-signup --> ir-button
  ir-nav --> ir-auth
  ir-user-form --> ir-auth
  style ir-auth fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
