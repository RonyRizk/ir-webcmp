# ir-pms-search



<!-- Auto Generated Below -->


## Properties

| Property     | Attribute    | Description | Type     | Default     |
| ------------ | ------------ | ----------- | -------- | ----------- |
| `propertyid` | `propertyid` |             | `string` | `undefined` |
| `ticket`     | `ticket`     |             | `string` | `undefined` |


## Events

| Event             | Description | Type                                       |
| ----------------- | ----------- | ------------------------------------------ |
| `combobox-select` |             | `CustomEvent<IrComboboxSelectEventDetail>` |


## Dependencies

### Used by

 - [ir-pms-page](../ir-pms-page)

### Depends on

- [ir-picker](../../ui/ir-picker)
- [ir-picker-item](../../ui/ir-picker/ir-picker-item)

### Graph
```mermaid
graph TD;
  ir-pms-search --> ir-picker
  ir-pms-search --> ir-picker-item
  ir-pms-page --> ir-pms-search
  style ir-pms-search fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
