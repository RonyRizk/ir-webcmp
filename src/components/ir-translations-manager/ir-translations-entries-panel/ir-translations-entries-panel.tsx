import type WaInput from '@awesome.me/webawesome/dist/components/input/input';
import { Component, Event, EventEmitter, Prop, State, Watch, h } from '@stencil/core';
import { DuplicateInfo, EntryStatusFilter, TranslationEntry, TranslationLanguage } from '../types';
import { countMissing } from '../utils';

/**
 * Owns the entries table plus its client-side search/status filtering — the
 * parent manager just hands it one table's raw entries and listens for the
 * CRUD intents it emits.
 */
@Component({
  tag: 'ir-translations-entries-panel',
  styleUrl: 'ir-translations-entries-panel.css',
  scoped: true,
})
export class IrTranslationsEntriesPanel {
  /** The active table's unfiltered entries — filtered internally for display. */
  @Prop() entries: TranslationEntry[] = [];
  @Prop() languages: TranslationLanguage[] = [];
  @Prop() sourceCode?: string;
  /** True while the active table's keys are still loading. */
  @Prop() isLoading: boolean = false;
  /** Disables the "New key" action, e.g. while another write is in flight. */
  @Prop() disableActions: boolean = false;
  /** True once a drag reorder is applied locally but not yet saved — shows the Save/Discard order buttons. */
  @Prop() hasPendingOrder: boolean = false;
  /** Ids of rows whose position differs from the last-loaded/saved order — marked in the table while a reorder is pending. */
  @Prop() changedEntryIds: Set<string> = new Set();
  /** True when `entries` span several setup tables — adds the table filter and hands the table its grouped rendering. */
  @Prop() groupByTable: boolean = false;
  /** Distinct table names present in `entries`, in display order — the table filter's options. */
  @Prop() tableNames: string[] = [];
  /** Disables the "New key" action outright, e.g. in the cross-table view where there is no single table to create into. */
  @Prop() disableCreate: boolean = false;
  /** Entry id → the tables sharing that row's description; rows present here get a duplicate badge. */
  @Prop() duplicates: Map<string, DuplicateInfo> = new Map();

  @Event() createEntry: EventEmitter<void>;
  @Event() editEntry: EventEmitter<TranslationEntry>;
  @Event() duplicateEntry: EventEmitter<TranslationEntry>;
  @Event() deleteEntry: EventEmitter<TranslationEntry>;
  @Event() entryChange: EventEmitter<TranslationEntry>;
  @Event() reorderEntries: EventEmitter<TranslationEntry[]>;
  @Event() toggleVisibility: EventEmitter<TranslationEntry>;
  @Event() saveOrder: EventEmitter<void>;
  @Event() discardOrder: EventEmitter<void>;

  @State() searchTerm: string = '';
  @State() statusFilter: EntryStatusFilter = 'all';
  /** Table name to narrow to, or 'all'. Only surfaced while `groupByTable` is on. */
  @State() tableFilter: string = 'all';
  /** Language codes to audit within the rows on screen — a row survives if it's untranslated in any of them. */
  @State() missingLanguageFilter: string[] = [];
  @State() shortcutHint: string | null = null;

  private searchInputRef?: WaInput;

  componentWillLoad() {
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (!isTouchDevice) {
      this.shortcutHint = '/';
    }
    document.addEventListener('keydown', this.handleGlobalKeyDown);
  }

  disconnectedCallback() {
    document.removeEventListener('keydown', this.handleGlobalKeyDown);
  }

  /** A new result set (e.g. the language selection changed) can drop the table that was filtered on — don't strand the user on an empty grid. */
  @Watch('tableNames')
  handleTableNamesChange(newNames: string[]) {
    if (this.tableFilter !== 'all' && !newNames.includes(this.tableFilter)) {
      this.tableFilter = 'all';
    }
  }

  /** Hiding a language (or narrowing the grid in the cross-table view) must not leave an invisible filter applied. */
  @Watch('languages')
  handleLanguagesChange(newLanguages: TranslationLanguage[]) {
    if (this.missingLanguageFilter.length === 0) {
      return;
    }
    const visible = new Set(newLanguages.filter(language => language.code !== this.sourceCode).map(language => language.code));
    const next = this.missingLanguageFilter.filter(code => visible.has(code));
    if (next.length !== this.missingLanguageFilter.length) {
      this.missingLanguageFilter = next;
    }
  }

