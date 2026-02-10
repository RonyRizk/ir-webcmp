# ir-agents



<!-- Auto Generated Below -->


## Properties

| Property     | Attribute    | Description                                                                                                                           | Type     | Default     |
| ------------ | ------------ | ------------------------------------------------------------------------------------------------------------------------------------- | -------- | ----------- |
| `language`   | `language`   | Two-letter language code (ISO) used for translations and API locale. Defaults to `'en'`.                                              | `string` | `'en'`      |
| `p`          | `p`          | Property alias or short identifier used by backend endpoints (aname). Passed to `getExposedProperty` when initializing the component. | `string` | `undefined` |
| `propertyid` | `propertyid` | ID of the property (hotel) for which arrivals should be displayed. Used in API calls related to rooms, bookings, and check-ins.       | `number` | `undefined` |
| `ticket`     | `ticket`     | Authentication token issued by the PMS backend. Required for initializing the component and making API calls.                         | `string` | `undefined` |


## Events

| Event   | Description | Type                                                                                                 |
| ------- | ----------- | ---------------------------------------------------------------------------------------------------- |
| `toast` |             | `CustomEvent<ICustomToast & Partial<IToastWithButton> \| IDefaultToast & Partial<IToastWithButton>>` |


## Dependencies

### Used by

 - [ir-secure-tasks](../ir-secure-tasks)

### Depends on

- [ir-loading-screen](../ir-loading-screen)
- [ir-toast](../ui/ir-toast)
- [ir-interceptor](../ir-interceptor)
- [ir-agents-table](ir-agents-table)
- [ir-agent-editor-drawer](ir-agent-editor-drawer)
- [ir-dialog](../ui/ir-dialog)
- [ir-custom-button](../ui/ir-custom-button)

### Graph
```mermaid
graph TD;
  ir-agents --> ir-loading-screen
  ir-agents --> ir-toast
  ir-agents --> ir-interceptor
  ir-agents --> ir-agents-table
  ir-agents --> ir-agent-editor-drawer
  ir-agents --> ir-dialog
  ir-agents --> ir-custom-button
  ir-toast --> ir-toast-provider
  ir-toast-provider --> ir-toast-alert
  ir-interceptor --> ir-spinner
  ir-interceptor --> ir-otp-modal
  ir-otp-modal --> ir-spinner
  ir-otp-modal --> ir-otp
  ir-otp-modal --> ir-button
  ir-button --> ir-icons
  ir-agents-table --> ir-custom-button
  ir-agents-table --> ir-empty-state
  ir-agent-editor-drawer --> ir-drawer
  ir-agent-editor-drawer --> ir-agent-editor-form
  ir-agent-editor-drawer --> ir-custom-button
  ir-agent-editor-form --> ir-agent-profile
  ir-agent-editor-form --> ir-agent-contract
  ir-agent-profile --> ir-validator
  ir-agent-profile --> ir-input
  ir-agent-profile --> ir-country-picker
  ir-country-picker --> ir-picker
  ir-country-picker --> ir-picker-item
  ir-country-picker --> ir-input-text
  ir-agent-contract --> ir-validator
  ir-agent-contract --> ir-input
  ir-secure-tasks --> ir-agents
  style ir-agents fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
