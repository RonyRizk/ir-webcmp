import { SetupService } from '@/services/setup';
import { showToast } from '@/utils/utils';
import { Component, Event, EventEmitter, Prop, State, Watch, h } from '@stencil/core';
import { TranslationEntry, TranslationTable } from '../types';
import { t } from '@/services/locale/t';

export interface TranslationEntryMoved {
  entry: TranslationEntry;
  fromTable: string;
  toTable: string;
}

/**
 * Moves one setup entry to another table through Move_Setup_Entry — the
 * backend re-homes the row, so nothing is re-created or soft-deleted here.
 *
 * The destination list is whatever the parent passes as `tables`: the manager
 * hands over the same set its header picker offers, so the "only used tables"
 * setting narrows both the same way. The search box is a local filter over
 * that list, and the source table is never offered as a destination.
 */
@Component({
  tag: 'ir-translations-move-dialog',
  styleUrl: 'ir-translations-move-dialog.css',
  scoped: true,
})
export class IrTranslationsMoveDialog {
  @Prop() open: boolean = false;
  /** The row being moved. Its `tableName` is the source table. */
  @Prop() entry: TranslationEntry | null = null;
  /** Candidate destinations — the tables the header picker shows. */
  @Prop() tables: TranslationTable[] = [];
  /** Language whose value is shown next to the key, so the user can tell rows with similar keys apart. */
  @Prop() sourceCode?: string;

  @Event() closeDialog: EventEmitter<void>;
  /** Emitted once the API confirmed the move. The parent owns closing the dialog and updating its rows. */
  @Event() entryMoved: EventEmitter<TranslationEntryMoved>;

  @State() query: string = '';
  @State() targetId: string | null = null;
  @State() isSubmitting: boolean = false;

  private dialogRef: HTMLIrDialogElement;
  private setupService = new SetupService();

  @Watch('open')
  handleOpenChange(open: boolean) {
    if (open) {
      // Start clean every time — a destination picked for one row must not carry over to the next.
      this.query = '';
      this.targetId = null;
      this.dialogRef?.openModal();
    } else {
      this.dialogRef?.closeModal();
    }
  }

  /** Every table but the one the row already lives in, narrowed by the search text. */
  private get candidateTables(): TranslationTable[] {
    const source = this.entry?.tableName;
    const query = this.query.trim().toLowerCase();
    return this.tables.filter(table => table.name !== source && (!query || table.name.toLowerCase().includes(query)));
  }

  /** Mirrors the Edit action's rule — a row Setup won't let us update can't be re-homed either. */
  private get isLocked(): boolean {
    return this.entry?.meta?.isUpdateable === false;
  }

  private handleMove = async () => {
    const entry = this.entry;
    const toTable = this.targetId;
    const fromTable = entry?.tableName;
    if (!entry || !fromTable || !toTable || this.isLocked) {
      return;
    }
    this.isSubmitting = true;
    try {
      // A code already used by the destination is a business exception — the interceptor toasts it and the dialog stays open.
      await this.setupService.moveSetupEntry({ old_tbl_name: fromTable, code_name: entry.key, new_tbl_name: toTable });
      showToast({ type: 'success', title: `Moved ${entry.key} to ${toTable}` });
      this.entryMoved.emit({ entry, fromTable, toTable });
    } finally {
      this.isSubmitting = false;
    }
  };

  private renderSummary() {
    const entry = this.entry;
    if (!entry) {
      return null;
    }
    const sourceValue = this.sourceCode ? entry.values[this.sourceCode] : undefined;
    return (
      <section class="move-dialog__summary">
        <code class="move-dialog__key">{entry.key}</code>
        {sourceValue && <p class="move-dialog__value">{sourceValue}</p>}
        <p class="move-dialog__hint">
          Currently in <strong>{entry.tableName}</strong>
        </p>
        {this.isLocked && (
          <p class="move-dialog__locked" role="alert">
            This key is locked by Setup and cannot be moved.
          </p>
        )}
      </section>
    );
  }

  private renderTableList() {
    const tables = this.candidateTables;
    return (
      <section class="move-dialog__tables">
        {/* Uncontrolled on purpose — see the manager's header search for why binding `value` misbehaves with wa-input. */}
        <wa-input
          class="move-dialog__search"
          size="s"
          with-clear
          label="Move to"
          placeholder="Search tables…"
          autocomplete="off"
          spellcheck={false}
          oninput={(e: Event) => (this.query = (e.target as HTMLInputElement).value ?? '')}
        >
          <wa-icon name="magnifying-glass" slot="start" aria-hidden="true"></wa-icon>
        </wa-input>
        {tables.length === 0 ? (
          <p class="move-dialog__empty">No tables match.</p>
        ) : (
          <wa-radio-group
            class="move-dialog__list"
            size="s"
            orientation="vertical"
            value={this.targetId ?? ''}
            onchange={(e: Event) => (this.targetId = (e.target as HTMLInputElement).value || null)}
          >
            {tables.map(table => (
              <wa-radio key={table.id} value={table.id}>
                {table.name}
              </wa-radio>
            ))}
          </wa-radio-group>
        )}
      </section>
    );
  }

  render() {
    return (
      <ir-dialog label="Move key" ref={el => (this.dialogRef = el)} onIrDialogHide={() => this.closeDialog.emit()}>
        {this.open && (
          <div class="move-dialog__body">
            {this.renderSummary()}
            {this.renderTableList()}
          </div>
        )}
        <div slot="footer" class="ir-dialog__footer">
          <ir-custom-button size="m" appearance="outlined" variant="neutral" disabled={this.isSubmitting} onClickHandler={() => this.closeDialog.emit()}>
            {t('Lcz_Cancel', { fallback: 'Cancel' })}
          </ir-custom-button>
          <ir-custom-button
            size="m"
            appearance="accent"
            variant="brand"
            disabled={!this.targetId || this.isLocked || this.isSubmitting}
            loading={this.isSubmitting}
            onClickHandler={this.handleMove}
          >
            Move
          </ir-custom-button>
        </div>
      </ir-dialog>
    );
  }
}
