# ir-booking-city-ledger



<!-- Auto Generated Below -->


## Properties

| Property        | Attribute    | Description                                                     | Type         | Default     |
| --------------- | ------------ | --------------------------------------------------------------- | ------------ | ----------- |
| `booking`       | --           | Booking object; component is hidden when booking.agent is null. | `Booking`    | `undefined` |
| `error`         | `error`      | Error message driven by the parent fetch.                       | `string`     | `null`      |
| `folioRows`     | --           | Folio rows fetched by the parent.                               | `FolioRow[]` | `[]`        |
| `isLoading`     | `is-loading` | Loading state driven by the parent fetch.                       | `boolean`    | `false`     |
| `language`      | `language`   | Active language code.                                           | `string`     | `'en'`      |
| `svcCategories` | --           | Service-category entries used to populate the transaction form. | `IEntries[]` | `[]`        |


## Dependencies

### Used by

 - [ir-payment-details](../ir-payment-details)

### Depends on

- [ir-empty-state](../../ir-empty-state)
- [ir-cl-status-tag](../../ir-city-ledger/ir-cl-status-tag)
- [ir-custom-button](../../ui/ir-custom-button)
- [ir-spinner](../../ui/ir-spinner)
- [ir-city-ledger-transaction-drawer](../../ir-city-ledger/ir-city-ledger-folio/ir-city-ledger-transaction-drawer)
- [ir-cl-fiscal-document-preview](../../ir-city-ledger/ir-city-ledger-fiscal-documents/ir-cl-fiscal-document-preview)
- [ir-dialog](../../ui/ir-dialog)

### Graph
```mermaid
graph TD;
  ir-booking-city-ledger --> ir-empty-state
  ir-booking-city-ledger --> ir-cl-status-tag
  ir-booking-city-ledger --> ir-custom-button
  ir-booking-city-ledger --> ir-spinner
  ir-booking-city-ledger --> ir-city-ledger-transaction-drawer
  ir-booking-city-ledger --> ir-cl-fiscal-document-preview
  ir-booking-city-ledger --> ir-dialog
  ir-city-ledger-transaction-drawer --> ir-drawer
  ir-city-ledger-transaction-drawer --> ir-city-ledger-transaction-form
  ir-city-ledger-transaction-drawer --> ir-custom-button
  ir-city-ledger-transaction-form --> ir-validator
  ir-city-ledger-transaction-form --> ir-date-select
  ir-city-ledger-transaction-form --> ir-input
  ir-city-ledger-transaction-form --> ir-cl-opening-balance-fields
  ir-city-ledger-transaction-form --> ir-cl-payment-fields
  ir-city-ledger-transaction-form --> ir-cl-adjustment-fields
  ir-city-ledger-transaction-form --> ir-cl-credit-note-fields
  ir-city-ledger-transaction-form --> ir-cl-debit-note-fields
  ir-city-ledger-transaction-form --> ir-spinner
  ir-date-select --> ir-input
  ir-date-select --> ir-air-date-picker
  ir-cl-opening-balance-fields --> ir-validator
  ir-cl-payment-fields --> ir-validator
  ir-cl-adjustment-fields --> ir-validator
  ir-cl-credit-note-fields --> ir-cl-invoice-select
  ir-cl-invoice-select --> ir-validator
  ir-cl-debit-note-fields --> ir-cl-invoice-select
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
  ir-payment-details --> ir-booking-city-ledger
  style ir-booking-city-ledger fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
