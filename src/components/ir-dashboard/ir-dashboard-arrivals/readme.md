# ir-dashboard-arrivals

<!-- Auto Generated Below -->


## Overview

Arrivals panel of the dashboard: the existing arrivals table plus its check-in dialog.
Data lives in the arrivals store, loaded by the dashboard root as a single page, so there's no pagination.

## Properties

| Property      | Attribute      | Description                                                                        | Type         | Default     |
| ------------- | -------------- | ---------------------------------------------------------------------------------- | ------------ | ----------- |
| `countries`   | --             |                                                                                    | `ICountry[]` | `undefined` |
| `language`    | `language`     |                                                                                    | `string`     | `'en'`      |
| `pmsDisabled` | `pms-disabled` | Property without front desk: every arriving room in one list, no check-in actions. | `boolean`    | `false`     |


## Dependencies

### Used by

 - [ir-dashboard](..)

### Depends on

- [ir-arrivals-table](../../ir-arrivals/ir-arrivals-table)
- [ir-room-guests](../../ir-booking-details/ir-room-guests)

### Graph
```mermaid
graph TD;
  ir-dashboard-arrivals --> ir-arrivals-table
  ir-dashboard-arrivals --> ir-room-guests
  ir-arrivals-table --> ir-booking-number-cell
  ir-arrivals-table --> ir-booked-by-cell
  ir-arrivals-table --> ir-guest-name-cell
  ir-arrivals-table --> ir-unit-cell
  ir-arrivals-table --> ir-dates-cell
  ir-arrivals-table --> ir-balance-cell
  ir-arrivals-table --> ir-actions-cell
  ir-arrivals-table --> ir-empty-state
  ir-arrivals-table --> ir-custom-button
  ir-arrivals-table --> ir-pagination
  ir-unit-cell --> ir-unit-tag
  ir-balance-cell --> ir-custom-button
  ir-actions-cell --> ir-custom-button
  ir-pagination --> ir-custom-button
  ir-room-guests --> ir-drawer
  ir-room-guests --> ir-room-guests-form
  ir-room-guests --> ir-custom-button
  ir-room-guests-form --> ir-spinner
  ir-room-guests-form --> ir-validator
  ir-room-guests-form --> ir-input
  ir-room-guests-form --> ir-country-picker
  ir-country-picker --> ir-picker
  ir-country-picker --> ir-picker-item
  ir-country-picker --> ir-input-text
  ir-dashboard --> ir-dashboard-arrivals
  style ir-dashboard-arrivals fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
