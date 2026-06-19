# ir-billing-drawer



<!-- Auto Generated Below -->


## Properties

| Property                  | Attribute                     | Description                                                                                                                                                               | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Default     |
| ------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| `agent`                   | --                            |                                                                                                                                                                           | `{ name?: string; id?: number; email?: string; property_id?: any; code?: string; address?: string; agent_rate_type_code?: { code?: string; description?: string; }; agent_type_code?: { code?: string; description?: string; }; city?: string; contact_name?: string; contract_nbr?: any; country_id?: number; currency_id?: any; due_balance?: any; email_copied_upon_booking?: string; is_active?: boolean; is_send_guest_confirmation_email?: boolean; notes?: string; payment_mode?: { code?: string; description?: string; }; phone?: string; provided_discount?: any; question?: string; sort_order?: any; tax_nbr?: string; reference?: string; verification_mode?: string; has_opening_balance?: boolean; cl_post_timing?: { code?: string; description?: string; }; }` | `undefined` |
| `booking`                 | --                            | The booking object containing reservation and guest details that will be used to populate the billing view.                                                               | `Booking`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `undefined` |
| `isAllServicesAgentOwned` | `is-all-services-agent-owned` |                                                                                                                                                                           | `boolean`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `undefined` |
| `open`                    | `open`                        | Controls whether the billing drawer is open or closed.  When `true`, the drawer becomes visible. When `false`, it is hidden.  This prop is reflected to the host element. | `boolean`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `undefined` |


## Events

| Event          | Description                                                                                                | Type                |
| -------------- | ---------------------------------------------------------------------------------------------------------- | ------------------- |
| `billingClose` | Emitted when the billing drawer has been closed.  Listen to this event to respond to drawer close actions. | `CustomEvent<void>` |


## Dependencies

### Used by

 - [ir-booking-details](../../ir-booking-details)

### Depends on

- [ir-drawer](../../ir-drawer)
- [ir-billing](..)

### Graph
```mermaid
graph TD;
  ir-billing-drawer --> ir-drawer
  ir-billing-drawer --> ir-billing
  ir-billing --> ir-guest-billing
  ir-billing --> ir-agent-billing
  ir-guest-billing --> ir-spinner
  ir-guest-billing --> ir-custom-button
  ir-guest-billing --> ir-empty-state
  ir-guest-billing --> ir-invoice
  ir-guest-billing --> ir-preview-screen-dialog
  ir-guest-billing --> ir-pdf-viewer
  ir-guest-billing --> ir-dialog
  ir-invoice --> ir-drawer
  ir-invoice --> ir-invoice-form
  ir-invoice --> ir-custom-button
  ir-invoice --> ir-preview-screen-dialog
  ir-invoice --> ir-proforma-invoice-preview
  ir-invoice-form --> ir-spinner
  ir-invoice-form --> ir-date-select
  ir-invoice-form --> ir-booking-billing-recipient
  ir-invoice-form --> ir-empty-state
  ir-date-select --> ir-input
  ir-date-select --> ir-air-date-picker
  ir-booking-billing-recipient --> ir-booking-company-dialog
  ir-booking-company-dialog --> ir-dialog
  ir-booking-company-dialog --> ir-booking-company-form
  ir-booking-company-dialog --> ir-custom-button
  ir-booking-company-form --> ir-input
  ir-preview-screen-dialog --> ir-dialog
  ir-preview-screen-dialog --> ir-custom-button
  ir-proforma-invoice-preview --> ir-printing-label
  ir-proforma-invoice-preview --> ir-print-room
  ir-proforma-invoice-preview --> ir-printing-pickup
  ir-proforma-invoice-preview --> ir-printing-extra-service
  ir-print-room --> ir-printing-label
  ir-printing-pickup --> ir-printing-label
  ir-printing-extra-service --> ir-printing-label
  ir-agent-billing --> ir-custom-button
  ir-agent-billing --> ir-city-ledger-fiscal-documents-table
  ir-agent-billing --> ir-cl-invoice-dialog
  ir-city-ledger-fiscal-documents-table --> ir-cl-status-tag
  ir-city-ledger-fiscal-documents-table --> ir-custom-button
  ir-city-ledger-fiscal-documents-table --> ir-spinner
  ir-city-ledger-fiscal-documents-table --> ir-fd-confirm-dialog
  ir-fd-confirm-dialog --> ir-dialog
  ir-fd-confirm-dialog --> ir-custom-button
  ir-cl-invoice-dialog --> ir-dialog
  ir-cl-invoice-dialog --> ir-cl-invoice-form
  ir-cl-invoice-dialog --> ir-custom-button
  ir-cl-invoice-form --> ir-date-range-filter
  ir-date-range-filter --> ir-date-select
  ir-date-range-filter --> ir-custom-button
  ir-booking-details --> ir-billing-drawer
  style ir-billing-drawer fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
