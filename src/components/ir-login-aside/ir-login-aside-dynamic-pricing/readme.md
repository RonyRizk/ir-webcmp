# ir-login-aside-dynamic-pricing



<!-- Auto Generated Below -->


## Properties

| Property        | Attribute | Description                                                                                                                                                                           | Type                       | Default |
| --------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- | ------- |
| `localeEntries` | --        | Translated labels from the host, keyed by `Lcz_*`. The `locales` store wins when it has a key; a key missing from both (or the whole object, until it arrives) falls back to English. | `{ [x: string]: string; }` | `null`  |


## Dependencies

### Used by

 - [ir-login-aside](..)
 - [ir-login-aside-showcase](../ir-login-aside-showcase)

### Graph
```mermaid
graph TD;
  ir-login-aside --> ir-login-aside-dynamic-pricing
  ir-login-aside-showcase --> ir-login-aside-dynamic-pricing
  style ir-login-aside-dynamic-pricing fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
