# igl-cal-header-days



<!-- Auto Generated Below -->


## Overview

The `.headersContainer` sticky bar of `igl-cal-header`: the month row plus the per-day header
cells (unassigned-units badge, day title, occupancy percent). `.headersContainer`/`.headerCell`
and each cell's `data-date` (`YYYY-MM-DD`) attribute are read directly by `igloo-calendar.tsx`'s drag-bounds
calculation (`document.querySelectorAll('.headersContainer .headerCell')`) — do not rename them.

## Properties

| Property                | Attribute            | Description                                                                                                              | Type                          | Default     |
| ----------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------ | ----------------------------- | ----------- |
| `days`                  | --                   |                                                                                                                          | `DayInfo[]`                   | `[]`        |
| `highlightedDate`       | `highlighted-date`   |                                                                                                                          | `string`                      | `undefined` |
| `isVacationRental`      | `is-vacation-rental` |                                                                                                                          | `boolean`                     | `undefined` |
| `loadingDays`           | --                   | Days (keyed by `dayInfo.value`) whose unassigned-units fetch is still in flight; their badges breathe.                   | `{ [key: string]: boolean; }` | `{}`        |
| `monthsInfo`            | --                   |                                                                                                                          | `MonthInfo[]`                 | `[]`        |
| `today`                 | `today`              | `YYYY-MM-DD`                                                                                                             | `string`                      | `undefined` |
| `unassignedRoomsNumber` | --                   | Unassigned-unit counts keyed by `dayInfo.value` (`YYYY-MM-DD`), falling back to `dayInfo.unassigned_units_nbr` per cell. | `{ [key: string]: number; }`  | `{}`        |


## Events

| Event             | Description                                                                               | Type                             |
| ----------------- | ----------------------------------------------------------------------------------------- | -------------------------------- |
| `dayBadgeClicked` | Emitted only when a badge with a non-zero count is clicked — a zero-count badge is inert. | `CustomEvent<{ date: string; }>` |


## Dependencies

### Used by

 - [igl-cal-header](..)

### Graph
```mermaid
graph TD;
  igl-cal-header --> igl-cal-header-days
  style igl-cal-header-days fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
