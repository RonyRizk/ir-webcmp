# ir-password-validator



<!-- Auto Generated Below -->


## Properties

| Property   | Attribute  | Description                     | Type     | Default |
| ---------- | ---------- | ------------------------------- | -------- | ------- |
| `password` | `password` | The password string to validate | `string` | `''`    |


## Events

| Event                      | Description | Type                   |
| -------------------------- | ----------- | ---------------------- |
| `passwordValidationChange` |             | `CustomEvent<boolean>` |


## Dependencies

### Depends on

- [requirement-check](requirement-check)

### Graph
```mermaid
graph TD;
  ir-password-validator --> requirement-check
  requirement-check --> ir-icons
  style ir-password-validator fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
