# ir-page



<!-- Auto Generated Below -->


## Properties

| Property      | Attribute     | Description | Type     | Default     |
| ------------- | ------------- | ----------- | -------- | ----------- |
| `description` | `description` |             | `string` | `undefined` |
| `label`       | `label`       |             | `string` | `undefined` |


## Shadow Parts

| Part     | Description |
| -------- | ----------- |
| `"body"` |             |


## Dependencies

### Used by

 - [ir-city-ledger](../../ir-city-ledger)
 - [ir-daily-revenue](../../ir-daily-revenue)
 - [ir-fiscal-documents](../../ir-fiscal-documents)
 - [ir-gap-nights](../../ir-gap-nights)
 - [ir-housekeeping](../../ir-housekeeping)
 - [ir-meal-report](../../ir-meal-report)
 - [ir-monthly-bookings-report](../../ir-monthly-bookings-report)
 - [ir-sales-by-channel](../../ir-sales-by-channel)
 - [ir-sales-by-country](../../ir-sales-by-country)
 - [ir-tax-service-categories](../../ir-tax-service-categories)
 - [ir-unbookable-rooms](../../ir-unbookable-rooms)

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
  ir-toast-provider --> ir-toast-item
  ir-city-ledger --> ir-page
  ir-daily-revenue --> ir-page
  ir-fiscal-documents --> ir-page
  ir-gap-nights --> ir-page
  ir-housekeeping --> ir-page
  ir-meal-report --> ir-page
  ir-monthly-bookings-report --> ir-page
  ir-sales-by-channel --> ir-page
  ir-sales-by-country --> ir-page
  ir-tax-service-categories --> ir-page
  ir-unbookable-rooms --> ir-page
  style ir-page fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
