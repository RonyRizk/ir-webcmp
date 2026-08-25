# igl-cal-header



<!-- Auto Generated Below -->


## Properties

| Property          | Attribute          | Description | Type                      | Default     |
| ----------------- | ------------------ | ----------- | ------------------------- | ----------- |
| `calendarData`    | --                 |             | `{ [key: string]: any; }` | `undefined` |
| `dayUseBookings`  | --                 |             | `DayUseBookings[]`        | `[]`        |
| `highlightedDate` | `highlighted-date` |             | `string`                  | `undefined` |
| `propertyid`      | `propertyid`       |             | `number`                  | `undefined` |
| `to_date`         | `to_date`          |             | `string`                  | `undefined` |
| `today`           | --                 |             | `String`                  | `undefined` |
| `unassignedDates` | `unassigned-dates` |             | `any`                     | `undefined` |


## Events

| Event                  | Description | Type                                   |
| ---------------------- | ----------- | -------------------------------------- |
| `gotoRoomEvent`        |             | `CustomEvent<{ [key: string]: any; }>` |
| `gotoToBeAssignedDate` |             | `CustomEvent<{ [key: string]: any; }>` |
| `optionEvent`          |             | `CustomEvent<{ [key: string]: any; }>` |


## Dependencies

### Used by

 - [igloo-calendar](..)

### Depends on

- [igl-cal-header-toolbar](igl-cal-header-toolbar)
- [igl-cal-header-days](igl-cal-header-days)

### Graph
```mermaid
graph TD;
  igl-cal-header --> igl-cal-header-toolbar
  igl-cal-header --> igl-cal-header-days
  igl-cal-header-toolbar --> ir-custom-button
  igl-cal-header-toolbar --> ir-date-select
  igl-cal-header-toolbar --> ir-picker
  igl-cal-header-toolbar --> ir-picker-item
  ir-date-select --> ir-input
  ir-date-select --> ir-air-date-picker
  igloo-calendar --> igl-cal-header
  style igl-cal-header fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
