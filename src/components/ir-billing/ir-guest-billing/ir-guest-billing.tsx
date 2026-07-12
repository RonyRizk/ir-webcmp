import { Booking } from '@/models/booking.dto';
import { Component, Event, EventEmitter, Fragment, Listen, Prop, State, h } from '@stencil/core';
import { BookingInvoiceInfo } from '../../ir-invoice/types';
import { BookingService } from '@/services/booking-service/booking.service';
import { PropertyService } from '@/services/property.service';
import { formatAmount, getEntryValue } from '@/utils/utils';
import type { IEntries } from '@/models/property';
import moment from 'moment';
import { isRequestPending } from '@/stores/ir-interceptor.store';
import { v4 } from 'uuid';
import calendar_data from '@/stores/calendar-data';
import { GuestDocumentPreviewRequest } from '@/components/ir-fiscal-documents/ir-guest-document-preview/types';
import { FdTypes, PayStatus, PayTypes } from '@/types/enums';
import type { UnifiedFolioRecord, GetUnifiedFolioParams } from '@/services/property/types';
import type { VoidDocumentRequest } from '@/components/ir-booking-details/ir-void-document-dialog/ir-void-document-dialog';

@Component({
  tag: 'ir-guest-billing',
  styleUrl: 'ir-guest-billing.css',
  scoped: true,
})
export class IrGuestBilling {
  @Prop() booking: Booking;

  @State() isOpen: 'invoice' = null;
  @State() isLoading: 'page' | null = 'page';
  @State() invoiceInfo: BookingInvoiceInfo;
  @State() rows: UnifiedFolioRecord[] = [];
  @State() private fdTypes: IEntries[] = [];
  @State() voidedInvoices: Set<string> = new Set();
  @State() voidedReceipts: Set<string> = new Set();

  @Event() billingClose: EventEmitter<void>;
  @Event({ bubbles: true, composed: true }) guestDocumentPreview: EventEmitter<GuestDocumentPreviewRequest>;
  /** Refreshes the wider booking-details tree. Emit with a Booking payload to skip ir-booking-details' full-page loading spinner. */
  @Event({ bubbles: true, composed: true }) resetBookingEvt: EventEmitter<Booking | null>;

  private bookingService = new BookingService();
  private propertyService = new PropertyService();
  private _id = `issue_invoice__btn_${v4()}`;
  private voidDialogRef: HTMLIrVoidDocumentDialogElement;

  componentWillLoad() {
    this.init();
  }

  @Listen('invoiceCreated')
  async handleInvoiceCreation(e: CustomEvent) {
    e.stopImmediatePropagation();
    e.stopPropagation();
    this.invoiceInfo = { ...e.detail };
    const { rows } = await this.propertyService.getUnifiedFolio(this.buildFolioParams());
    this.rows = rows;
  }

  private buildFolioParams(): GetUnifiedFolioParams {
    return {
      property_id: calendar_data.property.id,
      from_date: null,
      to_date: null,
      target_type: 'GUEST',
      doc_type: null,
      fd_type_code: null,
      doc_number: null,
      agent_id: null,
      guest_id: null,
      booking_number: this.booking.booking_nbr,
      page_index: 0,
      page_size: 500,
      o_Total_Rows: null,
      is_export_to_excel: false,
      Link_excel: '',
    };
  }

  private async init() {
    try {
      this.isLoading = 'page';
      const [, fdTypes] = await Promise.all([this.refreshInvoiceAndFolio(), this.bookingService.getSetupEntriesByTableName('_FD_TYPE')]);
      this.fdTypes = fdTypes ?? [];
      let voidedReceipts: Set<string> = new Set();
      this.booking.financial.payments?.forEach(payment => {
        if (payment.payment_type?.code === PayTypes.Payment && !payment.is_city_ledger && payment.payment_status?.code === PayStatus.Void) {
          voidedReceipts.add(payment.receipt_nbr);
        }
      });
      this.voidedReceipts = voidedReceipts;
    } catch (error) {
      console.error(error);
    } finally {
      this.isLoading = null;
    }
  }

  private async refreshInvoiceAndFolio() {
    const [invoiceInfo, { rows }] = await Promise.all([
      this.bookingService.getBookingInvoiceInfo({ booking_nbr: this.booking.booking_nbr }),
      this.propertyService.getUnifiedFolio(this.buildFolioParams()),
    ]);
    this.invoiceInfo = invoiceInfo;
    let voidedInvoices: Set<string> = new Set();
    this.invoiceInfo.invoices?.forEach(invoice => {
      if (invoice.credit_note) {
        voidedInvoices.add(invoice.nbr);
      }
    });
    this.voidedInvoices = voidedInvoices;
    this.rows = rows;
  }

