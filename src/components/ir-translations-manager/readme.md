# ir-translations-manager



<!-- Auto Generated Below -->


## Properties

| Property     | Attribute    | Description                                                                       | Type     | Default     |
| ------------ | ------------ | --------------------------------------------------------------------------------- | -------- | ----------- |
| `propertyid` | `propertyid` | Owning property id, sent as OWNER_ID on every write.                              | `number` | `undefined` |
| `ticket`     | `ticket`     | Auth ticket for the Setup API, following the same pattern as other feature roots. | `string` | `undefined` |
| `userId`     | `user-id`    | Acting user id, sent as ENTRY_USER_ID on every write.                             | `number` | `undefined` |


## Dependencies

### Depends on

- [ir-autocomplete](../ui/ir-autocomplete)
- [ir-autocomplete-option](../ui/ir-autocomplete/ir-autocomplete-option)
- [ir-page](../ui/ir-page)
- [ir-spinner](../ui/ir-spinner)
- [ir-empty-state](../ir-empty-state)
- [ir-custom-button](../ui/ir-custom-button)
- [ir-translations-entries-panel](ir-translations-entries-panel)
- [ir-translations-entry-drawer](ir-translations-entry-drawer)
- [ir-translations-table-dialog](ir-translations-table-dialog)
- [ir-dialog](../ui/ir-dialog)

### Graph
```mermaid
graph TD;
  ir-translations-manager --> ir-autocomplete
  ir-translations-manager --> ir-autocomplete-option
  ir-translations-manager --> ir-page
  ir-translations-manager --> ir-spinner
  ir-translations-manager --> ir-empty-state
  ir-translations-manager --> ir-custom-button
  ir-translations-manager --> ir-translations-entries-panel
  ir-translations-manager --> ir-translations-entry-drawer
  ir-translations-manager --> ir-translations-table-dialog
  ir-translations-manager --> ir-dialog
  ir-autocomplete --> ir-input
  ir-page --> ir-interceptor
  ir-page --> ir-toast
  ir-interceptor --> ir-otp-modal
  ir-otp-modal --> ir-dialog
  ir-otp-modal --> ir-spinner
  ir-otp-modal --> ir-otp
  ir-otp-modal --> ir-custom-button
  ir-toast --> ir-toast-provider
  ir-toast-provider --> ir-toast-item
  ir-translations-entries-panel --> ir-custom-button
  ir-translations-entries-panel --> ir-spinner
  ir-translations-entries-panel --> ir-translations-entries-table
  ir-translations-entries-table --> ir-custom-button
  ir-translations-entries-table --> ir-empty-state
  ir-translations-entry-drawer --> ir-drawer
  ir-translations-entry-drawer --> ir-translations-entry-form
  ir-translations-entry-drawer --> ir-custom-button
  ir-translations-entry-form --> ir-input
  ir-translations-entry-form --> ir-custom-button
  ir-translations-entry-form --> ir-empty-state
  ir-translations-table-dialog --> ir-dialog
  ir-translations-table-dialog --> ir-translations-table-form
  ir-translations-table-dialog --> ir-custom-button
  ir-translations-table-form --> ir-input
  style ir-translations-manager fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
