# ir-nav



<!-- Auto Generated Below -->


## Properties

| Property     | Attribute | Description | Type                  | Default     |
| ------------ | --------- | ----------- | --------------------- | ----------- |
| `currencies` | --        |             | `ICurrency[]`         | `undefined` |
| `languages`  | --        |             | `IExposedLanguages[]` | `undefined` |
| `logo`       | `logo`    |             | `string`              | `undefined` |
| `website`    | `website` |             | `string`              | `undefined` |


## Dependencies

### Used by

 - [ir-booking-engine](..)

### Depends on

- [ir-language-picker](ir-language-picker)
- [ir-auth](ir-auth)
- [ir-booking-code](../ir-booking-page/ir-booking-code)
- [ir-button](../../ui/ir-button)
- [ir-icons](../../ui/ir-icons)
- [ir-sheet](../../ui/ir-sheet)
- [ir-dialog](../../ui/ir-dialog)

### Graph
```mermaid
graph TD;
  ir-nav --> ir-language-picker
  ir-nav --> ir-auth
  ir-nav --> ir-booking-code
  ir-nav --> ir-button
  ir-nav --> ir-icons
  ir-nav --> ir-sheet
  ir-nav --> ir-dialog
  ir-language-picker --> ir-select
  ir-language-picker --> ir-button
  ir-auth --> ir-signin
  ir-auth --> ir-signup
  ir-signin --> ir-badge-group
  ir-signin --> ir-input
  ir-signin --> ir-button
  ir-badge-group --> ir-icons
  ir-signup --> ir-input
  ir-signup --> ir-button
  ir-booking-code --> ir-input
  ir-booking-code --> ir-button
  ir-sheet --> ir-button
  ir-booking-engine --> ir-nav
  style ir-nav fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
