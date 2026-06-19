# ir-payment-folio-form

<!-- Auto Generated Below -->


## Properties

| Property               | Attribute        | Description | Type                                                                                                                                                                                                                                                                                                                      | Default                                                                                                                                         |
| ---------------------- | ---------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `booking` _(required)_ | --               |             | `Booking`                                                                                                                                                                                                                                                                                                                 | `undefined`                                                                                                                                     |
| `bookingNumber`        | `booking-number` |             | `string`                                                                                                                                                                                                                                                                                                                  | `undefined`                                                                                                                                     |
| `formId`               | `form-id`        |             | `string`                                                                                                                                                                                                                                                                                                                  | `undefined`                                                                                                                                     |
| `mode`                 | `mode`           |             | `"edit" \| "new" \| "payment-action"`                                                                                                                                                                                                                                                                                     | `undefined`                                                                                                                                     |
| `payment`              | --               |             | `{ id: number; date: string; reference: string; system_id?: number; amount: number; currency: ICurrency; designation: string; book_nbr?: string; payment_gateway_code?: number; payment_type?: PaymentType; payment_method?: PaymentType; receipt_nbr?: string; is_receipt_issued?: boolean; is_city_ledger?: boolean; }` | `{     date: moment().format(DATE_FORMAT),     amount: 0,     designation: undefined,     currency: null,     reference: null,     id: -1,   }` |
| `paymentEntries`       | --               |             | `{ types: IEntries[]; groups: IEntries[]; methods: IEntries[]; }`                                                                                                                                                                                                                                                         | `undefined`                                                                                                                                     |


## Events

| Event                               | Description | Type                                    |
| ----------------------------------- | ----------- | --------------------------------------- |
| `closeModal`                        |             | `CustomEvent<null>`                     |
| `loadingChanged`                    |             | `CustomEvent<"save" \| "save-print">`   |
| `resetBookingEvt`                   |             | `CustomEvent<null>`                     |
| `resetExposedCancellationDueAmount` |             | `CustomEvent<"booking_nbr" \| Booking>` |


## Dependencies

### Used by

 - [ir-payment-folio](..)

### Depends on

- [ir-date-select](../../../../ui/date-picker/ir-date-select)
- [ir-validator](../../../../ui/ir-validator)
- [ir-input](../../../../ui/ir-input)

### Graph
```mermaid
graph TD;
  ir-payment-folio-form --> ir-date-select
  ir-payment-folio-form --> ir-validator
  ir-payment-folio-form --> ir-input
  ir-date-select --> ir-input
  ir-date-select --> ir-air-date-picker
  ir-payment-folio --> ir-payment-folio-form
  style ir-payment-folio-form fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
