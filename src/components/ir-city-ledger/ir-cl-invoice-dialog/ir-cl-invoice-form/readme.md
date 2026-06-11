# ir-cl-invoice-form



<!-- Auto Generated Below -->


## Methods

### `getValues() => Promise<CreateInvoiceFormValues>`



#### Returns

Type: `Promise<CreateInvoiceFormValues>`



### `validate() => Promise<boolean>`



#### Returns

Type: `Promise<boolean>`




## Dependencies

### Used by

 - [ir-cl-invoice-dialog](..)

### Depends on

- [ir-date-range-filter](../../../ui/ir-date-range-filter)

### Graph
```mermaid
graph TD;
  ir-cl-invoice-form --> ir-date-range-filter
  ir-date-range-filter --> ir-date-select
  ir-date-range-filter --> ir-custom-button
  ir-date-select --> ir-input
  ir-date-select --> ir-air-date-picker
  ir-cl-invoice-dialog --> ir-cl-invoice-form
  style ir-cl-invoice-form fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
