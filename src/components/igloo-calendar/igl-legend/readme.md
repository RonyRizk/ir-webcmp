# igl-legends



<!-- Auto Generated Below -->


## Properties

| Property     | Attribute | Description | Type                      | Default     |
| ------------ | --------- | ----------- | ------------------------- | ----------- |
| `legendData` | --        |             | `{ [key: string]: any; }` | `undefined` |


## Events

| Event         | Description | Type                                   |
| ------------- | ----------- | -------------------------------------- |
| `optionEvent` |             | `CustomEvent<{ [key: string]: any; }>` |


## Dependencies

### Used by

 - [igloo-calendar](..)

### Depends on

- [ir-custom-button](../../ui/ir-custom-button)
- [ir-success-loader](../../ui/ir-success-loader)

### Graph
```mermaid
graph TD;
  igl-legend --> ir-custom-button
  igl-legend --> ir-success-loader
  igloo-calendar --> igl-legend
  style igl-legend fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
