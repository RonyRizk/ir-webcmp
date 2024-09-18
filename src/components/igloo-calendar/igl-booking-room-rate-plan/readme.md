# igl-booking-room-rate-plan



<!-- Auto Generated Below -->


## Properties

| Property                       | Attribute                      | Description | Type                      | Default          |
| ------------------------------ | ------------------------------ | ----------- | ------------------------- | ---------------- |
| `bookingType`                  | `booking-type`                 |             | `string`                  | `'PLUS_BOOKING'` |
| `currency`                     | `currency`                     |             | `any`                     | `undefined`      |
| `dateDifference`               | `date-difference`              |             | `number`                  | `undefined`      |
| `defaultData`                  | --                             |             | `{ [key: string]: any; }` | `undefined`      |
| `defaultRoomId`                | `default-room-id`              |             | `any`                     | `undefined`      |
| `fullyBlocked`                 | `fully-blocked`                |             | `boolean`                 | `undefined`      |
| `index`                        | `index`                        |             | `number`                  | `undefined`      |
| `isBookDisabled`               | `is-book-disabled`             |             | `boolean`                 | `false`          |
| `is_bed_configuration_enabled` | `is_bed_configuration_enabled` |             | `boolean`                 | `undefined`      |
| `physicalrooms`                | `physicalrooms`                |             | `any`                     | `undefined`      |
| `ratePlanData`                 | --                             |             | `{ [key: string]: any; }` | `undefined`      |
| `ratePricingMode`              | --                             |             | `any[]`                   | `[]`             |
| `selectedRoom`                 | `selected-room`                |             | `any`                     | `undefined`      |
| `shouldBeDisabled`             | `should-be-disabled`           |             | `boolean`                 | `undefined`      |
| `totalAvailableRooms`          | `total-available-rooms`        |             | `number`                  | `undefined`      |


## Events

| Event                   | Description | Type                                   |
| ----------------------- | ----------- | -------------------------------------- |
| `dataUpdateEvent`       |             | `CustomEvent<{ [key: string]: any; }>` |
| `gotoSplitPageTwoEvent` |             | `CustomEvent<{ [key: string]: any; }>` |


## Dependencies

### Used by

 - [igl-booking-rooms](../igl-booking-rooms)

### Depends on

- [ir-tooltip](../../ir-tooltip)

### Graph
```mermaid
graph TD;
  igl-booking-room-rate-plan --> ir-tooltip
  igl-booking-rooms --> igl-booking-room-rate-plan
  style igl-booking-room-rate-plan fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
