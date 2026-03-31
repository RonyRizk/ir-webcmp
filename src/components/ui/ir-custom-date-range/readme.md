# ir-date-range



<!-- Auto Generated Below -->


## Properties

| Property        | Attribute       | Description | Type             | Default                      |
| --------------- | --------------- | ----------- | ---------------- | ---------------------------- |
| `dateModifiers` | --              |             | `IDateModifiers` | `undefined`                  |
| `fromDate`      | --              |             | `Moment`         | `null`                       |
| `locale`        | `locale`        |             | `string`         | `'en'`                       |
| `maxDate`       | --              |             | `Moment`         | `moment().add(24, 'years')`  |
| `maxSpanDays`   | `max-span-days` |             | `number`         | `90`                         |
| `minDate`       | --              |             | `Moment`         | `moment().add(-24, 'years')` |
| `showPrice`     | `show-price`    |             | `boolean`        | `false`                      |
| `toDate`        | --              |             | `Moment`         | `null`                       |


## Events

| Event        | Description | Type                                       |
| ------------ | ----------- | ------------------------------------------ |
| `dateChange` |             | `CustomEvent<{ start: Date; end: Date; }>` |


## Dependencies

### Used by

 - [igl-date-range](../../igloo-calendar/igl-date-range)

### Graph
```mermaid
graph TD;
  igl-date-range --> ir-custom-date-range
  style ir-custom-date-range fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
