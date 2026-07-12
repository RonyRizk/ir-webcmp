# ir-toast



<!-- Auto Generated Below -->


## Properties

| Property   | Attribute  | Description                                                                                                         | Type                                                           | Default       |
| ---------- | ---------- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ------------- |
| `position` | `position` | Position where toasts will appear. Options include: `'top-left'`, `'top-right'`, `'bottom-left'`, `'bottom-right'`. | `"bottom-left" \| "bottom-right" \| "top-left" \| "top-right"` | `'top-right'` |


## Dependencies

### Used by

 - [igl-book-property-container](../../igl-book-property-container)
 - [igloo-calendar](../../igloo-calendar)
 - [ir-agents](../../ir-agents)
 - [ir-arrivals](../../ir-arrivals)
 - [ir-booking-details](../../ir-booking-details)
 - [ir-booking-email-logs](../../ir-booking-email-logs)
 - [ir-channel](../../ir-channel)
 - [ir-departures](../../ir-departures)
 - [ir-financial-actions](../../ir-financial-actions)
 - [ir-ghs-onboarding](../../ir-ghs-onboarding)
 - [ir-guest-info](../../ir-guest-info)
 - [ir-hk-tasks](../../ir-housekeeping/ir-hk-tasks)
 - [ir-login](../../ir-login)
 - [ir-page](../ir-page)
 - [ir-payment-option](../../ir-payment-option)
 - [ir-queue-manager](../../ir-queue-manager)
 - [ir-reset-password](../../ir-reset-password)
 - [ir-user-management](../../ir-user-management)

### Depends on

- [ir-toast-provider](../../ir-toast-provider)

### Graph
```mermaid
graph TD;
  ir-toast --> ir-toast-provider
  ir-toast-provider --> ir-toast-item
  igl-book-property-container --> ir-toast
  igloo-calendar --> ir-toast
  ir-agents --> ir-toast
  ir-arrivals --> ir-toast
  ir-booking-details --> ir-toast
  ir-booking-email-logs --> ir-toast
  ir-channel --> ir-toast
  ir-departures --> ir-toast
  ir-financial-actions --> ir-toast
  ir-ghs-onboarding --> ir-toast
  ir-guest-info --> ir-toast
  ir-hk-tasks --> ir-toast
  ir-login --> ir-toast
  ir-page --> ir-toast
  ir-payment-option --> ir-toast
  ir-queue-manager --> ir-toast
  ir-reset-password --> ir-toast
  ir-user-management --> ir-toast
  style ir-toast fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
