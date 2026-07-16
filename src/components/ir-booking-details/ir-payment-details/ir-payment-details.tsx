import { Component, h, Prop, State, Event, EventEmitter, Listen } from '@stencil/core';
import { Booking, IPayment } from '@/models/booking.dto';
import { Agent } from '@/services/agents/type';
import { BookingService } from '@/services/booking-service/booking.service';
import { PaymentService, IPaymentAction } from '@/services/payment.service';
import locales from '@/stores/locales.store';
import { IToast } from '@/components/ui/ir-toast/toast';
import { Payment, PaymentEntries, PaymentSidebarEvent, PrintScreenOptions } from '../types';
import moment from 'moment';
import { formatAmount } from '@/utils/utils';
import calendar_data from '@/stores/calendar-data';
import { IEntries } from '@/models/property';
import { isAgentMode } from '../functions';
import { FolioRow } from '@/components/ir-city-ledger/ir-city-ledger-folio/types';
import { ClTx } from '@/services/city-ledger/types';
import { FdTypes, PayTypes } from '@/types/enums';
import type { GuestDocumentPreviewRequest } from '@/components/ir-fiscal-documents/ir-guest-document-preview/types';
import type { VoidDocumentRequest } from '@/components/ir-booking-details/ir-void-document-dialog/ir-void-document-dialog';

@Component({
  styleUrl: 'ir-payment-details.css',
  tag: 'ir-payment-details',
  scoped: true,
})
export class IrPaymentDetails {
  @Prop({ mutable: true }) booking: Booking;
  @Prop() paymentActions: IPaymentAction[];
  @Prop() propertyId: number;
  @Prop() paymentEntries: PaymentEntries;
  @Prop() language: string = 'en';
  @Prop() svcCategories: IEntries[];
  @Prop() isAllServicesAgentOwned: boolean = false;
  @Prop() agent: Agent;
  @Prop() folioRows: FolioRow[] = [];
  @Prop() clLoading: boolean = false;
  @Prop() clError: string | null = null;
  @Prop() clTransactions: ClTx[] = [];

  @State() confirmModal: boolean = false;
  @State() toBeDeletedItem: IPayment | null = null;
  @State() modalMode: 'delete' | 'save' | null = null;
  @State() isLoading: boolean = false;

  @Event({ bubbles: true }) resetBookingEvt: EventEmitter<null>;
  @Event({ bubbles: true }) resetExposedCancellationDueAmount: EventEmitter<null>;
  @Event({ bubbles: true }) toast: EventEmitter<IToast>;
  @Event({ bubbles: true }) openSidebar: EventEmitter<PaymentSidebarEvent>;
  @Event({ bubbles: true }) openPrintScreen: EventEmitter<PrintScreenOptions>;
  /** Opens an existing guest document (e.g. receipt) in the shared in-app preview. */
  @Event({ bubbles: true, composed: true }) guestDocumentPreview: EventEmitter<GuestDocumentPreviewRequest>;

  private paymentService = new PaymentService();
  private bookingService = new BookingService();
  private dialogRef: HTMLIrDialogElement;
  private voidDialogRef: HTMLIrVoidDocumentDialogElement;

  @Listen('generatePayment')
  handlePaymentGeneration(e: CustomEvent) {
    const value = e.detail;
    const paymentType = this.paymentEntries?.types?.find(p => p.CODE_NAME === (this.booking.status.code === '003' ? value.pay_type_code : '001'));
    this.openSidebar.emit({
      type: 'payment-folio',
      payload: {
        payment: {
          ...value,
          date: moment().format('YYYY-MM-DD'),
          id: -1,
          amount: value.amount,
          payment_type: paymentType
            ? {
                code: paymentType.CODE_NAME,
                description: paymentType.CODE_VALUE_EN,
                operation: paymentType.NOTES,
              }
            : null,
          designation: paymentType?.CODE_VALUE_EN ?? null,
        },
        mode: 'payment-action',
      },
    });
  }

  private handleAddPayment = (props?: { type: 'cancellation-penalty' | 'refund'; amount: number }) => {
    let payment: Payment = {
      id: -1,
      date: moment().format('YYYY-MM-DD'),
      amount: null,
      currency: calendar_data.currency,
      designation: null,
      reference: null,
    };
    if (props) {
      const { amount, type } = props;
      const cashMethod = this.paymentEntries.methods.find(pt => pt.CODE_NAME === '001');
      const payment_method = {
        code: cashMethod.CODE_NAME,
        description: cashMethod.CODE_VALUE_EN,
        operation: cashMethod.NOTES,
      };
      const paymentType = this.paymentEntries.types.find(pt => pt.CODE_NAME === (type === 'cancellation-penalty' ? '001' : '010'));
      payment = {
        ...payment,
        amount: amount,
        designation: paymentType.CODE_VALUE_EN,
        payment_type: {
          code: paymentType.CODE_NAME,
          description: paymentType.CODE_VALUE_EN,
          operation: paymentType.NOTES,
        },
        payment_method: type === 'refund' ? undefined : payment_method,
      };
      this.openSidebar.emit({
        type: 'payment-folio',
        payload: {
          payment,
          mode: 'payment-action',
        },
      });
      return;
    }
    this.openSidebar.emit({
      type: 'payment-folio',
      payload: {
        payment,
        mode: 'new',
      },
    });
  };

