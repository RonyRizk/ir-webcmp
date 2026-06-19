# ir-toasts-provider



<!-- Auto Generated Below -->


## Methods

### `create(message: string, options?: Partial<ToastOptions>) => Promise<string>`

Creates a toast and adds it to the stack. Returns the toast id.

#### Parameters

| Name      | Type                                                                                               | Description |
| --------- | -------------------------------------------------------------------------------------------------- | ----------- |
| `message` | `string`                                                                                           |             |
| `options` | `{ variant?: ToastVariants; duration?: number; allowHtml?: boolean; icon?: string \| ToastIcon; }` |             |

#### Returns

Type: `Promise<string>`




## Dependencies

### Depends on

- [ir-toast-item](../ir-toast-item)

### Graph
```mermaid
graph TD;
  ir-toasts-provider --> ir-toast-item
  style ir-toasts-provider fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
