# ir-delete-modal



<!-- Auto Generated Below -->


## Properties

| Property | Attribute | Description | Type            | Default     |
| -------- | --------- | ----------- | --------------- | ----------- |
| `user`   | --        |             | `IHouseKeepers` | `undefined` |


## Events

| Event         | Description | Type                  |
| ------------- | ----------- | --------------------- |
| `modalClosed` |             | `CustomEvent<null>`   |
| `resetData`   |             | `CustomEvent<string>` |


## Methods

### `closeModal() => Promise<void>`



#### Returns

Type: `Promise<void>`



### `openModal() => Promise<void>`



#### Returns

Type: `Promise<void>`




## Dependencies

### Used by

 - [ir-hk-team](../ir-hk-team)

### Depends on

- [ir-dialog](../../ui/ir-dialog)
- [ir-custom-button](../../ui/ir-custom-button)

### Graph
```mermaid
graph TD;
  ir-hk-delete-dialog --> ir-dialog
  ir-hk-delete-dialog --> ir-custom-button
  ir-hk-team --> ir-hk-delete-dialog
  style ir-hk-delete-dialog fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
