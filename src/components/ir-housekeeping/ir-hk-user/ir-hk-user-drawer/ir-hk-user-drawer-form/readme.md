# ir-hk-user-drawer-form



<!-- Auto Generated Below -->


## Properties

| Property | Attribute | Description | Type                                                                                                                                         | Default     |
| -------- | --------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| `formId` | `form-id` |             | `string`                                                                                                                                     | `undefined` |
| `isEdit` | `is-edit` |             | `boolean`                                                                                                                                    | `false`     |
| `user`   | --        |             | `{ name: string; note: string; id: number; property_id: number; mobile: string; password: string; phone_prefix: string; username: string; }` | `null`      |


## Events

| Event            | Description | Type                   |
| ---------------- | ----------- | ---------------------- |
| `closeSideBar`   |             | `CustomEvent<null>`    |
| `loadingChanged` |             | `CustomEvent<boolean>` |
| `resetData`      |             | `CustomEvent<null>`    |


## Dependencies

### Used by

 - [ir-hk-user-drawer](..)

### Depends on

- [ir-custom-button](../../../../ui/ir-custom-button)
- [ir-validator](../../../../ui/ir-validator)
- [ir-input](../../../../ui/ir-input)
- [ir-password-validator](../../../../ir-password-validator)
- [ir-spinner](../../../../ui/ir-spinner)
- [ir-mobile-input](../../../../ui/ir-mobile-input)

### Graph
```mermaid
graph TD;
  ir-hk-user-drawer-form --> ir-custom-button
  ir-hk-user-drawer-form --> ir-validator
  ir-hk-user-drawer-form --> ir-input
  ir-hk-user-drawer-form --> ir-password-validator
  ir-hk-user-drawer-form --> ir-spinner
  ir-hk-user-drawer-form --> ir-mobile-input
  ir-password-validator --> requirement-check
  requirement-check --> ir-icons
  ir-mobile-input --> ir-input
  ir-hk-user-drawer --> ir-hk-user-drawer-form
  style ir-hk-user-drawer-form fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
