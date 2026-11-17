# ir-login-aside-showcase



<!-- Auto Generated Below -->


## Properties

| Property        | Attribute | Description                                                                                                   | Type                       | Default |
| --------------- | --------- | ------------------------------------------------------------------------------------------------------------- | -------------------------- | ------- |
| `localeEntries` | --        | Host-provided `Lcz_*` translations, passed through to the slides. The `locales` store wins when it has a key. | `{ [x: string]: string; }` | `null`  |


## Dependencies

### Used by

 - [ir-login-aside](..)

### Depends on

- [ir-login-aside-calendar](../ir-login-aside-calendar)
- [ir-login-aside-dynamic-pricing](../ir-login-aside-dynamic-pricing)

### Graph
```mermaid
graph TD;
  ir-login-aside-showcase --> ir-login-aside-calendar
  ir-login-aside-showcase --> ir-login-aside-dynamic-pricing
  ir-login-aside --> ir-login-aside-showcase
  style ir-login-aside-showcase fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
