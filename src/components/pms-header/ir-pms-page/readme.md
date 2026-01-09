# ir-pms-page



<!-- Auto Generated Below -->


## Properties

| Property     | Attribute    | Description | Type     | Default     |
| ------------ | ------------ | ----------- | -------- | ----------- |
| `propertyid` | `propertyid` |             | `string` | `undefined` |
| `ticket`     | `ticket`     |             | `string` | `undefined` |


## Dependencies

### Depends on

- [ir-custom-button](../../ui/ir-custom-button)
- [ir-property-switcher](../ir-property-switcher)
- [ir-pms-search](../ir-pms-search)
- [ir-notifications](../../ir-notifications)
- [ir-menu-drawer](../ir-menu-drawer)
- [ir-menu](../ir-menu)
- [ir-menu-item](../ir-menu-item)
- [ir-menu-group](../ir-menu-group)

### Graph
```mermaid
graph TD;
  ir-pms-page --> ir-custom-button
  ir-pms-page --> ir-property-switcher
  ir-pms-page --> ir-pms-search
  ir-pms-page --> ir-notifications
  ir-pms-page --> ir-menu-drawer
  ir-pms-page --> ir-menu
  ir-pms-page --> ir-menu-item
  ir-pms-page --> ir-menu-group
  ir-property-switcher --> ir-custom-button
  ir-property-switcher --> ir-dialog
  ir-property-switcher --> ir-property-switcher-dialog-content
  ir-property-switcher-dialog-content --> ir-input
  ir-pms-search --> ir-picker
  ir-pms-search --> ir-picker-item
  ir-notifications --> ir-custom-button
  ir-notifications --> ir-empty-state
  ir-menu-drawer --> ir-drawer
  style ir-pms-page fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
