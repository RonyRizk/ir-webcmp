import { t } from '@/services/locale/t';
import { Component, Method, State, h } from '@stencil/core';
import type { SyncAnswer, SyncPrompt } from '../sync-policy';

type AskablePrompt = Exclude<SyncPrompt, { kind: 'none' }>;

/**
 * Asks whether a language edit should cross into or out of the sync-guarded tables
 * (see `SYNC_GUARDED_TABLES`). Both edit paths await `ask()` mid-save, so the answer
 * comes back as a promise rather than an event.
 */
@Component({
  tag: 'ir-translations-sync-dialog',
  styleUrl: 'ir-translations-sync-dialog.css',
  scoped: true,
})
export class IrTranslationsSyncDialog {
  @State() prompt: AskablePrompt | null = null;
  /** Guarded tables ticked in a `choose` prompt — none by default, so nothing guarded is written unless asked for. */
  @State() checkedTables: string[] = [];

  private dialogRef: HTMLIrDialogElement;
  private resolveAnswer: ((answer: SyncAnswer | null) => void) | null = null;

  /** Resolves with the user's answer, or `null` if they dismissed the dialog — the caller should then abort the save. */
  @Method()
  async ask(prompt: AskablePrompt): Promise<SyncAnswer | null> {
    // A prompt still open is superseded — treat it as dismissed.
    this.settle(null);
    this.prompt = prompt;
    this.checkedTables = [];
    this.dialogRef?.openModal();
    return new Promise(resolve => (this.resolveAnswer = resolve));
  }

  private settle(answer: SyncAnswer | null) {
    const resolve = this.resolveAnswer;
    this.resolveAnswer = null;
    resolve?.(answer);
  }

  private answer(answer: SyncAnswer) {
    this.settle(answer);
    this.dialogRef?.closeModal();
  }

  private toggleTable(table: string, checked: boolean) {
    this.checkedTables = checked ? [...this.checkedTables, table] : this.checkedTables.filter(name => name !== table);
  }

  private renderBody() {
    if (this.prompt?.kind === 'confirm') {
      return <p class="sync-dialog__text">This key has duplicates in other tables. Apply these changes to them as well, or update only this key?</p>;
    }
    if (this.prompt?.kind === 'choose') {
      return (
        <div class="sync-dialog__body">
          <p class="sync-dialog__text">This key also has duplicates in the tables below. Duplicates in other tables will be updated. Tick a table to update its duplicates too.</p>
          <div class="sync-dialog__tables">
            {this.prompt.tables.map(table => (
              <wa-checkbox
                key={table}
                defaultChecked={this.checkedTables.includes(table)}
                checked={this.checkedTables.includes(table)}
                onchange={(e: Event) => this.toggleTable(table, (e.target as HTMLInputElement).checked)}
              >
                {table}
              </wa-checkbox>
            ))}
          </div>
        </div>
      );
    }
    return null;
  }

  private renderFooter() {
    if (this.prompt?.kind === 'confirm') {
      return [
        <ir-custom-button size="m" appearance="outlined" variant="neutral" onClickHandler={() => this.answer({ kind: 'none' })}>
          Only this key
        </ir-custom-button>,
        <ir-custom-button size="m" appearance="accent" variant="brand" onClickHandler={() => this.answer({ kind: 'all' })}>
          Sync duplicates
        </ir-custom-button>,
      ];
    }
    return [
      <ir-custom-button size="m" appearance="outlined" variant="neutral" onClickHandler={() => this.dialogRef?.closeModal()}>
        {t('Lcz_Cancel', { fallback: 'Cancel' })}
      </ir-custom-button>,
      <ir-custom-button size="m" appearance="accent" variant="brand" onClickHandler={() => this.answer({ kind: 'tables', tables: this.checkedTables })}>
        {t('Lcz_Save', { fallback: 'Save' })}
      </ir-custom-button>,
    ];
  }

  render() {
    return (
      <ir-dialog
        label="Sync duplicates"
        ref={el => (this.dialogRef = el)}
        onIrDialogAfterHide={(e: CustomEvent) => {
          e.stopPropagation();
          this.settle(null);
          this.prompt = null;
        }}
      >
        {this.renderBody()}
        <div slot="footer" class="ir-dialog__footer">
          {this.renderFooter()}
        </div>
      </ir-dialog>
    );
  }
}
