import { Component, Event, EventEmitter, Host, Method, Prop, State, h } from '@stencil/core';
import { CityLedgerService } from '@/services/city-ledger';
import type { FolioRow } from '../../types';
import { t } from '@/services/locale/t';

@Component({
  tag: 'ir-hold-transaction-dialog',
  styleUrl: 'ir-hold-transaction-dialog.css',
  scoped: true,
})
export class IrHoldTransactionDialog {
  @Prop() row: FolioRow | null = null;
  @Prop() currencySymbol: string = '$';

  @State() private isLoading: boolean = false;

  @Event() holdToggled: EventEmitter<{ rowId: string; newIsHold: boolean }>;

  private dialogRef: HTMLIrDialogElement;
  private cityLedgerService = new CityLedgerService();

  @Method()
  async openModal() {
    this.dialogRef.openModal();
  }

  @Method()
  async closeModal() {
    this.dialogRef.closeModal();
  }

  private async handleConfirm() {
    if (!this.row) return;
    const newIsHold = !this.row._raw.IS_HOLD;
    try {
      this.isLoading = true;
      await this.cityLedgerService.toggleCLTxHold({
        CL_TX_ID: this.row._raw.CL_TX_ID,
        IS_HOLD: newIsHold,
      });
      this.holdToggled.emit({ rowId: this.row._rowId, newIsHold });
      this.dialogRef.closeModal();
    } catch (error) {
      console.error('Failed to toggle hold status', error);
    } finally {
      this.isLoading = false;
    }
  }

  render() {
    const isHeld = this.row?.status?.id === 'held';
    return (
      <Host>
        <ir-dialog
          label={isHeld ? t('Lcz_RevertTransactionTitle', { fallback: 'Revert Transaction' }) : t('Lcz_HoldTransactionTitle', { fallback: 'Hold Transaction' })}
          ref={el => (this.dialogRef = el)}
        >
          <div class="hold-dialog__body">
            {isHeld ? (
              <p>{t('Lcz_RevertToUnbilledConfirmMessage', { fallback: 'Revert this transaction back to Unbilled status? It will re-enter the billing queue.' })}</p>
            ) : (
              <p>{t('Lcz_HoldConfirmMessage', { fallback: 'Place this transaction on Hold? It will be excluded from invoicing until released.' })}</p>
            )}
          </div>
          <div slot="footer" class="ir-dialog__footer">
            <ir-custom-button size="m" appearance="filled" variant="neutral" data-dialog="close">
              {t('Lcz_Cancel', { fallback: 'Cancel' })}
            </ir-custom-button>
            <ir-custom-button size="m" loading={this.isLoading} onClickHandler={() => this.handleConfirm()} appearance="accent" variant="brand">
              {t('Lcz_Confirm', { fallback: 'Confirm' })}
            </ir-custom-button>
          </div>
        </ir-dialog>
      </Host>
    );
  }
}
