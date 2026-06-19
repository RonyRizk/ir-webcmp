# ir-pickup



<!-- Auto Generated Below -->


## Properties

| Property               | Attribute           | Description                                                                                                                                            | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Default     |
| ---------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| `agent`                | --                  |                                                                                                                                                        | `{ name?: string; id?: number; email?: string; property_id?: any; code?: string; address?: string; agent_rate_type_code?: { code?: string; description?: string; }; agent_type_code?: { code?: string; description?: string; }; city?: string; contact_name?: string; contract_nbr?: any; country_id?: number; currency_id?: any; due_balance?: any; email_copied_upon_booking?: string; is_active?: boolean; is_send_guest_confirmation_email?: boolean; notes?: string; payment_mode?: { code?: string; description?: string; }; phone?: string; provided_discount?: any; question?: string; sort_order?: any; tax_nbr?: string; reference?: string; verification_mode?: string; has_opening_balance?: boolean; cl_post_timing?: { code?: string; description?: string; }; }` | `undefined` |
| `booking` _(required)_ | --                  |                                                                                                                                                        | `Booking`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `undefined` |
| `bookingDates`         | --                  | The date range of the booking (check-in and check-out). Determines allowed pickup dates and validation rules.                                          | `{ from: string; to: string; }`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `undefined` |
| `bookingNumber`        | `booking-number`    | Unique booking reference number used to associate pickup updates with a specific reservation.                                                          | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | `undefined` |
| `defaultPickupData`    | --                  | Pre-filled pickup information coming from the booking. When provided, the pickup form initializes with this data and the user may update or remove it. | `IBookingPickupInfo`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `undefined` |
| `numberOfPersons`      | `number-of-persons` | Total number of persons included in the booking. Used to compute vehicle capacity and validate pickup options.                                         | `number`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | `0`         |
| `open`                 | `open`              | Controls whether the pickup drawer/modal is open. When true, the drawer becomes visible and initializes the form.                                      | `boolean`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `undefined` |


## Events

| Event        | Description                                                                                                                                              | Type                |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| `closeModal` | Emitted when the pickup drawer should be closed. Triggered when the user dismisses the drawer or when the inner pickup form requests the modal to close. | `CustomEvent<null>` |


## Dependencies

### Used by

 - [ir-booking-details](..)

### Depends on

- [ir-drawer](../../ir-drawer)
- [ir-pickup-form](ir-pickup-form)
- [ir-custom-button](../../ui/ir-custom-button)

### Graph
```mermaid
graph TD;
  ir-pickup --> ir-drawer
  ir-pickup --> ir-pickup-form
  ir-pickup --> ir-custom-button
  ir-pickup-form --> ir-validator
  ir-pickup-form --> ir-date-select
  ir-pickup-form --> ir-input
  ir-pickup-form --> ir-service-assignee-select
  ir-date-select --> ir-input
  ir-date-select --> ir-air-date-picker
  ir-booking-details --> ir-pickup
  style ir-pickup fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
