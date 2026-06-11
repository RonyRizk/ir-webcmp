# ir-fiscal-documents



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

- [ir-page](../ui/ir-page)
- [ir-fiscal-documents-filters](ir-fiscal-documents-filters)
- [ir-fiscal-documents-table](ir-fiscal-documents-table)

### Graph
```mermaid
graph TD;
  ir-fiscal-documents --> ir-page
  ir-fiscal-documents --> ir-fiscal-documents-filters
  ir-fiscal-documents --> ir-fiscal-documents-table
  ir-page --> ir-interceptor
  ir-page --> ir-toast
  ir-interceptor --> ir-otp-modal
  ir-otp-modal --> ir-spinner
  ir-otp-modal --> ir-otp
  ir-otp-modal --> ir-button
  ir-button --> ir-icons
  ir-toast --> ir-toast-provider
  ir-toast-provider --> ir-toast-alert
  ir-fiscal-documents-filters --> ir-validator
  ir-fiscal-documents-filters --> ir-date-range-filter
  ir-fiscal-documents-filters --> ir-autocomplete
  ir-fiscal-documents-filters --> ir-autocomplete-option
  ir-fiscal-documents-filters --> ir-picker
  ir-fiscal-documents-filters --> ir-picker-item
  ir-fiscal-documents-filters --> ir-input
  ir-fiscal-documents-filters --> ir-custom-button
  ir-date-range-filter --> ir-date-select
  ir-date-range-filter --> ir-custom-button
  ir-date-select --> ir-input
  ir-date-select --> ir-air-date-picker
  ir-autocomplete --> ir-input
  ir-fiscal-documents-table --> ir-cl-status-tag
  ir-fiscal-documents-table --> ir-custom-button
  ir-fiscal-documents-table --> ir-spinner
  ir-fiscal-documents-table --> ir-fd-confirm-dialog
  ir-fd-confirm-dialog --> ir-dialog
  ir-fd-confirm-dialog --> ir-custom-button
  style ir-fiscal-documents fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
