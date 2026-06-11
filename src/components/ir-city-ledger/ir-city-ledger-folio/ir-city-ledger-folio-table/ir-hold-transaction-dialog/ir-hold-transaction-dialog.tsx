import { Component, Event, EventEmitter, Host, Method, Prop, State, h } from '@stencil/core';
import { CityLedgerService } from '@/services/city-ledger';
import type { FolioRow } from '../../types';

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
    const isHeld = this.row?.status?.label === 'Held';
    return (
      <Host>
        <ir-dialog label={isHeld ? 'Revert Transaction' : 'Hold Transaction'} ref={el => (this.dialogRef = el)}>
          <div class="hold-dialog__body">
            {isHeld ? (
              <p>
                Revert this transaction back to <strong>Unbilled</strong> status? It will re-enter the billing queue.
              </p>
            ) : (
              <p>
                Place this transaction on <strong>Hold</strong>? It will be excluded from invoicing until released.
              </p>
            )}
          </div>
          <div slot="footer" class="ir-dialog__footer">
            <ir-custom-button size="medium" appearance="filled" variant="neutral" data-dialog="close">
              Cancel
            </ir-custom-button>
            <ir-custom-button size="medium" loading={this.isLoading} onClickHandler={() => this.handleConfirm()} appearance="accent" variant="brand">
              Confirm
            </ir-custom-button>
          </div>
        </ir-dialog>
      </Host>
    );
  }
}
