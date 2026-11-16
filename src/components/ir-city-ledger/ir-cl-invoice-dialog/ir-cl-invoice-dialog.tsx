import { Component, Event, EventEmitter, Host, Method, Prop, State, h } from '@stencil/core';
import { CityLedgerService, type FiscalDocument } from '@/services/city-ledger';
import calendar_data from '@/stores/calendar-data';
import { ClTxTypeCode, FdTypes, InOut } from '@/types/enums';
import { ClFiscalDocumentPreviewRequest } from '../ir-city-ledger-fiscal-documents/ir-cl-fiscal-document-preview/types';
import WaSwitch from '@awesome.me/webawesome/dist/components/switch/switch';
import { Booking, IUnit } from '@/models/booking.dto';
import moment from 'moment';
import { formatBookingNumber } from '@/utils/number';
import { t } from '@/services/locale/t';

@Component({
  tag: 'ir-cl-invoice-dialog',
  styleUrl: 'ir-cl-invoice-dialog.css',
  scoped: true,
})
export class IrClInvoiceDialog {
  @Prop() agentId: number | null = null;
  @Prop() mode: 'booking' | 'default' = 'default';
  @Prop() booking: Booking;
  @Prop() startDate: string | null = null;
  @Prop() endDate: string | null = null;
  @Prop() currencyId: number | null = null;

  @State() isLoading: boolean = false;
  @State() error: string | null = null;
  @State() noResults: boolean = false;
  @State() isProforma: boolean = false;
  @State() isCompact: boolean = false;

  /**
   * Determines whether a final (non-proforma) invoice can be issued, based on
   * whether every room in the booking has effectively been checked out.
   *
   * Resolution order:
   * 1. When not in `booking` mode, or the booking has no rooms, there is nothing
   *    blocking a final invoice — returns `true`.
   * 2. When today is on or before the booking's to-date and at least one room is
   *    still checked in, the stay is ongoing — returns `false`.
   * 3. When today is exactly the booking's to-date and no room has been set
   *    (all rooms are `NotSet`), the invoice is allowed — returns `true`.
   * 4. Otherwise falls back to the default rule: `true` once today is past the
   *    booking's to-date, else `true` only when every room is checked out.
   *
   * @returns `true` when all rooms are considered checked out and a final invoice may be issued.
   */
  private get allRoomsCheckedOut(): boolean {
    if (this.mode !== 'booking' || !this.booking.rooms.length) return true;
    const today = moment();
    const bookingToDate = moment(this.booking.to_date, 'YYYY-MM-DD');
    if (today.isSameOrBefore(bookingToDate, 'date') && this.booking.rooms.some(r => r.in_out?.code === InOut.CheckedIn)) return false;
    if (today.isSame(bookingToDate, 'date') && this.booking.rooms.every(r => r.in_out?.code === InOut.NotSet)) return true;
    if (today.isAfter(bookingToDate, 'date')) return true;
    return this.booking.rooms.every(r => r.in_out?.code === InOut.CheckedOut);
  }

  @Event() invoiceIssued: EventEmitter<FiscalDocument>;
  @Event({ bubbles: true, composed: true }) fiscalDocumentIssued: EventEmitter<void>;
  @Event({ bubbles: true, composed: true }) clFiscalDocumentPreview: EventEmitter<ClFiscalDocumentPreviewRequest>;

  private dialogRef: HTMLIrDialogElement;
  private formRef: HTMLIrClInvoiceFormElement;
  private readonly invoicedClTxTypeCode = new Set([ClTxTypeCode.Adjustment, ClTxTypeCode.CancellationPenalty, ClTxTypeCode.Discount, ClTxTypeCode.StandardChargeDebit]);

  private cityLedgerService = new CityLedgerService();

  @Method()
  async openModal() {
    this.error = null;
    this.noResults = false;
    this.isProforma = !this.allRoomsCheckedOut;
    this.isCompact = false;
    this.dialogRef.openModal();
  }

  @Method()
  async closeModal() {
    this.dialogRef.closeModal();
  }

