# ir-sales-by-channel



<!-- Auto Generated Below -->


## Properties

| Property     | Attribute    | Description | Type                  | Default     |
| ------------ | ------------ | ----------- | --------------------- | ----------- |
| `language`   | `language`   |             | `string`              | `''`        |
| `mode`       | `mode`       |             | `"mpo" \| "property"` | `undefined` |
| `p`          | `p`          |             | `string`              | `undefined` |
| `propertyid` | `propertyid` |             | `string`              | `undefined` |
| `ticket`     | `ticket`     |             | `string`              | `''`        |


## Dependencies

### Used by

 - [ir-secure-tasks](../ir-secure-tasks)

### Depends on

- [ir-loading-screen](../ir-loading-screen)
- [ir-page](../ui/ir-page)
- [ir-custom-button](../ui/ir-custom-button)
- [ir-sales-by-channel-summary](ir-sales-by-channel-summary)
- [ir-sales-by-channel-filters](ir-sales-by-channel-filters)
- [ir-sales-by-channel-table](ir-sales-by-channel-table)

### Graph
```mermaid
graph TD;
  ir-sales-by-channel --> ir-loading-screen
  ir-sales-by-channel --> ir-page
  ir-sales-by-channel --> ir-custom-button
  ir-sales-by-channel --> ir-sales-by-channel-summary
  ir-sales-by-channel --> ir-sales-by-channel-filters
  ir-sales-by-channel --> ir-sales-by-channel-table
  ir-page --> ir-interceptor
  ir-page --> ir-toast
  ir-interceptor --> ir-otp-modal
  ir-otp-modal --> ir-spinner
  ir-otp-modal --> ir-otp
  ir-otp-modal --> ir-button
  ir-button --> ir-icons
  ir-toast --> ir-toast-provider
  ir-toast-provider --> ir-toast-item
  ir-sales-by-channel-summary --> ir-metric-card
  ir-sales-by-channel-filters --> ir-filter-card
  ir-sales-by-channel-filters --> ir-m-combobox
  ir-sales-by-channel-filters --> ir-date-range-filter
  ir-sales-by-channel-filters --> ir-custom-button
  ir-filter-card --> ir-custom-button
  ir-date-range-filter --> ir-date-select
  ir-date-range-filter --> ir-custom-button
  ir-date-select --> ir-input
  ir-date-select --> ir-air-date-picker
  ir-sales-by-channel-table --> ir-empty-state
  ir-sales-by-channel-table --> ir-custom-button
  ir-secure-tasks --> ir-sales-by-channel
  style ir-sales-by-channel fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
