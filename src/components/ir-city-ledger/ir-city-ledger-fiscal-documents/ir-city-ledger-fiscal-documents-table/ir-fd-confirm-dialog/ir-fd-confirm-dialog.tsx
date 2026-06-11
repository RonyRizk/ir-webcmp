import { FdTypes } from '@/types/enums';
import { Component, Event, EventEmitter, Prop, h } from '@stencil/core';

export type FdConfirmAction = 'void' | 'delete-draft' | 'convert-to-invoice';

interface ConfirmConfig {
  title: string;
  message: string;
  confirmLabel: string;
  confirmVariant: 'danger' | 'brand';
}

const CONFIGS: Record<FdConfirmAction, (doc: string, fdType?: string) => ConfirmConfig> = {
  'void': (doc, fdType) => ({
    title: 'Void Document',
    message: `Are you sure you want to void ${doc}? This will issue a credit ${fdType === FdTypes.Invoice ? 'note' : 'receipt'} and cannot be undone.`,
    confirmLabel: 'Void',
    confirmVariant: 'danger',
  }),
  'delete-draft': doc => ({
    title: 'Delete Draft',
    message: `Are you sure you want to permanently delete draft ${doc}? This action cannot be undone.`,
    confirmLabel: 'Delete',
    confirmVariant: 'danger',
  }),
  'convert-to-invoice': doc => ({
    title: 'Convert to Invoice',
    message: `Are you sure you want to convert ${doc} to an invoice? This action cannot be undone.`,
    confirmLabel: 'Convert',
    confirmVariant: 'brand',
  }),
};

@Component({
  tag: 'ir-fd-confirm-dialog',
  styleUrl: 'ir-fd-confirm-dialog.css',
  scoped: true,
})
export class IrFdConfirmDialog {
  @Prop() open: boolean = false;
  @Prop() action: FdConfirmAction | null = null;
  @Prop() docNumber: string = 'this document';
  @Prop() isConfirming: boolean = false;
  @Prop() fdType: string;

  @Event() confirmed: EventEmitter<void>;
  @Event() cancelled: EventEmitter<void>;

  render() {
    const config = this.action ? CONFIGS[this.action]?.(this.docNumber, this.fdType) : null;

    return (
      <ir-dialog open={this.open} label={config?.title ?? ''} lightDismiss={false} onIrDialogHide={() => this.cancelled.emit()}>
        <p class="confirm-dialog__message">{config?.message ?? ''}</p>
        <div slot="footer" class="ir-dialog__footer">
          <ir-custom-button size="medium" variant="neutral" appearance="filled" onClickHandler={() => this.cancelled.emit()} disabled={this.isConfirming}>
            Cancel
          </ir-custom-button>
          <ir-custom-button size="medium" variant={config?.confirmVariant ?? 'neutral'} onClickHandler={() => this.confirmed.emit()} loading={this.isConfirming}>
            {config?.confirmLabel ?? 'Confirm'}
          </ir-custom-button>
        </div>
      </ir-dialog>
    );
  }
}
