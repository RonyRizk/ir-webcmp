# ir-listing-header

<!-- Auto Generated Below -->


## Properties

| Property     | Attribute     | Description | Type     | Default     |
| ------------ | ------------- | ----------- | -------- | ----------- |
| `language`   | `language`    |             | `string` | `undefined` |
| `p`          | `p`           |             | `string` | `undefined` |
| `propertyId` | `property-id` |             | `number` | `undefined` |


## Events

| Event             | Description | Type                  |
| ----------------- | ----------- | --------------------- |
| `preventPageLoad` |             | `CustomEvent<string>` |


## Dependencies

### Used by

 - [ir-booking-listing](..)

### Depends on

- [ir-date-range-filter](../../ui/ir-date-range-filter)
- [ir-custom-button](../../ui/ir-custom-button)

### Graph
```mermaid
graph TD;
  ir-listing-header --> ir-date-range-filter
  ir-listing-header --> ir-custom-button
  ir-date-range-filter --> ir-date-select
  ir-date-range-filter --> ir-custom-button
  ir-date-select --> ir-input
  ir-date-select --> ir-air-date-picker
  ir-booking-listing --> ir-listing-header
  style ir-listing-header fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
