import type WaInput from '@awesome.me/webawesome/dist/components/input/input';
import { flexRender, useTable } from '@/utils/useTable';
import { Component, Event, EventEmitter, Host, Prop, State, Watch, h } from '@stencil/core';
import { type Cell, type Row, createColumnHelper, getCoreRowModel } from '@tanstack/table-core';
import { TranslationEntry, TranslationLanguage } from '../types';
import { hasValue } from '../utils';

type EditingCell = { entryId: string; languageCode: string };

@Component({
  tag: 'ir-translations-entries-table',
  styleUrl: 'ir-translations-entries-table.css',
  scoped: true,
})
export class IrTranslationsEntriesTable {
  /** Rows to render, already filtered by the parent. */
  @Prop() entries: TranslationEntry[] = [];
  /** Column order — the source language is expected first. */
  @Prop() languages: TranslationLanguage[] = [];
  /** Code of the reference language, marked in the header. */
  @Prop() sourceCode?: string;
  @Prop() compact: boolean = true;
  /** True when the parent's filters hid every row, so the empty state can say so. */
  @Prop() filtered: boolean = false;
  /** False while a search/status filter is active — reordering a filtered subset can't map cleanly onto the full list. */
  @Prop() reorderEnabled: boolean = true;
  /** Ids of rows whose position differs from the last-loaded/saved order — highlighted while a reorder is pending. */
  @Prop() changedEntryIds: Set<string> = new Set();

  @Event() entryChange: EventEmitter<TranslationEntry>;
  @Event() editEntry: EventEmitter<TranslationEntry>;
  @Event() duplicateEntry: EventEmitter<TranslationEntry>;
  @Event() deleteEntry: EventEmitter<TranslationEntry>;
  @Event() clearFilters: EventEmitter<void>;
  @Event() reorderEntries: EventEmitter<TranslationEntry[]>;
  @Event() toggleVisibility: EventEmitter<TranslationEntry>;

  @State() editingCell: EditingCell | null = null;
  /** Working copy of `entries`, live-reordered while a drag is in progress. */
  @State() dragEntries: TranslationEntry[] = [];
  @State() draggingId: string | null = null;
  /** `.table--container`'s current content-box width — language columns stretch to fill it instead of sitting fixed. */
  @State() containerWidth: number = 0;

  private cellInputRef?: WaInput;
  private lastFocusKey: string | null = null;
  /** Live text of the cell being edited. Deliberately not @State — keystrokes must not re-render the grid. */
  private draft: string = '';
  private containerRef?: HTMLDivElement;
  private containerResizeObserver?: ResizeObserver;
  /** Latest pointer Y during a drag, read by the auto-scroll loop — not @State, it'd re-render on every dragover. */
  private dragClientY: number | null = null;
  private autoScrollRaf: number | null = null;

  componentWillLoad() {
    this.dragEntries = this.entries;
  }

  componentDidLoad() {
    if (this.containerRef) {
      this.containerResizeObserver = new ResizeObserver(entries => {
        const width = entries[0]?.contentRect.width;
        if (width) {
          this.containerWidth = width;
        }
      });
      this.containerResizeObserver.observe(this.containerRef);
    }
  }

  disconnectedCallback() {
    this.containerResizeObserver?.disconnect();
    this.stopAutoScroll();
  }

  /** A drag in progress owns row order locally — only resync from the parent once it's idle. */
  @Watch('entries')
  handleEntriesChange(newEntries: TranslationEntry[]) {
    if (!this.draggingId) {
      this.dragEntries = newEntries;
    }
  }

  componentDidRender() {
    const focusKey = this.editingCell ? `${this.editingCell.entryId}:${this.editingCell.languageCode}` : null;
    if (focusKey && focusKey !== this.lastFocusKey) {
      // wa-input's shadow DOM hasn't necessarily finished its first Lit
      // render synchronously after insertion, so focus() can run before the
      // internal <input> exists — defer past that render.
      requestAnimationFrame(() => this.cellInputRef?.focus());
    }
    this.lastFocusKey = focusKey;
  }

