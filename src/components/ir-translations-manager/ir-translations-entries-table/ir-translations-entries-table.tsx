import type WaInput from '@awesome.me/webawesome/dist/components/input/input';
import { flexRender, useTable } from '@/utils/useTable';
import { Component, Event, EventEmitter, Host, Prop, State, Watch, h } from '@stencil/core';
import { type Cell, type Row, createColumnHelper, getCoreRowModel } from '@tanstack/table-core';
import { DuplicateInfo, TranslationEntry, TranslationLanguage } from '../types';
import { hasValue } from '../utils';

type Field = 'lang' | 'note';

/**
 * One navigable grid column. The drag handle is deliberately absent — it is a
 * pointer affordance, not a cell, so arrow keys skip straight past it.
 */
type NavColumn = { id: string; kind: 'key' | 'note' | 'lang' | 'actions'; code?: string };

/**
 * One edit of one cell, from the moment its input opens until it commits or is
 * cancelled. Every handler on that input closes over *this object*, which is what
 * makes committing idempotent: Enter/Tab commits and immediately opens the next
 * cell, and the outgoing input's trailing `change`/`blur` then finds its own
 * session already flagged `committed` instead of writing a newer cell's draft
 * back over the one it came from.
 */
type EditSession = {
  /** `${entryId}|${columnId}` — also what `editingKey` holds, so render and session can never disagree. */
  key: string;
  entryId: string;
  columnId: string;
  field: Field;
  /** Language code when `field === 'lang'`. */
  code?: string;
  /** Value as it stood when the editor opened — the only thing a commit compares against. */
  original: string;
  draft: string;
  committed: boolean;
  /** Set when editing began by typing a character over the cell; consumed once by the focus pass. */
  seeded: boolean;
  /** How the focus pass should place the caret: over the whole value, or after it. */
  select: 'all' | 'end';
  /**
   * False until the input exists and has focus. An editor is created by a render and
   * focused a frame later, and a fast typist gets keys in before that — while this is
   * false the *cell* handles them on the session's behalf.
   */
  focused: boolean;
};