  private handleEditPayment(payment: IPayment) {
    this.openSidebar.emit({
      type: 'payment-folio',
      payload: { payment, mode: 'edit' },
    });
  }

  private handleDeletePayment(payment: IPayment) {
    this.modalMode = 'delete';
    this.toBeDeletedItem = payment;
    this.dialogRef.openModal();
  }

  private async handleIssueReceipt(detail: IPayment) {
    const { receipt_nbr, credit_receipt_nbr, payment_type } = detail;
    if (receipt_nbr || credit_receipt_nbr) {
      this.guestDocumentPreview.emit({
        documentNumber: payment_type?.code === PayTypes.Payment ? receipt_nbr : [PayTypes.CreditReceipt, PayTypes.Refund].includes(payment_type?.code as any) ? credit_receipt_nbr : null,
        fdTypeCode: payment_type?.code === PayTypes.Payment ? FdTypes.Receipt : payment_type?.code === PayTypes.Refund ? FdTypes.Refund : FdTypes.CreditReceipt,
        bookingNumber: this.booking.booking_nbr,
      });
      return;
    }
    // Issuing a brand-new receipt still uses the legacy print flow, which both
    // creates and renders the receipt.
    const starter = calendar_data.property.company?.receipt_prefix ? calendar_data.property.company?.receipt_prefix + '-' : '';
    const _number = await this.bookingService.getNextValue({ starter: `${starter}${calendar_data.property.aname}` });
    this.openPrintScreen.emit({
      mode: 'receipt',
      payload: {
        pid: detail.system_id?.toString(),
        rnb: `${starter}${_number.My_Result}`,
      },
    });
  }

  private handleVoidReceipt(payment: IPayment) {
    if (!payment.receipt_nbr) {
      return;
    }
    this.voidDialogRef?.open({ documentType: FdTypes.Receipt, documentNumber: payment.receipt_nbr, bookingNumber: this.booking.booking_nbr });
  }

  private async handleDocumentVoided(e: CustomEvent<VoidDocumentRequest>) {
    e.stopImmediatePropagation();
    e.stopPropagation();
    this.resetBookingEvt.emit(null);
  }

  private async cancelPayment() {
    try {
      this.isLoading = true;
      await this.paymentService.CancelPayment(this.toBeDeletedItem.system_id);
      const newPaymentArray = this.booking.financial.payments.filter((item: IPayment) => item.id !== this.toBeDeletedItem.id);

      this.booking = {
        ...this.booking,
        financial: { ...this.booking.financial, payments: newPaymentArray },
      };

      this.dialogRef.closeModal();
      this.confirmModal = false;
      this.resetBookingEvt.emit(null);
      this.resetExposedCancellationDueAmount.emit(null);
      this.toBeDeletedItem = null;
    } catch (error) {
      console.error('Error canceling payment:', error);
      this.toast.emit({
        type: 'error',
        title: 'Error',
        description: 'Failed to cancel payment. Please try again.',
        position: 'top-right',
      });
    } finally {
      this.isLoading = false;
    }
  }

  private handleConfirmModal = async (e: CustomEvent) => {
    e.stopImmediatePropagation();
    e.stopPropagation();

    if (this.modalMode === 'delete') {
      await this.cancelPayment();
    }
  };

  private handleCancelModal = (e: CustomEvent) => {
    e.stopImmediatePropagation();
    e.stopPropagation();
    this.modalMode = null;
    this.toBeDeletedItem = null;
  };

  private hasValidFinancialData(): boolean {
    return Boolean(this.booking?.financial);
  }

  // private shouldShowPaymentActions(): boolean {
  //   return Boolean(this.paymentActions?.filter(pa => pa.amount !== 0).length > 0 && this.booking.is_direct);
  // }
  private shouldShowRefundButton(): boolean {
    if (!this.booking.is_direct) {
      return false;
    }
    if (this.booking.financial.due_amount === 0) {
      return false;
    }
    if (this.booking.financial.cancelation_penality_as_if_today === 0) {
      return false;
    }
    if (this.booking.is_requested_to_cancel || ['003', '004'].includes(this.booking.status.code)) {
      return this.booking.financial.cancelation_penality_as_if_today < 0;
    }
    return false;
  }

