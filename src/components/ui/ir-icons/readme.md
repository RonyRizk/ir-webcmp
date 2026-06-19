# ir-icons

<!-- Auto Generated Below -->


## Properties

| Property       | Attribute        | Description                                                                                                                    | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Default     |
| -------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| `color`        | `color`          | Sets the `color` attribute on the `<svg>` element. Accepts any valid CSS color string.                                         | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | `undefined` |
| `name`         | `name`           | The name of the icon to render. Must match a key from the imported `icons` map.  Example: ```tsx <ir-icons name="check" /> ``` | `"angle-down" \| "angle-up" \| "angle_left" \| "angle_right" \| "angles_left" \| "angles_right" \| "arrow-right-from-bracket" \| "arrow-trend-down" \| "arrow-trend-up" \| "arrow_left" \| "arrow_right" \| "ban" \| "bell" \| "burger_menu" \| "calendar" \| "calendar-xmark" \| "check" \| "circle_check" \| "circle_info" \| "circle_plus" \| "clock" \| "closed_eye" \| "credit_card" \| "danger" \| "double_caret_left" \| "edit" \| "email" \| "envelope-circle-check" \| "eraser" \| "facebook" \| "file" \| "globe" \| "heart" \| "heart-fill" \| "home" \| "hotel" \| "instagram" \| "key" \| "menu_list" \| "minus" \| "note" \| "open_eye" \| "outline_user" \| "plus" \| "print" \| "reciept" \| "save" \| "search" \| "server" \| "square_plus" \| "trash" \| "twitter" \| "unlock" \| "user" \| "user_group" \| "whatsapp" \| "xmark" \| "xmark-fill" \| "youtube"` | `undefined` |
| `svgClassName` | `svg-class-name` | Additional CSS class applied to the `<svg>` element. Can be used for sizing, positioning, etc.                                 | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | `undefined` |


## Dependencies

### Used by

 - [ac-pages-menu](../../ac-pages-menu)
 - [igl-booking-event-hover](../../igloo-calendar/igl-booking-event-hover)
 - [ir-accordion](../ir-accordion)
 - [ir-applicable-policies](../../ir-booking-details/ir-payment-details/ir-applicable-policies)
 - [ir-button](../ir-button)
 - [ir-channel-general](../../ir-channel/ir-channel-general)
 - [ir-dropdown](../ir-dropdown)
 - [ir-login](../../ir-login)
 - [ir-payment-option](../../ir-payment-option)
 - [ir-stats-card](../ir-stats-card)
 - [requirement-check](../../ir-password-validator/requirement-check)

### Graph
```mermaid
graph TD;
  ac-pages-menu --> ir-icons
  igl-booking-event-hover --> ir-icons
  ir-accordion --> ir-icons
  ir-applicable-policies --> ir-icons
  ir-button --> ir-icons
  ir-channel-general --> ir-icons
  ir-dropdown --> ir-icons
  ir-login --> ir-icons
  ir-payment-option --> ir-icons
  ir-stats-card --> ir-icons
  requirement-check --> ir-icons
  style ir-icons fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
