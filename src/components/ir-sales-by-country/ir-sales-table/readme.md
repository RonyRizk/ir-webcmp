# ir-sales-table



<!-- Auto Generated Below -->


## Properties

| Property          | Attribute | Description | Type                                            | Default     |
| ----------------- | --------- | ----------- | ----------------------------------------------- | ----------- |
| `mappedCountries` | --        |             | `Map<number, Pick<ICountry, "name" \| "flag">>` | `undefined` |
| `records`         | --        |             | `SalesRecord[]`                                 | `[]`        |


## Dependencies

### Used by

 - [ir-sales-by-country](..)

### Depends on

- [ir-empty-state](../../ir-empty-state)
- [ir-custom-button](../../ui/ir-custom-button)

### Graph
```mermaid
graph TD;
  ir-sales-table --> ir-empty-state
  ir-sales-table --> ir-custom-button
  ir-sales-by-country --> ir-sales-table
  style ir-sales-table fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
