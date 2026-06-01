# ir-meal-report



<!-- Auto Generated Below -->


## Properties

| Property       | Attribute     | Description | Type                                                    | Default        |
| -------------- | ------------- | ----------- | ------------------------------------------------------- | -------------- |
| `fromDate`     | `from-date`   |             | `string`                                                | `undefined`    |
| `isLoading`    | `is-loading`  |             | `boolean`                                               | `false`        |
| `lcz`          | `lcz`         |             | `any`                                                   | `{}`           |
| `mealType`     | `meal-type`   |             | `string`                                                | `null`         |
| `reportType`   | `report-type` |             | `"GUEST_LIST" \| "MEAL_COUNT"`                          | `'GUEST_LIST'` |
| `setupEntries` | --            |             | `{ meal_type: IEntries[]; hb_preference: IEntries[]; }` | `undefined`    |
| `toDate`       | `to-date`     |             | `string`                                                | `undefined`    |


## Events

| Event              | Description | Type                                         |
| ------------------ | ----------- | -------------------------------------------- |
| `dateChange`       |             | `CustomEvent<{ from: string; to: string; }>` |
| `filterApply`      |             | `CustomEvent<void>`                          |
| `filterReset`      |             | `CustomEvent<void>`                          |
| `mealTypeChange`   |             | `CustomEvent<string>`                        |
| `presetDate`       |             | `CustomEvent<"today" \| "tomorrow">`         |
| `reportTypeChange` |             | `CustomEvent<"GUEST_LIST" \| "MEAL_COUNT">`  |


## Dependencies

### Used by

 - [ir-meal-report](.)

### Depends on

- [ir-custom-button](../ui/ir-custom-button)
- [ir-range-picker](../ir-housekeeping/ir-hk-tasks/ir-hk-archive/ir-range-picker)

### Graph
```mermaid
graph TD;
  ir-meal-report-filters --> ir-custom-button
  ir-meal-report-filters --> ir-range-picker
  ir-range-picker --> ir-date-picker
  ir-meal-report --> ir-meal-report-filters
  style ir-meal-report-filters fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
