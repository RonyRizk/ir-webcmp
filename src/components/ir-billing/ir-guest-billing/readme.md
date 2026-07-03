# ir-guest-billing



<!-- Auto Generated Below -->


## Properties

| Property  | Attribute | Description | Type      | Default     |
| --------- | --------- | ----------- | --------- | ----------- |
| `booking` | --        |             | `Booking` | `undefined` |


## Events

| Event                  | Description                                                                                                                  | Type                                       |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `billingClose`         |                                                                                                                              | `CustomEvent<void>`                        |
| `guestDocumentPreview` |                                                                                                                              | `CustomEvent<GuestDocumentPreviewRequest>` |
| `resetBookingEvt`      | Refreshes the wider booking-details tree. Emit with a Booking payload to skip ir-booking-details' full-page loading spinner. | `CustomEvent<Booking>`                     |


## Dependencies

### Used by

 - [ir-billing](..)

### Depends on

- [ir-spinner](../../ui/ir-spinner)
- [ir-custom-button](../../ui/ir-custom-button)
- [ir-empty-state](../../ir-empty-state)
- [ir-invoice](../../ir-invoice)
- [ir-void-document-dialog](../../ir-booking-details/ir-void-document-dialog)

### Graph
```mermaid
graph TD;
  ir-guest-billing --> ir-spinner
  ir-guest-billing --> ir-custom-button
  ir-guest-billing --> ir-empty-state
  ir-guest-billing --> ir-invoice
  ir-guest-billing --> ir-void-document-dialog
  ir-invoice --> ir-drawer
  ir-invoice --> ir-invoice-form
  ir-invoice --> ir-custom-button
  ir-invoice --> ir-fiscal-document-preview
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
  ir-fiscal-document-preview --> ir-cl-fiscal-document-preview
  ir-fiscal-document-preview --> ir-guest-document-preview
  ir-cl-fiscal-document-preview --> ir-spinner
  ir-cl-fiscal-document-preview --> ir-pdf-viewer
  ir-cl-fiscal-document-preview --> ir-preview-screen-dialog
  ir-cl-fiscal-document-preview --> ir-custom-button
  ir-cl-fiscal-document-preview --> ir-fd-confirm-dialog
  ir-preview-screen-dialog --> ir-dialog
  ir-preview-screen-dialog --> ir-custom-button
  ir-fd-confirm-dialog --> ir-dialog
  ir-fd-confirm-dialog --> ir-input
  ir-fd-confirm-dialog --> ir-custom-button
  ir-guest-document-preview --> ir-pdf-viewer
  ir-guest-document-preview --> ir-spinner
  ir-guest-document-preview --> ir-preview-screen-dialog
  ir-guest-document-preview --> ir-custom-button
  ir-void-document-dialog --> ir-dialog
  ir-void-document-dialog --> ir-custom-button
  ir-billing --> ir-guest-billing
  style ir-guest-billing fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