  private async handleSubmit() {
    this.isLoading = true;
    this.error = null;
    this.noResults = false;
    try {
      if (this.isProforma) {
        await this.handleProforma();
        return;
      }

      if (this.mode === 'booking') {
        const result = await this.cityLedgerService.issueFiscalDocument({
          AGENCY_ID: this.agentId,
          CURRENCY_ID: this.currencyId,
          START_DATE: this.startDate,
          END_DATE: this.endDate,
          BOOKING_NBR: this.booking?.booking_nbr,
          FD_TYPE_CODE: FdTypes.Draft,
          IS_COMPACT: this.isCompact,
        });
        const doc = result;
        this.clFiscalDocumentPreview.emit({
          fdTypeCode: doc.FD_TYPE_CODE,
          documentNumber: doc.DOC_NUMBER,
          agentId: doc.AGENCY_ID ?? this.agentId,
          agentName: doc.AGENCY_NAME,
          fdId: doc.FD_ID,
          externalRef: doc.EXTERNAL_REF,
        });
        this.invoiceIssued.emit(result);
        this.fiscalDocumentIssued.emit();
        this.dialogRef.closeModal();
      } else {
        const isValid = await this.formRef.validate();
        if (!isValid) {
          this.isLoading = false;
          return;
        }

        const { fromDate, toDate, is_checked_out_only, is_compact } = await this.formRef.getValues();

        const clResult = await this.cityLedgerService.fetchCL({
          AGENCY_ID: this.agentId,
          START_DATE: fromDate,
          END_DATE: toDate,
          START_ROW: 1,
          END_ROW: 999999,
          IS_CHECKED_OUT_ONLY: is_checked_out_only,
          IS_HOLD: false,
          IS_LOCKED: false,
        });

        // const targetCategories = [SvcCategory.Accommodation, 'TRF', 'GEN'];
        // const listClTxIds = [...new Set(clResult.My_Cl_tx.filter(tx => targetCategories.includes(tx.CATEGORY) && !tx.DOC_NUMBER).map(tx => tx.CL_TX_ID))];
        if (!clResult.My_Cl_tx?.length) {
          this.noResults = true;
          return;
        }

        const listClTxIds = [
          ...new Set(
            clResult.My_Cl_tx.map(tx => {
              if (this.invoicedClTxTypeCode.has(tx.CL_TX_TYPE_CODE as any)) {
                return tx.CL_TX_ID;
              }
              return null;
            }).filter(Boolean),
          ),
        ];

        const result = await this.cityLedgerService.issueFiscalDocument({
          AGENCY_ID: this.agentId,
          CURRENCY_ID: calendar_data?.property?.currency?.id,
          START_DATE: fromDate,
          END_DATE: toDate,
          LIST_CL_TX_ID: listClTxIds,
          FD_TYPE_CODE: FdTypes.Draft,
          IS_COMPACT: is_compact,
        });
        const doc = result;
        this.clFiscalDocumentPreview.emit({
          fdTypeCode: doc.FD_TYPE_CODE,
          documentNumber: doc.DOC_NUMBER,
          agentId: doc.AGENCY_ID ?? this.agentId,
          agentName: doc.AGENCY_NAME,
          fdId: doc.FD_ID,
          externalRef: doc.EXTERNAL_REF,
        });
        this.invoiceIssued.emit(doc);
        this.fiscalDocumentIssued.emit();
        this.dialogRef.closeModal();
      }
    } catch (err) {
      this.error = err instanceof Error ? err.message : t('Lcz_FailedToIssueInvoice', { fallback: 'Failed to issue invoice.' });
    } finally {
      this.isLoading = false;
    }
  }

  private async handleProforma() {
    try {
      let fromDate: string;
      let toDate: string;
      let bookingNbr: string | null = null;
      let isCompact = this.isCompact;

      if (this.mode === 'booking') {
        fromDate = this.startDate;
        toDate = this.endDate;
        bookingNbr = this.booking != null ? String(this.booking.booking_nbr) : null;
      } else {
        const isValid = await this.formRef.validate();
        if (!isValid) {
          this.isLoading = false;
          return;
        }
        const values = await this.formRef.getValues();
        fromDate = values.fromDate;
        toDate = values.toDate;
        isCompact = values.is_compact;
      }

      const url = await this.cityLedgerService.printClProforma({
        agency_id: String(this.agentId),
        from_date: fromDate,
        to_date: toDate,
        booking_nbr: bookingNbr,
        is_compact: isCompact,
      });
      this.fiscalDocumentIssued.emit();
      if (url) {
        this.clFiscalDocumentPreview.emit({
          fdTypeCode: FdTypes.Proforma,
          documentNumber: '',
          agentId: this.agentId,
          agentName: '',
          externalRef: '',
          url,
        });
      }
      this.dialogRef.closeModal();
    } catch (err) {
      this.error = err instanceof Error ? err.message : t('Lcz_FailedToGenerateProforma', { fallback: 'Failed to generate proforma.' });
    } finally {
      this.isLoading = false;
    }
  }

