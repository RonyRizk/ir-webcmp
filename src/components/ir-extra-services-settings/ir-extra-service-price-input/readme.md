# ir-extra-service-price-input



<!-- Auto Generated Below -->


## Properties

| Property       | Attribute       | Description                                                                                                                              | Type                                 | Default     |
| -------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | ----------- |
| `autoValidate` | `auto-validate` |                                                                                                                                          | `boolean`                            | `undefined` |
| `chargeRule`   | --              | Controlled charge rule value passed from the parent: `value` holds the price, `mode` holds the taxation mode code (Inclusive/Exclusive). | `{ value?: number; mode?: string; }` | `undefined` |
| `label`        | `label`         |                                                                                                                                          | `string`                             | `undefined` |
| `placeholder`  | `placeholder`   |                                                                                                                                          | `string`                             | `undefined` |


## Events

| Event         | Description | Type                                              |
| ------------- | ----------- | ------------------------------------------------- |
| `priceChange` |             | `CustomEvent<{ value?: number; mode?: string; }>` |


## Shadow Parts

| Part      | Description |
| --------- | ----------- |
| `"input"` |             |


## Dependencies

### Used by

 - [ir-extra-services-settings](..)

### Depends on

- [ir-validator](../../ui/ir-validator)
- [ir-input](../../ui/ir-input)

### Graph
```mermaid
graph TD;
  ir-extra-service-price-input --> ir-validator
  ir-extra-service-price-input --> ir-input
  ir-extra-services-settings --> ir-extra-service-price-input
  style ir-extra-service-price-input fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
