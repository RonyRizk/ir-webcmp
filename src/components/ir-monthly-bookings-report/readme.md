# ir-monthly-bookings-report



<!-- Auto Generated Below -->


## Properties

| Property     | Attribute    | Description | Type     | Default     |
| ------------ | ------------ | ----------- | -------- | ----------- |
| `language`   | `language`   |             | `string` | `''`        |
| `p`          | `p`          |             | `string` | `undefined` |
| `propertyid` | `propertyid` |             | `number` | `undefined` |
| `ticket`     | `ticket`     |             | `string` | `''`        |


## Dependencies

### Used by

 - [ir-secure-tasks](../ir-secure-tasks)

### Depends on

- [ir-loading-screen](../ir-loading-screen)
- [ir-page](../ui/ir-page)
- [ir-custom-button](../ui/ir-custom-button)
- [ir-metric-card](../ir-metric-card)
- [ir-monthly-bookings-report-filter](ir-monthly-bookings-report-filter)
- [ir-monthly-bookings-report-table](ir-monthly-bookings-report-table)

### Graph
```mermaid
graph TD;
  ir-monthly-bookings-report --> ir-loading-screen
  ir-monthly-bookings-report --> ir-page
  ir-monthly-bookings-report --> ir-custom-button
  ir-monthly-bookings-report --> ir-metric-card
  ir-monthly-bookings-report --> ir-monthly-bookings-report-filter
  ir-monthly-bookings-report --> ir-monthly-bookings-report-table
  ir-page --> ir-interceptor
  ir-page --> ir-toast
  ir-interceptor --> ir-otp-modal
  ir-otp-modal --> ir-spinner
  ir-otp-modal --> ir-otp
  ir-otp-modal --> ir-button
  ir-button --> ir-icons
  ir-toast --> ir-toast-provider
  ir-toast-provider --> ir-toast-item
  ir-monthly-bookings-report-filter --> ir-filter-card
  ir-monthly-bookings-report-filter --> ir-custom-button
  ir-filter-card --> ir-custom-button
  ir-monthly-bookings-report-table --> ir-tooltip
  ir-monthly-bookings-report-table --> ir-empty-state
  ir-secure-tasks --> ir-monthly-bookings-report
  style ir-monthly-bookings-report fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
