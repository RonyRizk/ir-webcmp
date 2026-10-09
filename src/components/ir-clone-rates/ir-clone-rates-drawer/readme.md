# ir-clone-rates-drawer



<!-- Auto Generated Below -->


## Properties

| Property     | Attribute    | Description | Type      | Default     |
| ------------ | ------------ | ----------- | --------- | ----------- |
| `language`   | `language`   |             | `string`  | `'en'`      |
| `open`       | `open`       |             | `boolean` | `false`     |
| `p`          | `p`          |             | `string`  | `undefined` |
| `propertyid` | `propertyid` |             | `number`  | `undefined` |
| `ticket`     | `ticket`     |             | `string`  | `undefined` |


## Events

| Event                    | Description                                                                                                                                 | Type                |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| `cloneRatesDrawerClosed` | Fired when the drawer closes: Cancel, the close button, Escape, light dismiss, or a successful copy. The parent should set `open` to false. | `CustomEvent<void>` |


## Dependencies

### Depends on

- [ir-drawer](../../ir-drawer)
- [ir-clone-rates](..)
- [ir-custom-button](../../ui/ir-custom-button)

### Graph
```mermaid
graph TD;
  ir-clone-rates-drawer --> ir-drawer
  ir-clone-rates-drawer --> ir-clone-rates
  ir-clone-rates-drawer --> ir-custom-button
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
  style ir-clone-rates-drawer fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
