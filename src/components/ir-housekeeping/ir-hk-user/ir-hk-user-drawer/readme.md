# ir-hk-user-drawer



<!-- Auto Generated Below -->


## Properties

| Property | Attribute | Description | Type                                                                                                                                         | Default |
| -------- | --------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| `isEdit` | `is-edit` |             | `boolean`                                                                                                                                    | `false` |
| `open`   | `open`    |             | `boolean`                                                                                                                                    | `false` |
| `user`   | --        |             | `{ name: string; note: string; id: number; property_id: number; mobile: string; password: string; phone_prefix: string; username: string; }` | `null`  |


## Events

| Event          | Description | Type                |
| -------------- | ----------- | ------------------- |
| `closeSideBar` |             | `CustomEvent<null>` |


## Dependencies

### Used by

 - [ir-hk-team](../../ir-hk-team)

### Depends on

- [ir-drawer](../../../ir-drawer)
- [ir-hk-user-drawer-form](ir-hk-user-drawer-form)
- [ir-custom-button](../../../ui/ir-custom-button)

### Graph
```mermaid
graph TD;
  ir-hk-user-drawer --> ir-drawer
  ir-hk-user-drawer --> ir-hk-user-drawer-form
  ir-hk-user-drawer --> ir-custom-button
  ir-hk-user-drawer-form --> ir-custom-button
  ir-hk-user-drawer-form --> ir-validator
  ir-hk-user-drawer-form --> ir-input
  ir-hk-user-drawer-form --> ir-password-validator
  ir-hk-user-drawer-form --> ir-spinner
  ir-hk-user-drawer-form --> ir-mobile-input
  ir-password-validator --> requirement-check
  requirement-check --> ir-icons
  ir-mobile-input --> ir-input
  ir-hk-team --> ir-hk-user-drawer
  style ir-hk-user-drawer fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
