import { Component, Event, EventEmitter, Host, Method, State, h } from '@stencil/core';
import { BookingService } from '@/services/booking-service/booking.service';
import calendar_data from '@/stores/calendar-data';
import { FdTypes } from '@/types/enums';
import type { IToast } from '@/components/ui/ir-toast/toast';

export type VoidableDocumentType = typeof FdTypes.Invoice | typeof FdTypes.Receipt;

export interface VoidDocumentRequest {
  documentType: VoidableDocumentType;
  documentNumber: string;
  bookingNumber?: string;
}

@Component({
  tag: 'ir-void-document-dialog',
  styleUrl: 'ir-void-document-dialog.css',
  scoped: true,
})
export class IrVoidDocumentDialog {
  @State() isOpen = false;
  @State() isLoading = false;
  @State() request: VoidDocumentRequest | null = null;

  /**
   * Emitted once a document has actually been voided server-side.
   * Consumers listen for this to refresh whatever data they own — e.g. ir-guest-billing
   * refetches its own rows, ir-payment-details forwards it into resetBookingEvt.
   */
  @Event({ bubbles: true, composed: true }) documentVoided: EventEmitter<VoidDocumentRequest>;
  @Event({ bubbles: true }) toast: EventEmitter<IToast>;

  private bookingService = new BookingService();

  @Method()
  async open(request: VoidDocumentRequest) {
    this.request = request;
    this.isOpen = true;
  }

  @Method()
  async close() {
    this.isOpen = false;
  }

  private get isInvoice(): boolean {
    return this.request?.documentType === FdTypes.Invoice;
  }

  private async voidInvoice(documentNumber: string) {
    await this.bookingService.voidInvoice({
      invoice_nbr: documentNumber,
      property_id: calendar_data.property.id,
      reason: '',
    });
  }

  private async voidReceipt(_documentNumber: string) {
    await this.bookingService.voidPayment({
      receipt_nbr: _documentNumber,
      booking_nbr: this.request?.bookingNumber,
    });
  }

  private async handleConfirm() {
    if (!this.request) {
      return;
    }
    this.isLoading = true;
    try {
      if (this.isInvoice) {
        await this.voidInvoice(this.request.documentNumber);
      } else {
        await this.voidReceipt(this.request.documentNumber);
      }
      this.documentVoided.emit(this.request);
      this.isOpen = false;
    } catch (error) {
      console.error(error);
      this.toast.emit({
        type: 'error',
        title: 'Error',
        description: 'Failed to void document. Please try again.',
        position: 'top-right',
      });
    } finally {
      this.isLoading = false;
    }
  }

  render() {
    const documentLabel = this.isInvoice ? 'invoice' : 'receipt';
    const creditDocumentLabel = this.isInvoice ? 'credit note' : 'credit receipt';
    return (
      <Host>
        <ir-dialog
          label="Alert"
          open={this.isOpen}
          lightDismiss={false}
          onIrDialogHide={e => {
            e.stopImmediatePropagation();
            e.stopPropagation();
          }}
          onIrDialogAfterHide={e => {
            e.stopImmediatePropagation();
            e.stopPropagation();
            this.isOpen = false;
            this.request = null;
          }}
        >
          <p class="void-document-dialog__message">
            Void {documentLabel} {this.request?.documentNumber} by generating a {creditDocumentLabel}?
          </p>
          <div slot="footer" class="void-document-dialog__footer">
            <ir-custom-button data-dialog="close" size="m" appearance="filled" variant="neutral" disabled={this.isLoading}>
              Cancel
            </ir-custom-button>
            <ir-custom-button loading={this.isLoading} onClickHandler={() => this.handleConfirm()} size="m" variant="danger">
              Confirm
            </ir-custom-button>
          </div>
        </ir-dialog>
      </Host>
    );
  }
}