  private startEditing(entry: TranslationEntry, code: string) {
    this.draft = entry.values[code] ?? '';
    this.editingCell = { entryId: entry.id, languageCode: code };
  }

  private commitDraft(entry: TranslationEntry, code: string) {
    // Idempotent per edit session — Enter/Tab commits and moves on, then the
    // outgoing input's native blur fires too (async, once it's actually
    // removed from the DOM); without this guard that blur would re-commit
    // using whatever cell's draft happens to be live by then.
    if ((entry.values[code] ?? '') === this.draft) {
      return;
    }
    this.entryChange.emit({ ...entry, values: { ...entry.values, [code]: this.draft } });
  }

  /**
   * Moves the edit caret through the grid, wrapping across row ends so Tab
   * walks the whole table the way a spreadsheet does.
   */
  private moveEditing(entryId: string, code: string, rowDelta: number, colDelta: number) {
    const rowIndex = this.dragEntries.findIndex(entry => entry.id === entryId);
    const colIndex = this.languages.findIndex(language => language.code === code);
    if (rowIndex === -1 || colIndex === -1) {
      this.editingCell = null;
      return;
    }

    let nextRow = rowIndex + rowDelta;
    let nextCol = colIndex + colDelta;
    if (nextCol >= this.languages.length) {
      nextCol = 0;
      nextRow += 1;
    } else if (nextCol < 0) {
      nextCol = this.languages.length - 1;
      nextRow -= 1;
    }

    const nextEntry = this.dragEntries[nextRow];
    if (!nextEntry) {
      this.editingCell = null;
      return;
    }
    this.startEditing(nextEntry, this.languages[nextCol].code);
  }