  private async handleDocumentVoided(e: CustomEvent<VoidDocumentRequest>) {
    e.stopImmediatePropagation();
    e.stopPropagation();
    await this.refreshInvoiceAndFolio();
    if (e.detail.documentType === FdTypes.Receipt) {
      const voidedReceipts = new Set(this.voidedReceipts);
      voidedReceipts.add(e.detail.documentNumber);
      this.voidedReceipts = new Set(voidedReceipts);
      // Voiding a receipt changes booking.financial.payments, which this component doesn't own.
      // Pass the freshly fetched booking so ir-booking-details updates in place instead of
      // taking the resetBookingEvt(null) branch, which shows its full-page loading spinner.
      const freshBooking = await this.bookingService.getExposedBooking({ booking_nbr: this.booking.booking_nbr, language: 'en' });
      this.resetBookingEvt.emit(freshBooking);
    }
  }

  private get fdTypeLabels(): Record<string, string> {
    const map: Record<string, string> = {};
    for (const entry of this.fdTypes) {
      map[entry.CODE_NAME] = getEntryValue({ entry, language: 'en' });
    }
    return map;
  }

  private get sortedRows(): UnifiedFolioRecord[] {
    return [...this.rows].sort((a, b) => {
      const aDate = moment(a.DOC_DATE, 'YYYY-MM-DD');
      const bDate = moment(b.DOC_DATE, 'YYYY-MM-DD');
      return aDate.diff(bDate);
    });
  }

  private printInvoice({ row, autoDownload }: { row: UnifiedFolioRecord; autoDownload?: boolean }) {
    this.guestDocumentPreview.emit({
      documentNumber: row.DOC_NUMBER,
      fdTypeCode: row.FD_TYPE_CODE,
      bookingNumber: this.booking.booking_nbr,
      autoDownload,
    });
  }
  private renderMoney(amount: number) {
    if (!amount) {
      return null;
    }
    return formatAmount(calendar_data?.property?.currency?.symbol, amount);
  }

