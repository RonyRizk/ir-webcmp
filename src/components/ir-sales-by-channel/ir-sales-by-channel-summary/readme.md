# ir-sales-by-channel-summary



<!-- Auto Generated Below -->


## Properties

| Property  | Attribute | Description | Type                                                                                                                                                                                                                                                                                           | Default |
| --------- | --------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| `records` | --        |             | `{ currency?: string; NIGHTS?: number; PCT?: number; REVENUE?: number; SOURCE?: string; PROPERTY_ID?: number; PROPERTY_NAME?: string; last_year?: { currency?: string; NIGHTS?: number; PCT?: number; REVENUE?: number; SOURCE?: string; PROPERTY_ID?: number; PROPERTY_NAME?: string; }; }[]` | `[]`    |


## Dependencies

### Used by

 - [ir-sales-by-channel](..)

### Depends on

- [ir-metric-card](../../ir-metric-card)

### Graph
```mermaid
graph TD;
  ir-sales-by-channel-summary --> ir-metric-card
  ir-sales-by-channel --> ir-sales-by-channel-summary
  style ir-sales-by-channel-summary fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
