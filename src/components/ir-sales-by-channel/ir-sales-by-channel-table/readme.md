# ir-sales-by-channel-table



<!-- Auto Generated Below -->


## Properties

| Property            | Attribute | Description | Type                                                                                                                                                                                                                                                                                           | Default     |
| ------------------- | --------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| `allowedProperties` | --        |             | `{ name?: string; id?: number; }[]`                                                                                                                                                                                                                                                            | `undefined` |
| `mode`              | `mode`    |             | `"mpo" \| "property"`                                                                                                                                                                                                                                                                          | `undefined` |
| `records`           | --        |             | `{ currency?: string; NIGHTS?: number; PCT?: number; REVENUE?: number; SOURCE?: string; PROPERTY_ID?: number; PROPERTY_NAME?: string; last_year?: { currency?: string; NIGHTS?: number; PCT?: number; REVENUE?: number; SOURCE?: string; PROPERTY_ID?: number; PROPERTY_NAME?: string; }; }[]` | `undefined` |


## Dependencies

### Used by

 - [ir-sales-by-channel](..)

### Depends on

- [ir-empty-state](../../ir-empty-state)
- [ir-custom-button](../../ui/ir-custom-button)

### Graph
```mermaid
graph TD;
  ir-sales-by-channel-table --> ir-empty-state
  ir-sales-by-channel-table --> ir-custom-button
  ir-sales-by-channel --> ir-sales-by-channel-table
  style ir-sales-by-channel-table fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
