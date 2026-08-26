import { Component, Event, EventEmitter, Prop, State, Watch, h } from '@stencil/core';
import { TranslationTable } from '../types';

/**
 * Dumb open/close shell — the nested ir-translations-table-form owns the
 * draft, validation, and the actual save call.
 */
@Component({
  tag: 'ir-translations-table-dialog',
  styleUrl: 'ir-translations-table-dialog.css',
  scoped: true,
})
export class IrTranslationsTableDialog {
  @Prop() open: boolean = false;
  @Prop() formId: string = 'translations-table-form';
  @Prop() mode: 'create' | 'edit' = 'create';
  @Prop() table: TranslationTable | null = null;
  /** Names of the other tables, for duplicate detection. */
  @Prop() existingNames: string[] = [];
  @Prop() ownerId: number;
  @Prop() entryUserId: number;

  @Event() closeDialog: EventEmitter<void>;
  @Event() tableSaved: EventEmitter<{ id: string; name: string; mode: 'create' | 'edit' }>;
  @Event() tableSaveFailed: EventEmitter<void>;

  @State() saveDisabled: boolean = true;
  @State() isSubmitting: boolean = false;

  private dialogRef: HTMLIrDialogElement;

  @Watch('open')
  handleOpenChange(open: boolean) {
    if (open) {
      this.dialogRef?.openModal();
    } else {
      this.dialogRef?.closeModal();
    }
  }

  render() {
    const isEditing = this.mode === 'edit';
    return (
      <ir-dialog label={isEditing ? 'Table details' : 'New table'} ref={el => (this.dialogRef = el)} onIrDialogHide={() => this.closeDialog.emit()}>
        {this.open && (
          <ir-translations-table-form
            formId={this.formId}
            mode={this.mode}
            table={this.table}
            existingNames={this.existingNames}
            ownerId={this.ownerId}
            entryUserId={this.entryUserId}
            onSubmitDisabledChange={(e: CustomEvent<boolean>) => (this.saveDisabled = e.detail)}
            onIsSubmittingChange={(e: CustomEvent<boolean>) => (this.isSubmitting = e.detail)}
            onTableSaved={(e: CustomEvent<{ id: string; name: string; mode: 'create' | 'edit' }>) => {
              e.stopImmediatePropagation();
              e.stopPropagation();
              this.tableSaved.emit(e.detail);
              this.dialogRef?.closeModal();
            }}
            onTableSaveFailed={(e: CustomEvent<void>) => {
              e.stopImmediatePropagation();
              e.stopPropagation();
              this.tableSaveFailed.emit();
              this.dialogRef?.closeModal();
            }}
          ></ir-translations-table-form>
        )}
        <div slot="footer" class="ir-dialog__footer">
          <ir-custom-button size="m" appearance="outlined" variant="neutral" disabled={this.isSubmitting} onClickHandler={() => this.closeDialog.emit()}>
            Cancel
          </ir-custom-button>
          <ir-custom-button
            size="m"
            appearance="accent"
            variant="brand"
            form={this.formId}
            type="submit"
            disabled={this.saveDisabled || this.isSubmitting}
            loading={this.isSubmitting}
          >
            Save
          </ir-custom-button>
        </div>
      </ir-dialog>
    );
  }
}
