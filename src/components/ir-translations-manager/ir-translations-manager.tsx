import Token from '@/models/Token';
import { SetupService } from '@/services/setup';
import { showToast } from '@/utils/utils';
import { Component, Host, Prop, State, Watch, h } from '@stencil/core';
import { buildEditSetupParams, exposedLanguagesToTranslationLanguages, setupEntryToTranslationEntry } from './setup-mapping';
import { TranslationEntry, TranslationLanguage, TranslationTable } from './types';
import { getSourceLanguage, orderLanguages, sortByDisplayOrder } from './utils';

type DeleteTarget = { type: 'entry' | 'table'; id: string; label: string; detail?: string };

@Component({
  tag: 'ir-translations-manager',
  styleUrl: 'ir-translations-manager.css',
  scoped: true,
})
export class IrTranslationsManager {
  /** Auth ticket for the Setup API, following the same pattern as other feature roots. */
  @Prop() ticket: string;
  /** Owning property id, sent as OWNER_ID on every write. */
  @Prop() propertyid: number;
  /** Acting user id, sent as ENTRY_USER_ID on every write. */
  @Prop() userId: number;

  @State() tables: TranslationTable[] = [];
  /** Languages currently shown — a subset of `languageCatalog` toggled via the language dialog. */
  @State() languages: TranslationLanguage[] = [];
  /** Every language this property exposes and Setup can persist, regardless of current visibility. */
  @State() languageCatalog: TranslationLanguage[] = [];
  @State() activeTableId: string | null = null;

  /** Text shown in the table picker — doubles as the option filter while typing. */
  @State() tableQuery: string = '';

  @State() entryDrawerOpen: boolean = false;
  @State() entryDrawerEntry: TranslationEntry | null = null;

  @State() tableDialogOpen: boolean = false;
  @State() tableDialogMode: 'create' | 'edit' = 'create';
  @State() tableDialogTable: TranslationTable | null = null;

  @State() languageDialogOpen: boolean = false;

  @State() deleteTarget: DeleteTarget | null = null;

  /** True while the distinct table list is loading. */
  @State() isLoading: boolean = false;
  /** True while the active table's keys are loading — set on every table switch. */
  @State() isLoadingEntries: boolean = false;
  /** True while any write is in flight — guards against overlapping edits. */
  @State() isMutating: boolean = false;
  /** True once a drag reorder is applied locally but not yet persisted. */
  @State() orderDirty: boolean = false;
  /** Table the user picked while an order was still unsaved — held until they resolve the prompt. */
  @State() pendingTableSwitchId: string | null = null;
  /** Entry ids in the active table's last-loaded (or last-saved) order — the yardstick `changedEntryIds` diffs against. */
  @State() baselineOrderIds: string[] = [];

  private deleteDialogRef: HTMLIrDialogElement;
  private unsavedOrderDialogRef: HTMLIrDialogElement;

  private tokenService = new Token();
  private setupService = new SetupService();

  componentWillLoad() {
    if (this.ticket) {
      this.tokenService.setToken(this.ticket);
      this.loadLanguages();
      this.loadTables();
    }
  }

  @Watch('ticket')
  handleTicketChange(newValue: string, oldValue: string) {
    if (newValue && newValue !== oldValue) {
      this.tokenService.setToken(newValue);
      this.loadLanguages();
      this.loadTables();
    }
  }

  // #region Loading

  /**
   * Which languages this property actually wants translated, and their
   * display names, come from Setup's exposed-language catalog rather than a
   * hardcoded list — narrowed to the codes Setup can persist. All exposed
   * languages start visible; hiding one only affects `languages`, so the
   * catalog stays the reference list the language dialog re-offers from.
   */
  private async loadLanguages() {
    try {
      const exposed = await this.setupService.getExposedLanguages();
      this.languageCatalog = exposedLanguagesToTranslationLanguages(exposed);
      this.languages = this.languageCatalog;
    } finally {
    }
  }

