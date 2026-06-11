# ir-validator

<!-- Auto Generated Below -->


## Properties

| Property              | Attribute             | Description                                                                  | Type                     | Default                                           |
| --------------------- | --------------------- | ---------------------------------------------------------------------------- | ------------------------ | ------------------------------------------------- |
| `asyncValidation`     | `async-validation`    |                                                                              | `boolean`                | `undefined`                                       |
| `autovalidate`        | `autovalidate`        | Enables automatic validation on every value change.                          | `boolean`                | `undefined`                                       |
| `blurEvent`           | `blur-event`          | Event names (space/comma separated) dispatched when the child loses focus.   | `string`                 | `'blur input-blur select-blur'`                   |
| `form`                | `form`                | Optional form id. Falls back to the closest ancestor form when omitted.      | `string`                 | `undefined`                                       |
| `schema` _(required)_ | --                    | Zod schema used to validate the child control's value.                       | `ZodType<any, any, any>` | `undefined`                                       |
| `showErrorMessage`    | `show-error-message`  |                                                                              | `boolean`                | `undefined`                                       |
| `validationDebounce`  | `validation-debounce` | Debounce delay (ms) before running validation for autovalidated changes.     | `number`                 | `200`                                             |
| `value`               | `value`               |                                                                              | `any`                    | `undefined`                                       |
| `valueEvent`          | `value-event`         | Event names (space/comma separated) dispatched when the child value changes. | `string`                 | `'input input-change value-change select-change'` |


## Events

| Event                | Description                                  | Type                                               |
| -------------------- | -------------------------------------------- | -------------------------------------------------- |
| `irValidationChange` | Emits whenever the validation state toggles. | `CustomEvent<{ valid: boolean; value: unknown; }>` |
| `irValueChange`      | Emits whenever the tracked value changes.    | `CustomEvent<{ value: unknown; }>`                 |


## Shadow Parts

| Part              | Description |
| ----------------- | ----------- |
| `"error-message"` |             |


## Dependencies

### Used by

 - [igl-application-info](../../igloo-calendar/igl-book-property/igl-booking-form/igl-application-info)
 - [igl-book-property-header](../../igloo-calendar/igl-book-property/igl-book-property-header)
 - [igl-property-booked-by](../../igloo-calendar/igl-book-property/igl-booking-form/igl-property-booked-by)
 - [igl-rate-extender-form](../../igloo-calendar/igl-rate-extender-drawer/igl-rate-extender-form)
 - [igl-spilt-booking-form](../../igloo-calendar/igl-split-booking-drawer/igl-spilt-booking-form)
 - [ir-agent-contract](../../ir-agents/ir-agent-editor-drawer/ir-agent-contract)
 - [ir-agent-profile](../../ir-agents/ir-agent-editor-drawer/ir-agent-profile)
 - [ir-booking-editor-guest-form](../../igloo-calendar/ir-booking-editor/ir-booking-editor-guest-form)
 - [ir-booking-editor-header](../../igloo-calendar/ir-booking-editor/ir-booking-editor-header)
 - [ir-booking-pricing-form](../../ir-booking-details/ir-room/ir-booking-pricing-drawer/ir-booking-pricing-form)
 - [ir-city-ledger-fiscal-documents-filters](../../ir-city-ledger/ir-city-ledger-fiscal-documents/ir-city-ledger-fiscal-documents-filters)
 - [ir-city-ledger-folio-filters](../../ir-city-ledger/ir-city-ledger-folio/ir-city-ledger-folio-filters)
 - [ir-city-ledger-statements-filter](../../ir-city-ledger/ir-city-ledger-statements/ir-city-ledger-statements-filter)
 - [ir-city-ledger-transaction-form](../../ir-city-ledger/ir-city-ledger-folio/ir-city-ledger-transaction-drawer/ir-city-ledger-transaction-form)
 - [ir-cl-adjustment-fields](../../ir-city-ledger/ir-city-ledger-folio/ir-city-ledger-transaction-drawer/ir-city-ledger-transaction-form/fields/ir-cl-adjustment-fields)
 - [ir-cl-invoice-select](../../ir-city-ledger/ir-city-ledger-folio/ir-city-ledger-transaction-drawer/ir-city-ledger-transaction-form/fields/ir-cl-invoice-select)
 - [ir-cl-opening-balance-fields](../../ir-city-ledger/ir-city-ledger-folio/ir-city-ledger-transaction-drawer/ir-city-ledger-transaction-form/fields/ir-cl-opening-balance-fields)
 - [ir-cl-payment-fields](../../ir-city-ledger/ir-city-ledger-folio/ir-city-ledger-transaction-drawer/ir-city-ledger-transaction-form/fields/ir-cl-payment-fields)
 - [ir-extra-service-config-form](../../ir-booking-details/ir-extra-services/ir-extra-service-config/ir-extra-service-config-form)
 - [ir-fiscal-documents-filters](../../ir-fiscal-documents/ir-fiscal-documents-filters)
 - [ir-guest-info-form](../../ir-guest-info/ir-guest-info-form)
 - [ir-hk-user-drawer-form](../../ir-housekeeping/ir-hk-user/ir-hk-user-drawer/ir-hk-user-drawer-form)
 - [ir-payment-folio-form](../../ir-booking-details/ir-payment-details/ir-payment-folio/ir-payment-folio-form)
 - [ir-pickup-form](../../ir-booking-details/ir-pickup/ir-pickup-form)
 - [ir-reallocation-form](../../ir-reallocation-drawer/ir-reallocation-form)
 - [ir-rectifier](../../igloo-calendar/igl-bulk-operations/ir-rectifier)
 - [ir-reset-password](../../ir-reset-password)
 - [ir-room-guests-form](../../ir-booking-details/ir-room-guests/ir-room-guests-form)
 - [ir-tax-input](../../ir-tax-service-categories/ir-tax-input)
 - [ir-user-form-panel](../../ir-user-management/ir-user-form-panel)

### Graph
```mermaid
graph TD;
  igl-application-info --> ir-validator
  igl-book-property-header --> ir-validator
  igl-property-booked-by --> ir-validator
  igl-rate-extender-form --> ir-validator
  igl-spilt-booking-form --> ir-validator
  ir-agent-contract --> ir-validator
  ir-agent-profile --> ir-validator
  ir-booking-editor-guest-form --> ir-validator
  ir-booking-editor-header --> ir-validator
  ir-booking-pricing-form --> ir-validator
  ir-city-ledger-fiscal-documents-filters --> ir-validator
  ir-city-ledger-folio-filters --> ir-validator
  ir-city-ledger-statements-filter --> ir-validator
  ir-city-ledger-transaction-form --> ir-validator
  ir-cl-adjustment-fields --> ir-validator
  ir-cl-invoice-select --> ir-validator
  ir-cl-opening-balance-fields --> ir-validator
  ir-cl-payment-fields --> ir-validator
  ir-extra-service-config-form --> ir-validator
  ir-fiscal-documents-filters --> ir-validator
  ir-guest-info-form --> ir-validator
  ir-hk-user-drawer-form --> ir-validator
  ir-payment-folio-form --> ir-validator
  ir-pickup-form --> ir-validator
  ir-reallocation-form --> ir-validator
  ir-rectifier --> ir-validator
  ir-reset-password --> ir-validator
  ir-room-guests-form --> ir-validator
  ir-tax-input --> ir-validator
  ir-user-form-panel --> ir-validator
  style ir-validator fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
