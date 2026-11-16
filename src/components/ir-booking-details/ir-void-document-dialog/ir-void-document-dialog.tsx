import { Component, Event, EventEmitter, Host, Method, State, h } from '@stencil/core';
import { BookingService } from '@/services/booking-service/booking.service';
import calendar_data from '@/stores/calendar-data';
import { FdTypes } from '@/types/enums';
import type { IToast } from '@/components/ui/ir-toast/toast';
import { t } from '@/services/locale/t';

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
        title: t('Lcz_Error', { fallback: 'Error' }),
        description: t('Lcz_FailedToVoidDocument', { fallback: 'Failed to void document. Please try again.' }),
        position: 'top-right',
      });
    } finally {
      this.isLoading = false;
    }
  }

  render() {
    const documentLabel = this.isInvoice ? t('Lcz_DocumentTypeInvoice', { fallback: 'Invoice' }) : t('Lcz_DocumentTypeReceipt', { fallback: 'Receipt' });
    const creditDocumentLabel = this.isInvoice ? t('Lcz_DocumentTypeCreditNote', { fallback: 'Credit Note' }) : t('Lcz_CreditReceipt', { fallback: 'Credit Receipt' });
    return (
      <Host>
        <ir-dialog
          label={t('Lcz_Alert', { fallback: 'Alert' })}
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
            {t('Lcz_VoidDocumentConfirm', { fallback: 'Void %1 %2 by generating a %3?', params: [documentLabel, this.request?.documentNumber ?? '', creditDocumentLabel] })}
          </p>
          <div slot="footer" class="void-document-dialog__footer">
            <ir-custom-button data-dialog="close" size="m" appearance="filled" variant="neutral" disabled={this.isLoading}>
              {t('Lcz_Cancel', { fallback: 'Cancel' })}
            </ir-custom-button>
            <ir-custom-button loading={this.isLoading} onClickHandler={() => this.handleConfirm()} size="m" variant="danger">
              {t('Lcz_Confirm', { fallback: 'Confirm' })}
            </ir-custom-button>
          </div>
        </ir-dialog>
      </Host>
    );
  }
}
