# ir-reservation-information



<!-- Auto Generated Below -->


## Properties

| Property    | Attribute | Description | Type         | Default     |
| ----------- | --------- | ----------- | ------------ | ----------- |
| `booking`   | --        |             | `Booking`    | `undefined` |
| `countries` | --        |             | `ICountry[]` | `undefined` |


## Events

| Event         | Description | Type                                                                 |
| ------------- | ----------- | -------------------------------------------------------------------- |
| `openSidebar` |             | `CustomEvent<{ type: BookingDetailsSidebarEvents; payload?: any; }>` |


## Dependencies

### Used by

 - [ir-booking-details](..)

### Depends on

- [ir-label](../../ui/ir-label)
- [ir-tooltip](../../ui/ir-tooltip)
- [ir-icons](../../ui/ir-icons)
- [ir-button](../../ui/ir-button)
- [ota-label](../../ui/ota-label)

### Graph
```mermaid
graph TD;
  ir-reservation-information --> ir-label
  ir-reservation-information --> ir-tooltip
  ir-reservation-information --> ir-icons
  ir-reservation-information --> ir-button
  ir-reservation-information --> ota-label
  ir-button --> ir-icons
  ir-booking-details --> ir-reservation-information
  style ir-reservation-information fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
