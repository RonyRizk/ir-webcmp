# ir-booking-summary



<!-- Auto Generated Below -->


## Properties

| Property    | Attribute    | Description | Type      | Default |
| ----------- | ------------ | ----------- | --------- | ------- |
| `isLoading` | `is-loading` |             | `boolean` | `false` |


## Events

| Event            | Description | Type                                   |
| ---------------- | ----------- | -------------------------------------- |
| `bookingClicked` |             | `CustomEvent<null>`                    |
| `routing`        |             | `CustomEvent<"booking" \| "checkout">` |


## Dependencies

### Used by

 - [ir-checkout-page](..)

### Depends on

- [ir-button](../../../ui/ir-button)
- [ir-checkbox](../../../ui/ir-checkbox)

### Graph
```mermaid
graph TD;
  ir-booking-summary --> ir-button
  ir-booking-summary --> ir-checkbox
  ir-checkout-page --> ir-booking-summary
  style ir-booking-summary fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
