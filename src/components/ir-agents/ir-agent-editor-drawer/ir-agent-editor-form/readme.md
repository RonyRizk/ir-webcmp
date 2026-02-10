# ir-agent-editor-form



<!-- Auto Generated Below -->


## Properties

| Property       | Attribute | Description | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Default     |
| -------------- | --------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| `agent`        | --        |             | `{ name?: string; email?: string; id?: number; reference?: string; address?: string; code?: string; notes?: string; is_active?: boolean; property_id?: any; country_id?: number; currency_id?: any; city?: string; agent_rate_type_code?: { code?: string; description?: string; }; agent_type_code?: { code?: string; description?: string; }; contact_name?: string; contract_nbr?: any; due_balance?: any; email_copied_upon_booking?: string; is_send_guest_confirmation_email?: boolean; payment_mode?: { code?: string; description?: string; }; phone?: string; provided_discount?: any; question?: string; sort_order?: any; tax_nbr?: string; verification_mode?: string; }` | `undefined` |
| `countries`    | --        |             | `ICountry[]`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | `undefined` |
| `formId`       | `form-id` |             | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | `undefined` |
| `setupEntries` | --        |             | `{ agent_rate_type: IEntries[]; agent_type: IEntries[]; ta_payment_method: IEntries[]; }`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | `undefined` |


## Events

| Event            | Description | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ---------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `closeDrawer`    |             | `CustomEvent<void>`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `loadingChanged` |             | `CustomEvent<string>`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `upsertAgent`    |             | `CustomEvent<{ name?: string; email?: string; id?: number; reference?: string; address?: string; code?: string; notes?: string; is_active?: boolean; property_id?: any; country_id?: number; currency_id?: any; city?: string; agent_rate_type_code?: { code?: string; description?: string; }; agent_type_code?: { code?: string; description?: string; }; contact_name?: string; contract_nbr?: any; due_balance?: any; email_copied_upon_booking?: string; is_send_guest_confirmation_email?: boolean; payment_mode?: { code?: string; description?: string; }; phone?: string; provided_discount?: any; question?: string; sort_order?: any; tax_nbr?: string; verification_mode?: string; }>` |


## Dependencies

### Used by

 - [ir-agent-editor-drawer](..)

### Depends on

- [ir-agent-profile](../ir-agent-profile)
- [ir-agent-contract](../ir-agent-contract)

### Graph
```mermaid
graph TD;
  ir-agent-editor-form --> ir-agent-profile
  ir-agent-editor-form --> ir-agent-contract
  ir-agent-profile --> ir-validator
  ir-agent-profile --> ir-input
  ir-agent-profile --> ir-country-picker
  ir-country-picker --> ir-picker
  ir-country-picker --> ir-picker-item
  ir-country-picker --> ir-input-text
  ir-agent-contract --> ir-validator
  ir-agent-contract --> ir-input
  ir-agent-editor-drawer --> ir-agent-editor-form
  style ir-agent-editor-form fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
