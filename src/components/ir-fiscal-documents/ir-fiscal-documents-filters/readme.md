# ir-fiscal-documents-filters



<!-- Auto Generated Below -->


## Properties

| Property     | Attribute     | Description | Type                    | Default                                                                                                                                                                                                  |
| ------------ | ------------- | ----------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `filters`    | --            |             | `FiscalDocumentFilters` | `{     fromDate: undefined,     toDate: undefined,     docNumber: '',     taxableOnly: false,     type: 'all',     proformaOnly: false,     folioType: 'all',     agentId: null,     guestId: null,   }` |
| `propertyId` | `property-id` |             | `number`                | `undefined`                                                                                                                                                                                              |


## Events

| Event           | Description | Type                                 |
| --------------- | ----------- | ------------------------------------ |
| `applyFilters`  |             | `CustomEvent<FiscalDocumentFilters>` |
| `filtersChange` |             | `CustomEvent<FiscalDocumentFilters>` |


## Dependencies

### Used by

 - [ir-fiscal-documents](..)

### Depends on

- [ir-validator](../../ui/ir-validator)
- [ir-date-range-filter](../../ui/ir-date-range-filter)
- [ir-autocomplete](../../ui/ir-autocomplete)
- [ir-autocomplete-option](../../ui/ir-autocomplete/ir-autocomplete-option)
- [ir-picker](../../ui/ir-picker)
- [ir-picker-item](../../ui/ir-picker/ir-picker-item)
- [ir-input](../../ui/ir-input)
- [ir-custom-button](../../ui/ir-custom-button)

### Graph
```mermaid
graph TD;
  ir-fiscal-documents-filters --> ir-validator
  ir-fiscal-documents-filters --> ir-date-range-filter
  ir-fiscal-documents-filters --> ir-autocomplete
  ir-fiscal-documents-filters --> ir-autocomplete-option
  ir-fiscal-documents-filters --> ir-picker
  ir-fiscal-documents-filters --> ir-picker-item
  ir-fiscal-documents-filters --> ir-input
  ir-fiscal-documents-filters --> ir-custom-button
  ir-date-range-filter --> ir-date-select
  ir-date-range-filter --> ir-custom-button
  ir-date-select --> ir-input
  ir-date-select --> ir-air-date-picker
  ir-autocomplete --> ir-input
  ir-fiscal-documents --> ir-fiscal-documents-filters
  style ir-fiscal-documents-filters fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