  private handleCellKeyDown(event: KeyboardEvent, entry: TranslationEntry, code: string, originalValue: string) {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.draft = originalValue;
      this.editingCell = null;
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      this.commitDraft(entry, code);
      this.moveEditing(entry.id, code, event.shiftKey ? -1 : 1, 0);
      return;
    }
    if (event.key === 'Tab') {
      event.preventDefault();
      this.commitDraft(entry, code);
      this.moveEditing(entry.id, code, 0, event.shiftKey ? -1 : 1);
    }
  }

  private handleCellBlur(entry: TranslationEntry, code: string) {
    // Keyboard navigation has already pointed editingCell at the next cell by
    // the time this fires, so only a genuine focus-out should close the editor.
    if (this.editingCell?.entryId === entry.id && this.editingCell?.languageCode === code) {
      this.editingCell = null;
    }
  }

  private handleRowAction(action: string, entry: TranslationEntry) {
    switch (action) {
      case 'edit':
        this.editEntry.emit(entry);
        break;
      case 'duplicate':
        this.duplicateEntry.emit(entry);
        break;
      case 'copy':
        navigator.clipboard?.writeText(entry.key);
        break;
      case 'delete':
        this.deleteEntry.emit(entry);
        break;
      case 'toggle-visibility':
        this.toggleVisibility.emit(entry);
        break;
    }
  }

  // #region Drag and drop

  private handleDragStart = (event: DragEvent, entry: TranslationEntry) => {
    if (!this.reorderEnabled) {
      event.preventDefault();
      return;
    }
    this.draggingId = entry.id;
    event.dataTransfer?.setData('text/plain', entry.id);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
    this.startAutoScroll();
  };

  /** Live-shifts the dragged row to the position of whichever row it's currently hovering. */
  private handleDragOver = (event: DragEvent, overEntry: TranslationEntry) => {
    if (!this.reorderEnabled || !this.draggingId) {
      return;
    }
    event.preventDefault();
    this.dragClientY = event.clientY;
    if (this.draggingId === overEntry.id) {
      return;
    }
    const fromIndex = this.dragEntries.findIndex(entry => entry.id === this.draggingId);
    const toIndex = this.dragEntries.findIndex(entry => entry.id === overEntry.id);
    if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
      return;
    }
    const next = [...this.dragEntries];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    this.dragEntries = next;
  };

  /** Catches dragover over the container's own padding/gaps (not just row cells) so the pointer Y stays fresh for auto-scroll. */
  private handleContainerDragOver = (event: DragEvent) => {
    if (!this.reorderEnabled || !this.draggingId) {
      return;
    }
    event.preventDefault();
    this.dragClientY = event.clientY;
  };

  private handleDragEnd = () => {
    const changed = this.dragEntries.length === this.entries.length && this.dragEntries.some((entry, index) => entry.id !== this.entries[index]?.id);
    if (changed) {
      this.reorderEntries.emit(this.dragEntries);
    }
    this.draggingId = null;
    this.stopAutoScroll();
  };

  /**
   * Native HTML5 drag has no scroll-follow of its own, so a row dragged past
   * the container's top/bottom edge would otherwise strand the user there —
   * nudge `.table--container`'s own scroll position each frame while the
   * pointer sits in either edge zone, faster the closer it is to the edge.
   */
  private startAutoScroll() {
    if (this.autoScrollRaf !== null) {
      return;
    }
    const edgeZone = 48;
    const maxSpeed = 16;
    const tick = () => {
      if (!this.draggingId || this.dragClientY === null || !this.containerRef) {
        this.autoScrollRaf = null;
        return;
      }
      const rect = this.containerRef.getBoundingClientRect();
      let delta = 0;
      if (this.dragClientY < rect.top + edgeZone) {
        delta = -maxSpeed * Math.min(1, (rect.top + edgeZone - this.dragClientY) / edgeZone);
      } else if (this.dragClientY > rect.bottom - edgeZone) {
        delta = maxSpeed * Math.min(1, (this.dragClientY - (rect.bottom - edgeZone)) / edgeZone);
      }
      if (delta !== 0) {
        this.containerRef.scrollTop += delta;
      }
      this.autoScrollRaf = requestAnimationFrame(tick);
    };
    this.autoScrollRaf = requestAnimationFrame(tick);
  }

  private stopAutoScroll() {
    if (this.autoScrollRaf !== null) {
      cancelAnimationFrame(this.autoScrollRaf);
      this.autoScrollRaf = null;
    }
    this.dragClientY = null;
  }

  private renderDragHandle(entry: TranslationEntry) {
    const label = this.reorderEnabled ? `Reorder ${entry.key || 'key'}` : 'Clear filters to reorder';
    return (
      <span
        class={`entries-table__drag-handle ${this.reorderEnabled ? '' : '--disabled'}`}
        draggable={this.reorderEnabled}
        title={label}
        aria-label={label}
        onDragStart={(e: DragEvent) => this.handleDragStart(e, entry)}
        onDragEnd={this.handleDragEnd}
      >
        <wa-icon name="grip-vertical" aria-hidden="true"></wa-icon>
      </span>
    );
  }

  // #endregion

  private renderValueCell(entry: TranslationEntry, language: TranslationLanguage) {
    const value = entry.values[language.code] ?? '';
    const isEditing = this.editingCell?.entryId === entry.id && this.editingCell?.languageCode === language.code;
    const ariaLabel = `${language.name} translation for ${entry.key || 'new entry'}`;

    if (entry.meta?.isUpdateable === false) {
      return (
        <span class="entries-table__cell-display --readonly" aria-label={`${ariaLabel} (read-only)`}>
          {hasValue(value) ? (
            <span class="entries-table__cell-text" title={value}>
              {value}
            </span>
          ) : (
            <span class="entries-table__cell-missing">Missing</span>
          )}
          <wa-icon name="lock" class="entries-table__cell-lock" aria-hidden="true"></wa-icon>
        </span>
      );
    }

    if (isEditing) {
      return (
        <wa-input
          size="s"
          value={value}
          class="entries-table__cell-input"
          label={ariaLabel}
          autocomplete="off"
          spellcheck={false}
          ref={el => (this.cellInputRef = el)}
          oninput={(e: Event) => (this.draft = (e.target as HTMLInputElement).value)}
          onKeyDown={(e: KeyboardEvent) => this.handleCellKeyDown(e, entry, language.code, value)}
          onblur={() => this.handleCellBlur(entry, language.code)}
          onchange={() => {
            this.commitDraft(entry, language.code);
          }}
        ></wa-input>
      );
    }

    return (
      <button
        type="button"
        class={`entries-table__cell-display ${hasValue(value) ? '' : '--empty'}`}
        aria-label={hasValue(value) ? `Edit ${ariaLabel}` : `Add ${ariaLabel}`}
        onClick={() => this.startEditing(entry, language.code)}
      >
        {hasValue(value) ? (
          <span class="entries-table__cell-text" title={value}>
            {value}
          </span>
        ) : (
          <span class="entries-table__cell-missing">Missing</span>
        )}
      </button>
    );
  }

  private renderKeyCell(entry: TranslationEntry) {
    const isHidden = entry.meta?.isVisible === false;
    return (
      <div class="entries-table__key-container">
        {isHidden && (
          <span class="entries-table__key-hidden-mark" title="Hidden from the app" aria-label={`${entry.key || 'This key'} is hidden from the app`}>
            <wa-icon name="eye-slash" aria-hidden="true"></wa-icon>
          </span>
        )}
        <span class="entries-table__key-text" title={entry.key}>
          {entry.key}
        </span>
        <wa-icon class="entries-table__key-icon" name="pen-to-square"></wa-icon>
      </div>
    );
  }

  private renderLangHead(language: TranslationLanguage) {
    return (
      <span class="entries-table__lang-head">
        <abbr class="entries-table__lang-code" title={language.name}>
          {language.code.toUpperCase()}
        </abbr>
        {language.code === this.sourceCode && <span class="entries-table__lang-source">source</span>}
      </span>
    );
  }

  private renderActionsCell(entry: TranslationEntry) {
    return (
      <wa-dropdown onwa-select={(e: CustomEvent<any>) => this.handleRowAction(e.detail.item.value, entry)}>
        <ir-custom-button slot="trigger" appearance="plain" variant="neutral" iconBtn>
          <wa-icon name="ellipsis" label={`Actions for ${entry.key || 'entry'}`}></wa-icon>
        </ir-custom-button>
        <wa-dropdown-item value="edit" disabled={entry.meta?.isUpdateable === false}>
          <wa-icon slot="icon" name="pen"></wa-icon>
          Edit all languages
        </wa-dropdown-item>
        {/* <wa-dropdown-item value="duplicate">
          <wa-icon slot="icon" name="copy"></wa-icon>
          Duplicate
        </wa-dropdown-item> */}
        <wa-dropdown-item value="copy">
          <wa-icon slot="icon" name="clipboard"></wa-icon>
          Copy key
        </wa-dropdown-item>
        <wa-dropdown-item value="toggle-visibility">
          <wa-icon slot="icon" name={entry.meta?.isVisible === false ? 'eye' : 'eye-slash'}></wa-icon>
          {entry.meta?.isVisible === false ? 'Show in app' : 'Hide from app'}
        </wa-dropdown-item>
        <wa-dropdown-item value="delete" variant="danger" disabled={entry.meta?.isDeleteable === false}>
          <wa-icon slot="icon" name="trash-can"></wa-icon>
          Delete
        </wa-dropdown-item>
      </wa-dropdown>
    );
  }

  private buildColumns() {
    const helper = createColumnHelper<TranslationEntry>();
    return [
      helper.display({
        id: 'drag',
        header: () => <span class="entries-table__sr-only">Reorder</span>,
        cell: info => this.renderDragHandle(info.row.original),
      }),
      helper.accessor('key', {
        id: 'key',
        header: () => 'Key',
        cell: info => this.renderKeyCell(info.row.original),
      }),
      ...this.languages.map(language =>
        helper.accessor(row => row.values[language.code] ?? '', {
          id: language.code,
          header: () => this.renderLangHead(language),
          cell: info => this.renderValueCell(info.row.original, language),
        }),
      ),
      helper.display({
        id: 'actions',
        header: () => <span class="entries-table__sr-only">Actions</span>,
        cell: info => this.renderActionsCell(info.row.original),
      }),
    ];
  }

  private renderCell(cell: Cell<TranslationEntry, unknown>) {
    const columnId = cell.column.id;
    const isLangColumn = this.languages.some(language => language.code === columnId);
    return (
      <td
        key={cell.id}
        class={{
          'entries-table__key': columnId === 'key',
          'entries-table__value-cell': isLangColumn,
          'entries-table__actions': columnId === 'actions',
          'entries-table__drag-cell': columnId === 'drag',
        }}
        onClick={columnId === 'key' ? () => this.editEntry.emit(cell.row.original) : undefined}
      >
        {flexRender(cell.column.columnDef.cell, cell.getContext())}
      </td>
    );
  }

  private renderRow(row: Row<TranslationEntry>) {
    const entry = row.original;
    return (
      <tr
        key={row.id}
        class={{
          'ir-table-row': true,
          'entries-table__row--dragging': this.draggingId === entry.id,
          'entries-table__row--reordered': this.changedEntryIds.has(entry.id),
          'entries-table__row--hidden': entry.meta?.isVisible === false,
          'entries-table__row--deleted': entry.meta?.isDeleted === true,
        }}
        onDragOver={(e: DragEvent) => this.handleDragOver(e, entry)}
        onDrop={(e: DragEvent) => e.preventDefault()}
      >
        {row.getVisibleCells().map(cell => this.renderCell(cell))}
      </tr>
    );
  }

  private renderEmptyState() {
    if (this.languages.length === 0) {
      return <ir-empty-state message="Add a language before creating translation keys."></ir-empty-state>;
    }
    if (this.filtered) {
      return (
        <ir-empty-state message="No keys match the current search and filters.">
          <ir-custom-button appearance="outlined" variant="neutral" onClickHandler={() => this.clearFilters.emit()}>
            Clear filters
          </ir-custom-button>
        </ir-empty-state>
      );
    }
    return <ir-empty-state message="No keys in this table yet — add one to get started."></ir-empty-state>;
  }

  render() {
    if (this.dragEntries.length === 0 || this.languages.length === 0) {
      return <Host class="--empty">{this.renderEmptyState()}</Host>;
    }

    const columns = this.buildColumns();
    const table = useTable<TranslationEntry>({
      data: this.dragEntries,
      columns,
      getCoreRowModel: getCoreRowModel(),
    });

    // Fixed columns (drag handle, key, actions) stay a constant width; language
    // columns split whatever's left in the container equally, with a 200px
    // floor below which the table falls back to its own horizontal scroll
    // instead of squeezing columns further.
    const fixedColsWidth = 32 + 220 + 44;
    const minLangColWidth = 200;
    const langColWidth = Math.max(minLangColWidth, Math.floor((this.containerWidth - fixedColsWidth) / this.languages.length));
    const minWidth = fixedColsWidth + langColWidth * this.languages.length;

    return (
      <Host class={this.compact ? '--compact' : ''}>
        <div class="table--container" ref={el => (this.containerRef = el)} onDragOver={this.handleContainerDragOver}>
          <table class="table data-table entries-table__table" style={{ minWidth: `${minWidth}px` }}>
            <colgroup>
              <col class="entries-table__col--drag" />
              <col class="entries-table__col--key" />
              <col class="entries-table__col--lang" span={this.languages.length} style={{ width: `${langColWidth}px` }} />
              <col class="entries-table__col--actions" />
            </colgroup>
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th key={header.id} scope="col" class={{ 'entries-table__key-head': header.column.id === 'key' }}>
                      {!header.isPlaceholder && flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map(row => this.renderRow(row))}
              <tr class={'last__row'}>
                <td colSpan={10}></td>
              </tr>
            </tbody>
          </table>
        </div>
      </Host>
    );
  }
}
