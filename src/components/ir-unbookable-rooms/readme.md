# ir-unbookable-rooms



<!-- Auto Generated Below -->


## Properties

| Property             | Attribute            | Description | Type                 | Default     |
| -------------------- | -------------------- | ----------- | -------------------- | ----------- |
| `consecutive_period` | `consecutive_period` |             | `number`             | `14`        |
| `mode`               | `mode`               |             | `"default" \| "mpo"` | `'default'` |
| `period_to_check`    | `period_to_check`    |             | `number`             | `2`         |
| `propertyid`         | `propertyid`         |             | `number`             | `undefined` |
| `ticket`             | `ticket`             |             | `string`             | `''`        |


## Dependencies

### Depends on

- [ir-loading-screen](../ir-loading-screen)
- [ir-toast](../ui/ir-toast)
- [ir-interceptor](../ir-interceptor)
- [ir-unbookable-rooms-filters](ir-unbookable-rooms-filters)
- [ir-unbookable-rooms-data](ir-unbookable-rooms-data)

### Graph
```mermaid
graph TD;
  ir-unbookable-rooms --> ir-loading-screen
  ir-unbookable-rooms --> ir-toast
  ir-unbookable-rooms --> ir-interceptor
  ir-unbookable-rooms --> ir-unbookable-rooms-filters
  ir-unbookable-rooms --> ir-unbookable-rooms-data
  ir-toast --> ir-toast-provider
  ir-toast-provider --> ir-toast-alert
  ir-interceptor --> ir-spinner
  ir-interceptor --> ir-otp-modal
  ir-otp-modal --> ir-spinner
  ir-otp-modal --> ir-otp
  ir-otp-modal --> ir-button
  ir-button --> ir-icons
  ir-unbookable-rooms-filters --> ir-input
  ir-unbookable-rooms-filters --> ir-custom-button
  ir-unbookable-rooms-data --> ir-input
  style ir-unbookable-rooms fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
