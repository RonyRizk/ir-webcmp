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
import { FdTypes } from '@/types/enums';
import type { UnifiedFolioRecord, GetUnifiedFolioParams } from '@/services/property/types';

@Component({
  tag: 'ir-guest-billing',
  styleUrl: 'ir-guest-billing.css',
  scoped: true,
})
export class IrGuestBilling {
  @Prop() booking: Booking;

  @State() isOpen: 'invoice' = null;
  @State() isLoading: 'page' | 'void' = 'page';
  @State() invoiceInfo: BookingInvoiceInfo;
  @State() rows: UnifiedFolioRecord[] = [];
  @State() selectedInvoice: string = null;
  @State() private fdTypes: IEntries[] = [];

  @Event() billingClose: EventEmitter<void>;
  @Event({ bubbles: true, composed: true }) guestDocumentPreview: EventEmitter<GuestDocumentPreviewRequest>;

  private bookingService = new BookingService();
  private propertyService = new PropertyService();
  private _id = `issue_invoice__btn_${v4()}`;

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
      const [invoiceInfo, { rows }, fdTypes] = await Promise.all([
        this.bookingService.getBookingInvoiceInfo({ booking_nbr: this.booking.booking_nbr }),
        this.propertyService.getUnifiedFolio(this.buildFolioParams()),
        this.bookingService.getSetupEntriesByTableName('_FD_TYPE'),
      ]);
      this.invoiceInfo = invoiceInfo;
      this.rows = rows;
      this.fdTypes = fdTypes ?? [];
    } catch (error) {
      console.error(error);
    } finally {
      this.isLoading = null;
    }
  }

  private async voidInvoice(e: CustomEvent) {
    this.isLoading = 'void';
    e.stopImmediatePropagation();
    e.stopPropagation();
    await this.bookingService.voidInvoice({
      invoice_nbr: this.selectedInvoice,
      property_id: calendar_data.property.id,
      reason: '',
    });
    const [invoiceInfo, { rows }] = await Promise.all([
      this.bookingService.getBookingInvoiceInfo({ booking_nbr: this.booking.booking_nbr }),
      this.propertyService.getUnifiedFolio(this.buildFolioParams()),
    ]);
    this.invoiceInfo = invoiceInfo;
    this.rows = rows;
    this.isLoading = null;
    this.selectedInvoice = null;
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
                                    this.selectedInvoice = row.DOC_NUMBER;
                                    break;
                                }
                              }}
                            >
                              <wa-dropdown-item value="view-print">
                                Open PDF
                                {isRequestPending('/Print_Invoice') && <wa-spinner slot="details"></wa-spinner>}
                              </wa-dropdown-item>
                              {isInvoice && (
                                <wa-dropdown-item variant="danger" value="void">
                                  Void with credit note
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

                    {isInvoice && (
                      <div slot="footer" class="billing__card-footer">
                        <ir-custom-button
                          onClickHandler={() => {
                            this.selectedInvoice = row.DOC_NUMBER;
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
        <ir-dialog
          label="Alert"
          open={this.selectedInvoice !== null}
          lightDismiss={false}
          onIrDialogHide={e => {
            e.stopImmediatePropagation();
            e.stopPropagation();
          }}
          onIrDialogAfterHide={e => {
            e.stopImmediatePropagation();
            e.stopPropagation();
            this.selectedInvoice = null;
          }}
        >
          <p>Void invoice {this.selectedInvoice} by generating a credit note?</p>
          <div slot="footer" class="ir-dialog__footer">
            <ir-custom-button data-dialog="close" size="m" appearance="filled" variant="neutral">
              Cancel
            </ir-custom-button>
            <ir-custom-button loading={this.isLoading === 'void'} onClickHandler={this.voidInvoice.bind(this)} size="m" variant="danger">
              Confirm
            </ir-custom-button>
          </div>
        </ir-dialog>
      </Fragment>
    );
  }
}
