# ir-page



<!-- Auto Generated Below -->


## Properties

| Property      | Attribute     | Description | Type     | Default     |
| ------------- | ------------- | ----------- | -------- | ----------- |
| `description` | `description` |             | `string` | `undefined` |
| `label`       | `label`       |             | `string` | `undefined` |


## Dependencies

### Used by

 - [ir-city-ledger](../../ir-city-ledger)
 - [ir-fiscal-documents](../../ir-fiscal-documents)

### Depends on

- [ir-interceptor](../../ir-interceptor)
- [ir-toast](../ir-toast)

### Graph
```mermaid
graph TD;
  ir-page --> ir-interceptor
  ir-page --> ir-toast
  ir-interceptor --> ir-otp-modal
  ir-otp-modal --> ir-spinner
  ir-otp-modal --> ir-otp
  ir-otp-modal --> ir-button
  ir-button --> ir-icons
  ir-toast --> ir-toast-provider
  ir-toast-provider --> ir-toast-alert
  ir-city-ledger --> ir-page
  ir-fiscal-documents --> ir-page
  style ir-page fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
