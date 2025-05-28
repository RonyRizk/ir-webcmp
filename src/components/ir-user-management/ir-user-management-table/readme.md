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

- [ir-user-form-panel](../ir-user-form-panel)
- [ir-icon](../../ui/ir-icon)
- [ir-switch](../../ui/ir-switch)
- [ir-sidebar](../../ui/ir-sidebar)
- [ir-modal](../../ui/ir-modal)

### Graph
```mermaid
graph TD;
  ir-user-management-table --> ir-user-form-panel
  ir-user-management-table --> ir-icon
  ir-user-management-table --> ir-switch
  ir-user-management-table --> ir-sidebar
  ir-user-management-table --> ir-modal
  ir-user-form-panel --> ir-title
  ir-user-form-panel --> ir-input-text
  ir-user-form-panel --> ir-select
  ir-user-form-panel --> ir-password-validator
  ir-user-form-panel --> ir-button
  ir-user-form-panel --> ir-sidebar
  ir-user-form-panel --> ir-reset-password
  ir-title --> ir-icon
  ir-password-validator --> requirement-check
  requirement-check --> ir-icons
  ir-button --> ir-icons
  ir-sidebar --> ir-icon
  ir-reset-password --> ir-interceptor
  ir-reset-password --> ir-toast
  ir-reset-password --> ir-title
  ir-reset-password --> ir-input-text
  ir-reset-password --> ir-password-validator
  ir-reset-password --> ir-button
  ir-interceptor --> ir-otp-modal
  ir-otp-modal --> ir-spinner
  ir-otp-modal --> ir-otp
  ir-otp-modal --> ir-button
  ir-modal --> ir-button
  ir-user-management --> ir-user-management-table
  style ir-user-management-table fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
