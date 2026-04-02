# ir-hk-staff-tasks



<!-- Auto Generated Below -->


## Properties

| Property   | Attribute  | Description | Type     | Default     |
| ---------- | ---------- | ----------- | -------- | ----------- |
| `baseurl`  | `baseurl`  |             | `string` | `undefined` |
| `language` | `language` |             | `string` | `'en'`      |
| `ticket`   | `ticket`   |             | `string` | `undefined` |


## Dependencies

### Depends on

- [ir-loading-screen](../../ir-loading-screen)
- [ir-hk-staff-tasks-header](ir-hk-staff-tasks-header)
- [ir-hk-staff-task](ir-hk-staff-task)
- [ir-dialog](../../ui/ir-dialog)
- [ir-custom-button](../../ui/ir-custom-button)

### Graph
```mermaid
graph TD;
  ir-hk-staff-tasks --> ir-loading-screen
  ir-hk-staff-tasks --> ir-hk-staff-tasks-header
  ir-hk-staff-tasks --> ir-hk-staff-task
  ir-hk-staff-tasks --> ir-dialog
  ir-hk-staff-tasks --> ir-custom-button
  ir-hk-staff-tasks-header --> ir-custom-button
  style ir-hk-staff-tasks fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
