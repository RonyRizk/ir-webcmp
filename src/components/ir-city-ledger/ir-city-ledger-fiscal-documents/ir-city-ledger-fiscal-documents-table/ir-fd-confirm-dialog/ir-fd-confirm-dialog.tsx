import calendar_data from '@/stores/calendar-data';
import { FdTypes } from '@/types/enums';
import { Component, Event, EventEmitter, Prop, State, h } from '@stencil/core';

export type FdConfirmAction = 'void' | 'delete-draft' | 'convert-to-invoice';
export type FdConfirmationVoidType = typeof FdTypes.CreditNote | typeof FdTypes.AdjustmentCredit;
interface ConfirmConfig {
  title: string;
  message: string;
  confirmLabel: string;
  confirmVariant: 'danger' | 'brand';
}

const CONFIGS: Record<FdConfirmAction, (doc: string, fdType?: string) => ConfirmConfig> = {
  'void': (doc, fdType) => ({
    title: fdType === FdTypes.Invoice ? 'Credit Note' : 'Void Document',
    message: `Are you sure you want to void ${doc}? This will issue a credit ${fdType === FdTypes.Invoice ? 'note' : 'receipt'} and cannot be undone.`,
    confirmLabel: 'Confirm',
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
  @Prop() amount: number;
  @Prop() fdType: string;

  @State() voidType: FdConfirmationVoidType = FdTypes.CreditNote;
  @State() goodwillAmount: string = '';

  @Event() confirmed: EventEmitter<{
    amount: number | null;
    voidType: FdConfirmationVoidType;
  }>;
  @Event() cancelled: EventEmitter<void>;

  render() {
    const config = this.action ? CONFIGS[this.action]?.(this.docNumber, this.fdType) : null;
    const showVoidOptions = this.action === 'void' && this.fdType !== FdTypes.Receipt;
    return (
      <ir-dialog
        open={this.open}
        label={config?.title ?? ''}
        lightDismiss={false}
        onIrDialogHide={() => {
          this.cancelled.emit();
        }}
        onIrDialogAfterHide={() => {
          this.voidType = FdTypes.CreditNote;
          this.goodwillAmount = null;
        }}
      >
        {!showVoidOptions && <p class="confirm-dialog__message">{config?.message ?? ''}</p>}
        {/* {<p class="confirm-dialog__message">{config?.message ?? ''}</p>} */}
        {showVoidOptions && (
          <div class="void-options">
            <wa-radio-group defaultValue={this.voidType} value={this.voidType} onchange={(e: CustomEvent) => (this.voidType = (e.target as any).value)}>
              <wa-radio value={FdTypes.CreditNote}>
                <p class="confirm-dialog__radio-title">
                  Credit Note to reverse Invoice <b>{this.docNumber}</b>
                </p>
                <p class="confirm-dialog__radio-hint">Issue a Credit Note to reverse the invoice and unlock all invoiced entries for future invoicing.</p>
              </wa-radio>
              <wa-radio value={FdTypes.AdjustmentCredit}>
                <p class="confirm-dialog__radio-title">Adjustment Credit</p>
                <p class="confirm-dialog__radio-hint">
                  Add a folio credit adjustment to create a fiscal credit note document related to <b>{this.docNumber}</b>
                </p>
              </wa-radio>
            </wa-radio-group>
            {this.voidType === FdTypes.AdjustmentCredit && (
              <ir-input
                style={{ marginLeft: '1.5rem' }}
                max={this.amount}
                min="0"
                mask={'price'}
                value={this.goodwillAmount}
                defaultValue={this.goodwillAmount}
                onText-change={e => (this.goodwillAmount = e.detail)}
              >
                <span slot="start">{calendar_data.property.currency.symbol}</span>
              </ir-input>
            )}
          </div>
        )}
        <div slot="footer" class="ir-dialog__footer">
          <ir-custom-button size="m" variant="neutral" appearance="filled" onClickHandler={() => this.cancelled.emit()} disabled={this.isConfirming}>
            Cancel
          </ir-custom-button>
          <ir-custom-button
            size="m"
            variant={config?.confirmVariant ?? 'neutral'}
            onClickHandler={() =>
              this.confirmed.emit({
                amount: Number(this.goodwillAmount),
                voidType: this.voidType,
              })
            }
            loading={this.isConfirming}
          >
            {config?.confirmLabel ?? 'Confirm'}
          </ir-custom-button>
        </div>
      </ir-dialog>
    );
  }
}
