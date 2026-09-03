import Token from '@/models/Token';
import { SetupService, type SetupEntry } from '@/services/setup';
import { showToast } from '@/utils/utils';
import { Component, Host, Prop, State, Watch, h } from '@stencil/core';
import { Subject, Subscription, catchError, debounceTime, distinctUntilChanged, from, map, merge, of, switchMap, tap } from 'rxjs';
import { buildEditSetupParams, exposedLanguagesToTranslationLanguages, setupEntryToTranslationEntry } from './setup-mapping';
import { DuplicateInfo, TranslationEntry, TranslationLanguage, TranslationTable } from './types';
import { USED_SETUP_TABLE_SET } from './used-setup-tables';
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
  /** Every language this property exposes and Setup can persist — all of them are always shown. */
  @State() languages: TranslationLanguage[] = [];
  @State() activeTableId: string | null = null;
  /** Hides setup tables nothing in this codebase reads. On by default — the full list is mostly noise. */
  @State() usedTablesOnly: boolean = true;

  /** Text shown in the table picker — doubles as the option filter while typing. */
  @State() tableQuery: string = '';

  @State() entryDrawerOpen: boolean = false;
  @State() entryDrawerEntry: TranslationEntry | null = null;

  @State() tableDialogOpen: boolean = false;
  @State() tableDialogMode: 'create' | 'edit' = 'create';
  @State() tableDialogTable: TranslationTable | null = null;

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

  /** Languages being audited for missing translations. Non-empty switches the page into the cross-table view. */
  @State() missingLanguageCodes: string[] = [];
  /**
   * The debounced, long-enough-to-be-useful query actually driving the fetch.
   * Non-empty switches the page into the cross-table view. The field's live text is
   * deliberately *not* state — see `renderPageActions`.
   */
  @State() appliedSearchQuery: string = '';
  /** Rows behind the cross-table view — the missing-language union, the search hits, or their intersection. */
  @State() crossTableEntries: TranslationEntry[] = [];
  /** True while a cross-table query is in flight. */
  @State() isLoadingCrossTable: boolean = false;

  /** Entry id (`TBL_NAME::CODE_NAME`) → the tables sharing that row's description. Empty until the duplicate scan lands. */
  @State() duplicates: Map<string, DuplicateInfo> = new Map();

  private deleteDialogRef: HTMLIrDialogElement;
  private unsavedOrderDialogRef: HTMLIrDialogElement;

  private tokenService = new Token();
  private setupService = new SetupService();

  /** Every keystroke in the header search. Debounced downstream — typing shouldn't be a query per character. */
  private search$ = new Subject<string>();
  /** Re-runs the cross-table query at once — language changes and post-save refetches, neither of which wants the typing debounce. */
  private refresh$ = new Subject<void>();
  private subscription: Subscription;

  componentWillLoad() {
    const debouncedSearch$ = this.search$.pipe(
      debounceTime(600),
      map(value => value.trim()),
      // A single character matches too much to be worth a round trip.
      map(value => (value.length >= 2 ? value : '')),
      distinctUntilChanged(),
      tap(value => (this.appliedSearchQuery = value)),
    );

    this.subscription = merge(debouncedSearch$, this.refresh$)
      .pipe(
        tap(() => (this.isLoadingCrossTable = this.isCrossTableMode)),
        // switchMap drops the response of any query a newer one has already superseded.
        switchMap(() => from(this.fetchCrossTableEntries()).pipe(catchError(() => of([] as TranslationEntry[])))),
      )
      .subscribe(entries => {
        this.crossTableEntries = entries;
        this.isLoadingCrossTable = false;
      });

    if (this.ticket) {
      this.tokenService.setToken(this.ticket);
      this.loadLanguages();
      this.loadTables();
      this.loadDuplicatedSetupEntriesAcrossTables();
    }
  }

  disconnectedCallback() {
    this.subscription?.unsubscribe();
  }

  @Watch('ticket')
  handleTicketChange(newValue: string, oldValue: string) {
    if (newValue && newValue !== oldValue) {
      this.tokenService.setToken(newValue);
      this.loadLanguages();
      this.loadTables();
      this.loadDuplicatedSetupEntriesAcrossTables();
    }
  }

  // #region Loading

  /**
   * Which languages this property actually wants translated, and their
   * display names, come from Setup's exposed-language catalog rather than a
   * hardcoded list — narrowed to the codes Setup can persist.
   */
  private async loadLanguages() {
    try {
      this.languages = exposedLanguagesToTranslationLanguages(await this.setupService.getExposedLanguages());
    } finally {
    }
  }
  /**
   * One scan of every description shared by more than one setup table, flattened
   * from the API's per-description grouping into a per-row lookup keyed by the same
   * `TBL_NAME::CODE_NAME` id the entries carry. Loaded once — it describes the whole
   * setup, not the table currently on screen. Purely decorative, so a failure leaves
   * the badges off rather than taking the page down with it.
   */
  private async loadDuplicatedSetupEntriesAcrossTables() {
    try {
      const groups = await this.setupService.getDuplicatedSetupEntriesAcrossTables();
      const byEntry = new Map<string, DuplicateInfo>();
      for (const group of groups ?? []) {
        // A description can repeat inside one table, so the tooltip lists distinct tables.
        const tables = [...new Set(group.ENTRIES.map(entry => entry.TBL_NAME))].sort();
        for (const entry of group.ENTRIES) {
          byEntry.set(`${entry.TBL_NAME}::${entry.CODE_NAME}`, { occurrences: group.OCCURRENCES, tables });
        }
      }
      this.duplicates = byEntry;
    } catch (error) {
      console.error(error);
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
      this.setActiveTable(this.visibleTables[0]?.id ?? null);
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

  /** Table-qualified id → entry, so two result sets can be intersected without re-deriving ids. */
  private indexEntries(rows: SetupEntry[]): Map<string, TranslationEntry> {
    const byId = new Map<string, TranslationEntry>();
    for (const row of rows) {
      const entry = setupEntryToTranslationEntry(row);
      if (!byId.has(entry.id)) {
        byId.set(entry.id, entry);
      }
    }
    return byId;
  }

  /**
   * The cross-table result set, from either header control or both.
   *
   * Get_Missing_Setup_Entries only takes one language, so the audited languages are
   * queried in parallel and *unioned* — a row missing AR *or* FR needs attention. The
   * search is a second, independent filter, so when both are set the two sets are
   * *intersected*: only rows that match the query and are still untranslated.
   */
  private async fetchCrossTableEntries(): Promise<TranslationEntry[]> {
    const query = this.appliedSearchQuery;
    const codes = this.missingLanguageCodes;
    if (!this.ticket || (codes.length === 0 && !query)) {
      return [];
    }

    const [missingRows, searchRows] = await Promise.all([
      codes.length > 0 ? Promise.all(codes.map(code => this.setupService.getMissingSetupEntries({ language: code.toUpperCase() }))) : Promise.resolve(null),
      query ? this.setupService.searchSetupByDescription({ query }) : Promise.resolve(null),
    ]);

    const missing = missingRows ? this.indexEntries(missingRows.flat()) : null;
    const found = searchRows ? this.indexEntries(searchRows) : null;
    const combined = missing && found ? new Map([...found].filter(([id]) => missing.has(id))) : (missing ?? found ?? new Map<string, TranslationEntry>());

    // Sorted by table so the entries table can open a group header whenever the name changes.
    return [...combined.values()].sort((a, b) => (a.tableName ?? '').localeCompare(b.tableName ?? '') || (a.meta?.displayOrder ?? 0) - (b.meta?.displayOrder ?? 0));
  }

  // #endregion

  // #region Derived state

  private get activeTable(): TranslationTable | undefined {
    return this.tables.find(table => table.id === this.activeTableId);
  }

  private get orderedLanguages(): TranslationLanguage[] {
    return orderLanguages(this.languages);
  }

  /**
   * Languages worth auditing for missing text. The source language is what
   * everything else is translated *from*, so "missing in English" is not a
   * question either filter should offer.
   */
  private get auditableLanguages(): TranslationLanguage[] {
    const sourceCode = getSourceLanguage(this.languages)?.code;
    return this.languages.filter(language => language.code !== sourceCode);
  }

  /** True when a table survives the "used in this codebase" switch. */
  private isTableAllowed(name: string | undefined): boolean {
    return !this.usedTablesOnly || !name || USED_SETUP_TABLE_SET.has(name);
  }

  /** The tables the picker offers — every one Setup reports, or only those the app reads. */
  private get visibleTables(): TranslationTable[] {
    return this.usedTablesOnly ? this.tables.filter(table => this.isTableAllowed(table.name)) : this.tables;
  }

  /** Cross-table results narrowed by the same switch, so search and audits can't surface a table the picker hides. */
  private get allowedCrossTableEntries(): TranslationEntry[] {
    return this.usedTablesOnly ? this.crossTableEntries.filter(entry => this.isTableAllowed(entry.tableName)) : this.crossTableEntries;
  }

  /** True once either header control is engaged — the grid then shows rows from every table. */
  private get isCrossTableMode(): boolean {
    return this.missingLanguageCodes.length > 0 || this.appliedSearchQuery.length > 0;
  }

  /** Whatever the entries panel is currently showing: the cross-table missing set, or the active table's keys. */
  private get displayedEntries(): TranslationEntry[] {
    return this.isCrossTableMode ? this.allowedCrossTableEntries : (this.activeTable?.entries ?? []);
  }

  /**
   * Columns for the grid. The cross-table view narrows to the reference language
   * plus the ones being audited, so the missing cells are on screen without
   * scrolling past every other language.
   */
  private get displayedLanguages(): TranslationLanguage[] {
    // Only a language audit has columns worth narrowing to; a plain search says nothing about which ones matter.
    if (this.missingLanguageCodes.length === 0) {
      return this.orderedLanguages;
    }
    const source = getSourceLanguage(this.languages);
    const audited = this.languages.filter(language => this.missingLanguageCodes.includes(language.code));
    const seen = new Set<string>();
    return [...(source ? [source] : []), ...audited].filter(language => {
      if (seen.has(language.code)) {
        return false;
      }
      seen.add(language.code);
      return true;
    });
  }

  /** Names the control that came up empty, so the user knows which one to loosen. */
  private get crossTableEmptyMessage(): string {
    const query = this.appliedSearchQuery;
    const hasLanguages = this.missingLanguageCodes.length > 0;
    if (query && hasLanguages) {
      return `No keys matching “${query}” are still missing a translation in the selected languages.`;
    }
    if (query) {
      return `No keys match “${query}” in any table.`;
    }
    return 'Nothing is missing a translation in the selected languages.';
  }

  /** Distinct tables represented in the missing set, in the order they appear — the panel's table filter options. */
  private get crossTableNames(): string[] {
    return [...new Set(this.allowedCrossTableEntries.map(entry => entry.tableName).filter((name): name is string => !!name))];
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
    const tables = this.visibleTables;
    const query = this.tableQuery.trim().toLowerCase();
    if (!query || query === this.activeTable?.name.toLowerCase()) {
      return tables;
    }
    return tables.filter(table => table.name.toLowerCase().includes(query));
  }

  // #endregion

  private updateActiveTable(update: (table: TranslationTable) => TranslationTable) {
    const activeId = this.activeTableId;
    this.tables = this.tables.map(table => (table.id === activeId ? update(table) : table));
  }

  /** The table a row is written back to — its own in the cross-table view, the active one otherwise. */
  private tableNameFor(entry: TranslationEntry): string | undefined {
    return entry.tableName ?? this.activeTable?.name;
  }

  /**
   * Writes back into whichever collection is on screen. `tableId` pins a table-mode
   * write to the table it started against, so a rollback landing after a table
   * switch can't corrupt the newly-selected one.
   */
  private patchEntries(update: (entries: TranslationEntry[]) => TranslationEntry[], tableId?: string | null) {
    if (this.isCrossTableMode) {
      this.crossTableEntries = update(this.crossTableEntries);
      return;
    }
    const targetId = tableId ?? this.activeTableId;
    this.tables = this.tables.map(table => (table.id === targetId ? { ...table, entries: update(table.entries) } : table));
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
    if (this.isCrossTableMode) {
      this.refresh$.next();
      return;
    }
    if (this.activeTableId) {
      this.loadTableEntries(this.activeTableId);
    }
  };

  private async handleEntryChange(updatedEntry: TranslationEntry) {
    const tableName = this.tableNameFor(updatedEntry);
    if (!tableName) {
      return;
    }
    const tableId = this.activeTableId;
    const previousEntries = this.displayedEntries;
    // Optimistic — the cell already shows the new value before the write lands.
    this.patchEntries(entries => entries.map(entry => (entry.id === updatedEntry.id ? updatedEntry : entry)), tableId);

    this.isMutating = true;
    try {
      const saved = await this.setupService.editSetup(
        buildEditSetupParams({
          ownerId: this.propertyid,
          entryUserId: this.userId,
          tableName,
          key: updatedEntry.key,
          values: updatedEntry.values,
          meta: updatedEntry.meta,
          touch: false,
        }),
      );
      const savedEntry = setupEntryToTranslationEntry(saved);
      this.patchEntries(entries => entries.map(entry => (entry.id === savedEntry.id ? savedEntry : entry)), tableId);
      showToast({ type: 'success', title: 'Saved Successfully' });
    } catch (error) {
      this.patchEntries(() => previousEntries, tableId);
    } finally {
      this.isMutating = false;
    }
  }

  /** Flips ISVISIBLE for one entry — a deliberate settings change, so it stamps a fresh ENTRY_DATE like any other content edit. */
  private async handleToggleVisibility(entry: TranslationEntry) {
    const tableName = this.tableNameFor(entry);
    if (!tableName) {
      return;
    }
    const tableId = this.activeTableId;
    const nextVisible = !(entry.meta?.isVisible ?? true);
    const previousEntries = this.displayedEntries;
    this.patchEntries(entries => entries.map(item => (item.id === entry.id && item.meta ? { ...item, meta: { ...item.meta, isVisible: nextVisible } } : item)), tableId);

    this.isMutating = true;
    try {
      const saved = await this.setupService.editSetup(
        buildEditSetupParams({
          ownerId: this.propertyid,
          entryUserId: this.userId,
          tableName,
          key: entry.key,
          values: entry.values,
          meta: entry.meta ? { ...entry.meta, isVisible: nextVisible } : entry.meta,
          touch: true,
        }),
      );
      const savedEntry = setupEntryToTranslationEntry(saved);
      this.patchEntries(entries => entries.map(item => (item.id === savedEntry.id ? savedEntry : item)), tableId);
      showToast({ type: 'success', title: nextVisible ? 'Key shown in app' : 'Key hidden from app' });
    } catch (error) {
      this.patchEntries(() => previousEntries, tableId);
    } finally {
      this.isMutating = false;
    }
  }

  /** A row drag finished — reindex every row's display order locally and flag it unsaved. */
  private handleReorderEntries(orderedEntries: TranslationEntry[]) {
    // Order is a per-table concept — the cross-table view has no single table to reindex.
    if (this.isCrossTableMode) {
      return;
    }
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
    if (!table || this.isCrossTableMode) {
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
    if (this.activeTableId && !this.isCrossTableMode) {
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

  private async confirmDelete() {
    if (!this.deleteTarget) {
      return;
    }
    this.isMutating = true;
    try {
      if (this.deleteTarget.type === 'entry') {
        const entry = this.displayedEntries.find(item => item.id === this.deleteTarget.id);
        const tableName = entry ? this.tableNameFor(entry) : undefined;
        if (entry && tableName) {
          await this.setupService.editSetup(
            buildEditSetupParams({
              ownerId: this.propertyid,
              entryUserId: this.userId,
              tableName,
              key: entry.key,
              values: entry.values,
              meta: entry.meta,
              isDeleted: true,
              touch: true,
            }),
          );
          this.patchEntries(entries => entries.filter(item => item.id !== entry.id));
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

  /**
   * Either header control takes the grid cross-table, so the table picker stops
   * selecting and the panel's own table filter takes over narrowing.
   */
  private handleMissingLanguagesChange(codes: string[]) {
    this.missingLanguageCodes = codes;
    this.refresh$.next();
  }

  private handleSearchQueryChange(query: string) {
    this.search$.next(query);
  }

  /** Narrowing the list can strand the active table off it — fall back to the first one still on offer. */
  private handleUsedTablesOnlyChange(enabled: boolean) {
    this.usedTablesOnly = enabled;
    if (enabled && this.activeTable && !this.isTableAllowed(this.activeTable.name)) {
      this.setActiveTable(this.visibleTables[0]?.id ?? null);
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
            value={this.isCrossTableMode ? 'All tables' : this.tableQuery}
            disabled={this.isCrossTableMode}
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

        {/*
          Deliberately uncontrolled. Binding `value` to state round-trips every
          keystroke back through a re-render, and wa-input re-emits `input` when its
          value is set — two events per character, the echo carrying whatever value
          the async re-render happened to write. debounceTime then settles on the
          echo, so a fast typist searches for a prefix of what's in the box.
        */}
        <wa-input
          class="tm__search"
          size="s"
          with-clear
          label="Search eng in all tables"
          placeholder="Search eng in all tables…"
          autocomplete="off"
          spellcheck={false}
          disabled={this.orderDirty}
          title={this.orderDirty ? 'Save or discard the pending order first' : undefined}
          oninput={(e: Event) => this.handleSearchQueryChange((e.target as HTMLInputElement).value)}
        >
          <wa-icon name="magnifying-glass" slot="start" aria-hidden="true"></wa-icon>
        </wa-input>

        {/* max-options-visible: two tags wrap in a header-width control and shove the row taller. */}
        <wa-select
          class="tm__missing-select"
          size="s"
          multiple
          with-clear
          max-options-visible={1}
          label="Missing language in all tables…"
          placeholder="Missing language in all tables…"
          value={this.missingLanguageCodes}
          disabled={this.orderDirty}
          title={this.orderDirty ? 'Save or discard the pending order first' : undefined}
          onchange={(e: Event) => this.handleMissingLanguagesChange([...(((e.target as HTMLSelectElement).value as unknown as string[]) ?? [])])}
        >
          {this.auditableLanguages.map(language => (
            <wa-option key={language.code} value={language.code}>
              {language.name}
            </wa-option>
          ))}
        </wa-select>

        <wa-switch
          class="tm__used-only"
          size="s"
          checked={this.usedTablesOnly}
          defaultChecked={this.usedTablesOnly}
          onchange={(e: Event) => this.handleUsedTablesOnlyChange((e.target as HTMLInputElement).checked)}
        >
          Used in app
        </wa-switch>
      </div>
    );
  }

  render() {
    const activeTable = this.activeTable;
    const languages = this.orderedLanguages;
    const sourceCode = getSourceLanguage(this.languages)?.code;
    // In the cross-table view the drawer follows the row being edited, not the picker.
    const drawerTableName = this.entryDrawerEntry?.tableName ?? activeTable?.name;

    return (
      <Host>
        <ir-page class={'translation-manager__page'} label="Setup Entries">
          {this.renderPageActions()}

          {this.isLoading ? (
            <div class="tm__loader-container">
              <ir-spinner></ir-spinner>
              <p>Loading translation tables…</p>
            </div>
          ) : !activeTable && !this.isCrossTableMode ? (
            <ir-empty-state message="No translation tables yet — create one to start translating strings.">
              <ir-custom-button variant="brand" appearance="filled" onClickHandler={() => this.openCreateTable()}>
                New table
              </ir-custom-button>
            </ir-empty-state>
          ) : this.isCrossTableMode && !this.isLoadingCrossTable && this.allowedCrossTableEntries.length === 0 ? (
            <ir-empty-state message={this.crossTableEmptyMessage}></ir-empty-state>
          ) : (
            <ir-translations-entries-panel
              entries={this.displayedEntries}
              languages={this.displayedLanguages}
              sourceCode={sourceCode}
              isLoading={this.isLoadingEntries || this.isLoadingCrossTable}
              disableActions={this.isMutating}
              groupByTable={this.isCrossTableMode}
              tableNames={this.crossTableNames}
              disableCreate={this.isCrossTableMode}
              hasPendingOrder={this.orderDirty}
              changedEntryIds={this.changedEntryIds}
              duplicates={this.duplicates}
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
          existingKeys={this.displayedEntries.filter(entry => entry.tableName === drawerTableName).map(entry => entry.key)}
          nextDisplayOrder={this.nextDisplayOrder}
          tableName={drawerTableName}
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
