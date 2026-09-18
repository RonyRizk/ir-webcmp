# igl-to-be-assigned

<!-- Auto Generated Below -->


## Properties

| Property       | Attribute    | Description | Type                      | Default     |
| -------------- | ------------ | ----------- | ------------------------- | ----------- |
| `calendarData` | --           |             | `{ [key: string]: any; }` | `undefined` |
| `propertyid`   | `propertyid` |             | `number`                  | `undefined` |


## Events

| Event                               | Description | Type                                                                        |
| ----------------------------------- | ----------- | --------------------------------------------------------------------------- |
| `addToBeAssignedEvent`              |             | `CustomEvent<{ key: "tobeAssignedEvents"; data: []; }>`                     |
| `highlightToBeAssignedBookingEvent` |             | `CustomEvent<{ key: "highlightBookingId"; data: { bookingId: string; }; }>` |
| `optionEvent`                       |             | `CustomEvent<{ key: string; data?: unknown; }>`                             |
| `showBookingPopup`                  |             | `CustomEvent<{ key: "calendar"; data: number; noScroll: boolean; }>`        |


## Dependencies

### Used by

 - [igloo-calendar](..)

### Depends on

- [ir-empty-state](../../ir-empty-state)
- [ir-spinner](../../ui/ir-spinner)
- [igl-tba-category-view](igl-tba-category-view)
- [ir-custom-button](../../ui/ir-custom-button)

### Graph
```mermaid
graph TD;
  igl-to-be-assigned --> ir-empty-state
  igl-to-be-assigned --> ir-spinner
  igl-to-be-assigned --> igl-tba-category-view
  igl-to-be-assigned --> ir-custom-button
  igl-tba-category-view --> igl-tba-booking-view
  igloo-calendar --> igl-to-be-assigned
  style igl-to-be-assigned fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
