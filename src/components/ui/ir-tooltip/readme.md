# ir-tooltip



<!-- Auto Generated Below -->


## Properties

| Property         | Attribute         | Description                                                                                                                                                                                                                                                                                                                                                                              | Type                           | Default     |
| ---------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | ----------- |
| `alignment`      | `alignment`       | Defines the horizontal alignment of the tooltip trigger content.  - `'start'`: Aligns the trigger to the left within its container. - `'center'`: Centers the trigger horizontally (default). - `'end'`: Aligns the trigger to the right within its container.  This alignment affects how the trigger (e.g., icon or slotted element) is positioned inside the outer tooltip container. | `"center" \| "end" \| "start"` | `'center'`  |
| `containerClass` | `container-class` | CSS classes applied to the outer tooltip container.                                                                                                                                                                                                                                                                                                                                      | `string`                       | `undefined` |
| `containerStyle` | --                | Inline styles applied to the outer tooltip container.                                                                                                                                                                                                                                                                                                                                    | `{ [key: string]: string; }`   | `undefined` |
| `customSlot`     | `custom-slot`     | When true, allows a custom element to trigger the tooltip using a named slot. If false, a default info icon is used.                                                                                                                                                                                                                                                                     | `boolean`                      | `false`     |
| `message`        | `message`         | Text or HTML content to be displayed in the tooltip.                                                                                                                                                                                                                                                                                                                                     | `string`                       | `undefined` |
| `withHtml`       | `with-html`       | Whether the tooltip content should be rendered using `innerHTML`. If false, treats message as plain text.                                                                                                                                                                                                                                                                                | `boolean`                      | `true`      |


## Dependencies

### Used by

 - [igl-application-info](../../igloo-calendar/igl-book-property/igl-booking-form/igl-application-info)
 - [igl-property-booked-by](../../igloo-calendar/igl-book-property/igl-booking-form/igl-property-booked-by)
 - [igl-rate-plan](../../igloo-calendar/igl-book-property/igl-booking-overview-page/igl-room-type/igl-rate-plan)
 - [ir-booking-listing](../../ir-booking-listing)
 - [ir-hk-archive](../../ir-housekeeping/ir-hk-tasks/ir-hk-archive)
 - [ir-monthly-bookings-report-table](../../ir-monthly-bookings-report/ir-monthly-bookings-report-table)
 - [ir-reservation-information](../../ir-booking-details/ir-reservation-information)
 - [ir-room](../../ir-booking-details/ir-room)

### Graph
```mermaid
graph TD;
  igl-application-info --> ir-tooltip
  igl-property-booked-by --> ir-tooltip
  igl-rate-plan --> ir-tooltip
  ir-booking-listing --> ir-tooltip
  ir-hk-archive --> ir-tooltip
  ir-monthly-bookings-report-table --> ir-tooltip
  ir-reservation-information --> ir-tooltip
  ir-room --> ir-tooltip
  style ir-tooltip fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
