# ir-custom-button

<!-- Auto Generated Below -->


## Properties

| Property         | Attribute          | Description                                                                                                                                                                                                          | Type                                                                           | Default     |
| ---------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ----------- |
| `appearance`     | `appearance`       | The button's visual appearance.                                                                                                                                                                                      | `"accent" \| "filled" \| "filled-outlined" \| "outlined" \| "plain"`           | `undefined` |
| `disabled`       | `disabled`         | Disables the button. Does not apply to link buttons.                                                                                                                                                                 | `boolean`                                                                      | `undefined` |
| `download`       | `download`         | Tells the browser to download the linked file as this filename. Only used when `href` is present.                                                                                                                    | `string`                                                                       | `undefined` |
| `form`           | `form`             | The "form owner" to associate the button with. If omitted, the closest containing form will be used instead. The value of this attribute must be an id of a form in the same document or shadow root as the button.  | `HTMLFormElement \| string`                                                    | `undefined` |
| `formAction`     | `form-action`      | Used to override the form owner's `action` attribute.                                                                                                                                                                | `string`                                                                       | `undefined` |
| `formEnctype`    | `form-enctype`     | Used to override the form owner's `enctype` attribute.                                                                                                                                                               | `"application/x-www-form-urlencoded" \| "multipart/form-data" \| "text/plain"` | `undefined` |
| `formMethod`     | `form-method`      | Used to override the form owner's `method` attribute.                                                                                                                                                                | `"get" \| "post"`                                                              | `undefined` |
| `formNoValidate` | `form-no-validate` | Used to override the form owner's `novalidate` attribute.                                                                                                                                                            | `boolean`                                                                      | `undefined` |
| `formTarget`     | `form-target`      | Used to override the form owner's `target` attribute.                                                                                                                                                                | `string`                                                                       | `undefined` |
| `href`           | `href`             | When set, the underlying button will be rendered as an `<a>` with this `href` instead of a `<button>`.                                                                                                               | `string`                                                                       | `undefined` |
| `iconBtn`        | `icon-btn`         |                                                                                                                                                                                                                      | `boolean`                                                                      | `undefined` |
| `link`           | `link`             |                                                                                                                                                                                                                      | `boolean`                                                                      | `undefined` |
| `loading`        | `loading`          | Draws the button in a loading state.                                                                                                                                                                                 | `boolean`                                                                      | `undefined` |
| `name`           | `name`             | The name of the button, submitted as a name/value pair with form data, but only when this button is the submitter. This attribute is ignored when `href` is present.                                                 | `string`                                                                       | `undefined` |
| `pill`           | `pill`             | Draws a pill-style button with rounded edges.                                                                                                                                                                        | `boolean`                                                                      | `undefined` |
| `rel`            | `rel`              | When using `href`, this attribute will map to the underlying link's `rel` attribute.                                                                                                                                 | `string`                                                                       | `undefined` |
| `size`           | `size`             | The button's size.                                                                                                                                                                                                   | `"l" \| "large" \| "m" \| "medium" \| "s" \| "small" \| "xl" \| "xs"`          | `'s'`       |
| `target`         | `target`           | Tells the browser where to open the link. Only used when `href` is present.                                                                                                                                          | `"_blank" \| "_parent" \| "_self" \| "_top"`                                   | `undefined` |
| `type`           | `type`             | The type of button. Note that the default value is `button` instead of `submit`, which is opposite of how native `<button>` elements behave. When the type is `submit`, the button will submit the surrounding form. | `"button" \| "reset" \| "submit"`                                              | `'button'`  |
| `value`          | `value`            | The value of the button, submitted as a pair with the button's name as part of the form data, but only when this button is the submitter. This attribute is ignored when `href` is present.                          | `string`                                                                       | `undefined` |
| `variant`        | `variant`          | The button's theme variant. Defaults to `neutral` if not within another element with a variant.                                                                                                                      | `"brand" \| "danger" \| "neutral" \| "success" \| "warning"`                   | `undefined` |
| `withCaret`      | `with-caret`       | Draws the button with a caret. Used to indicate that the button triggers a dropdown menu or similar behavior.                                                                                                        | `boolean`                                                                      | `undefined` |


## Events

| Event          | Description | Type                      |
| -------------- | ----------- | ------------------------- |
| `clickHandler` |             | `CustomEvent<MouseEvent>` |


## Dependencies

