# ir-housekeeping



<!-- Auto Generated Below -->


## Properties

| Property     | Attribute    | Description | Type     | Default     |
| ------------ | ------------ | ----------- | -------- | ----------- |
| `baseUrl`    | `base-url`   |             | `string` | `undefined` |
| `language`   | `language`   |             | `string` | `''`        |
| `p`          | `p`          |             | `string` | `undefined` |
| `propertyid` | `propertyid` |             | `number` | `undefined` |
| `ticket`     | `ticket`     |             | `string` | `''`        |


## Events

| Event   | Description | Type                                                                                                 |
| ------- | ----------- | ---------------------------------------------------------------------------------------------------- |
| `toast` |             | `CustomEvent<ICustomToast & Partial<IToastWithButton> \| IDefaultToast & Partial<IToastWithButton>>` |


## Dependencies

### Used by

 - [ir-secure-tasks](../ir-secure-tasks)

### Depends on

- [ir-loading-screen](../ir-loading-screen)
- [ir-interceptor](../ir-interceptor)
- [ir-toast](../ui/ir-toast)
- [ir-hk-operations-card](ir-hk-operations-card)
- [ir-hk-team](ir-hk-team)

### Graph
```mermaid
graph TD;
  ir-housekeeping --> ir-loading-screen
  ir-housekeeping --> ir-interceptor
  ir-housekeeping --> ir-toast
  ir-housekeeping --> ir-hk-operations-card
  ir-housekeeping --> ir-hk-team
  ir-interceptor --> ir-spinner
  ir-interceptor --> ir-otp-modal
  ir-otp-modal --> ir-spinner
  ir-otp-modal --> ir-otp
  ir-otp-modal --> ir-button
  ir-button --> ir-icons
  ir-toast --> ir-toast-provider
  ir-toast-provider --> ir-toast-alert
  ir-hk-operations-card --> ir-input
  ir-hk-operations-card --> ir-dialog
  ir-hk-operations-card --> ir-custom-button
  ir-hk-team --> ir-hk-unassigned-units
  ir-hk-team --> ir-custom-button
  ir-hk-team --> ir-popover
  ir-hk-team --> ir-button
  ir-hk-team --> ir-hk-user-drawer
  ir-hk-team --> ir-hk-unassigned-units-drawer
  ir-hk-team --> ir-hk-delete-dialog
  ir-hk-unassigned-units --> ir-select
  ir-hk-unassigned-units --> ir-title
  ir-hk-unassigned-units --> ir-button
  ir-title --> ir-icon
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
  ir-hk-unassigned-units-drawer --> ir-drawer
  ir-hk-unassigned-units-drawer --> ir-hk-unassigned-units-drawer-form
  ir-hk-unassigned-units-drawer --> ir-custom-button
  ir-hk-unassigned-units-drawer-form --> ir-select
  ir-hk-delete-dialog --> ir-dialog
  ir-hk-delete-dialog --> ir-custom-button
  ir-secure-tasks --> ir-housekeeping
  style ir-housekeeping fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
