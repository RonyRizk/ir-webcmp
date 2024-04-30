# ir-checkout-page



<!-- Auto Generated Below -->


## Dependencies

### Used by

 - [ir-booking-engine](..)

### Depends on

- [ir-user-form](ir-user-form)
- [ir-booking-details](ir-booking-details)
- [ir-pickup](ir-pickup)
- [ir-booking-summary](ir-booking-summary)

### Graph
```mermaid
graph TD;
  ir-checkout-page --> ir-user-form
  ir-checkout-page --> ir-booking-details
  ir-checkout-page --> ir-pickup
  ir-checkout-page --> ir-booking-summary
  ir-user-form --> ir-button
  ir-user-form --> ir-input
  ir-user-form --> ir-phone-input
  ir-user-form --> ir-select
  ir-user-form --> ir-checkbox
  ir-user-form --> ir-dialog
  ir-user-form --> ir-auth
  ir-phone-input --> ir-icons
  ir-auth --> ir-signin
  ir-auth --> ir-signup
  ir-signin --> ir-badge-group
  ir-signin --> ir-input
  ir-signin --> ir-button
  ir-badge-group --> ir-icons
  ir-signup --> ir-input
  ir-signup --> ir-button
  ir-booking-details --> ir-icons
  ir-booking-details --> ir-select
  ir-booking-details --> ir-button
  ir-booking-details --> ir-input
  ir-booking-details --> ir-dialog
  ir-pickup --> ir-icons
  ir-pickup --> ir-select
  ir-pickup --> ir-popover
  ir-pickup --> ir-calendar
  ir-pickup --> ir-input
  ir-popover --> ir-dialog
  ir-booking-summary --> ir-button
  ir-booking-summary --> ir-checkbox
  ir-booking-engine --> ir-checkout-page
  style ir-checkout-page fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
