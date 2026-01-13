# ir-user-form-panel



<!-- Auto Generated Below -->


## Properties

| Property              | Attribute               | Description | Type                                                                                                                                                                                                                                                                                | Default                         |
| --------------------- | ----------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| `allowedUsersTypes`   | --                      |             | `AllowedUser[]`                                                                                                                                                                                                                                                                     | `[]`                            |
| `baseUserTypeCode`    | `base-user-type-code`   |             | `number \| string`                                                                                                                                                                                                                                                                  | `undefined`                     |
| `formId`              | `form-id`               |             | `string`                                                                                                                                                                                                                                                                            | `undefined`                     |
| `haveAdminPrivileges` | `have-admin-privileges` |             | `boolean`                                                                                                                                                                                                                                                                           | `undefined`                     |
| `isEdit`              | `is-edit`               |             | `boolean`                                                                                                                                                                                                                                                                           | `false`                         |
| `language`            | `language`              |             | `string`                                                                                                                                                                                                                                                                            | `'en'`                          |
| `property_id`         | `property_id`           |             | `number`                                                                                                                                                                                                                                                                            | `undefined`                     |
| `superAdminId`        | `super-admin-id`        |             | `string`                                                                                                                                                                                                                                                                            | `'5'`                           |
| `user`                | --                      |             | `THKUser & { type: string; is_active: boolean; sign_ins: SignIn[]; is_email_verified?: boolean; created_on: string; password: string; email: string; role?: string; }`                                                                                                              | `undefined`                     |
| `userTypeCode`        | `user-type-code`        |             | `number \| string`                                                                                                                                                                                                                                                                  | `undefined`                     |
| `userTypes`           | --                      |             | `{ new (entries?: readonly (readonly [string \| number, string])[]): Map<string \| number, string>; new (iterable?: Iterable<readonly [string \| number, string]>): Map<string \| number, string>; readonly prototype: Map<any, any>; readonly [Symbol.species]: MapConstructor; }` | `Map<number \| string, string>` |


## Events

| Event          | Description | Type                |
| -------------- | ----------- | ------------------- |
| `closeSideBar` |             | `CustomEvent<null>` |
| `resetData`    |             | `CustomEvent<null>` |


## Dependencies

### Used by

 - [ir-user-form-panel-drawer](ir-user-form-panel-drawer)

### Depends on

- [ir-validator](../../ui/ir-validator)
- [ir-input](../../ui/ir-input)
- [ir-password-validator](../../ir-password-validator)
- [ir-button](../../ui/ir-button)
- [ir-sidebar](../../ui/ir-sidebar)
- [ir-reset-password](../../ir-reset-password)

### Graph
```mermaid
graph TD;
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
  ir-user-form-panel-drawer --> ir-user-form-panel
  style ir-user-form-panel fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
