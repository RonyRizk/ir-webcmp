import type WaInput from '@awesome.me/webawesome/dist/components/input/input';
import { Component, Event, EventEmitter, Prop, State, h } from '@stencil/core';
import { EntryStatusFilter, TranslationEntry, TranslationLanguage } from '../types';
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

  private get filteredEntries(): TranslationEntry[] {
    const term = this.searchTerm.trim().toLowerCase();

    return this.entries.filter(entry => {
      if (term && !entry.key.toLowerCase().includes(term) && !Object.values(entry.values).some(value => value.toLowerCase().includes(term))) {
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
    return this.searchTerm.trim().length > 0 || this.statusFilter !== 'all';
  }

  private clearFilters = (e: CustomEvent) => {
    this.stopPropagation(e);
    this.searchTerm = '';
    this.statusFilter = 'all';
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
          disabled={this.disableActions || this.isLoading}
          onClickHandler={() => this.createEntry.emit()}
        >
          <wa-icon name="plus" slot="start" aria-hidden="true"></wa-icon>
          New key
        </ir-custom-button>
      </div>
    );
  }

  private renderFooter(shown: number, total: number, missing: number) {
    return (
      <div class="entries-panel__footer" aria-live="polite">
        <span>{shown === total ? `${total} key${total === 1 ? '' : 's'}` : `${shown} of ${total} keys`}</span>
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
            reorderEnabled={!this.hasActiveFilters}
            changedEntryIds={this.changedEntryIds}
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

        {!this.isLoading && total > 0 && this.renderFooter(filteredEntries.length, total, missing)}
      </div>
    );
  }
}
