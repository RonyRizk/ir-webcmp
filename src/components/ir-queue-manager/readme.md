# ir-queue-manager



<!-- Auto Generated Below -->


## Properties

| Property | Attribute | Description | Type     | Default |
| -------- | --------- | ----------- | -------- | ------- |
| `ticket` | `ticket`  |             | `string` | `''`    |


## Dependencies

### Depends on

- [ir-loading-screen](../ir-loading-screen)
- [ir-interceptor](../ir-interceptor)
- [ir-toast](../ui/ir-toast)
- [ir-custom-button](../ui/ir-custom-button)
- [ir-empty-state](../ir-empty-state)

### Graph
```mermaid
graph TD;
  ir-queue-manager --> ir-loading-screen
  ir-queue-manager --> ir-interceptor
  ir-queue-manager --> ir-toast
  ir-queue-manager --> ir-custom-button
  ir-queue-manager --> ir-empty-state
  ir-interceptor --> ir-spinner
  ir-interceptor --> ir-otp-modal
  ir-otp-modal --> ir-spinner
  ir-otp-modal --> ir-otp
  ir-otp-modal --> ir-button
  ir-button --> ir-icons
  ir-toast --> ir-toast-provider
  ir-toast-provider --> ir-toast-alert
  style ir-queue-manager fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
