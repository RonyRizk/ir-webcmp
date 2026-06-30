# ir-invoice



<!-- Auto Generated Below -->


## Properties

| Property         | Attribute         | Description                                                                                                                                                                                                          | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Default     |
| ---------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| `autoPrint`      | `auto-print`      | When `true`, automatically triggers `window.print()` after an invoice is created. Useful for setups where the invoice should immediately be sent to a printer.                                                       | `boolean`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | `false`     |
| `booking`        | --                | The booking object for which the invoice is being generated. Should contain room, guest, and pricing information.                                                                                                    | `Booking`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | `undefined` |
| `for`            | `for`             | Specifies what the invoice is for. - `"room"`: invoice for a specific room - `"booking"`: invoice for the entire booking                                                                                             | `"booking" \| "room"`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `'booking'` |
| `invoiceInfo`    | --                | Additional invoice-related metadata used when creating or rendering the invoice.  This object can include payment details, discounts, tax information, or any context needed by the invoice form.                    | `{ invoiceable_items?: { key?: number; type?: InvoiceableItemType; status?: any; system_id?: any; amount?: number; currency?: { symbol?: string; id?: number; code?: string; }; booking_nbr?: string; invoice_nbr?: string; reason?: { code?: InvoiceableItemReasonCode; description?: string; }; is_invoiceable?: boolean; }[]; invoices?: { user?: string; status?: { code?: string; description?: any; }; date?: string; system_id?: number; currency?: { symbol?: string; id?: number; code?: string; }; booking_nbr?: string; total_amount?: any; target?: any; nbr?: string; remark?: string; billed_to_name?: any; billed_to_tax?: any; items?: { key?: number; type?: string; status?: { code?: string; description?: any; }; description?: any; system_id?: number; amount?: number; currency?: { symbol?: string; id?: number; code?: string; }; booking_nbr?: string; invoice_nbr?: string; is_invoiceable?: boolean; }[]; credit_note?: { user?: string; date?: string; system_id?: string; reason?: string; nbr?: string; }; pdf_url?: any; }[]; }` | `undefined` |
| `open`           | `open`            | Whether the invoice drawer is open.  This prop is mutable and reflected to the host element, allowing parent components to control visibility via markup or via the public `openDrawer()` / `closeDrawer()` methods. | `boolean`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | `undefined` |
| `roomIdentifier` | `room-identifier` | The identifier of the room for which the invoice is being generated. Used when invoicing at room level instead of booking level.                                                                                     | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | `undefined` |


## Events

| Event          | Description                                                                                                                                  | Type                |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| `invoiceClose` | Emitted when the invoice drawer is closed.  Fired when `closeDrawer()` is called, including when the underlying drawer emits `onDrawerHide`. | `CustomEvent<void>` |
| `invoiceOpen`  | Emitted when the invoice drawer is opened.  Fired when `openDrawer()` is called and the component transitions into the open state.           | `CustomEvent<void>` |


## Methods

### `closeDrawer() => Promise<void>`

Closes the invoice drawer.

This method sets the `open` property to `false`, hiding the drawer.
Parent components can call this to close the drawer programmatically,
and it is also used internally when the drawer emits `onDrawerHide`.

Also emits the `invoiceClose` event.

#### Returns

Type: `Promise<void>`

Resolves once the drawer state is updated.

### `openDrawer() => Promise<void>`

Opens the invoice drawer.

This method sets the `open` property to `true`, making the drawer visible.
It can be called programmatically by parent components.

Also emits the `invoiceOpen` event.

#### Returns

Type: `Promise<void>`

Resolves once the drawer state is updated.


## Dependencies

### Used by

 - [igloo-calendar](../igloo-calendar)
 - [ir-departures](../ir-departures)
 - [ir-guest-billing](../ir-billing/ir-guest-billing)
 - [ir-room](../ir-booking-details/ir-room)
 - [ir-test2-cmp](../ir-test-cmp)

### Depends on

- [ir-drawer](../ir-drawer)
- [ir-invoice-form](ir-invoice-form)
- [ir-custom-button](../ui/ir-custom-button)
- [ir-fiscal-document-preview](../ir-fiscal-documents/ir-fiscal-document-preview)

### Graph
```mermaid
graph TD;
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
  igloo-calendar --> ir-invoice
  ir-departures --> ir-invoice
  ir-guest-billing --> ir-invoice
  ir-room --> ir-invoice
  ir-test2-cmp --> ir-invoice
  style ir-invoice fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
