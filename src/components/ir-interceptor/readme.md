# ir-interceptor



<!-- Auto Generated Below -->


## Properties

| Property                 | Attribute | Description                                                               | Type       | Default                                                                                                   |
| ------------------------ | --------- | ------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `handledEndpoints`       | --        | List of endpoint paths that should trigger loader logic and OTP handling. | `string[]` | `['/Get_Exposed_Calendar', '/ReAllocate_Exposed_Room', '/Get_Exposed_Bookings', '/UnBlock_Exposed_Unit']` |
| `suppressToastEndpoints` | --        | List of endpoints for which to suppress toast messages.                   | `string[]` | `[]`                                                                                                      |


## Events

| Event   | Description                                                              | Type                                                                                                 |
| ------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| `toast` | Emits a toast notification (`type`, `title`, `description`, `position`). | `CustomEvent<ICustomToast & Partial<IToastWithButton> \| IDefaultToast & Partial<IToastWithButton>>` |


## Dependencies

### Used by

 - [igl-book-property-container](../igl-book-property-container)
 - [igloo-calendar](../igloo-calendar)
 - [ir-agents](../ir-agents)
 - [ir-arrivals](../ir-arrivals)
 - [ir-booking-details](../ir-booking-details)
 - [ir-booking-editor](../igloo-calendar/ir-booking-editor)
 - [ir-booking-email-logs](../ir-booking-email-logs)
 - [ir-departures](../ir-departures)
 - [ir-financial-actions](../ir-financial-actions)
 - [ir-ghs-onboarding](../ir-ghs-onboarding)
 - [ir-guest-info](../ir-guest-info)
 - [ir-hk-tasks](../ir-housekeeping/ir-hk-tasks)
 - [ir-login](../ir-login)
 - [ir-page](../ui/ir-page)
 - [ir-payment-option](../ir-payment-option)
 - [ir-queue-manager](../ir-queue-manager)
 - [ir-reset-password](../ir-reset-password)
 - [ir-user-management](../ir-user-management)

### Depends on

- [ir-otp-modal](../ir-otp-modal)

### Graph
```mermaid
graph TD;
  ir-interceptor --> ir-otp-modal
  ir-otp-modal --> ir-spinner
  ir-otp-modal --> ir-otp
  ir-otp-modal --> ir-button
  ir-button --> ir-icons
  igl-book-property-container --> ir-interceptor
  igloo-calendar --> ir-interceptor
  ir-agents --> ir-interceptor
  ir-arrivals --> ir-interceptor
  ir-booking-details --> ir-interceptor
  ir-booking-editor --> ir-interceptor
  ir-booking-email-logs --> ir-interceptor
  ir-departures --> ir-interceptor
  ir-financial-actions --> ir-interceptor
  ir-ghs-onboarding --> ir-interceptor
  ir-guest-info --> ir-interceptor
  ir-hk-tasks --> ir-interceptor
  ir-login --> ir-interceptor
  ir-page --> ir-interceptor
  ir-payment-option --> ir-interceptor
  ir-queue-manager --> ir-interceptor
  ir-reset-password --> ir-interceptor
  ir-user-management --> ir-interceptor
  style ir-interceptor fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
