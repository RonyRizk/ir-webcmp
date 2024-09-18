# ir-booking-listing



<!-- Auto Generated Below -->


## Properties

| Property     | Attribute    | Description | Type     | Default     |
| ------------ | ------------ | ----------- | -------- | ----------- |
| `baseurl`    | `baseurl`    |             | `string` | `''`        |
| `language`   | `language`   |             | `string` | `''`        |
| `propertyid` | `propertyid` |             | `number` | `undefined` |
| `rowCount`   | `row-count`  |             | `number` | `10`        |
| `ticket`     | `ticket`     |             | `string` | `''`        |


## Dependencies

### Depends on

- [ir-loading-screen](../ir-loading-screen)
- [ir-interceptor](../ir-interceptor)
- [ir-toast](../ir-toast)
- [ir-listing-header](ir-listing-header)
- [ir-tooltip](../ir-tooltip)
- [ir-button](../ir-button)
- [ir-select](../ir-select)
- [ir-listing-modal](ir-listing-modal)
- [ir-sidebar](../ir-sidebar)
- [ir-booking-details](../ir-booking-details)

### Graph
```mermaid
graph TD;
  ir-booking-listing --> ir-loading-screen
  ir-booking-listing --> ir-interceptor
  ir-booking-listing --> ir-toast
  ir-booking-listing --> ir-listing-header
  ir-booking-listing --> ir-tooltip
  ir-booking-listing --> ir-button
  ir-booking-listing --> ir-select
  ir-booking-listing --> ir-listing-modal
  ir-booking-listing --> ir-sidebar
  ir-booking-listing --> ir-booking-details
  ir-listing-header --> igl-book-property-container
  ir-listing-header --> ir-button
  ir-listing-header --> ir-input-text
  ir-listing-header --> ir-select
  ir-listing-header --> ir-date-picker
  igl-book-property-container --> ir-toast
  igl-book-property-container --> ir-interceptor
  igl-book-property-container --> igl-book-property
  igl-book-property --> igl-block-dates-view
  igl-book-property --> ir-button
  igl-book-property --> ir-icon
  igl-book-property --> igl-booking-overview-page
  igl-book-property --> igl-pagetwo
  igl-block-dates-view --> ir-date-view
  ir-button --> ir-icons
  igl-booking-overview-page --> igl-book-property-header
  igl-booking-overview-page --> igl-booking-rooms
  igl-booking-overview-page --> igl-book-property-footer
  igl-book-property-header --> ir-autocomplete
  igl-book-property-header --> ir-select
  igl-book-property-header --> ir-button
  igl-book-property-header --> igl-date-range
  igl-date-range --> ir-date-picker
  igl-date-range --> ir-date-view
  igl-booking-rooms --> igl-booking-room-rate-plan
  igl-booking-room-rate-plan --> ir-tooltip
  igl-book-property-footer --> ir-button
  igl-pagetwo --> ir-date-view
  igl-pagetwo --> igl-application-info
  igl-pagetwo --> igl-property-booked-by
  igl-pagetwo --> ir-button
  igl-application-info --> ir-tooltip
  igl-property-booked-by --> ir-autocomplete
  igl-property-booked-by --> ir-tooltip
  ir-listing-modal --> ir-icon
  ir-listing-modal --> ir-select
  ir-listing-modal --> ir-button
  ir-sidebar --> ir-icon
  ir-booking-details --> ir-toast
  ir-booking-details --> ir-interceptor
  ir-booking-details --> ir-select
  ir-booking-details --> ir-button
  ir-booking-details --> ir-label
  ir-booking-details --> ota-label
  ir-booking-details --> ir-date-view
  ir-booking-details --> ir-room
  ir-booking-details --> ir-payment-details
  ir-booking-details --> ir-sidebar
  ir-booking-details --> igl-book-property
  ir-booking-details --> ir-dialog
  ir-booking-details --> ir-guest-info
  ir-booking-details --> ir-pickup
  ir-booking-details --> ir-booking-extra-note
  ir-label --> ir-button
  ir-room --> ir-button
  ir-room --> ir-date-view
  ir-room --> ir-label
  ir-room --> ir-modal
  ir-modal --> ir-button
  ir-payment-details --> ir-date-picker
  ir-payment-details --> ir-button
  ir-payment-details --> ir-modal
  ir-dialog --> ir-icon
  ir-guest-info --> ir-icon
  ir-guest-info --> ir-input-text
  ir-guest-info --> ir-select
  ir-guest-info --> ir-button
  ir-pickup --> ir-title
  ir-pickup --> ir-select
  ir-pickup --> ir-date-picker
  ir-pickup --> ir-input-text
  ir-pickup --> ir-button
  ir-title --> ir-icon
  ir-booking-extra-note --> ir-title
  ir-booking-extra-note --> ir-textarea
  ir-booking-extra-note --> ir-button
  style ir-booking-listing fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
