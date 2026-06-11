# ir-cl-adjustment-fields



<!-- Auto Generated Below -->


## Properties

| Property               | Attribute    | Description | Type                               | Default     |
| ---------------------- | ------------ | ----------- | ---------------------------------- | ----------- |
| `bookingOptions`       | --           |             | `LinkedOption[]`                   | `[]`        |
| `entryType`            | `entry-type` |             | `"" \| "CR" \| "DB"`               | `''`        |
| `linkType`             | `link-type`  |             | `"BOOKING" \| "INVOICE" \| "NONE"` | `'NONE'`    |
| `linkedId`             | `linked-id`  |             | `string`                           | `undefined` |
| `unpaidInvoiceOptions` | --           |             | `LinkedOption[]`                   | `[]`        |


## Events

| Event         | Description | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fieldChange` |             | `CustomEvent<{ transactionType?: TransactionType; date?: string; amount?: string; taxId?: string; reference?: string; notes?: string; entryType?: "" \| "DB" \| "CR"; isCutover?: boolean; payment_type?: PaymentTypeOption; payment_method?: PaymentMethodOption; designation?: string; invoiceId?: string; onAccount?: boolean; serviceCategoryId?: string; linkType?: "NONE" \| "INVOICE" \| "BOOKING"; linkedId?: string; reason?: "" \| "ROUNDING_DIFFERENCE" \| "GOODWILL_CREDIT" \| "PRICE_MATCH" \| "COMMISSION_CORRECTION" \| "DISCOUNT_CORRECTION"; generatesFiscalDocument?: boolean; creditNoteMode?: "cancel-invoice" \| "goodwill"; }>` |


## Dependencies

### Used by

 - [ir-city-ledger-transaction-form](../..)

### Depends on

- [ir-validator](../../../../../../ui/ir-validator)

### Graph
```mermaid
graph TD;
  ir-cl-adjustment-fields --> ir-validator
  ir-city-ledger-transaction-form --> ir-cl-adjustment-fields
  style ir-cl-adjustment-fields fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