  private shouldCancellationButton(): boolean {
    if (!this.booking.is_direct) {
      return false;
    }
    if (this.booking.guest_financial.due_amount === 0) {
      return false;
    }
    if (this.booking.financial.cancelation_penality_as_if_today === 0) {
      return false;
    }
    if (['003', '004'].includes(this.booking.status.code) && this.booking.financial.cancelation_penality_as_if_today > 0) {
      return true;
    }
    return false;
  }

  render() {
    if (!this.hasValidFinancialData()) {
      return null;
    }

    const { financial, currency } = this.booking;

    return [
      <wa-card>
        <ir-payment-summary
          clTransactions={this.clTransactions}
          isAllServicesAgentOwned={this.isAllServicesAgentOwned}
          booking={this.booking}
          agent={this.agent}
          isBookingCancelled={['003', '004'].includes(this.booking.status.code)}
          totalCost={financial.gross_cost}
          balance={financial.due_amount}
          collected={financial.collected + financial.refunds}
          currency={currency}
        />
        <ir-booking-guarantee booking={this.booking} bookingService={this.bookingService} />
        {/* {this.shouldShowPaymentActions() && <ir-payment-actions paymentAction={this.paymentActions} booking={this.booking} />} */}
        {!['003', '004'].includes(this.booking.status.code) && this.booking.is_direct && (
          <ir-applicable-policies propertyId={this.propertyId} booking={this.booking}></ir-applicable-policies>
        )}

        {this.shouldShowRefundButton() && (
          <div class="d-flex mt-1">
            <ir-custom-button
              variant="brand"
              appearance="outlined"
              onClickHandler={() => {
                this.handleAddPayment({ type: 'refund', amount: Math.abs(this.booking.financial.cancelation_penality_as_if_today) });
              }}
            >
              {`Refund ${formatAmount(currency.symbol, Math.abs(this.booking.financial.cancelation_penality_as_if_today))}`}
            </ir-custom-button>
          </div>
        )}
        {this.shouldCancellationButton() && (
          <div class="d-flex mt-1">
            <ir-custom-button
              variant="brand"
              appearance="outlined"
              onClickHandler={() => {
                this.handleAddPayment({ type: 'cancellation-penalty', amount: Math.abs(this.booking.financial.cancelation_penality_as_if_today) });
              }}
            >
              {`Charge cancellation penalty ${formatAmount(currency.symbol, this.booking.financial.cancelation_penality_as_if_today)}`}
            </ir-custom-button>
          </div>
        )}
      </wa-card>,
      isAgentMode(this.agent) && (
        <ir-booking-city-ledger
          booking={this.booking}
          language={this.language}
          svcCategories={this.svcCategories}
          folioRows={this.folioRows}
          isLoading={this.clLoading}
          error={this.clError}
        ></ir-booking-city-ledger>
      ),
      <ir-payments-folio
        booking={this.booking}
        payments={(financial.payments || []).filter(p => !p.is_city_ledger)}
        isAddPaymentDisabled={this.isAllServicesAgentOwned}
        onAddPayment={() => this.handleAddPayment()}
        onEditPayment={e => this.handleEditPayment(e.detail)}
        onDeletePayment={e => this.handleDeletePayment(e.detail)}
        onIssueReceipt={e => this.handleIssueReceipt(e.detail)}
        onVoidReceipt={e => this.handleVoidReceipt(e.detail)}
      />,
      <ir-void-document-dialog ref={el => (this.voidDialogRef = el)} onDocumentVoided={e => this.handleDocumentVoided(e)}></ir-void-document-dialog>,
      <ir-dialog
        onIrDialogHide={e => {
          e.stopImmediatePropagation();
          e.stopPropagation();
        }}
        onIrDialogAfterHide={e => {
          this.handleCancelModal(e);
        }}
        ref={el => (this.dialogRef = el)}
        label="Alert"
        lightDismiss={this.modalMode !== 'delete'}
      >
        <p>{this.modalMode === 'delete' ? locales.entries.Lcz_IfDeletedPermantlyLost : locales.entries.Lcz_EnteringAmountGreaterThanDue}</p>
        <div slot="footer" class="ir-dialog__footer">
          <ir-custom-button size="m" data-dialog="close" variant="neutral" appearance="filled">
            {locales.entries.Lcz_Cancel}
          </ir-custom-button>
          <ir-custom-button loading={this.isLoading} size="m" onClickHandler={e => this.handleConfirmModal(e)} variant={this.modalMode === 'delete' ? 'danger' : 'brand'}>
            {this.modalMode === 'delete' ? locales.entries.Lcz_Delete : locales.entries.Lcz_Confirm}
          </ir-custom-button>
        </div>
      </ir-dialog>,
    ];
  }
}