### Used by

 - [igl-blocked-date-drawer](../../igloo-calendar/igl-blocked-date-drawer)
 - [igl-book-property](../../igloo-calendar/igl-book-property)
 - [igl-book-property-footer](../../igloo-calendar/igl-book-property/igl-book-property-footer)
 - [igl-book-property-header](../../igloo-calendar/igl-book-property/igl-book-property-header)
 - [igl-booking-event-hover](../../igloo-calendar/igl-booking-event-hover)
 - [igl-bulk-block](../../igloo-calendar/igl-bulk-operations/igl-bulk-block)
 - [igl-bulk-operations-drawer](../../igloo-calendar/igl-bulk-operations/igl-bulk-operations-drawer)
 - [igl-bulk-stop-sale](../../igloo-calendar/igl-bulk-operations/igl-bulk-stop-sale)
 - [igl-cal-header](../../igloo-calendar/igl-cal-header)
 - [igl-hk-issues-dialog](../../igloo-calendar/igl-cal-body/igl-hk-issues-dialog)
 - [igl-housekeeping-dialog](../../igloo-calendar/igl-cal-body/igl-housekeeping-dialog)
 - [igl-legend](../../igloo-calendar/igl-legend)
 - [igl-rate-extender-drawer](../../igloo-calendar/igl-rate-extender-drawer)
 - [igl-rate-plan](../../igloo-calendar/igl-book-property/igl-booking-overview-page/igl-room-type/igl-rate-plan)
 - [igl-reallocation-dialog](../../igloo-calendar/igl-reallocation-dialog)
 - [igl-split-booking-drawer](../../igloo-calendar/igl-split-booking-drawer)
 - [igl-to-be-assigned](../../igloo-calendar/igl-to-be-assigned)
 - [ir-actions-cell](../../table-cells/booking/ir-actions-cell)
 - [ir-agent-billing](../../ir-billing/ir-agent-billing)
 - [ir-agent-editor-drawer](../../ir-agents/ir-agent-editor-drawer)
 - [ir-agents](../../ir-agents)
 - [ir-agents-table](../../ir-agents/ir-agents-table)
 - [ir-applicable-policies](../../ir-booking-details/ir-payment-details/ir-applicable-policies)
 - [ir-arrival-time-dialog](../../ir-booking-details/ir-arrival-time-dialog/ir-arrival-time-dialog)
 - [ir-arrivals-table](../../ir-arrivals/ir-arrivals-table)
 - [ir-assignment-toggle-dialog](../../ir-booking-details/ir-assignment-toggle-dialog)
 - [ir-balance-cell](../../table-cells/booking/ir-balance-cell)
 - [ir-booking-city-ledger](../../ir-booking-details/ir-booking-city-ledger)
 - [ir-booking-company-dialog](../../ir-booking-company-dialog)
 - [ir-booking-details](../../ir-booking-details)
 - [ir-booking-editor-drawer](../../igloo-calendar/ir-booking-editor/ir-booking-editor-drawer)
 - [ir-booking-editor-form](../../igloo-calendar/ir-booking-editor/ir-booking-editor-form)
 - [ir-booking-editor-header](../../igloo-calendar/ir-booking-editor/ir-booking-editor-header)
 - [ir-booking-extra-note](../../ir-booking-details/ir-booking-extra-note)
 - [ir-booking-header](../../ir-booking-details/ir-booking-header)
 - [ir-booking-listing-mobile-card](../../ir-booking-listing/ir-booking-listing-mobile-card)
 - [ir-booking-listing-table](../../ir-booking-listing/ir-booking-listing-table)
 - [ir-booking-new-form](../../ir-booking-new-form)
 - [ir-booking-pricing-drawer](../../ir-booking-details/ir-room/ir-booking-pricing-drawer)
 - [ir-booking-rooms](../../ir-booking-details/ir-booking-rooms)
 - [ir-booking-source-editor-dialog](../../ir-booking-details/ir-booking-source-editor-dialog)
 - [ir-checkout-dialog](../../ir-checkout-dialog)
 - [ir-city-ledger-fiscal-documents-filters](../../ir-city-ledger/ir-city-ledger-fiscal-documents/ir-city-ledger-fiscal-documents-filters)
 - [ir-city-ledger-fiscal-documents-table](../../ir-city-ledger/ir-city-ledger-fiscal-documents/ir-city-ledger-fiscal-documents-table)
 - [ir-city-ledger-folio](../../ir-city-ledger/ir-city-ledger-folio)
 - [ir-city-ledger-folio-filters](../../ir-city-ledger/ir-city-ledger-folio/ir-city-ledger-folio-filters)
 - [ir-city-ledger-folio-table](../../ir-city-ledger/ir-city-ledger-folio/ir-city-ledger-folio-table)
 - [ir-city-ledger-statements](../../ir-city-ledger/ir-city-ledger-statements)
 - [ir-city-ledger-statements-filter](../../ir-city-ledger/ir-city-ledger-statements/ir-city-ledger-statements-filter)
 - [ir-city-ledger-toolbar](../../ir-city-ledger/ir-city-ledger-toolbar)
 - [ir-city-ledger-transaction-drawer](../../ir-city-ledger/ir-city-ledger-folio/ir-city-ledger-transaction-drawer)
 - [ir-cl-fiscal-document-preview](../../ir-city-ledger/ir-city-ledger-fiscal-documents/ir-cl-fiscal-document-preview)
 - [ir-cl-invoice-dialog](../../ir-city-ledger/ir-cl-invoice-dialog)
 - [ir-daily-revenue](../../ir-daily-revenue)
 - [ir-daily-revenue-filters](../../ir-daily-revenue/ir-daily-revenue-filters)
 - [ir-date-range-filter](../ir-date-range-filter)
 - [ir-departures-table](../../ir-departures/ir-departures-table)
 - [ir-extra-service](../../ir-booking-details/ir-extra-services/ir-extra-service)
 - [ir-extra-service-config](../../ir-booking-details/ir-extra-services/ir-extra-service-config)
 - [ir-extra-services](../../ir-booking-details/ir-extra-services)
 - [ir-fd-confirm-dialog](../../ir-city-ledger/ir-city-ledger-fiscal-documents/ir-city-ledger-fiscal-documents-table/ir-fd-confirm-dialog)
 - [ir-filter-card](../../ir-filter-card)
 - [ir-fiscal-documents-filters](../../ir-fiscal-documents/ir-fiscal-documents-filters)
 - [ir-fiscal-documents-table](../../ir-fiscal-documents/ir-fiscal-documents-table)
 - [ir-ghs-filters](../../ir-ghs-onboarding)
 - [ir-ghs-onboarding](../../ir-ghs-onboarding)
 - [ir-ghs-selection-bucket](../../ir-ghs-onboarding)
 - [ir-guest-billing](../../ir-billing/ir-guest-billing)
 - [ir-guest-info-drawer](../../ir-guest-info/ir-guest-info-drawer)
 - [ir-hb-preference-dialog](../../ir-booking-details/ir-room/ir-hb-preference-dialog)
 - [ir-hk-archive-drawer](../../ir-housekeeping/ir-hk-tasks/ir-hk-archive-drawer)
 - [ir-hk-delete-dialog](../../ir-housekeeping/ir-hk-delete-dialog)
 - [ir-hk-operations-card](../../ir-housekeeping/ir-hk-operations-card)
 - [ir-hk-staff-tasks](../../ir-housekeeping/ir-hk-staff-tasks)
 - [ir-hk-staff-tasks-header](../../ir-housekeeping/ir-hk-staff-tasks/ir-hk-staff-tasks-header)
 - [ir-hk-tasks](../../ir-housekeeping/ir-hk-tasks)
 - [ir-hk-team](../../ir-housekeeping/ir-hk-team)
 - [ir-hk-unassigned-units-drawer](../../ir-housekeeping/ir-hk-unassigned-units/ir-hk-unassigned-units-drawer)
 - [ir-hk-user-drawer](../../ir-housekeeping/ir-hk-user/ir-hk-user-drawer)
 - [ir-hk-user-drawer-form](../../ir-housekeeping/ir-hk-user/ir-hk-user-drawer/ir-hk-user-drawer-form)
 - [ir-hold-transaction-dialog](../../ir-city-ledger/ir-city-ledger-folio/ir-city-ledger-folio-table/ir-hold-transaction-dialog)
 - [ir-invoice](../../ir-invoice)
 - [ir-listing-header](../../ir-booking-listing/ir-listing-header)
 - [ir-meal-report](../../ir-meal-report)
 - [ir-meal-report-filters](../../ir-meal-report/ir-meal-report-filters)
 - [ir-monthly-bookings-report](../../ir-monthly-bookings-report)
 - [ir-monthly-bookings-report-filter](../../ir-monthly-bookings-report/ir-monthly-bookings-report-filter)
 - [ir-notifications](../../ir-notifications)
 - [ir-pagination](../../ir-pagination)
 - [ir-payment-details](../../ir-booking-details/ir-payment-details)
 - [ir-payment-folio](../../ir-booking-details/ir-payment-details/ir-payment-folio)
 - [ir-payments-folio](../../ir-booking-details/ir-payment-details/ir-payments-folio)
 - [ir-pickup](../../ir-booking-details/ir-pickup)
 - [ir-pickup-view](../../ir-booking-details/ir-pickup-view)
 - [ir-pms-logs](../../ir-booking-details/ir-booking-header/ir-pms-logs)
 - [ir-pms-page](../../pms-header/ir-pms-page)
 - [ir-preview-screen-dialog](../../ir-preview-screen-dialog)
 - [ir-queue-manager](../../ir-queue-manager)
 - [ir-reallocation-drawer](../../ir-reallocation-drawer)
 - [ir-reservation-information](../../ir-booking-details/ir-reservation-information)
 - [ir-reset-password](../../ir-reset-password)
 - [ir-revenue-row-details](../../ir-daily-revenue/ir-revenue-table/ir-revenue-row/ir-revenue-row-details)
 - [ir-room](../../ir-booking-details/ir-room)
 - [ir-room-guests](../../ir-booking-details/ir-room-guests)
 - [ir-sales-by-channel](../../ir-sales-by-channel)
 - [ir-sales-by-channel-filters](../../ir-sales-by-channel/ir-sales-by-channel-filters)
 - [ir-sales-by-channel-table](../../ir-sales-by-channel/ir-sales-by-channel-table)
 - [ir-sales-by-country](../../ir-sales-by-country)
 - [ir-sales-filters](../../ir-sales-by-country/ir-sales-filters)
 - [ir-sales-table](../../ir-sales-by-country/ir-sales-table)
 - [ir-tasks-card](../../ir-housekeeping/ir-hk-tasks/ir-tasks-table/ir-tasks-card)
 - [ir-tasks-filters](../../ir-housekeeping/ir-hk-tasks/ir-tasks-filters)
 - [ir-tasks-header](../../ir-housekeeping/ir-hk-tasks/ir-tasks-header)
 - [ir-tasks-table](../../ir-housekeeping/ir-hk-tasks/ir-tasks-table)
 - [ir-tax-service-categories](../../ir-tax-service-categories)
 - [ir-test2-cmp](../../ir-test-cmp)
 - [ir-unbookable-rooms-filters](../../ir-unbookable-rooms/ir-unbookable-rooms-filters)
 - [ir-user-form-panel-drawer](../../ir-user-management/ir-user-form-panel/ir-user-form-panel-drawer)
 - [ir-user-management-table](../../ir-user-management/ir-user-management-table)

