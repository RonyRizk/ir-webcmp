# ir-tasks-table



<!-- Auto Generated Below -->


## Properties

| Property | Attribute | Description | Type     | Default |
| -------- | --------- | ----------- | -------- | ------- |
| `tasks`  | --        |             | `Task[]` | `[]`    |


## Events

| Event                  | Description | Type                                                                                                 |
| ---------------------- | ----------- | ---------------------------------------------------------------------------------------------------- |
| `animateCleanedButton` |             | `CustomEvent<null>`                                                                                  |
| `rowSelectChange`      |             | `CustomEvent<Task[]>`                                                                                |
| `skipSelectedTask`     |             | `CustomEvent<Task>`                                                                                  |
| `sortingChanged`       |             | `CustomEvent<{ field: string; direction: "ASC" \| "DESC"; }>`                                        |
| `toast`                |             | `CustomEvent<ICustomToast & Partial<IToastWithButton> \| IDefaultToast & Partial<IToastWithButton>>` |


## Dependencies

### Used by

 - [ir-hk-tasks](..)

### Depends on

- [ir-tasks-header](../ir-tasks-header)
- [ir-tasks-card](ir-tasks-card)
- [ir-tasks-table-pagination](ir-tasks-table-pagination)
- [ir-custom-button](../../../ui/ir-custom-button)
- [ir-dialog](../../../ui/ir-dialog)

### Graph
```mermaid
graph TD;
  ir-tasks-table --> ir-tasks-header
  ir-tasks-table --> ir-tasks-card
  ir-tasks-table --> ir-tasks-table-pagination
  ir-tasks-table --> ir-custom-button
  ir-tasks-table --> ir-dialog
  ir-tasks-header --> ir-input
  ir-tasks-header --> ir-custom-button
  ir-tasks-card --> ir-custom-button
  ir-tasks-table-pagination --> ir-button
  ir-tasks-table-pagination --> ir-pagination
  ir-button --> ir-icons
  ir-pagination --> ir-select
  ir-pagination --> ir-custom-button
  ir-hk-tasks --> ir-tasks-table
  style ir-tasks-table fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
