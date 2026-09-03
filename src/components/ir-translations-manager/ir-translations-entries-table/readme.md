# ir-translations-entries-table



<!-- Auto Generated Below -->


## Properties

| Property          | Attribute         | Description                                                                                                       | Type                         | Default     |
| ----------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------- | ---------------------------- | ----------- |
| `changedEntryIds` | --                | Ids of rows whose position differs from the last-loaded/saved order — highlighted while a reorder is pending.     | `Set<string>`                | `new Set()` |
| `compact`         | `compact`         |                                                                                                                   | `boolean`                    | `true`      |
| `duplicates`      | --                | Entry id → the tables sharing that row's description; rows present here get a duplicate badge beside their key.   | `Map<string, DuplicateInfo>` | `new Map()` |
| `entries`         | --                | Rows to render, already filtered by the parent.                                                                   | `TranslationEntry[]`         | `[]`        |
| `filtered`        | `filtered`        | True when the parent's filters hid every row, so the empty state can say so.                                      | `boolean`                    | `false`     |
| `groupByTable`    | `group-by-table`  | True when `entries` span several setup tables — rows are then broken up by collapsible per-table header rows.     | `boolean`                    | `false`     |
| `languages`       | --                | Column order — the source language is expected first.                                                             | `TranslationLanguage[]`      | `[]`        |
| `reorderEnabled`  | `reorder-enabled` | False while a search/status filter is active — reordering a filtered subset can't map cleanly onto the full list. | `boolean`                    | `true`      |
| `sourceCode`      | `source-code`     | Code of the reference language, marked in the header.                                                             | `string`                     | `undefined` |


## Events

| Event              | Description | Type                              |
| ------------------ | ----------- | --------------------------------- |
| `clearFilters`     |             | `CustomEvent<void>`               |
| `deleteEntry`      |             | `CustomEvent<TranslationEntry>`   |
| `duplicateEntry`   |             | `CustomEvent<TranslationEntry>`   |
| `editEntry`        |             | `CustomEvent<TranslationEntry>`   |
| `entryChange`      |             | `CustomEvent<TranslationEntry>`   |
| `reorderEntries`   |             | `CustomEvent<TranslationEntry[]>` |
| `toggleVisibility` |             | `CustomEvent<TranslationEntry>`   |


## Dependencies

### Used by

 - [ir-translations-entries-panel](../ir-translations-entries-panel)

### Depends on

- [ir-custom-button](../../ui/ir-custom-button)
- [ir-empty-state](../../ir-empty-state)

### Graph
```mermaid
graph TD;
  ir-translations-entries-table --> ir-custom-button
  ir-translations-entries-table --> ir-empty-state
  ir-translations-entries-panel --> ir-translations-entries-table
  style ir-translations-entries-table fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
