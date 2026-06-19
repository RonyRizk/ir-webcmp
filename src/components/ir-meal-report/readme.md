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

### Used by

 - [ir-secure-tasks](../ir-secure-tasks)

### Depends on

- [ir-loading-screen](../ir-loading-screen)
- [ir-page](../ui/ir-page)
- [ir-custom-button](../ui/ir-custom-button)
- [ir-meal-report-filters](ir-meal-report-filters)
- [ir-meal-guest-list](ir-meal-guest-list)
- [ir-meal-count-summary](ir-meal-count-summary)

### Graph
```mermaid
graph TD;
  ir-meal-report --> ir-loading-screen
  ir-meal-report --> ir-page
  ir-meal-report --> ir-custom-button
  ir-meal-report --> ir-meal-report-filters
  ir-meal-report --> ir-meal-guest-list
  ir-meal-report --> ir-meal-count-summary
  ir-page --> ir-interceptor
  ir-page --> ir-toast
  ir-interceptor --> ir-otp-modal
  ir-otp-modal --> ir-spinner
  ir-otp-modal --> ir-otp
  ir-otp-modal --> ir-button
  ir-button --> ir-icons
  ir-toast --> ir-toast-provider
  ir-toast-provider --> ir-toast-item
  ir-meal-report-filters --> ir-filter-card
  ir-meal-report-filters --> ir-date-range-filter
  ir-meal-report-filters --> ir-custom-button
  ir-filter-card --> ir-custom-button
  ir-date-range-filter --> ir-date-select
  ir-date-range-filter --> ir-custom-button
  ir-date-select --> ir-input
  ir-date-select --> ir-air-date-picker
  ir-meal-guest-list --> ir-empty-state
  ir-meal-count-summary --> ir-empty-state
  ir-secure-tasks --> ir-meal-report
  style ir-meal-report fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
