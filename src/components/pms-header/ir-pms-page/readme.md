# ir-pms-page



<!-- Auto Generated Below -->


## Properties

| Property     | Attribute    | Description | Type     | Default     |
| ------------ | ------------ | ----------- | -------- | ----------- |
| `propertyid` | `propertyid` |             | `string` | `undefined` |
| `ticket`     | `ticket`     |             | `string` | `undefined` |


## Dependencies

### Depends on

- [ir-custom-button](../../ui/ir-custom-button)
- [ir-property-switcher](../ir-property-switcher)
- [ir-pms-search](../ir-pms-search)
- [ir-booking-new-form](../../ir-booking-new-form)
- [ir-notifications](../../ir-notifications)
- [ir-menu-drawer](../ir-menu-drawer)
- [ir-menu](../ir-menu)
- [ir-menu-item](../ir-menu-item)
- [ir-menu-group](../ir-menu-group)
- [ir-pms-payment-due-alert](../ir-pms-payment-due-alert)

### Graph
```mermaid
graph TD;
  ir-pms-page --> ir-custom-button
  ir-pms-page --> ir-property-switcher
  ir-pms-page --> ir-pms-search
  ir-pms-page --> ir-booking-new-form
  ir-pms-page --> ir-notifications
  ir-pms-page --> ir-menu-drawer
  ir-pms-page --> ir-menu
  ir-pms-page --> ir-menu-item
  ir-pms-page --> ir-menu-group
  ir-pms-page --> ir-pms-payment-due-alert
  ir-property-switcher --> ir-dialog
  ir-property-switcher --> ir-spinner
  ir-property-switcher --> ir-property-switcher-dialog-content
  ir-property-switcher-dialog-content --> ir-input
  ir-pms-search --> ir-autocomplete
  ir-pms-search --> ir-autocomplete-option
  ir-pms-search --> ir-booking-status-tag
  ir-autocomplete --> ir-input
  ir-booking-new-form --> ir-custom-button
  ir-booking-new-form --> ir-booking-editor-drawer
  ir-booking-editor-drawer --> ir-custom-button
  ir-booking-editor-drawer --> ir-drawer
  ir-booking-editor-drawer --> ir-booking-editor
  ir-booking-editor --> ir-spinner
  ir-booking-editor --> ir-interceptor
  ir-booking-editor --> ir-booking-editor-header
  ir-booking-editor --> igl-room-type
  ir-booking-editor --> ir-booking-editor-form
  ir-interceptor --> ir-otp-modal
  ir-otp-modal --> ir-spinner
  ir-otp-modal --> ir-otp
  ir-otp-modal --> ir-button
  ir-button --> ir-icons
  ir-booking-editor-header --> ir-validator
  ir-booking-editor-header --> ir-picker
  ir-booking-editor-header --> ir-picker-item
  ir-booking-editor-header --> ir-date-range
  ir-booking-editor-header --> ir-custom-button
  ir-date-range --> ir-input
  ir-date-range --> ir-custom-date-range
  igl-room-type --> igl-rate-plan
  igl-rate-plan --> ir-input
  igl-rate-plan --> ir-custom-button
  ir-booking-editor-form --> ir-date-view
  ir-booking-editor-form --> igl-application-info
  ir-booking-editor-form --> ir-picker
  ir-booking-editor-form --> ir-picker-item
  ir-booking-editor-form --> ir-custom-button
  ir-booking-editor-form --> ir-booking-editor-guest-form
  ir-booking-editor-form --> ir-service-assignee-select
  igl-application-info --> ir-validator
  igl-application-info --> ir-input
  ir-booking-editor-guest-form --> ir-input
  ir-booking-editor-guest-form --> ir-validator
  ir-booking-editor-guest-form --> ir-country-picker
  ir-booking-editor-guest-form --> ir-mobile-input
  ir-country-picker --> ir-picker
  ir-country-picker --> ir-picker-item
  ir-country-picker --> ir-input-text
  ir-mobile-input --> ir-input
  ir-notifications --> ir-custom-button
  ir-notifications --> ir-empty-state
  ir-menu-drawer --> ir-drawer
  style ir-pms-page fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