  render() {
    if (this.isLoading === 'page') {
      return (
        <div class="drawer__loader-container">
          <ir-spinner></ir-spinner>
        </div>
      );
    }
    const currencySymbol = this.booking.currency?.symbol ?? '';
    return (
      <Fragment>
        <div class="billing__container">
          <section>
            <div class="billing__section-title-row">
              <h4 class="billing__section-title">Issued documents</h4>
              <ir-custom-button
                variant="brand"
                id={this._id}
                onClickHandler={e => {
                  e.stopImmediatePropagation();
                  e.stopPropagation();
                  this.isOpen = 'invoice';
                }}
              >
                Issue invoice
              </ir-custom-button>
            </div>
            <div class="table-container">
              <table class="table data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th class="billing__doc-number-col">Doc number</th>
                    <th>Type</th>
                    <th class="billing__price-col">Debit</th>
                    <th class="billing__price-col">Credit</th>
                    <th class={'text-center'}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {this.sortedRows.length === 0 && (
                    <tr>
                      <td colSpan={6} class="empty-row">
                        <ir-empty-state></ir-empty-state>
                      </td>
                    </tr>
                  )}
                  {this.sortedRows.map(row => {
                    const isInvoice = row.FD_TYPE_CODE === FdTypes.Invoice;
                    const isReceipt = row.FD_TYPE_CODE === FdTypes.Receipt;
                    return (
                      <tr class="ir-table-row" key={row.DOC_NUMBER}>
                        <td>{row.DOC_DATE ? moment(row.DOC_DATE, 'YYYY-MM-DD').format('MMM DD, YYYY') : '—'}</td>
                        <td class="billing__doc-number-col">
                          <wa-button onClick={() => this.printInvoice({ row })} variant="brand" appearance="plain" class="billing__invoice-nbr">
                            {row.DOC_NUMBER}
                          </wa-button>
                        </td>
                        <td>{(row.FD_TYPE_CODE && this.fdTypeLabels[row.FD_TYPE_CODE]) || row.FD_TYPE_CODE || '—'}</td>
                        <td class="billing__price-col">
                          <span class="ir-price" style={{ fontWeight: '400' }}>
                            {this.renderMoney(row.DEBIT)}
                          </span>
                        </td>
                        <td class="billing__price-col">
                          <span class="ir-price" style={{ fontWeight: '400' }}>
                            {this.renderMoney(row.CREDIT)}
                          </span>
                        </td>
                        <td>
                          <div class="billing__actions-row">
                            <wa-dropdown
                              onwa-hide={e => {
                                e.stopImmediatePropagation();
                                e.stopPropagation();
                              }}
                              onwa-select={async e => {
                                switch ((e.detail as any).item.value) {
                                  case 'print':
                                    this.printInvoice({ row, autoDownload: true });
                                    break;
                                  case 'view-print':
                                    this.printInvoice({ row });
                                    break;
                                  case 'void':
                                    this.voidDialogRef?.open({
                                      documentType: isInvoice ? FdTypes.Invoice : FdTypes.Receipt,
                                      documentNumber: row.DOC_NUMBER,
                                      bookingNumber: this.booking.booking_nbr,
                                    });
                                    break;
                                }
                              }}
                            >
                              <wa-dropdown-item value="view-print">
                                Open PDF
                                {isRequestPending('/Print_Invoice') && <wa-spinner slot="details"></wa-spinner>}
                              </wa-dropdown-item>
                              {isInvoice && !this.voidedInvoices.has(row.DOC_NUMBER) && (
                                <wa-dropdown-item variant="danger" value="void">
                                  Void with credit note
                                </wa-dropdown-item>
                              )}
                              {isReceipt && !this.voidedReceipts.has(row.DOC_NUMBER) && (
                                <wa-dropdown-item variant="danger" value="void">
                                  Void with credit receipt
                                </wa-dropdown-item>
                              )}
                              <ir-custom-button slot="trigger" id={`pdf-${row.DOC_ID ?? row.DOC_NUMBER}`} variant="neutral" appearance="plain">
                                <wa-icon name="ellipsis-vertical" style={{ fontSize: '1rem' }}></wa-icon>
                              </ir-custom-button>
                            </wa-dropdown>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div class="billing__cards">
              {this.sortedRows.length === 0 && (
                <div class="billing__empty-state">
                  <ir-empty-state></ir-empty-state>
                </div>
              )}
              {this.sortedRows.map(row => {
                const isInvoice = row.FD_TYPE_CODE === FdTypes.Invoice;
                return (
                  <wa-card key={row.DOC_NUMBER} class="billing__card">
                    <div class="billing__card-header">
                      <div class="billing__card-header-info">
                        <p class="billing__card-number">
                          {(row.FD_TYPE_CODE && this.fdTypeLabels[row.FD_TYPE_CODE]) || row.FD_TYPE_CODE || '—'}:{row.DOC_NUMBER}
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                        <wa-tooltip for={`mobile-download-pdf-${row.DOC_ID ?? row.DOC_NUMBER}`}>Open PDF</wa-tooltip>
                        <ir-custom-button
                          onClickHandler={() => this.printInvoice({ row })}
                          loading={isRequestPending('/Print_Invoice')}
                          id={`mobile-download-pdf-${row.DOC_ID ?? row.DOC_NUMBER}`}
                          variant="neutral"
                          appearance="plain"
                          class="billing__card-download-btn"
                        >
                          <wa-icon name="file-pdf" style={{ fontSize: '1rem' }}></wa-icon>
                        </ir-custom-button>
                      </div>
                    </div>

                    <div class="billing__card-details">
                      <div class="billing__card-detail">
                        <p class="billing__card-detail-label">Date</p>
                        <p class="billing__card-detail-value">{row.DOC_DATE ? moment(row.DOC_DATE, 'YYYY-MM-DD').format('MMM DD, YYYY') : '—'}</p>
                      </div>

                      <div class="billing__card-detail">
                        <p class="billing__card-detail-label --amount">Amount</p>
                        <p class="billing__card-detail-value">{formatAmount(currencySymbol, row.TOTAL_AMOUNT ?? 0)}</p>
                      </div>
                    </div>

                    {isInvoice && !this.voidedInvoices.has(row.DOC_NUMBER) && (
                      <div slot="footer" class="billing__card-footer">
                        <ir-custom-button
                          onClickHandler={() => {
                            this.voidDialogRef?.open({ documentType: FdTypes.Invoice, documentNumber: row.DOC_NUMBER });
                          }}
                          variant="danger"
                          appearance="outlined"
                          class="billing__card-void-btn"
                        >
                          Void with credit note
                        </ir-custom-button>
                      </div>
                    )}
                  </wa-card>
                );
              })}
            </div>
          </section>
        </div>
        <ir-invoice
          invoiceInfo={this.invoiceInfo}
          onInvoiceClose={e => {
            e.stopImmediatePropagation();
            e.stopPropagation();
            this.isOpen = null;
          }}
          open={this.isOpen === 'invoice'}
          booking={this.booking}
        ></ir-invoice>
        <ir-void-document-dialog ref={el => (this.voidDialogRef = el)} onDocumentVoided={e => this.handleDocumentVoided(e)}></ir-void-document-dialog>
      </Fragment>
    );
  }
}