  /** `/` jumps to search the way most keyboard-driven tools do — unlike ⌘F it doesn't fight the browser. */
  private handleGlobalKeyDown = (event: KeyboardEvent) => {
    if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) {
      return;
    }
    const target = event.target as HTMLElement | null;
    if (target?.closest('input, textarea, [contenteditable="true"], wa-input, wa-textarea, wa-select')) {
      return;
    }
    event.preventDefault();
    this.searchInputRef?.focus();
  };

  /** The source language is what everything else is translated from, so "untranslated in English" isn't a useful filter. */
  private get auditableLanguages(): TranslationLanguage[] {
    return this.languages.filter(language => language.code !== this.sourceCode);
  }

  private get filteredEntries(): TranslationEntry[] {
    const term = this.searchTerm.trim().toLowerCase();
    // Resolved once rather than per row; empty means the language filter is off.
    const audited = this.missingLanguageFilter.length > 0 ? this.languages.filter(language => this.missingLanguageFilter.includes(language.code)) : [];

    return this.entries.filter(entry => {
      if (term && !entry.key.toLowerCase().includes(term) && !Object.values(entry.values).some(value => value.toLowerCase().includes(term))) {
        return false;
      }
      if (this.tableFilter !== 'all' && entry.tableName !== this.tableFilter) {
        return false;
      }
      // Untranslated in *any* audited language is enough — same union rule the header's cross-table filter uses.
      if (audited.length > 0 && countMissing(entry, audited) === 0) {
        return false;
      }
      if (this.statusFilter === 'all') {
        return true;
      }
      if (this.statusFilter === 'hidden') {
        return entry.meta?.isVisible === false;
      }
      const missing = countMissing(entry, this.languages);
      return this.statusFilter === 'missing' ? missing > 0 : missing === 0;
    });
  }

  private get hasActiveFilters(): boolean {
    return this.searchTerm.trim().length > 0 || this.statusFilter !== 'all' || this.tableFilter !== 'all' || this.missingLanguageFilter.length > 0;
  }

  private clearFilters = (e: CustomEvent) => {
    this.stopPropagation(e);
    this.searchTerm = '';
    this.statusFilter = 'all';
    this.tableFilter = 'all';
    this.missingLanguageFilter = [];
  };

  private renderToolbar() {
    return (
      <div class="entries-panel__toolbar">
        <wa-input
          class="entries-panel__search"
          size="s"
          with-clear
          label="Search keys and translations"
          value={this.searchTerm}
          placeholder="Search keys and translations"
          autocomplete="off"
          spellcheck={false}
          ref={el => (this.searchInputRef = el)}
          oninput={(e: Event) => (this.searchTerm = (e.target as HTMLInputElement).value)}
        >
          <wa-icon name="magnifying-glass" slot="start" aria-hidden="true"></wa-icon>
          {this.shortcutHint && !this.searchTerm && (
            <span slot="end" class="entries-panel__search-hint" aria-hidden="true">
              {this.shortcutHint}
            </span>
          )}
        </wa-input>

        <wa-select
          class="entries-panel__status"
          size="s"
          label="Status"
          value={this.statusFilter}
          onchange={(e: Event) => (this.statusFilter = (e.target as HTMLSelectElement).value as EntryStatusFilter)}
        >
          <wa-option value="all">All keys</wa-option>
          <wa-option value="missing">Needs translation</wa-option>
          <wa-option value="complete">Complete</wa-option>
          <wa-option value="hidden">Hidden from app</wa-option>
        </wa-select>

        {/* max-options-visible: two tags already wrap in a toolbar-width control and shove the row taller. */}
        {this.auditableLanguages.length > 0 && (
          <wa-select
            class="entries-panel__missing-filter"
            size="s"
            multiple
            with-clear
            max-options-visible={1}
            label="Untranslated in"
            placeholder="Untranslated in…"
            value={this.missingLanguageFilter}
            onchange={(e: Event) => (this.missingLanguageFilter = [...(((e.target as HTMLSelectElement).value as unknown as string[]) ?? [])])}
          >
            {this.auditableLanguages.map(language => (
              <wa-option key={language.code} value={language.code}>
                {language.name}
              </wa-option>
            ))}
          </wa-select>
        )}

        {this.groupByTable && this.tableNames.length > 1 && (
          <wa-select
            class="entries-panel__table-filter"
            size="s"
            label="Table"
            value={this.tableFilter}
            onchange={(e: Event) => (this.tableFilter = (e.target as HTMLSelectElement).value)}
          >
            <wa-option value="all">All tables</wa-option>
            {this.tableNames.map(name => (
              <wa-option key={name} value={name}>
                {name}
              </wa-option>
            ))}
          </wa-select>
        )}
        {this.hasPendingOrder && (
          <ir-custom-button style={{ marginLeft: 'auto' }} variant="neutral" appearance="outlined" disabled={this.disableActions} onClickHandler={() => this.discardOrder.emit()}>
            Discard
          </ir-custom-button>
        )}
        {this.hasPendingOrder && (
          <ir-custom-button variant="brand" appearance="accent" disabled={this.disableActions} loading={this.disableActions} onClickHandler={() => this.saveOrder.emit()}>
            Save
          </ir-custom-button>
        )}
        <ir-custom-button
          style={{ marginLeft: this.hasPendingOrder ? null : 'auto' }}
          variant="brand"
          appearance="filled"
          disabled={this.disableActions || this.isLoading || this.disableCreate}
          onClickHandler={() => this.createEntry.emit()}
        >
          <wa-icon name="plus" slot="start" aria-hidden="true"></wa-icon>
          New key
        </ir-custom-button>
      </div>
    );
  }

  private renderFooter(shown: number, total: number, missing: number, tables: number) {
    return (
      <div class="entries-panel__footer" aria-live="polite">
        <span>
          {shown === total ? `${total} key${total === 1 ? '' : 's'}` : `${shown} of ${total} keys`}
          {this.groupByTable && tables > 0 && ` · ${tables} table${tables === 1 ? '' : 's'}`}
        </span>
        {missing > 0 && (
          <button type="button" class="entries-panel__missing-link" onClick={() => (this.statusFilter = this.statusFilter === 'missing' ? 'all' : 'missing')}>
            {missing} need{missing === 1 ? 's' : ''} translation
          </button>
        )}
      </div>
    );
  }

  private stopPropagation(e: CustomEvent<unknown>) {
    e.stopImmediatePropagation();
    e.stopPropagation();
  }

  render() {
    const filteredEntries = this.filteredEntries;
    const total = this.entries.length;
    const missing = this.entries.filter(entry => countMissing(entry, this.languages) > 0).length;
    const shownTables = new Set(filteredEntries.map(entry => entry.tableName)).size;

    return (
      <div class="entries-panel__card">
        {this.renderToolbar()}

        {this.isLoading ? (
          <div class="entries-panel__loader-container">
            <ir-spinner></ir-spinner>
            <p>Loading keys…</p>
          </div>
        ) : (
          <ir-translations-entries-table
            entries={filteredEntries}
            languages={this.languages}
            sourceCode={this.sourceCode}
            compact={false}
            filtered={this.hasActiveFilters}
            groupByTable={this.groupByTable}
            reorderEnabled={!this.hasActiveFilters && !this.groupByTable}
            changedEntryIds={this.changedEntryIds}
            duplicates={this.duplicates}
            onEntryChange={(e: CustomEvent<TranslationEntry>) => {
              this.stopPropagation(e);
              this.entryChange.emit(e.detail);
            }}
            onEditEntry={(e: CustomEvent<TranslationEntry>) => {
              this.stopPropagation(e);
              this.editEntry.emit(e.detail);
            }}
            onDuplicateEntry={(e: CustomEvent<TranslationEntry>) => {
              this.stopPropagation(e);
              this.duplicateEntry.emit(e.detail);
            }}
            onDeleteEntry={(e: CustomEvent<TranslationEntry>) => {
              this.stopPropagation(e);
              this.deleteEntry.emit(e.detail);
            }}
            onClearFilters={this.clearFilters}
            onReorderEntries={(e: CustomEvent<TranslationEntry[]>) => {
              this.stopPropagation(e);
              this.reorderEntries.emit(e.detail);
            }}
            onToggleVisibility={(e: CustomEvent<TranslationEntry>) => {
              this.stopPropagation(e);
              this.toggleVisibility.emit(e.detail);
            }}
          ></ir-translations-entries-table>
        )}

        {!this.isLoading && total > 0 && this.renderFooter(filteredEntries.length, total, missing, shownTables)}
      </div>
    );
  }
}
