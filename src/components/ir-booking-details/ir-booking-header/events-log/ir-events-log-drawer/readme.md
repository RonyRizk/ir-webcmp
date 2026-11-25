# ir-events-log-drawer



<!-- Auto Generated Below -->


## Overview

Side drawer showing a booking's events log (who did what, and when).

## Properties

| Property | Attribute | Description                                     | Type                    | Default     |
| -------- | --------- | ----------------------------------------------- | ----------------------- | ----------- |
| `events` | --        | Booking events, rendered in the order received. | `ExposedBookingEvent[]` | `[]`        |
| `open`   | `open`    | Controls whether the drawer is open.            | `boolean`               | `undefined` |


## Events

| Event                   | Description                                                                   | Type                                |
| ----------------------- | ----------------------------------------------------------------------------- | ----------------------------------- |
| `eventsLogDrawerClosed` | Emitted when the drawer is dismissed (close button, Escape or light dismiss). | `CustomEvent<{ source: Element; }>` |


## Dependencies

### Used by

 - [ir-booking-header](../..)

### Depends on

- [ir-drawer](../../../../ir-drawer)
- [ir-events-log](..)

### Graph
```mermaid
graph TD;
  ir-events-log-drawer --> ir-drawer
  ir-events-log-drawer --> ir-events-log
  ir-events-log --> ir-empty-state
  ir-booking-header --> ir-events-log-drawer
  style ir-events-log-drawer fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
