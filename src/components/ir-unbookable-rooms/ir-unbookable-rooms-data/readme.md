# ir-unbookable-rooms-data



<!-- Auto Generated Below -->


## Properties

| Property            | Attribute       | Description | Type                                                                                                                                                                                                                                                                                                                 | Default                                                          |
| ------------------- | --------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `allowedProperties` | --              |             | `{ name?: string; id?: number; }[]`                                                                                                                                                                                                                                                                                  | `null`                                                           |
| `errorMessage`      | `error-message` |             | `string`                                                                                                                                                                                                                                                                                                             | `''`                                                             |
| `filters`           | --              |             | `{ period_to_check: number; consecutive_period: number; country: string; }`                                                                                                                                                                                                                                          | `{ period_to_check: 2, consecutive_period: 14, country: 'all' }` |
| `isLoading`         | `is-loading`    |             | `boolean`                                                                                                                                                                                                                                                                                                            | `false`                                                          |
| `mode`              | `mode`          |             | `"default" \| "mpo"`                                                                                                                                                                                                                                                                                                 | `'default'`                                                      |
| `progressFilters`   | --              |             | `{ period_to_check: number; consecutive_period: number; }`                                                                                                                                                                                                                                                           | `{ period_to_check: 2, consecutive_period: 14 }`                 |
| `unbookableRooms`   | --              |             | `{ first_night_not_bookable: string; property_id: number; room_type_id: number; room_type_name: string; total_room_types_nbr: number; aname: string; country: { cities: null; code: null; currency: null; flag: null; gmt_offset: number; id: number; market_places: null; name: string; phone_prefix: null; }; }[]` | `[]`                                                             |


## Dependencies

### Used by

 - [ir-unbookable-rooms](..)

### Depends on

- [ir-input](../../ui/ir-input)

### Graph
```mermaid
graph TD;
  ir-unbookable-rooms-data --> ir-input
  ir-unbookable-rooms --> ir-unbookable-rooms-data
  style ir-unbookable-rooms-data fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
