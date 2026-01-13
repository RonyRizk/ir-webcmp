# ir-reset-password



<!-- Auto Generated Below -->


## Properties

| Property   | Attribute   | Description | Type      | Default     |
| ---------- | ----------- | ----------- | --------- | ----------- |
| `language` | `language`  |             | `string`  | `'en'`      |
| `old_pwd`  | `old_pwd`   |             | `string`  | `undefined` |
| `skip2Fa`  | `skip-2-fa` |             | `boolean` | `undefined` |
| `ticket`   | `ticket`    |             | `string`  | `undefined` |
| `username` | `username`  |             | `string`  | `undefined` |


## Events

| Event          | Description | Type                |
| -------------- | ----------- | ------------------- |
| `closeSideBar` |             | `CustomEvent<null>` |


## Dependencies

### Used by

 - [ir-user-form-panel](../ir-user-management/ir-user-form-panel)

### Depends on

- [ir-interceptor](../ir-interceptor)
- [ir-toast](../ui/ir-toast)
- [ir-title](../ir-title)
- [ir-validator](../ui/ir-validator)
- [ir-input](../ui/ir-input)
- [ir-password-validator](../ir-password-validator)
- [ir-custom-button](../ui/ir-custom-button)

### Graph
```mermaid
graph TD;
  ir-reset-password --> ir-interceptor
  ir-reset-password --> ir-toast
  ir-reset-password --> ir-title
  ir-reset-password --> ir-validator
  ir-reset-password --> ir-input
  ir-reset-password --> ir-password-validator
  ir-reset-password --> ir-custom-button
  ir-interceptor --> ir-spinner
  ir-interceptor --> ir-otp-modal
  ir-otp-modal --> ir-spinner
  ir-otp-modal --> ir-otp
  ir-otp-modal --> ir-button
  ir-button --> ir-icons
  ir-toast --> ir-toast-provider
  ir-toast-provider --> ir-toast-alert
  ir-title --> ir-icon
  ir-password-validator --> requirement-check
  requirement-check --> ir-icons
  ir-user-form-panel --> ir-reset-password
  style ir-reset-password fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
