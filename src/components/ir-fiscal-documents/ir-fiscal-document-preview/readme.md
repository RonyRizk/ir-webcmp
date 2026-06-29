# ir-fiscal-document-preview



<!-- Auto Generated Below -->


## Overview

Fiscal Document Preview

Thin wrapper that mounts the appropriate preview component(s). Both inner
previews are passive, window-event-driven listeners, so the host just needs
to render this once. `documentConverted` from the agent preview bubbles
through to the host.

## Properties

| Property     | Attribute     | Description                                                     | Type                          | Default     |
| ------------ | ------------- | --------------------------------------------------------------- | ----------------------------- | ----------- |
| `mode`       | `mode`        | Which preview flows to enable. Defaults to agent (city-ledger). | `"agent" \| "all" \| "guest"` | `'agent'`   |
| `propertyId` | `property-id` |                                                                 | `number`                      | `undefined` |
| `ticket`     | `ticket`      |                                                                 | `string`                      | `undefined` |


## Events

| Event               | Description                                                         | Type                |
| ------------------- | ------------------------------------------------------------------- | ------------------- |
| `documentConverted` | Re-emitted when the agent preview converts a draft into an invoice. | `CustomEvent<void>` |


## Dependencies

### Used by

 - [ir-booking-details](../../ir-booking-details)
 - [ir-fiscal-documents](..)
 - [ir-invoice](../../ir-invoice)

### Depends on

- [ir-cl-fiscal-document-preview](../../ir-city-ledger/ir-city-ledger-fiscal-documents/ir-cl-fiscal-document-preview)
- [ir-guest-document-preview](../ir-guest-document-preview)

### Graph
```mermaid
graph TD;
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
  ir-booking-details --> ir-fiscal-document-preview
  ir-fiscal-documents --> ir-fiscal-document-preview
  ir-invoice --> ir-fiscal-document-preview
  style ir-fiscal-document-preview fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