/** Rows a PageUp/PageDown jumps. */
const PAGE_ROWS = 10;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

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
  /** True when `entries` span several setup tables — rows are then broken up by collapsible per-table header rows. */
  @Prop() groupByTable: boolean = false;
  /** Entry id → the tables sharing that row's description; rows present here get a duplicate badge beside their key. */
  @Prop() duplicates: Map<string, DuplicateInfo> = new Map();
  /** Whether the notes column is included at all. */
  @Prop() showNotes: boolean = true;

  @Event() entryChange: EventEmitter<TranslationEntry>;
  @Event() editEntry: EventEmitter<TranslationEntry>;
  @Event() duplicateEntry: EventEmitter<TranslationEntry>;
  @Event() deleteEntry: EventEmitter<TranslationEntry>;
  @Event() clearFilters: EventEmitter<void>;
  @Event() reorderEntries: EventEmitter<TranslationEntry[]>;
  @Event() toggleVisibility: EventEmitter<TranslationEntry>;

  /** `${entryId}|${columnId}` of the open editor, or null. The only edit state that needs a re-render. */
  @State() editingKey: string | null = null;
  /** Working copy of `entries`, live-reordered while a drag is in progress. */
  @State() dragEntries: TranslationEntry[] = [];
  @State() draggingId: string | null = null;
  /** `.table--container`'s current content-box width — language columns stretch to fill it instead of sitting fixed. */
  @State() containerWidth: number = 0;
  /** Table names whose group is currently folded shut. Only meaningful while `groupByTable` is on. */
  @State() collapsedTables: Set<string> = new Set();

  /**
   * The live edit. Deliberately not @State — keystrokes must not re-render the grid,
   * and the object identity is what makes a commit idempotent (see `EditSession`).
   */
  private editSession: EditSession | null = null;
  /**
   * The grid's single tab stop, as {visible row, navigable column} indices. Also not
   * @State: arrow keys move it by swapping `tabindex` on two `<td>`s directly, so
   * walking a 2,300-cell grid costs no re-renders at all.
   */
  private activeCell: { row: number; col: number } = { row: 0, col: 0 };
  /** What to focus after the next render — set by anything that opens or closes an editor. */
  private pendingFocus: 'input' | 'cell' | null = null;
  /**
   * The session a pending 'input' focus was scheduled for. Typing faster than the
   * screen refreshes can queue two of these in one frame, and the first must not
   * declare the second one's editor focused — that would hand the keys back to an
   * input that doesn't have them yet, and they'd be lost.
   */
  private pendingFocusSession: EditSession | null = null;
  private containerRef?: HTMLDivElement;
  private containerResizeObserver?: ResizeObserver;
  /** Latest pointer Y during a drag, read by the auto-scroll loop — not @State, it'd re-render on every dragover. */
  private dragClientY: number | null = null;
  private autoScrollRaf: number | null = null;
  /**
   * One tooltip serves the whole grid. Anchoring per element would mean a
   * `wa-tooltip` per cell — ~2,300 of them in the cross-table view — so hovers are
   * delegated and this single instance is re-anchored instead.
   */
  private tooltipRef?: HTMLElement & { anchor: Element | null; open: boolean };
  private tooltipTimer?: ReturnType<typeof setTimeout>;

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
    clearTimeout(this.tooltipTimer);
  }

  // #region Shared tooltip

  /** Re-points the shared tooltip at whatever `[data-tooltip]` element the pointer is over. */
  private handleTooltipOver = (event: MouseEvent) => {
    const target = (event.target as HTMLElement | null)?.closest?.('[data-tooltip]') as HTMLElement | null;
    this.showTooltipFor(target);
  };

  /** Shared by hover and by keyboard focus, so truncated cell text is readable either way. */
  private showTooltipFor(target: HTMLElement | null) {
    const tooltip = this.tooltipRef;
    if (!tooltip) {
      return;
    }
    const text = target?.dataset.tooltip;
    if (!target || !text) {
      this.hideTooltip();
      return;
    }
    if (tooltip.anchor === target && tooltip.open) {
      return;
    }
    // Re-anchoring a visible tooltip makes the bubble skate across the grid, so it
    // always closes first and re-opens on the new anchor after the usual hover beat.
    clearTimeout(this.tooltipTimer);
    tooltip.open = false;
    this.tooltipTimer = setTimeout(() => {
      tooltip.textContent = text;
      tooltip.anchor = target;
      tooltip.open = true;
    }, 250);
  }

  private hideTooltip = () => {
    clearTimeout(this.tooltipTimer);
    if (this.tooltipRef) {
      this.tooltipRef.open = false;
    }
  };

  // #endregion

  /** A drag in progress owns row order locally — only resync from the parent once it's idle. */
  @Watch('entries')
  handleEntriesChange(newEntries: TranslationEntry[]) {
    if (!this.draggingId) {
      this.dragEntries = newEntries;
    }
  }

  componentDidRender() {
    this.syncActionTabStops();
    const pending = this.pendingFocus;
    if (!pending) {
      return;
    }
    this.pendingFocus = null;
    // wa-input's shadow DOM hasn't necessarily finished its first Lit render
    // synchronously after insertion, so focus() can run before the internal
    // <input> exists — defer past that render.
    requestAnimationFrame(() => {
      if (pending === 'cell') {
        this.cellElement(this.activeCell.row, this.activeCell.col)?.focus();
        return;
      }
      const session = this.pendingFocusSession;
      // Superseded by a later edit, or already handled by a pass queued alongside this one.
      if (!session || session !== this.editSession) {
        return;
      }
      const input = this.cellElement(this.activeCell.row, this.activeCell.col)?.querySelector('wa-input') as WaInput | null;
      if (!input) {
        // This frame ran ahead of the render that creates the input; the pass queued
        // by that render finds it. Leave the session pending for it.
        return;
      }
      this.pendingFocusSession = null;
      input.focus();
      session.focused = true;
      if (session.seeded) {
        // Editing began by typing over the cell: that first character is the value now.
        session.seeded = false;
        input.value = session.draft;
        input.input?.setSelectionRange(session.draft.length, session.draft.length);
        return;
      }
      // focus() alone leaves the caret at position 0, so typing would prepend.
      if (session.select === 'all') {
        input.input?.select();
      } else {
        input.input?.setSelectionRange(session.draft.length, session.draft.length);
      }
    });
  }

  /**
   * `ir-custom-button` renders a `wa-button` of its own, which would put a tab stop
   * in every single row — and the grid is meant to be one tab stop, entered with Tab
   * and walked with arrows. The trigger stays reachable through its own cell (Enter
   * opens the menu) and by mouse; it just isn't tabbable any more.
   *
   * Deferred a frame because child components render after this one, so the
   * `wa-button` doesn't exist yet on a first paint. `:not([tabindex])` keeps the
   * sweep idempotent across re-renders.
   */
  private syncActionTabStops() {
    requestAnimationFrame(() => {
      this.containerRef?.querySelectorAll('td.entries-table__actions wa-button:not([tabindex])').forEach(button => button.setAttribute('tabindex', '-1'));
    });
  }

  // #region Grid geometry

  /** Every column arrow keys can land on, in visual order. */
  private get navColumns(): NavColumn[] {
    return [
      { id: 'key', kind: 'key' },
      ...(this.showNotes ? [{ id: 'notes', kind: 'note' } as NavColumn] : []),
      ...this.languages.map(language => ({ id: language.code, kind: 'lang', code: language.code }) as NavColumn),
      { id: 'actions', kind: 'actions' },
    ];
  }

  /**
   * Rows actually on screen. Grouped mode drops the rows of folded tables, and
   * navigation indices have to agree with what's rendered or arrow keys would
   * step into cells that don't exist.
   */
  private get visibleEntries(): TranslationEntry[] {
    if (!this.groupByTable || this.collapsedTables.size === 0) {
      return this.dragEntries;
    }
    return this.dragEntries.filter(entry => !this.collapsedTables.has(entry.tableName ?? ''));
  }

  private cellValue(entry: TranslationEntry, column: NavColumn): string {
    return column.kind === 'note' ? (entry.meta?.notes ?? '') : (entry.values[column.code] ?? '');
  }

  /** Key and Actions are navigable but never editable; system-protected rows lock their values. */
  private isCellEditable(entry: TranslationEntry, column: NavColumn): boolean {
    return (column.kind === 'note' || column.kind === 'lang') && entry.meta?.isUpdateable !== false;
  }

  private cellElement(row: number, col: number): HTMLTableCellElement | null {
    return (this.containerRef?.querySelector(`td[data-row="${row}"][data-col="${col}"]`) as HTMLTableCellElement | null) ?? null;
  }

  /** Rows and columns come and go with filters — without this the single tab stop could end up on a cell that no longer exists. */
  private clampActiveCell() {
    this.activeCell = {
      row: clamp(this.activeCell.row, 0, Math.max(0, this.visibleEntries.length - 1)),
      col: clamp(this.activeCell.col, 0, Math.max(0, this.navColumns.length - 1)),
    };
  }

  // #endregion

  // #region Editing

  /**
   * `select` follows the spreadsheet convention: arriving on a cell from the keyboard
   * selects its whole value so typing replaces it, while clicking into one puts the
   * caret after the text so a typo can be fixed without retyping the cell.
   */
  private startEditing(entry: TranslationEntry, column: NavColumn, options: { initial?: string; select?: 'all' | 'end' } = {}) {
    if (!this.isCellEditable(entry, column)) {
      return;
    }
    const { initial, select = 'all' } = options;
    const original = this.cellValue(entry, column);
    this.editSession = {
      key: `${entry.id}|${column.id}`,
      entryId: entry.id,
      columnId: column.id,
      field: column.kind === 'note' ? 'note' : 'lang',
      code: column.code,
      original,
      draft: initial ?? original,
      committed: false,
      seeded: initial !== undefined,
      select,
      focused: false,
    };
    this.editingKey = this.editSession.key;
    this.pendingFocus = 'input';
    this.pendingFocusSession = this.editSession;
    // Park focus on the cell right now, before the render that creates the input.
    // Otherwise focus sits on the outgoing input (about to be removed) or falls to
    // <body> when it is, and anything typed in that gap lands where this component
    // can't hear it. On the cell, the grid handler buffers it into this session.
    this.cellElement(this.activeCell.row, this.activeCell.col)?.focus({ preventScroll: true });
  }

  /**
   * Saves a session at most once, and only when its value actually moved. Each
   * emit is a live `Edit_Setup` write plus a toast in the manager, so flagging
   * `committed` *before* emitting matters: the trailing `change`/`blur` from the
   * input this commit is about to replace lands right back here.
   */
  private commitSession(session: EditSession | null) {
    if (!session || session.committed) {
      return;
    }
    session.committed = true;
    if (session.draft === session.original) {
      return;
    }
    // Read the row back out rather than closing over it — the parent patches
    // `entries` optimistically on every commit, so a cell edited twice in a row
    // must build on the patched version, not the one this editor opened over.
    const entry = this.dragEntries.find(item => item.id === session.entryId);
    if (!entry) {
      return;
    }
    const newEntry: TranslationEntry =
      session.field === 'note' ? { ...entry, meta: { ...entry.meta, notes: session.draft } } : { ...entry, values: { ...entry.values, [session.code]: session.draft } };

    this.entryChange.emit(newEntry);
  }

  private closeEditor(focusCell: boolean = true) {
    this.editSession = null;
    this.editingKey = null;
    this.pendingFocusSession = null;
    if (focusCell) {
      this.pendingFocus = 'cell';
    }
  }

  /** Escape: discard the draft, and make sure the trailing blur can't resurrect it. */
  private cancelEditing(session: EditSession) {
    session.committed = true;
    this.closeEditor();
  }

  private handleEditorBlur(session: EditSession) {
    this.commitSession(session);
    // Keyboard navigation has already pointed `editingKey` at the next cell by the
    // time this fires, so only a genuine focus-out should close the editor.
    if (this.editingKey === session.key) {
      this.editSession = null;
      this.editingKey = null;
    }
  }

  /**
   * The three keys that end an edit. Shared with the cell handler, because a fast
   * Enter-Enter or Tab-Tab can land before the next editor's input has taken focus
   * and those keystrokes have to keep working rather than falling on the floor.
   * Returns whether the key was one of them.
   */
  private handleEditKey(event: KeyboardEvent, session: EditSession): boolean {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.cancelEditing(session);
      return true;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      this.commitSession(session);
      this.moveEditing(session, event.shiftKey ? -1 : 1, 0);
      return true;
    }
    if (event.key === 'Tab') {
      event.preventDefault();
      this.commitSession(session);
      this.moveEditing(session, 0, event.shiftKey ? -1 : 1);
      return true;
    }
    return false;
  }

  private handleEditorKeyDown(event: KeyboardEvent, session: EditSession) {
    if (this.handleEditKey(event, session)) {
      // The cell below must not handle this a second time.
      event.stopPropagation();
    }
  }

  /**
   * Moves the open editor through the grid, wrapping across row ends so Tab walks
   * the whole table the way a spreadsheet does. Key/Actions columns and locked
   * rows are stepped over rather than stopped on, and running off either end
   * leaves focus parked on the cell it started from instead of on nothing.
   */
  private moveEditing(session: EditSession, rowDelta: number, colDelta: number) {
    const rows = this.visibleEntries;
    const columns = this.navColumns;
    const fromRow = rows.findIndex(entry => entry.id === session.entryId);
    const fromCol = columns.findIndex(column => column.id === session.columnId);
    if (fromRow === -1 || fromCol === -1) {
      this.closeEditor(false);
      return;
    }

    let row = fromRow;
    let col = fromCol;
    const stop = () => {
      this.activeCell = { row: fromRow, col: fromCol };
      this.closeEditor();
    };

    // Bounded by the grid size — a table where every cell is locked must not spin.
    for (let step = 0; step <= rows.length * columns.length; step++) {
      if (colDelta !== 0) {
        col += colDelta;
        if (col >= columns.length) {
          col = 0;
          row += 1;
        } else if (col < 0) {
          col = columns.length - 1;
          row -= 1;
        }
      } else {
        row += rowDelta;
      }

      if (row < 0 || row >= rows.length) {
        stop();
        return;
      }
      if (this.isCellEditable(rows[row], columns[col])) {
        this.activeCell = { row, col };
        this.startEditing(rows[row], columns[col]);
        return;
      }
    }
    stop();
  }

  // #endregion

  // #region Keyboard navigation

  /** Moves the grid's single tab stop, swapping `tabindex` on the DOM directly so no re-render is needed. */
  private focusCell(row: number, col: number) {
    const target = this.cellElement(row, col);
    if (!target) {
      return;
    }
    const previous = this.cellElement(this.activeCell.row, this.activeCell.col);
    if (previous && previous !== target) {
      previous.tabIndex = -1;
    }
    this.activeCell = { row, col };
    target.tabIndex = 0;
    // focus() would scroll the cell to the middle of the container; `nearest` keeps
    // the grid still unless the cell is genuinely off-screen.
    target.focus({ preventScroll: true });
    target.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    this.showTooltipFor(target.querySelector('[data-tooltip]'));
  }

  /** Click, or Shift+Tab back into the grid — whatever the browser focused becomes the tab stop. */
  private handleCellFocus(row: number, col: number, td: HTMLTableCellElement) {
    if (this.activeCell.row === row && this.activeCell.col === col) {
      return;
    }
    const previous = this.cellElement(this.activeCell.row, this.activeCell.col);
    if (previous && previous !== td) {
      previous.tabIndex = -1;
    }
    this.activeCell = { row, col };
    td.tabIndex = 0;
  }

  private activateCell(entry: TranslationEntry, column: NavColumn, row: number, col: number) {
    this.activeCell = { row, col };
    if (column.kind === 'key') {
      this.editEntry.emit(entry);
      return;
    }
    if (column.kind === 'actions') {
      const dropdown = this.cellElement(row, col)?.querySelector('wa-dropdown') as (HTMLElement & { open: boolean }) | null;
      if (dropdown) {
        dropdown.open = true;
      }
      return;
    }
    this.startEditing(entry, column);
  }

  /** A key that should open a cell and become its first character, rather than being a command. */
  private isPrintable(event: KeyboardEvent): boolean {
    return event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey;
  }

  private handleGridKeyDown(event: KeyboardEvent, row: number, col: number) {
    // While an editor is open it owns every key it cares about and stops those from
    // bubbling; anything that reaches here is meant for the text field.
    if (this.editingKey) {
      const pending = this.editSession;
      if (!pending || pending.focused) {
        return;
      }
      // The editor exists but its input is still a frame away from focus. Everything
      // typed in that gap belongs to it: without this, "Zed" would open the cell on
      // "Z" alone, and a fast Enter-Enter down a column would swallow the second one.
      if (this.handleEditKey(event, pending)) {
        return;
      }
      if (this.isPrintable(event)) {
        if (!pending.seeded) {
          // Arriving on a cell from the keyboard selects its whole value, so the first
          // character replaces it — exactly as it would with the input already focused.
          pending.draft = pending.select === 'all' ? '' : pending.draft;
          pending.seeded = true;
        }
        pending.draft += event.key;
        event.preventDefault();
      }
      return;
    }
    const rows = this.visibleEntries;
    const columns = this.navColumns;
    const entry = rows[row];
    const column = columns[col];
    if (!entry || !column) {
      return;
    }
    const lastRow = rows.length - 1;
    const lastCol = columns.length - 1;
    const jumpsToEdge = event.ctrlKey || event.metaKey;

    switch (event.key) {
      case 'ArrowRight':
        this.focusCell(row, clamp(col + 1, 0, lastCol));
        break;
      case 'ArrowLeft':
        this.focusCell(row, clamp(col - 1, 0, lastCol));
        break;
      case 'ArrowDown':
        this.focusCell(clamp(row + 1, 0, lastRow), col);
        break;
      case 'ArrowUp':
        this.focusCell(clamp(row - 1, 0, lastRow), col);
        break;
      case 'Home':
        this.focusCell(jumpsToEdge ? 0 : row, 0);
        break;
      case 'End':
        this.focusCell(jumpsToEdge ? lastRow : row, lastCol);
        break;
      case 'PageDown':
        this.focusCell(clamp(row + PAGE_ROWS, 0, lastRow), col);
        break;
      case 'PageUp':
        this.focusCell(clamp(row - PAGE_ROWS, 0, lastRow), col);
        break;
      case 'Enter':
      case 'F2':
      case ' ':
        this.activateCell(entry, column, row, col);
        break;
      default:
        // Typing over a cell opens it on that character, as a spreadsheet would.
        if (this.isPrintable(event) && this.isCellEditable(entry, column)) {
          this.activeCell = { row, col };
          this.startEditing(entry, column, { initial: event.key });
          break;
        }
        // Tab is deliberately not handled: the grid is one tab stop, so Tab leaves it.
        return;
    }
    event.preventDefault();
  }

  private handleCellClick(entry: TranslationEntry, column: NavColumn, row: number, col: number) {
    this.activeCell = { row, col };
    if (column.kind === 'key') {
      this.editEntry.emit(entry);
      return;
    }
    // The dropdown's own trigger handles this; a click inside the open editor must
    // not tear down the session it lands in.
    if (column.kind === 'actions' || this.editingKey === `${entry.id}|${column.id}`) {
      return;
    }
    this.startEditing(entry, column, { select: 'end' });
  }

  // #endregion

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
        data-tooltip={label}
        aria-label={label}
        onDragStart={(e: DragEvent) => this.handleDragStart(e, entry)}
        onDragEnd={this.handleDragEnd}
      >
        <wa-icon name="grip-vertical" aria-hidden="true"></wa-icon>
      </span>
    );
  }

  // #endregion

  private renderValueCell(entry: TranslationEntry, column: NavColumn) {
    const isNote = column.kind === 'note';
    const language = isNote ? undefined : this.languages.find(item => item.code === column.code);
    const value = this.cellValue(entry, column);
    const session = this.editSession;
    const isEditing = !!session && session.key === `${entry.id}|${column.id}`;
    const ariaLabel = isNote ? `${entry.key} note` : `${language?.name} translation for ${entry.key || 'new entry'}`;

    if (entry.meta?.isUpdateable === false) {
      return (
        <span class="entries-table__cell-display --readonly">
          {hasValue(value) ? (
            <span class="entries-table__cell-text" data-tooltip={value}>
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
          oninput={(e: Event) => (session.draft = (e.target as HTMLInputElement).value)}
          onKeyDown={(e: KeyboardEvent) => this.handleEditorKeyDown(e, session)}
          onblur={() => this.handleEditorBlur(session)}
          // `change` fires on Enter *and* on blur, and neither is guaranteed once
          // the input is torn down mid-render — committing is idempotent per
          // session, so wiring both simply means the save can't be missed.
          onchange={() => this.commitSession(session)}
        ></wa-input>
      );
    }

    return (
      <span class={`entries-table__cell-display ${hasValue(value) ? '' : '--empty'}`}>
        {hasValue(value) ? (
          <span class="entries-table__cell-text" data-tooltip={value}>
            {value}
          </span>
        ) : (
          <span class="entries-table__cell-missing">Missing</span>
        )}
      </span>
    );
  }

  /** The duplicate badge. Its tooltip rides the shared instance like every other hover target here. */
  private renderDuplicateBadge(entry: TranslationEntry) {
    const duplicate = this.duplicates.get(entry.id);
    if (!duplicate) {
      return null;
    }
    // Other used tables only — the row's own table is never counted (see buildDuplicateMap).
    const tableCount = duplicate.tables.length;
    const rowCount = duplicate.siblings.length;
    const tables = duplicate.tables.join(', ');
    // Rows and tables diverge when a description repeats inside one table, which is
    // worth calling out rather than hiding behind a table count.
    const label =
      rowCount > tableCount
        ? `${rowCount} matching entries in ${tableCount} other ${tableCount === 1 ? 'table' : 'tables'} (${tables}) — language edits sync there`
        : `Also in ${tableCount} other ${tableCount === 1 ? 'table' : 'tables'} (${tables}) — language edits sync there`;
    return (
      <span
        class="entries-table__dup-badge"
        data-tooltip={label}
        aria-label={label}
        // The whole key cell opens the entry drawer — the badge is a hover target, not a way in.
        onClick={(event: MouseEvent) => event.stopPropagation()}
      >
        <wa-icon name="clone" aria-hidden="true"></wa-icon>
        {tableCount}
      </span>
    );
  }

  private renderKeyCell(entry: TranslationEntry) {
    const isHidden = entry.meta?.isVisible === false;
    return (
      <div class="entries-table__key-container">
        {isHidden && (
          <span class="entries-table__key-hidden-mark" data-tooltip="Hidden from the app" aria-label={`${entry.key || 'This key'} is hidden from the app`}>
            <wa-icon name="eye-slash" aria-hidden="true"></wa-icon>
          </span>
        )}
        <span class="entries-table__key-text" data-tooltip={entry.key}>
          {entry.key}
        </span>
        {this.renderDuplicateBadge(entry)}
        <wa-icon class="entries-table__key-icon" name="pen-to-square"></wa-icon>
      </div>
    );
  }

  private renderLangHead(language: TranslationLanguage) {
    return (
      <span class="entries-table__lang-head">
        <abbr class="entries-table__lang-code" data-tooltip={language.name} aria-label={language.name}>
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
      ...(this.showNotes
        ? [
            helper.display({
              id: 'notes',
              header: 'Notes',
              cell: info => this.renderValueCell(info.row.original, { id: 'notes', kind: 'note' }),
            }),
          ]
        : []),
      ...this.languages.map(language =>
        helper.accessor(row => row.values[language.code] ?? '', {
          id: language.code,
          header: () => this.renderLangHead(language),
          cell: info => this.renderValueCell(info.row.original, { id: language.code, kind: 'lang', code: language.code }),
        }),
      ),
      helper.display({
        id: 'actions',
        header: () => <span class="entries-table__sr-only">Actions</span>,
        cell: info => this.renderActionsCell(info.row.original),
      }),
    ];
  }

  /**
   * The language column pinned beside the key. Deliberately "whichever is
   * leftmost" rather than a lookup by source code — pinning a column from the
   * middle of the row would park it on top of its neighbours.
   */
  private get pinnedLanguageCode(): string | undefined {
    return this.languages[0]?.code;
  }

  private renderCell(cell: Cell<TranslationEntry, unknown>, rowIndex: number) {
    const columnId = cell.column.id;
    const isLangColumn = this.languages.some(language => language.code === columnId);
    const columns = this.navColumns;
    const colIndex = columns.findIndex(column => column.id === columnId);
    const column = colIndex === -1 ? null : columns[colIndex];
    const entry = cell.row.original;
    const isActive = !!column && this.activeCell.row === rowIndex && this.activeCell.col === colIndex;
    const isLocked = entry.meta?.isUpdateable === false;

    return (
      <td
        key={cell.id}
        class={{
          'entries-table__key': columnId === 'key',
          'entries-table__source-cell': isLangColumn && columnId === this.pinnedLanguageCode,
          'entries-table__value-cell': isLangColumn || columnId === 'notes',
          'entries-table__actions': columnId === 'actions',
          'entries-table__drag-cell': columnId === 'drag',
        }}
        // The cell itself is the focus target, not the content inside it: one uniform
        // roving tab stop for Key, Notes, language and Actions cells, and no focusable
        // button nested inside a focusable gridcell.
        tabindex={column ? (isActive ? '0' : '-1') : undefined}
        data-row={column ? rowIndex : undefined}
        data-col={column ? colIndex : undefined}
        aria-readonly={column && (column.kind === 'note' || column.kind === 'lang') && isLocked ? 'true' : undefined}
        onKeyDown={column ? (e: KeyboardEvent) => this.handleGridKeyDown(e, rowIndex, colIndex) : undefined}
        onFocus={column ? (e: FocusEvent) => this.handleCellFocus(rowIndex, colIndex, e.currentTarget as HTMLTableCellElement) : undefined}
        onClick={column ? () => this.handleCellClick(entry, column, rowIndex, colIndex) : undefined}
      >
        {flexRender(cell.column.columnDef.cell, cell.getContext())}
      </td>
    );
  }

  private renderRow(row: Row<TranslationEntry>, rowIndex: number) {
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
        {row.getVisibleCells().map(cell => this.renderCell(cell, rowIndex))}
      </tr>
    );
  }

  // #region Table grouping

  private toggleGroup(name: string) {
    const next = new Set(this.collapsedTables);
    if (next.has(name)) {
      next.delete(name);
    } else {
      next.add(name);
    }
    this.collapsedTables = next;
  }

  private renderGroupHeader(name: string, count: number) {
    const collapsed = this.collapsedTables.has(name);
    return (
      <tr key={`group:${name}`} class="entries-table__group-row">
        <td class="entries-table__group-cell" colSpan={(this.showNotes ? 4 : 3) + this.languages.length}>
          <button type="button" class="entries-table__group-toggle" aria-expanded={collapsed ? 'false' : 'true'} onClick={() => this.toggleGroup(name)}>
            <wa-icon class="entries-table__group-chevron" name="chevron-down" aria-hidden="true"></wa-icon>
            <span class="entries-table__group-name">{name}</span>
            <span class="entries-table__group-count">
              {count} key{count === 1 ? '' : 's'}
            </span>
          </button>
        </td>
      </tr>
    );
  }

  /**
   * Opens a group header row each time the table name changes and drops the rows
   * of collapsed groups. Rows arrive already sorted by table, so one pass suffices
   * and a group can never be reopened further down the list.
   */
  private renderGroupedRows(rows: Row<TranslationEntry>[]) {
    const counts = new Map<string, number>();
    rows.forEach(row => {
      const name = row.original.tableName ?? '';
      counts.set(name, (counts.get(name) ?? 0) + 1);
    });

    const nodes = [];
    let currentGroup: string | null = null;
    // Counts only the rows that actually render, so `data-row` lines up with
    // `visibleEntries` — the list arrow keys walk.
    let visibleIndex = 0;
    rows.forEach(row => {
      const name = row.original.tableName ?? '';
      if (name !== currentGroup) {
        currentGroup = name;
        nodes.push(this.renderGroupHeader(name, counts.get(name) ?? 0));
      }
      if (!this.collapsedTables.has(name)) {
        nodes.push(this.renderRow(row, visibleIndex));
        visibleIndex += 1;
      }
    });
    return nodes;
  }

  // #endregion

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

    this.clampActiveCell();

    const columns = this.buildColumns();
    const table = useTable<TranslationEntry>({
      data: this.dragEntries,
      columns,
      getCoreRowModel: getCoreRowModel(),
    });

    // Fixed columns (drag handle, key, notes, actions) stay a constant width;
    // language columns split whatever's left in the container equally, with a
    // 200px floor below which the table falls back to its own horizontal
    // scroll instead of squeezing columns further.
    const notesColWidth = 180;
    const fixedColsWidth = 32 + 220 + 44 + (this.showNotes ? notesColWidth : 0);
    const minLangColWidth = 200;
    const langColWidth = Math.max(minLangColWidth, Math.floor((this.containerWidth - fixedColsWidth) / this.languages.length));
    const minWidth = fixedColsWidth + langColWidth * this.languages.length;

    return (
      <Host class={this.compact ? '--compact' : ''}>
        <div
          class="table--container"
          ref={el => (this.containerRef = el)}
          onDragOver={this.handleContainerDragOver}
          onMouseOver={this.handleTooltipOver}
          onMouseLeave={this.hideTooltip}
          onScroll={this.hideTooltip}
        >
          {/* An editable grid, not a static table: one tab stop, arrow keys inside. */}
          <table role="grid" class="table data-table entries-table__table" style={{ minWidth: `${minWidth}px` }}>
            <colgroup>
              <col class="entries-table__col--drag" />
              <col class="entries-table__col--key" />
              {this.showNotes && <col class="entries-table__col--notes" style={{ width: `${notesColWidth}px` }} />}
              <col class="entries-table__col--lang" span={this.languages.length} style={{ width: `${langColWidth}px` }} />
              <col class="entries-table__col--actions" />
            </colgroup>
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th
                      key={header.id}
                      scope="col"
                      class={{
                        'entries-table__key-head': header.column.id === 'key',
                        'entries-table__source-head': header.column.id === this.pinnedLanguageCode,
                      }}
                    >
                      {!header.isPlaceholder && flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {this.groupByTable ? this.renderGroupedRows(table.getRowModel().rows) : table.getRowModel().rows.map((row, index) => this.renderRow(row, index))}
              <tr class={'last__row'}>
                <td colSpan={10}></td>
              </tr>
            </tbody>
          </table>
        </div>
        {/* Sits outside the scroll container so it isn't clipped by it; content and anchor are set on hover. */}
        <wa-tooltip class="entries-table__tooltip" ref={el => (this.tooltipRef = el as any)} trigger="manual" placement="top"></wa-tooltip>
      </Host>
    );
  }
}
