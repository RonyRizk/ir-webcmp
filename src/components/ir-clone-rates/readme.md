# ir-clone-rates



<!-- Auto Generated Below -->


## Properties

| Property     | Attribute    | Description                                                                                                              | Type                 | Default     |
| ------------ | ------------ | ------------------------------------------------------------------------------------------------------------------------ | -------------------- | ----------- |
| `language`   | `language`   |                                                                                                                          | `string`             | `'en'`      |
| `mode`       | `mode`       | `drawer` drops the page shell and the inline Review button; the host drawer submits `#clone-rates-form` from its footer. | `"drawer" \| "page"` | `'page'`    |
| `p`          | `p`          |                                                                                                                          | `string`             | `undefined` |
| `propertyid` | `propertyid` |                                                                                                                          | `number`             | `undefined` |
| `ticket`     | `ticket`     |                                                                                                                          | `string`             | `undefined` |


## Events

| Event         | Description                                     | Type                |
| ------------- | ----------------------------------------------- | ------------------- |
| `ratesCloned` | Fired after the rates were copied successfully. | `CustomEvent<void>` |


## Dependencies

### Used by

 - [ir-clone-rates-drawer](ir-clone-rates-drawer)

### Depends on

- [ir-date-range-filter](../ui/ir-date-range-filter)
- [ir-weekday-selector](../ui/ir-weekday-selector)
- [ir-empty-state](../ir-empty-state)
- [ir-input](../ui/ir-input)
- [ir-custom-button](../ui/ir-custom-button)
- [ir-clone-rates-review](ir-clone-rates-review)
- [ir-spinner](../ui/ir-spinner)
- [ir-loading-screen](../ir-loading-screen)
- [ir-page](../ui/ir-page)

### Graph
```mermaid
graph TD;
  ir-clone-rates --> ir-date-range-filter
  ir-clone-rates --> ir-weekday-selector
  ir-clone-rates --> ir-empty-state
  ir-clone-rates --> ir-input
  ir-clone-rates --> ir-custom-button
  ir-clone-rates --> ir-clone-rates-review
  ir-clone-rates --> ir-spinner
  ir-clone-rates --> ir-loading-screen
  ir-clone-rates --> ir-page
  ir-date-range-filter --> ir-date-select
  ir-date-range-filter --> ir-custom-button
  ir-date-select --> ir-input
  ir-date-select --> ir-air-date-picker
  ir-clone-rates-review --> ir-dialog
  ir-clone-rates-review --> ir-custom-button
  ir-page --> ir-interceptor
  ir-page --> ir-toast
  ir-interceptor --> ir-otp-modal
  ir-otp-modal --> ir-dialog
  ir-otp-modal --> ir-spinner
  ir-otp-modal --> ir-otp
  ir-otp-modal --> ir-custom-button
  ir-toast --> ir-toast-provider
  ir-toast-provider --> ir-toast-item
  ir-clone-rates-drawer --> ir-clone-rates
  style ir-clone-rates fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
