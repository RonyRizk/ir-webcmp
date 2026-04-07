# ir-hk-team



<!-- Auto Generated Below -->


## Dependencies

### Used by

 - [ir-housekeeping](..)

### Depends on

- [ir-hk-unassigned-units](../ir-hk-unassigned-units)
- [ir-custom-button](../../ui/ir-custom-button)
- [ir-popover](../../ui/ir-popover)
- [ir-button](../../ui/ir-button)
- [ir-hk-user-drawer](../ir-hk-user/ir-hk-user-drawer)
- [ir-hk-unassigned-units-drawer](../ir-hk-unassigned-units/ir-hk-unassigned-units-drawer)
- [ir-hk-delete-dialog](../ir-hk-delete-dialog)

### Graph
```mermaid
graph TD;
  ir-hk-team --> ir-hk-unassigned-units
  ir-hk-team --> ir-custom-button
  ir-hk-team --> ir-popover
  ir-hk-team --> ir-button
  ir-hk-team --> ir-hk-user-drawer
  ir-hk-team --> ir-hk-unassigned-units-drawer
  ir-hk-team --> ir-hk-delete-dialog
  ir-hk-unassigned-units --> ir-select
  ir-hk-unassigned-units --> ir-title
  ir-hk-unassigned-units --> ir-button
  ir-title --> ir-icon
  ir-button --> ir-icons
  ir-hk-user-drawer --> ir-drawer
  ir-hk-user-drawer --> ir-hk-user-drawer-form
  ir-hk-user-drawer --> ir-custom-button
  ir-hk-user-drawer-form --> ir-custom-button
  ir-hk-user-drawer-form --> ir-validator
  ir-hk-user-drawer-form --> ir-input
  ir-hk-user-drawer-form --> ir-password-validator
  ir-hk-user-drawer-form --> ir-spinner
  ir-hk-user-drawer-form --> ir-mobile-input
  ir-password-validator --> requirement-check
  requirement-check --> ir-icons
  ir-mobile-input --> ir-input
  ir-hk-unassigned-units-drawer --> ir-drawer
  ir-hk-unassigned-units-drawer --> ir-hk-unassigned-units-drawer-form
  ir-hk-unassigned-units-drawer --> ir-custom-button
  ir-hk-unassigned-units-drawer-form --> ir-select
  ir-hk-delete-dialog --> ir-dialog
  ir-hk-delete-dialog --> ir-custom-button
  ir-housekeeping --> ir-hk-team
  style ir-hk-team fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
