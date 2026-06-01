# ir-meal-report



<!-- Auto Generated Below -->


## Properties

| Property     | Attribute    | Description | Type     | Default     |
| ------------ | ------------ | ----------- | -------- | ----------- |
| `baseurl`    | `baseurl`    |             | `string` | `undefined` |
| `language`   | `language`   |             | `string` | `'en'`      |
| `propertyid` | `propertyid` |             | `number` | `undefined` |
| `ticket`     | `ticket`     |             | `string` | `undefined` |


## Dependencies

### Depends on

- [ir-loading-screen](../ir-loading-screen)
- [ir-toast](../ui/ir-toast)
- [ir-interceptor](../ir-interceptor)
- [ir-custom-button](../ui/ir-custom-button)
- [ir-range-picker](../ir-housekeeping/ir-hk-tasks/ir-hk-archive/ir-range-picker)
- [ir-spinner](../ui/ir-spinner)
- [ir-meal-guest-list](.)
- [ir-meal-count-summary](.)
- [ir-toast-provider](../ir-toast-provider)

### Graph
```mermaid
graph TD;
  ir-meal-report --> ir-loading-screen
  ir-meal-report --> ir-toast
  ir-meal-report --> ir-interceptor
  ir-meal-report --> ir-custom-button
  ir-meal-report --> ir-range-picker
  ir-meal-report --> ir-spinner
  ir-meal-report --> ir-meal-guest-list
  ir-meal-report --> ir-meal-count-summary
  ir-meal-report --> ir-toast-provider
  ir-toast --> ir-toast-provider
  ir-toast-provider --> ir-toast-alert
  ir-interceptor --> ir-spinner
  ir-interceptor --> ir-otp-modal
  ir-otp-modal --> ir-spinner
  ir-otp-modal --> ir-otp
  ir-otp-modal --> ir-button
  ir-button --> ir-icons
  ir-range-picker --> ir-date-picker
  style ir-meal-report fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
