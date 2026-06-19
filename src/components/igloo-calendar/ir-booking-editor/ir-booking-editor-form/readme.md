# ir-booking-editor-form



<!-- Auto Generated Below -->


## Properties

| Property  | Attribute | Description | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Default          |
| --------- | --------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| `agent`   | --        |             | `{ name?: string; id?: number; email?: string; property_id?: any; code?: string; address?: string; agent_rate_type_code?: { code?: string; description?: string; }; agent_type_code?: { code?: string; description?: string; }; city?: string; contact_name?: string; contract_nbr?: any; country_id?: number; currency_id?: any; due_balance?: any; email_copied_upon_booking?: string; is_active?: boolean; is_send_guest_confirmation_email?: boolean; notes?: string; payment_mode?: { code?: string; description?: string; }; phone?: string; provided_discount?: any; question?: string; sort_order?: any; tax_nbr?: string; reference?: string; verification_mode?: string; has_opening_balance?: boolean; cl_post_timing?: { code?: string; description?: string; }; }` | `undefined`      |
| `booking` | --        |             | `Booking`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `undefined`      |
| `mode`    | `mode`    |             | `"ADD_ROOM" \| "BAR_BOOKING" \| "EDIT_BOOKING" \| "PLUS_BOOKING" \| "SPLIT_BOOKING"`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `'PLUS_BOOKING'` |
| `room`    | --        |             | `Room`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | `undefined`      |


## Events

| Event           | Description | Type                  |
| --------------- | ----------- | --------------------- |
| `doReservation` |             | `CustomEvent<string>` |


## Dependencies

### Used by

 - [ir-booking-editor](..)

### Depends on

- [ir-date-view](../../../ir-date-view)
- [igl-application-info](../../igl-book-property/igl-booking-form/igl-application-info)
- [ir-picker](../../../ui/ir-picker)
- [ir-picker-item](../../../ui/ir-picker/ir-picker-item)
- [ir-custom-button](../../../ui/ir-custom-button)
- [ir-booking-editor-guest-form](../ir-booking-editor-guest-form)
- [ir-service-assignee-select](../../../ir-booking-details/ir-service-assignee-select)

### Graph
```mermaid
graph TD;
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
  ir-booking-editor --> ir-booking-editor-form
  style ir-booking-editor-form fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