  /**
   * Only the distinct table names are fetched up front, to fill the picker —
   * a table's keys aren't loaded until it's actually selected.
   */
  private async loadTables() {
    this.isLoading = true;
    try {
      const tableNames = await this.setupService.getDistinctSetupTables();
      this.tables = tableNames.map(name => ({ id: name, name, entries: [] }));
      this.setActiveTable(this.tables[0]?.id ?? null);
      // this.setActiveTable(this.tables.find(t => t.name === 'BLAbLA')?.id ?? null);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Fetches one table's keys. Runs every time a table becomes active — including
   * a table that was just created locally and doesn't exist on the backend yet.
   * Skipped without a ticket so purely-local interactions (e.g. the demo page)
   * never fire a real, doomed-to-fail request.
   */
  private async loadTableEntries(tableId: string) {
    if (!this.ticket) {
      return;
    }
    this.isLoadingEntries = true;
    try {
      const rows = await this.setupService.getSetupEntriesByTblName({ TBL_NAME: tableId });
      const entries = sortByDisplayOrder(rows.map(setupEntryToTranslationEntry));
      this.tables = this.tables.map(table => (table.id === tableId ? { ...table, entries } : table));
      // A fresh fetch is always the authoritative order — any pending local reorder is moot now.
      this.orderDirty = false;
      this.baselineOrderIds = entries.map(entry => entry.id);
    } finally {
      this.isLoadingEntries = false;
    }
  }

  // #endregion

  // #region Derived state

  private get activeTable(): TranslationTable | undefined {
    return this.tables.find(table => table.id === this.activeTableId);
  }

  private get orderedLanguages(): TranslationLanguage[] {
    return orderLanguages(this.languages);
  }

  /** One past the highest DISPLAY_ORDER in the active table — where a brand-new key should land. */
  private get nextDisplayOrder(): number {
    const entries = this.activeTable?.entries ?? [];
    return entries.reduce((max, entry) => Math.max(max, entry.meta?.displayOrder ?? 0), -1) + 1;
  }

  /** Ids of rows whose position no longer matches the last-loaded/saved order — empty unless a reorder is pending. */
  private get changedEntryIds(): Set<string> {
    if (!this.orderDirty || !this.activeTable) {
      return new Set();
    }
    const changed = new Set<string>();
    this.activeTable.entries.forEach((entry, index) => {
      if (this.baselineOrderIds[index] !== entry.id) {
        changed.add(entry.id);
      }
    });
    return changed;
  }

  /**
   * Options for the table picker. While the field still shows the selected
   * table's name the whole list is offered, so reopening the picker doesn't
   * narrow it down to the one table already chosen.
   */
  private get filteredTables(): TranslationTable[] {
    const query = this.tableQuery.trim().toLowerCase();
    if (!query || query === this.activeTable?.name.toLowerCase()) {
      return this.tables;
    }
    return this.tables.filter(table => table.name.toLowerCase().includes(query));
  }

  // #endregion

  private updateActiveTable(update: (table: TranslationTable) => TranslationTable) {
    const activeId = this.activeTableId;
    this.tables = this.tables.map(table => (table.id === activeId ? update(table) : table));
  }

  /**
   * Selecting a table always re-labels the picker, so the field never drifts
   * from what's shown, and always (re)fetches that table's keys — there's no
   * per-table cache, so switching back to an already-seen table hits the API again.
   */
  private setActiveTable(id: string | null) {
    this.activeTableId = id;
    this.tableQuery = this.tables.find(table => table.id === id)?.name ?? '';
    this.orderDirty = false;
    if (id) {
      this.loadTableEntries(id);
    }
  }

  /**
   * ir-autocomplete has no "closed without choosing" event, so abandoned search
   * text would otherwise sit in the field labelling the wrong table. Deferring a
   * frame lets a pending option click land first, which makes this a no-op.
   */
  private restoreTableQuery() {
    setTimeout(() => {
      const name = this.activeTable?.name ?? '';
      if (this.tableQuery !== name) {
        this.tableQuery = name;
      }
    }, 0);
  }

  /** Picking a table from the header autocomplete goes through here so an unsaved drag reorder can't be silently discarded. */
  private requestActiveTableChange(id: string) {
    if (this.orderDirty && id !== this.activeTableId) {
      this.pendingTableSwitchId = id;
      this.unsavedOrderDialogRef?.openModal();
      return;
    }
    this.setActiveTable(id);
  }

  private discardOrderAndSwitchTable() {
    const target = this.pendingTableSwitchId;
    this.pendingTableSwitchId = null;
    this.unsavedOrderDialogRef?.closeModal();
    if (target) {
      this.setActiveTable(target);
    }
  }

  /** Saves the current table's order first — only switches once that write actually lands. */
  private async saveOrderAndSwitchTable() {
    await this.handleSaveOrder();
    if (this.orderDirty) {
      // handleSaveOrder already toasted the failure — leave the prompt open so the user can retry or discard instead.
      return;
    }
    const target = this.pendingTableSwitchId;
    this.pendingTableSwitchId = null;
    this.unsavedOrderDialogRef?.closeModal();
    if (target) {
      this.setActiveTable(target);
    }
  }

  // #region Entry CRUD

  private openCreateEntry() {
    this.entryDrawerEntry = null;
    this.entryDrawerOpen = true;
  }

  private openEditEntry(entry: TranslationEntry) {
    this.entryDrawerEntry = entry;
    this.entryDrawerOpen = true;
  }

  /** The entry form saved (and possibly soft-deleted/recreated) directly against Setup — refetch to pick up the result. */
  private handleEntrySaved = () => {
    if (this.activeTableId) {
      this.loadTableEntries(this.activeTableId);
    }
  };

  private async handleEntryChange(updatedEntry: TranslationEntry) {
    const table = this.activeTable;
    if (!table) {
      return;
    }
    const previousEntries = table.entries;
    // Optimistic — the cell already shows the new value before the write lands.
    this.updateActiveTable(current => ({ ...current, entries: current.entries.map(entry => (entry.id === updatedEntry.id ? updatedEntry : entry)) }));

    this.isMutating = true;
    try {
      const saved = await this.setupService.editSetup(
        buildEditSetupParams({
          ownerId: this.propertyid,
          entryUserId: this.userId,
          tableName: table.name,
          key: updatedEntry.key,
          values: updatedEntry.values,
          meta: updatedEntry.meta,
          touch: false,
        }),
      );
      const savedEntry = setupEntryToTranslationEntry(saved);
      this.updateActiveTable(current => ({ ...current, entries: current.entries.map(entry => (entry.id === savedEntry.id ? savedEntry : entry)) }));
      showToast({ type: 'success', title: 'Saved Successfully' });
    } catch (error) {
      this.tables = this.tables.map(t => (t.id === table.id ? { ...t, entries: previousEntries } : t));
    } finally {
      this.isMutating = false;
    }
  }

  /** Flips ISVISIBLE for one entry — a deliberate settings change, so it stamps a fresh ENTRY_DATE like any other content edit. */
  private async handleToggleVisibility(entry: TranslationEntry) {
    const table = this.activeTable;
    if (!table) {
      return;
    }
    const nextVisible = !(entry.meta?.isVisible ?? true);
    const previousEntries = table.entries;
    this.updateActiveTable(current => ({
      ...current,
      entries: current.entries.map(item => (item.id === entry.id && item.meta ? { ...item, meta: { ...item.meta, isVisible: nextVisible } } : item)),
    }));

    this.isMutating = true;
    try {
      const saved = await this.setupService.editSetup(
        buildEditSetupParams({
          ownerId: this.propertyid,
          entryUserId: this.userId,
          tableName: table.name,
          key: entry.key,
          values: entry.values,
          meta: entry.meta ? { ...entry.meta, isVisible: nextVisible } : entry.meta,
          touch: true,
        }),
      );
      const savedEntry = setupEntryToTranslationEntry(saved);
      this.updateActiveTable(current => ({ ...current, entries: current.entries.map(item => (item.id === savedEntry.id ? savedEntry : item)) }));
      showToast({ type: 'success', title: nextVisible ? 'Key shown in app' : 'Key hidden from app' });
    } catch (error) {
      this.tables = this.tables.map(t => (t.id === table.id ? { ...t, entries: previousEntries } : t));
    } finally {
      this.isMutating = false;
    }
  }

  /** A row drag finished — reindex every row's display order locally and flag it unsaved. */
  private handleReorderEntries(orderedEntries: TranslationEntry[]) {
    const reordered = orderedEntries.map((entry, index) => ({
      ...entry,
      meta: { ...entry.meta!, displayOrder: index },
    }));
    this.updateActiveTable(current => ({ ...current, entries: reordered }));
    this.orderDirty = true;
  }

  /** Persists the locally-reindexed order — every row in the table is rewritten, matching the bulk-write shape used for table delete. */
  private async handleSaveOrder() {
    const table = this.activeTable;
    if (!table) {
      return;
    }
    this.isMutating = true;
    try {
      await this.setupService.editSetupMany(
        table.entries.map(entry =>
          buildEditSetupParams({ ownerId: this.propertyid, entryUserId: this.userId, tableName: table.name, key: entry.key, values: entry.values, meta: entry.meta }),
        ),
      );
      this.orderDirty = false;
      this.baselineOrderIds = table.entries.map(entry => entry.id);
      showToast({ type: 'success', title: 'Order saved' });
    } finally {
      this.isMutating = false;
    }
  }

  /** Drops the local reorder and refetches — the same "fresh fetch is authoritative" path `loadTableEntries` already resets order state through. */
  private handleDiscardOrder() {
    if (this.activeTableId) {
      this.loadTableEntries(this.activeTableId);
    }
  }

  // private async handleDuplicateEntry(entry: TranslationEntry) {
  //   const table = this.activeTable;
  //   if (!table) {
  //     return;
  //   }
  //   const existingKeys = new Set(table.entries.map(item => item.key));
  //   let copyKey = `${entry.key}_copy`;
  //   let suffix = 2;
  //   while (existingKeys.has(copyKey)) {
  //     copyKey = `${entry.key}_copy_${suffix++}`;
  //   }

  //   this.isMutating = true;
  //   try {
  //     const saved = await this.setupService.editSetup(
  //       buildEditSetupParams({ ownerId: this.propertyid, entryUserId: this.userId, tableName: table.name, key: copyKey, values: entry.values }),
  //     );
  //     const savedEntry = setupEntryToTranslationEntry(saved);
  //     this.updateActiveTable(current => {
  //       const index = current.entries.findIndex(item => item.id === entry.id);
  //       const entries = [...current.entries];
  //       entries.splice(index + 1, 0, savedEntry);
  //       return { ...current, entries };
  //     });
  //   } catch (error) {
  //     console.error(error);
  //     showToast({ type: 'error', title: 'Unable to duplicate key' });
  //   } finally {
  //     this.isMutating = false;
  //   }
  // }

  private requestDeleteEntry(entry: TranslationEntry) {
    this.deleteTarget = { type: 'entry', id: entry.id, label: entry.key || 'this key' };
    this.deleteDialogRef?.openModal();
  }

  // #endregion

  // #region Table CRUD

  private openCreateTable() {
    this.tableDialogMode = 'create';
    this.tableDialogTable = null;
    this.tableDialogOpen = true;
  }

  // private openEditTable(table: TranslationTable) {
  //   this.tableDialogMode = 'edit';
  //   this.tableDialogTable = table;
  //   this.tableDialogOpen = true;
  // }

  /** The table form saved (create, empty-table rename, or bulk rename) directly against Setup — reconcile local state with what it reports. */
  private handleTableSaved = (saved: { id: string; name: string; mode: 'create' | 'edit' }) => {
    if (saved.mode === 'create') {
      const newTable: TranslationTable = { id: saved.id, name: saved.name, entries: [] };
      this.tables = [...this.tables, newTable];
      this.setActiveTable(newTable.id);
      return;
    }

    const oldTable = this.tableDialogTable;
    if (!oldTable) {
      return;
    }
    this.tables = this.tables.map(t => (t.id === oldTable.id ? { id: saved.id, name: saved.name, entries: [] } : t));
    if (this.activeTableId === oldTable.id) {
      // Fetches the rows just written rather than trusting the write responses.
      this.setActiveTable(saved.id);
    }
  };

  /** The table form's bulk rename partially failed — reload everything rather than trust a half-applied local state. */
  private handleTableSaveFailed = () => {
    this.loadTables();
  };

  // private async handleDuplicateTable(table: TranslationTable) {
  //   let name = `${table.name} (copy)`;
  //   let suffix = 2;
  //   while (this.tables.some(t => t.name === name)) {
  //     name = `${table.name} (copy ${suffix++})`;
  //   }

  //   if (table.entries.length === 0) {
  //     const copy: TranslationTable = { id: name, name, entries: [] };
  //     this.tables = [...this.tables, copy];
  //     this.setActiveTable(copy.id);
  //     return;
  //   }

  //   this.isMutating = true;
  //   try {
  //     await Promise.all(
  //       table.entries.map(entry =>
  //         this.setupService.editSetup(buildEditSetupParams({ ownerId: this.propertyid, entryUserId: this.userId, tableName: name, key: entry.key, values: entry.values })),
  //       ),
  //     );
  //     const copy: TranslationTable = { id: name, name, entries: [] };
  //     this.tables = [...this.tables, copy];
  //     // Fetches the rows just written rather than trusting the write responses.
  //     this.setActiveTable(copy.id);
  //     showToast({ type: 'success', title: 'Table duplicated' });
  //   } catch (error) {
  //     console.error(error);
  //     showToast({ type: 'error', title: 'Unable to duplicate table' });
  //   } finally {
  //     this.isMutating = false;
  //   }
  // }

  // private requestDeleteTable(table: TranslationTable) {
  //   const count = table.entries.length;
  //   this.deleteTarget = {
  //     type: 'table',
  //     id: table.id,
  //     label: table.name,
  //     detail: count > 0 ? `${count} key${count === 1 ? '' : 's'} will be deleted with it.` : undefined,
  //   };
  //   this.deleteDialogRef?.openModal();
  // }

  // #endregion

  // #region Language visibility
  //
  // Setup always carries all nine CODE_VALUE_* columns on every row — adding or
  // removing a language here only changes which columns this manager displays.
  // It never touches saved translation text, so no confirmation step is needed.

  private handleAddLanguage(language: TranslationLanguage) {
    const isFirst = this.languages.length === 0;
    this.languages = [...this.languages, { ...language, isSource: isFirst }];
  }

  private handleRemoveLanguage(code: string) {
    const wasSource = this.languages.find(language => language.code === code)?.isSource;
    this.languages = this.languages.filter(language => language.code !== code);
    if (wasSource && this.languages.length > 0) {
      this.languages = this.languages.map((language, index) => ({ ...language, isSource: index === 0 }));
    }
  }

  private handleSetSourceLanguage(code: string) {
    this.languages = this.languages.map(language => ({ ...language, isSource: language.code === code }));
  }

  // #endregion

  private async confirmDelete() {
    if (!this.deleteTarget) {
      return;
    }
    this.isMutating = true;
    try {
      if (this.deleteTarget.type === 'entry') {
        const table = this.activeTable;
        const entry = table?.entries.find(item => item.id === this.deleteTarget.id);
        if (table && entry) {
          await this.setupService.editSetup(
            buildEditSetupParams({
              ownerId: this.propertyid,
              entryUserId: this.userId,
              tableName: table.name,
              key: entry.key,
              values: entry.values,
              meta: entry.meta,
              isDeleted: true,
              touch: true,
            }),
          );
          this.updateActiveTable(current => ({ ...current, entries: current.entries.filter(item => item.id !== entry.id) }));
        }
      } else {
        const table = this.tables.find(item => item.id === this.deleteTarget.id);
        if (table) {
          await this.setupService.editSetupMany(
            table.entries.map(entry =>
              buildEditSetupParams({
                ownerId: this.propertyid,
                entryUserId: this.userId,
                tableName: table.name,
                key: entry.key,
                values: entry.values,
                meta: entry.meta,
                isDeleted: true,
              }),
            ),
          );
          this.tables = this.tables.filter(item => item.id !== table.id);
          if (this.activeTableId === table.id) {
            this.setActiveTable(this.tables[0]?.id ?? null);
          }
        }
      }
      this.deleteDialogRef?.closeModal();
    } finally {
      this.isMutating = false;
    }
  }

  private renderPageActions() {
    // const activeTable = this.activeTable;

    return (
      <div slot="page-header" class="tm__page-actions">
        <div class="tm__table-picker">
          <ir-autocomplete
            class="tm__table-select"
            size="s"
            label="Table"
            placeholder="Select table"
            value={this.tableQuery}
            emitOnSameValue={false}
            withClear
            onText-change={(e: CustomEvent<string>) => (this.tableQuery = e.detail ?? '')}
            onCombobox-change={(e: CustomEvent<string | string[]>) => this.requestActiveTableChange(e.detail as string)}
            onFocusout={() => this.restoreTableQuery()}
          >
            <wa-icon name="table" slot="start"></wa-icon>
            {this.filteredTables.map(table => (
              <ir-autocomplete-option key={table.id} label={table.name} value={table.id}>
                {table.name}
              </ir-autocomplete-option>
            ))}
          </ir-autocomplete>
          {/* <wa-dropdown
            onwa-select={(e: CustomEvent<any>) => {
              if (!activeTable) {
                return;
              }
              const action = e.detail.item.value;
              if (action === 'rename') {
                this.openEditTable(activeTable);
              } else if (action === 'duplicate') {
                this.handleDuplicateTable(activeTable);
              } else if (action === 'delete') {
                this.requestDeleteTable(activeTable);
              }
            }}
          >
            <ir-custom-button class="tm__icon-btn" slot="trigger" appearance="outlined" variant="neutral" disabled={!activeTable || this.isMutating || this.isLoadingEntries}>
              <wa-icon name="ellipsis" label="Table actions"></wa-icon>
            </ir-custom-button>
            <wa-dropdown-item value="rename">
              <wa-icon slot="icon" name="pen"></wa-icon>
              Rename
            </wa-dropdown-item>
            <wa-dropdown-item value="duplicate">
              <wa-icon slot="icon" name="copy"></wa-icon>
              Duplicate
            </wa-dropdown-item>
            <wa-dropdown-item value="delete" variant="danger">
              <wa-icon slot="icon" name="trash-can"></wa-icon>
              Delete
            </wa-dropdown-item>
          </wa-dropdown> */}

          {/* <ir-custom-button class="tm__icon-btn" appearance="outlined" variant="neutral" disabled={this.isMutating} onClickHandler={() => this.openCreateTable()}>
            <wa-icon name="plus" label="New table"></wa-icon>
          </ir-custom-button> */}
        </div>

        <ir-custom-button appearance="outlined" variant="neutral" onClickHandler={() => (this.languageDialogOpen = true)}>
          <wa-icon name="language" slot="start" aria-hidden="true"></wa-icon>
          Languages
          <span slot="end" class="tm__lang-count">
            {this.languages.length}
          </span>
        </ir-custom-button>
      </div>
    );
  }

  render() {
    const activeTable = this.activeTable;
    const languages = this.orderedLanguages;
    const sourceCode = getSourceLanguage(this.languages)?.code;

    return (
      <Host>
        <ir-page class={'translation-manager__page'} label="Setup Entries">
          {this.renderPageActions()}

          {this.isLoading ? (
            <div class="tm__loader-container">
              <ir-spinner></ir-spinner>
              <p>Loading translation tables…</p>
            </div>
          ) : !activeTable ? (
            <ir-empty-state message="No translation tables yet — create one to start translating strings.">
              <ir-custom-button variant="brand" appearance="filled" onClickHandler={() => this.openCreateTable()}>
                New table
              </ir-custom-button>
            </ir-empty-state>
          ) : (
            <ir-translations-entries-panel
              entries={activeTable.entries}
              languages={languages}
              sourceCode={sourceCode}
              isLoading={this.isLoadingEntries}
              disableActions={this.isMutating}
              hasPendingOrder={this.orderDirty}
              changedEntryIds={this.changedEntryIds}
              onCreateEntry={() => this.openCreateEntry()}
              onEditEntry={(e: CustomEvent<TranslationEntry>) => this.openEditEntry(e.detail)}
              // onDuplicateEntry={(e: CustomEvent<TranslationEntry>) => this.handleDuplicateEntry(e.detail)}
              onDeleteEntry={(e: CustomEvent<TranslationEntry>) => this.requestDeleteEntry(e.detail)}
              onEntryChange={(e: CustomEvent<TranslationEntry>) => this.handleEntryChange(e.detail)}
              onToggleVisibility={(e: CustomEvent<TranslationEntry>) => this.handleToggleVisibility(e.detail)}
              onReorderEntries={(e: CustomEvent<TranslationEntry[]>) => this.handleReorderEntries(e.detail)}
              onSaveOrder={() => this.handleSaveOrder()}
              onDiscardOrder={() => this.handleDiscardOrder()}
            ></ir-translations-entries-panel>
          )}
        </ir-page>
        <ir-translations-entry-drawer
          open={this.entryDrawerOpen}
          languages={languages}
          entry={this.entryDrawerEntry}
          existingKeys={activeTable?.entries.map(entry => entry.key) ?? []}
          nextDisplayOrder={this.nextDisplayOrder}
          tableName={activeTable?.name}
          ownerId={this.propertyid}
          entryUserId={this.userId}
          onEntrySaved={this.handleEntrySaved}
          onCloseDrawer={() => {
            this.entryDrawerOpen = false;
            this.entryDrawerEntry = null;
          }}
        ></ir-translations-entry-drawer>

        <ir-translations-table-dialog
          open={this.tableDialogOpen}
          mode={this.tableDialogMode}
          table={this.tableDialogTable}
          existingNames={this.tables.map(table => table.name)}
          ownerId={this.propertyid}
          entryUserId={this.userId}
          onTableSaved={(e: CustomEvent<{ id: string; name: string; mode: 'create' | 'edit' }>) => this.handleTableSaved(e.detail)}
          onTableSaveFailed={this.handleTableSaveFailed}
          onCloseDialog={() => (this.tableDialogOpen = false)}
        ></ir-translations-table-dialog>

        <ir-translations-language-dialog
          open={this.languageDialogOpen}
          languages={languages}
          catalog={this.languageCatalog}
          entries={activeTable?.entries ?? []}
          onAddLanguage={(e: CustomEvent<TranslationLanguage>) => this.handleAddLanguage(e.detail)}
          onRemoveLanguage={(e: CustomEvent<string>) => this.handleRemoveLanguage(e.detail)}
          onSetSourceLanguage={(e: CustomEvent<string>) => this.handleSetSourceLanguage(e.detail)}
          onCloseDialog={() => (this.languageDialogOpen = false)}
        ></ir-translations-language-dialog>

        <ir-dialog
          label={this.deleteTarget?.type === 'table' ? 'Delete table' : 'Delete key'}
          ref={el => (this.deleteDialogRef = el)}
          onIrDialogAfterHide={() => (this.deleteTarget = null)}
        >
          <p class="tm__confirm-text">
            Delete <strong>{this.deleteTarget?.label}</strong>? {this.deleteTarget?.detail} This cannot be undone.
          </p>
          <div slot="footer" class="ir-dialog__footer">
            <ir-custom-button size="m" appearance="outlined" variant="neutral" onClickHandler={() => this.deleteDialogRef?.closeModal()}>
              Cancel
            </ir-custom-button>
            <ir-custom-button size="m" appearance="accent" variant="danger" loading={this.isMutating} onClickHandler={() => this.confirmDelete()}>
              Delete
            </ir-custom-button>
          </div>
        </ir-dialog>

        <ir-dialog
          label="Unsaved order"
          ref={el => (this.unsavedOrderDialogRef = el)}
          onIrDialogAfterHide={() => {
            // Only true if neither Save nor Discard resolved it — i.e. the picker already
            // optimistically wrote the newly-clicked option's label straight into its own
            // input DOM node, bypassing our `value` prop. Since `tableQuery` itself never
            // actually changed, reassigning it wouldn't touch that DOM node — force a
            // real prop change (even momentarily) so ir-autocomplete's own value watcher fires.
            if (this.pendingTableSwitchId) {
              this.tableQuery = '';
              requestAnimationFrame(() => (this.tableQuery = this.activeTable?.name ?? ''));
            }
            this.pendingTableSwitchId = null;
          }}
        >
          <p class="tm__confirm-text">You reordered keys in this table but haven't saved it yet. Save the new order, or discard it and switch tables?</p>
          <div slot="footer" class="ir-dialog__footer">
            <ir-custom-button size="m" appearance="outlined" variant="neutral" onClickHandler={() => this.unsavedOrderDialogRef?.closeModal()}>
              Cancel
            </ir-custom-button>
            <ir-custom-button size="m" appearance="outlined" variant="danger" disabled={this.isMutating} onClickHandler={() => this.discardOrderAndSwitchTable()}>
              Discard
            </ir-custom-button>
            <ir-custom-button size="m" appearance="accent" variant="brand" loading={this.isMutating} onClickHandler={() => this.saveOrderAndSwitchTable()}>
              Save
            </ir-custom-button>
          </div>
        </ir-dialog>
      </Host>
    );
  }
}
