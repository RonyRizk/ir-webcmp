# ir-extra-services-settings

<!-- Auto Generated Below -->


## Properties

| Property     | Attribute    | Description | Type     | Default     |
| ------------ | ------------ | ----------- | -------- | ----------- |
| `language`   | `language`   |             | `string` | `'en'`      |
| `p`          | `p`          |             | `string` | `undefined` |
| `propertyid` | `propertyid` |             | `number` | `undefined` |
| `ticket`     | `ticket`     |             | `string` | `undefined` |


## Dependencies

### Used by

 - [ir-secure-tasks](../ir-secure-tasks)

### Depends on

- [ir-loading-screen](../ir-loading-screen)
- [ir-page](../ui/ir-page)
- [ir-custom-button](../ui/ir-custom-button)
- [ir-empty-state](../ir-empty-state)
- [ir-extra-service-price-input](ir-extra-service-price-input)

### Graph
```mermaid
graph TD;
  ir-extra-services-settings --> ir-loading-screen
  ir-extra-services-settings --> ir-page
  ir-extra-services-settings --> ir-custom-button
  ir-extra-services-settings --> ir-empty-state
  ir-extra-services-settings --> ir-extra-service-price-input
  ir-page --> ir-interceptor
  ir-page --> ir-toast
  ir-interceptor --> ir-otp-modal
  ir-otp-modal --> ir-dialog
  ir-otp-modal --> ir-spinner
  ir-otp-modal --> ir-otp
  ir-otp-modal --> ir-custom-button
  ir-toast --> ir-toast-provider
  ir-toast-provider --> ir-toast-item
  ir-extra-service-price-input --> ir-validator
  ir-extra-service-price-input --> ir-input
  ir-secure-tasks --> ir-extra-services-settings
  style ir-extra-services-settings fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
