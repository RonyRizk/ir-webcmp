# ir-agent-editor-drawer

<!-- Auto Generated Below -->


## Properties

| Property       | Attribute | Description | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Default     |
| -------------- | --------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| `agent`        | --        |             | `{ name?: string; id?: number; email?: string; property_id?: any; code?: string; address?: string; agent_rate_type_code?: { code?: string; description?: string; }; agent_type_code?: { code?: string; description?: string; }; city?: string; contact_name?: string; contract_nbr?: any; country_id?: number; currency_id?: any; due_balance?: any; email_copied_upon_booking?: string; is_active?: boolean; is_send_guest_confirmation_email?: boolean; notes?: string; payment_mode?: { code?: string; description?: string; }; phone?: string; provided_discount?: any; question?: string; sort_order?: any; tax_nbr?: string; reference?: string; verification_mode?: string; has_opening_balance?: boolean; cl_post_timing?: { code?: string; description?: string; }; }` | `undefined` |
| `countries`    | --        |             | `ICountry[]`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | `undefined` |
| `open`         | `open`    |             | `boolean`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `false`     |
| `setupEntries` | --        |             | `{ agent_rate_type: IEntries[]; agent_type: IEntries[]; ta_payment_method: IEntries[]; cl_post_timing: IEntries[]; }`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | `undefined` |


## Events

| Event              | Description | Type                |
| ------------------ | ----------- | ------------------- |
| `agentEditorClose` |             | `CustomEvent<void>` |


## Dependencies

### Used by

 - [ir-agents](..)

### Depends on

- [ir-drawer](../../ir-drawer)
- [ir-agent-editor-form](ir-agent-editor-form)
- [ir-custom-button](../../ui/ir-custom-button)

### Graph
```mermaid
graph TD;
  ir-agent-editor-drawer --> ir-drawer
  ir-agent-editor-drawer --> ir-agent-editor-form
  ir-agent-editor-drawer --> ir-custom-button
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
  ir-agents --> ir-agent-editor-drawer
  style ir-agent-editor-drawer fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
