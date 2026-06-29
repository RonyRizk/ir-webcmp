# ir-cl-invoice-select



<!-- Auto Generated Below -->


## Properties

| Property          | Attribute | Description | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Default     |
| ----------------- | --------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| `fiscalDocuments` | --        |             | `{ DOC_NUMBER?: string; FD_TYPE_CODE?: string; CURRENCY_ID?: number; TOTAL_AMOUNT?: number; CREDIT?: number; DEBIT?: number; NET_AMOUNT?: number; TAX_AMOUNT?: number; FROM_DATE?: string; TO_DATE?: string; BOOK_NBR?: string; AGENCY_ID?: number; AGENCY_NAME?: string; CREDIT_DISPLAY?: string; CURRENCY_CODE?: string; DEBIT_DISPLAY?: string; EXTERNAL_REF?: string; FD_ID?: number; FD_STATUS_CODE?: string; FD_STATUS_NAME?: string; FD_TYPE_NAME?: string; ISSUE_DATE?: string; ISSUE_DATE_DISPLAY?: string; IS_PRINTED?: boolean; NET_AMOUNT_DISPLAY?: string; TAX_AMOUNT_DISPLAY?: string; BALANCE_BEFORE_TX?: number; BALANCE_AFTER_TX?: number; }[]` | `[]`        |
| `hint`            | `hint`    |             | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | `''`        |
| `label`           | `label`   |             | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | `'Invoice'` |
| `value`           | `value`   |             | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | `''`        |


## Events

| Event           | Description | Type                  |
| --------------- | ----------- | --------------------- |
| `invoiceChange` |             | `CustomEvent<string>` |


## Dependencies

### Used by

 - [ir-cl-credit-note-fields](../ir-cl-credit-note-fields)
 - [ir-cl-debit-note-fields](../ir-cl-debit-note-fields)

### Depends on

- [ir-validator](../../../../../../ui/ir-validator)

### Graph
```mermaid
graph TD;
  ir-cl-invoice-select --> ir-validator
  ir-cl-credit-note-fields --> ir-cl-invoice-select
  ir-cl-debit-note-fields --> ir-cl-invoice-select
  style ir-cl-invoice-select fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
