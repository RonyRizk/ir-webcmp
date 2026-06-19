# ir-date-select

<!-- Auto Generated Below -->


## Properties

| Property                | Attribute                 | Description                                                                                                                                                                                                                                                                            | Type                | Default        |
| ----------------------- | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- | -------------- |
| `autoClose`             | `auto-close`              | Closes the picker automatically after a date is selected.                                                                                                                                                                                                                              | `boolean`           | `true`         |
| `container`             | --                        | Pass a container element if you need the date picker to be appended to a specific element for styling or positioning (particularly for arrow rendering). If not provided, it defaults to `this.el`.                                                                                    | `HTMLElement`       | `undefined`    |
| `customPicker`          | `custom-picker`           | Controls how the date picker is triggered. - **`true`**: The picker can be triggered by custom UI elements (provided via a `<slot name="trigger">`). - **`false`**: A default button input is used to open the picker.  Defaults to `false`.                                           | `boolean`           | `false`        |
| `date`                  | `date`                    | The initially selected date; can be a `Date` object or a string recognized by `AirDatepicker`.                                                                                                                                                                                         | `Moment \| string`  | `null`         |
| `dateFormat`            | `date-format`             | Format for the date as it appears in the input field. Follows the `AirDatepicker` format rules.                                                                                                                                                                                        | `string`            | `'yyyy-MM-dd'` |
| `dates`                 | --                        |                                                                                                                                                                                                                                                                                        | `string[]`          | `undefined`    |
| `disabled`              | `disabled`                | Disables the input and prevents interaction.                                                                                                                                                                                                                                           | `boolean`           | `false`        |
| `emitEmptyDate`         | `emit-empty-date`         | If `true`, the component will emit a `dateChanged` event when the selected date becomes empty (null). Otherwise, empty-date changes will be ignored (no event emitted).  Defaults to `false`.                                                                                          | `boolean`           | `false`        |
| `forceDestroyOnUpdate`  | `force-destroy-on-update` | If `true`, the date picker instance is destroyed and rebuilt each time the `date` prop changes. This can be useful if you need the picker to fully re-initialize in response to dynamic changes, but note that it may affect performance if triggered frequently. Defaults to `false`. | `boolean`           | `false`        |
| `inline`                | `inline`                  | Determines whether the date picker is rendered inline or in a pop-up. If `true`, the picker is always visible inline.                                                                                                                                                                  | `boolean`           | `false`        |
| `label`                 | `label`                   |                                                                                                                                                                                                                                                                                        | `string`            | `undefined`    |
| `maxDate`               | `max-date`                | The latest date that can be selected.                                                                                                                                                                                                                                                  | `Moment \| string`  | `undefined`    |
| `minDate`               | `min-date`                | The earliest date that can be selected.                                                                                                                                                                                                                                                | `Moment \| string`  | `undefined`    |
| `multipleDates`         | `multiple-dates`          | Enables multiple dates. If `true`, multiple selection is allowed. If you pass a number (e.g. 3), that is the maximum number of selectable dates.                                                                                                                                       | `boolean \| number` | `false`        |
| `placeholder`           | `placeholder`             |                                                                                                                                                                                                                                                                                        | `string`            | `undefined`    |
| `range`                 | `range`                   | Whether the picker should allow range selection (start and end date).                                                                                                                                                                                                                  | `boolean`           | `false`        |
| `selectOtherMonths`     | `select-other-months`     | Allows selecting days from previous/next month shown in the current view.                                                                                                                                                                                                              | `boolean`           | `true`         |
| `showOtherMonths`       | `show-other-months`       | Shows days from previous/next month in the current month's calendar.                                                                                                                                                                                                                   | `boolean`           | `true`         |
| `timepicker`            | `timepicker`              | Enables the timepicker functionality (select hours and minutes).                                                                                                                                                                                                                       | `boolean`           | `false`        |
| `triggerContainerStyle` | `trigger-container-style` | Styles for the trigger container                                                                                                                                                                                                                                                       | `string`            | `''`           |
| `withClear`             | `with-clear`              |                                                                                                                                                                                                                                                                                        | `boolean`           | `undefined`    |


## Events

| Event             | Description | Type                                           |
| ----------------- | ----------- | ---------------------------------------------- |
| `dateChanged`     |             | `CustomEvent<{ start: Moment; end: Moment; }>` |
| `datePickerBlur`  |             | `CustomEvent<void>`                            |
| `datePickerFocus` |             | `CustomEvent<void>`                            |


## Methods

### `clear() => Promise<void>`



#### Returns

Type: `Promise<void>`



### `hide() => Promise<void>`



#### Returns

Type: `Promise<void>`



### `show() => Promise<void>`



#### Returns

Type: `Promise<void>`




## Shadow Parts

| Part         | Description |
| ------------ | ----------- |
| `"anchor"`   |             |
| `"base"`     |             |
| `"body"`     |             |
| `"combobox"` |             |


## Dependencies

### Used by

 - [igl-bulk-block](../../../igloo-calendar/igl-bulk-operations/igl-bulk-block)
 - [igl-bulk-stop-sale](../../../igloo-calendar/igl-bulk-operations/igl-bulk-stop-sale)
 - [igl-cal-header](../../../igloo-calendar/igl-cal-header)
 - [ir-arrivals-filters](../../../ir-arrivals/ir-arrivals-filters)
 - [ir-city-ledger-transaction-form](../../../ir-city-ledger/ir-city-ledger-folio/ir-city-ledger-transaction-drawer/ir-city-ledger-transaction-form)
 - [ir-date-range-filter](../../ir-date-range-filter)
 - [ir-departures-filter](../../../ir-departures/ir-departures-filter)
 - [ir-extra-service-config-form](../../../ir-booking-details/ir-extra-services/ir-extra-service-config/ir-extra-service-config-form)
 - [ir-invoice-form](../../../ir-invoice/ir-invoice-form)
 - [ir-payment-folio-form](../../../ir-booking-details/ir-payment-details/ir-payment-folio/ir-payment-folio-form)
 - [ir-pickup-form](../../../ir-booking-details/ir-pickup/ir-pickup-form)
 - [ir-rectifier](../../../igloo-calendar/igl-bulk-operations/ir-rectifier)

### Depends on

- [ir-input](../../ir-input)
- [ir-air-date-picker](../ir-air-date-picker)

### Graph
```mermaid
graph TD;
  ir-date-select --> ir-input
  ir-date-select --> ir-air-date-picker
  igl-bulk-block --> ir-date-select
  igl-bulk-stop-sale --> ir-date-select
  igl-cal-header --> ir-date-select
  ir-arrivals-filters --> ir-date-select
  ir-city-ledger-transaction-form --> ir-date-select
  ir-date-range-filter --> ir-date-select
  ir-departures-filter --> ir-date-select
  ir-extra-service-config-form --> ir-date-select
  ir-invoice-form --> ir-date-select
  ir-payment-folio-form --> ir-date-select
  ir-pickup-form --> ir-date-select
  ir-rectifier --> ir-date-select
  style ir-date-select fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