### Graph
```mermaid
graph TD;
  igl-blocked-date-drawer --> ir-custom-button
  igl-book-property --> ir-custom-button
  igl-book-property-footer --> ir-custom-button
  igl-book-property-header --> ir-custom-button
  igl-booking-event-hover --> ir-custom-button
  igl-bulk-block --> ir-custom-button
  igl-bulk-operations-drawer --> ir-custom-button
  igl-bulk-stop-sale --> ir-custom-button
  igl-cal-header --> ir-custom-button
  igl-hk-issues-dialog --> ir-custom-button
  igl-housekeeping-dialog --> ir-custom-button
  igl-legend --> ir-custom-button
  igl-rate-extender-drawer --> ir-custom-button
  igl-rate-plan --> ir-custom-button
  igl-reallocation-dialog --> ir-custom-button
  igl-split-booking-drawer --> ir-custom-button
  igl-to-be-assigned --> ir-custom-button
  ir-actions-cell --> ir-custom-button
  ir-agent-billing --> ir-custom-button
  ir-agent-editor-drawer --> ir-custom-button
  ir-agents --> ir-custom-button
  ir-agents-table --> ir-custom-button
  ir-applicable-policies --> ir-custom-button
  ir-arrival-time-dialog --> ir-custom-button
  ir-arrivals-table --> ir-custom-button
  ir-assignment-toggle-dialog --> ir-custom-button
  ir-balance-cell --> ir-custom-button
  ir-booking-city-ledger --> ir-custom-button
  ir-booking-company-dialog --> ir-custom-button
  ir-booking-details --> ir-custom-button
  ir-booking-editor-drawer --> ir-custom-button
  ir-booking-editor-form --> ir-custom-button
  ir-booking-editor-header --> ir-custom-button
  ir-booking-extra-note --> ir-custom-button
  ir-booking-header --> ir-custom-button
  ir-booking-listing-mobile-card --> ir-custom-button
  ir-booking-listing-table --> ir-custom-button
  ir-booking-new-form --> ir-custom-button
  ir-booking-pricing-drawer --> ir-custom-button
  ir-booking-rooms --> ir-custom-button
  ir-booking-source-editor-dialog --> ir-custom-button
  ir-checkout-dialog --> ir-custom-button
  ir-city-ledger-fiscal-documents-filters --> ir-custom-button
  ir-city-ledger-fiscal-documents-table --> ir-custom-button
  ir-city-ledger-folio --> ir-custom-button
  ir-city-ledger-folio-filters --> ir-custom-button
  ir-city-ledger-folio-table --> ir-custom-button
  ir-city-ledger-statements --> ir-custom-button
  ir-city-ledger-statements-filter --> ir-custom-button
  ir-city-ledger-toolbar --> ir-custom-button
  ir-city-ledger-transaction-drawer --> ir-custom-button
  ir-cl-fiscal-document-preview --> ir-custom-button
  ir-cl-invoice-dialog --> ir-custom-button
  ir-daily-revenue --> ir-custom-button
  ir-daily-revenue-filters --> ir-custom-button
  ir-date-range-filter --> ir-custom-button
  ir-departures-table --> ir-custom-button
  ir-extra-service --> ir-custom-button
  ir-extra-service-config --> ir-custom-button
  ir-extra-services --> ir-custom-button
  ir-fd-confirm-dialog --> ir-custom-button
  ir-filter-card --> ir-custom-button
  ir-fiscal-documents-filters --> ir-custom-button
  ir-fiscal-documents-table --> ir-custom-button
  ir-ghs-filters --> ir-custom-button
  ir-ghs-onboarding --> ir-custom-button
  ir-ghs-selection-bucket --> ir-custom-button
  ir-guest-billing --> ir-custom-button
  ir-guest-info-drawer --> ir-custom-button
  ir-hb-preference-dialog --> ir-custom-button
  ir-hk-archive-drawer --> ir-custom-button
  ir-hk-delete-dialog --> ir-custom-button
  ir-hk-operations-card --> ir-custom-button
  ir-hk-staff-tasks --> ir-custom-button
  ir-hk-staff-tasks-header --> ir-custom-button
  ir-hk-tasks --> ir-custom-button
  ir-hk-team --> ir-custom-button
  ir-hk-unassigned-units-drawer --> ir-custom-button
  ir-hk-user-drawer --> ir-custom-button
  ir-hk-user-drawer-form --> ir-custom-button
  ir-hold-transaction-dialog --> ir-custom-button
  ir-invoice --> ir-custom-button
  ir-listing-header --> ir-custom-button
  ir-meal-report --> ir-custom-button
  ir-meal-report-filters --> ir-custom-button
  ir-monthly-bookings-report --> ir-custom-button
  ir-monthly-bookings-report-filter --> ir-custom-button
  ir-notifications --> ir-custom-button
  ir-pagination --> ir-custom-button
  ir-payment-details --> ir-custom-button
  ir-payment-folio --> ir-custom-button
  ir-payments-folio --> ir-custom-button
  ir-pickup --> ir-custom-button
  ir-pickup-view --> ir-custom-button
  ir-pms-logs --> ir-custom-button
  ir-pms-page --> ir-custom-button
  ir-preview-screen-dialog --> ir-custom-button
  ir-queue-manager --> ir-custom-button
  ir-reallocation-drawer --> ir-custom-button
  ir-reservation-information --> ir-custom-button
  ir-reset-password --> ir-custom-button
  ir-revenue-row-details --> ir-custom-button
  ir-room --> ir-custom-button
  ir-room-guests --> ir-custom-button
  ir-sales-by-channel --> ir-custom-button
  ir-sales-by-channel-filters --> ir-custom-button
  ir-sales-by-channel-table --> ir-custom-button
  ir-sales-by-country --> ir-custom-button
  ir-sales-filters --> ir-custom-button
  ir-sales-table --> ir-custom-button
  ir-tasks-card --> ir-custom-button
  ir-tasks-filters --> ir-custom-button
  ir-tasks-header --> ir-custom-button
  ir-tasks-table --> ir-custom-button
  ir-tax-service-categories --> ir-custom-button
  ir-test2-cmp --> ir-custom-button
  ir-unbookable-rooms-filters --> ir-custom-button
  ir-user-form-panel-drawer --> ir-custom-button
  ir-user-management-table --> ir-custom-button
  style ir-custom-button fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
