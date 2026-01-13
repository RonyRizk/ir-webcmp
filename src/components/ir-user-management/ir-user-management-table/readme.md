# ir-user-management-table



<!-- Auto Generated Below -->


## Properties

| Property              | Attribute               | Description | Type                            | Default     |
| --------------------- | ----------------------- | ----------- | ------------------------------- | ----------- |
| `allowedUsersTypes`   | --                      |             | `AllowedUser[]`                 | `[]`        |
| `baseUserTypeCode`    | `base-user-type-code`   |             | `number \| string`              | `undefined` |
| `haveAdminPrivileges` | `have-admin-privileges` |             | `boolean`                       | `undefined` |
| `isSuperAdmin`        | `is-super-admin`        |             | `boolean`                       | `undefined` |
| `property_id`         | `property_id`           |             | `number`                        | `undefined` |
| `superAdminId`        | `super-admin-id`        |             | `string`                        | `'5'`       |
| `userTypeCode`        | `user-type-code`        |             | `number \| string`              | `undefined` |
| `userTypes`           | --                      |             | `Map<string \| number, string>` | `new Map()` |
| `users`               | --                      |             | `User[]`                        | `[]`        |


## Events

| Event       | Description | Type                                                                                                 |
| ----------- | ----------- | ---------------------------------------------------------------------------------------------------- |
| `resetData` |             | `CustomEvent<null>`                                                                                  |
| `toast`     |             | `CustomEvent<ICustomToast & Partial<IToastWithButton> \| IDefaultToast & Partial<IToastWithButton>>` |


## Dependencies

### Used by

 - [ir-user-management](..)

### Depends on

- [ir-custom-button](../../ui/ir-custom-button)
- [ir-user-form-panel-drawer](../ir-user-form-panel/ir-user-form-panel-drawer)
- [ir-dialog](../../ui/ir-dialog)

### Graph
```mermaid
graph TD;
  ir-user-management-table --> ir-custom-button
  ir-user-management-table --> ir-user-form-panel-drawer
  ir-user-management-table --> ir-dialog
  ir-user-form-panel-drawer --> ir-drawer
  ir-user-form-panel-drawer --> ir-user-form-panel
  ir-user-form-panel-drawer --> ir-custom-button
  ir-user-form-panel --> ir-validator
  ir-user-form-panel --> ir-input
  ir-user-form-panel --> ir-password-validator
  ir-user-form-panel --> ir-button
  ir-user-form-panel --> ir-sidebar
  ir-user-form-panel --> ir-reset-password
  ir-password-validator --> requirement-check
  requirement-check --> ir-icons
  ir-button --> ir-icons
  ir-sidebar --> ir-icon
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
  ir-toast --> ir-toast-provider
  ir-toast-provider --> ir-toast-alert
  ir-title --> ir-icon
  ir-user-management --> ir-user-management-table
  style ir-user-management-table fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
