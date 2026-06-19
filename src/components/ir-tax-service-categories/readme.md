# ir-tax-service-categories



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
- [ir-tax-input](ir-tax-input)

### Graph
```mermaid
graph TD;
  ir-tax-service-categories --> ir-loading-screen
  ir-tax-service-categories --> ir-page
  ir-tax-service-categories --> ir-custom-button
  ir-tax-service-categories --> ir-tax-input
  ir-page --> ir-interceptor
  ir-page --> ir-toast
  ir-interceptor --> ir-otp-modal
  ir-otp-modal --> ir-spinner
  ir-otp-modal --> ir-otp
  ir-otp-modal --> ir-button
  ir-button --> ir-icons
  ir-toast --> ir-toast-provider
  ir-toast-provider --> ir-toast-item
  ir-tax-input --> ir-validator
  ir-tax-input --> ir-input
  ir-secure-tasks --> ir-tax-service-categories
  style ir-tax-service-categories fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