  render() {
    const units = this.booking ? this.booking?.rooms.filter(r => r.agent && r.in_out?.code !== InOut.CheckedOut).map(r => (r.unit as IUnit).name) : null;
    return (
      <Host>
        <ir-dialog label={t('Lcz_CreateInvoice', { fallback: 'Create Invoice' })} ref={el => (this.dialogRef = el)}>
          {this.booking && (
            <div slot="header-actions" class={'cl-invoice-dialog__header-actions'}>
              <wa-switch
                checked={this.isProforma}
                disabled={this.mode === 'booking' && !this.allRoomsCheckedOut}
                onchange={e => (this.isProforma = (e.target as WaSwitch).checked)}
              >
                {t('Lcz_Proforma', { fallback: 'Proforma' })}
              </wa-switch>
            </div>
          )}
          <div class="create-invoice-dialog__body">
            {this.mode === 'booking' ? (
              [
                !this.allRoomsCheckedOut ? (
                  <wa-callout size="s" variant="warning">
                    <wa-icon slot="icon" name="triangle-exclamation"></wa-icon>
                    {t('Lcz_ProformaOnlyInHouseWarning', {
                      fallback: 'Only a proforma invoice can be generated at this time because %1 is/are still in-house.',
                      params: [`${units?.length > 1 ? t('Lcz_UnitsLowercase', { fallback: 'units' }) : t('Lcz_UnitLowercase', { fallback: 'unit' })} ${units?.join(', ')}`],
                    })}
                  </wa-callout>
                ) : (
                  <p class="create-invoice-dialog__message">
                    {this.isProforma
                      ? t('Lcz_GenerateProformaConfirm', { fallback: 'Generate a proforma for Booking #%1?', params: [formatBookingNumber(this.booking?.booking_nbr)] })
                      : t('Lcz_IssueDraftInvoiceConfirm', {
                          fallback: 'Issue a draft invoice for Booking #%1 to the agent?',
                          params: [formatBookingNumber(this.booking?.booking_nbr)],
                        })}
                  </p>
                ),
                <wa-checkbox
                  checked={this.isCompact}
                  defaultChecked={this.isCompact}
                  onchange={e => {
                    this.isCompact = (e.target as HTMLInputElement).checked;
                  }}
                >
                  {t('Lcz_CompactVersion', { fallback: 'Compact version' })}
                </wa-checkbox>,
              ]
            ) : (
              <ir-cl-invoice-form ref={el => (this.formRef = el)}></ir-cl-invoice-form>
            )}
            {this.noResults && (
              <wa-callout variant="warning" class="create-invoice-dialog__no-results">
                <wa-icon slot="icon" name="triangle-exclamation"></wa-icon>
                {t('Lcz_NoTransactionsFoundForPeriod', { fallback: 'No transactions found for the selected period and filters.' })}
              </wa-callout>
            )}
            {this.error && <p class="create-invoice-dialog__error">{this.error}</p>}
          </div>

          <div slot="footer" class="ir-dialog__footer">
            <ir-custom-button size="m" appearance="filled" variant="neutral" data-dialog="close" disabled={this.isLoading}>
              {t('Lcz_Cancel', { fallback: 'Cancel' })}
            </ir-custom-button>
            <ir-custom-button size="m" appearance="accent" variant="brand" loading={this.isLoading} onClickHandler={() => this.handleSubmit()}>
              {this.isProforma ? t('Lcz_Confirm', { fallback: 'Confirm' }) : t('Lcz_ShowDraft', { fallback: 'Show draft' })}
            </ir-custom-button>
          </div>
        </ir-dialog>
      </Host>
    );
  }
}
