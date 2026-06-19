import { Component, Event, EventEmitter, Fragment, Prop, State, Watch, h } from '@stencil/core';
import moment from 'moment';
import type { ZodIssue } from 'zod';
import type { IEntries } from '@/models/IBooking';
import type { PaymentEntries } from '@/components/ir-booking-details/types';
import { BookingService } from '@/services/booking-service/booking.service';
import { buildPaymentTypes } from '@/services/booking-service/utils';
import { CityLedgerService } from '@/services/city-ledger';
import type { FiscalDocuments } from '@/services/city-ledger/types';
import type { ClFiscalDocumentPreviewRequest } from '../../../ir-city-ledger-fiscal-documents/ir-cl-fiscal-document-preview/types';
import calendar_data from '@/stores/calendar-data';
import {
  DATE_INPUT_FORMAT,
  TRANSACTION_TYPE_RATES,
  amountFieldSchema,
  createInitialTransactionFormDraft,
  dateFieldSchema,
  hydrateFormDraftFromTx,
  resetDraftForTransactionType,
  taxIdFieldSchema,
  transactionTypeFieldSchema,
  validateCityLedgerTransaction,
  type CityLedgerTransactionFormDraft,
  type CityLedgerTransactionPayload,
  type LinkedOption,
  type ServiceCategoryOption,
  type TaxOption,
  type TransactionType,
} from './ir-city-ledger-transaction-form.schema';
import { ClTxTypeCode, FdStatus, FdTypes, VatIncludedCodes } from '@/types/enums';
import { Agent } from '@/services/agents/type';
import { Booking } from '@/models/booking.dto';
import type { ClTx } from '@/services/city-ledger';

@Component({
  tag: 'ir-city-ledger-transaction-form',
  styleUrl: 'ir-city-ledger-transaction-form.css',
  scoped: true,
})
export class IrCityLedgerTransactionForm {
  @Prop() formId: string = 'city-ledger-transaction-form';
  @Prop() agent: Agent | null = null;
  @Prop() initialTransactionType: TransactionType = ClTxTypeCode.Payment;
  @Prop() unpaidInvoiceOptions: LinkedOption[] = [];
  @Prop() bookingOptions: LinkedOption[] = [];
  @Prop() serviceCategoryOptions: ServiceCategoryOption[] = [];
  @Prop() language: string = 'en';
  @Prop() booking: Booking | null = null;
  @Prop() transaction: ClTx | null = null;

  @State() formData: CityLedgerTransactionFormDraft = createInitialTransactionFormDraft();
  @State() paymentEntries: PaymentEntries = {
    types: [],
    groups: [],
    methods: [],
  };
  @State() paymentTypeGroups: Record<string, IEntries[]> = {};
  @State() isLoading: boolean = true;
  @State() isSubmitting: boolean = false;
  @State() fiscalDocuments: FiscalDocuments = [];

  @Event() transactionSaved: EventEmitter<void>;
  @Event() transactionValidationFailed: EventEmitter<ZodIssue[]>;
  @Event() submitDisabledChange: EventEmitter<boolean>;
  @Event() clFiscalDocumentPreview: EventEmitter<ClFiscalDocumentPreviewRequest>;

  private taxOptions: TaxOption[] = [];
  private bookingService = new BookingService();
  private cityLedgerService = new CityLedgerService();
  private clTxTypes: IEntries[];

  private get resolvedInitialType(): TransactionType {
    return ClTxTypeCode.Payment;
  }

  private getUniqueTaxValues() {
    let taxes: Set<number> = new Set();
    calendar_data?.property.tax_categories?.forEach(t => {
      if (t.taxation_mode.code === VatIncludedCodes.Inclusive) taxes.add(t.pct);
    });
    this.taxOptions = Array.from(taxes).map(t => ({ id: t.toString(), label: `${t}%` }));
  }

  componentWillLoad() {
    this.formData = this.transaction ? hydrateFormDraftFromTx(this.transaction) : createInitialTransactionFormDraft(this.resolvedInitialType);
    this.fetchPaymentEntries();
    this.getUniqueTaxValues();
  }

  @Watch('transaction')
  handleTransactionChange(newTx: ClTx | null) {
    this.formData = newTx ? hydrateFormDraftFromTx(newTx) : createInitialTransactionFormDraft(this.resolvedInitialType);
  }

  @Watch('initialTransactionType')
  handleInitialTransactionTypeChange(_newType: TransactionType) {
    if (!this.transaction) {
      this.formData = resetDraftForTransactionType(this.resolvedInitialType, this.formData);
    }
  }

  private updateFormData(patch: Partial<CityLedgerTransactionFormDraft>) {
    this.formData = { ...this.formData, ...patch };
  }

  private get isSubmitDisabled(): boolean {
    return this.formData.transactionType === ClTxTypeCode.DebitNote && !this.isLoading && this.fiscalDocuments.length === 0;
  }

  private handleTransactionTypeChange(nextType: TransactionType) {
    this.formData = resetDraftForTransactionType(nextType, this.formData);
    if (nextType === ClTxTypeCode.Payment || nextType === ClTxTypeCode.CreditNote || nextType === ClTxTypeCode.DebitNote) {
      this.fetchFiscalDocumentsForType(nextType);
    } else {
      this.submitDisabledChange.emit(false);
    }
  }

  private async fetchFiscalDocumentsForType(type: typeof ClTxTypeCode.Payment | typeof ClTxTypeCode.CreditNote | typeof ClTxTypeCode.DebitNote) {
    try {
      this.isLoading = true;
      const LIST_FD_TYPE_CODE: string[] = [FdTypes.Invoice];
      if (type === ClTxTypeCode.Payment) {
        LIST_FD_TYPE_CODE.push(FdTypes.DebitNote);
      }
      this.fiscalDocuments = await this.cityLedgerService.getFiscalDocuments({
        AGENCY_ID: this.agent?.id,
        START_DATE: null,
        END_DATE: null,
        LIST_FD_TYPE_CODE,
        BOOK_NBR: this.booking?.booking_nbr,
        LIST_FD_STATUS_CODE: type === ClTxTypeCode.Payment ? [FdStatus.Sent, FdStatus.Issued] : [FdStatus.Paid, FdStatus.Issued],
      });
      if (type === ClTxTypeCode.CreditNote && this.fiscalDocuments.length === 0 && this.formData.creditNoteMode === 'cancel-invoice') {
        this.updateFormData({ creditNoteMode: 'goodwill', invoiceId: undefined });
      }
      if (type === ClTxTypeCode.Payment && this.fiscalDocuments.length === 0) {
        this.updateFormData({ onAccount: true, invoiceId: undefined });
      }
    } catch (error) {
      console.error('Failed to fetch fiscal documents', error);
      this.fiscalDocuments = [];
    } finally {
      this.isLoading = false;
      this.submitDisabledChange.emit(this.isSubmitDisabled);
    }
  }

  private async fetchPaymentEntries() {
    try {
      this.isLoading = true;
      const setupEntries = await this.bookingService.getSetupEntriesByTableNameMulti(['_PAY_TYPE', '_PAY_TYPE_GROUP', '_PAY_METHOD', '_CL_TX_TYPE']);
      const { pay_type, pay_type_group, pay_method, cl_tx_type } = this.bookingService.groupEntryTablesResult(setupEntries);
      this.paymentEntries = {
        types: pay_type ?? [],
        groups: pay_type_group ?? [],
        methods: pay_method ?? [],
      };
      this.clTxTypes = cl_tx_type;
      this.paymentTypeGroups = buildPaymentTypes(this.paymentEntries);
    } catch (error) {
      console.error('Failed to load payment setup entries', error);
      this.paymentEntries = { types: [], groups: [], methods: [] };
      this.paymentTypeGroups = {};
    } finally {
      this.isLoading = false;
    }
  }

  private buildParams(payload: CityLedgerTransactionPayload) {
    const amount = payload.amount ?? 0;
    let credit = 0;
    let debit = 0;
    let payMethodCode = '';

    switch (payload.transactionType) {
      case ClTxTypeCode.OpeningBalance:
      case ClTxTypeCode.Adjustment:
        if (payload.entryType === 'CR') credit = amount;
        else debit = amount;
        break;
      case ClTxTypeCode.Payment:
      case ClTxTypeCode.CreditNote:
      case ClTxTypeCode.Discount:
        credit = amount;
        break;
      case ClTxTypeCode.StandardChargeDebit:
      case ClTxTypeCode.DebitNote:
      case ClTxTypeCode.CancellationPenalty:
        debit = amount;
        break;
    }

    if (payload.transactionType === ClTxTypeCode.Payment) {
      payMethodCode = payload.payment_method?.code ?? '';
    }

    const noTaxTransaction = payload.transactionType === ClTxTypeCode.OpeningBalance || payload.transactionType === ClTxTypeCode.Payment;
    const hasVat = !noTaxTransaction && payload.taxId !== 'N/A';

    const typeLabel = this.clTxTypes.find(c => c.CODE_NAME === payload.transactionType)?.CODE_VALUE_EN ?? payload.transactionType;
    return {
      CL_TX_ID: this.transaction?.CL_TX_ID ?? -1,
      AGENCY_ID: this.agent.id,
      SERVICE_DATE: payload.date,
      CL_TX_TYPE_CODE: payload.transactionType,
      DESCRIPTION: payload.reference ? `${typeLabel}: ${payload.reference}` : typeLabel,
      DEBIT: debit,
      CREDIT: credit,
      CURRENCY_ID: calendar_data?.property?.currency?.id,
      PAY_METHOD_CODE: payMethodCode,
      EXTERNAL_REF: payload.reference ?? '',
      BH_ID: this.booking?.system_id ?? null,
      VAT_INCLUDED_CODE: (noTaxTransaction ? '' : hasVat ? '001' : '002') as '001' | '002',
      VAT_PCT: noTaxTransaction ? null : hasVat ? Number(payload.taxId) : 0,
    };
  }

  private handleSubmit = async (event: Event) => {
    event.preventDefault();
    const validation = validateCityLedgerTransaction(this.formData);

    if (!validation.success) {
      this.transactionValidationFailed.emit(validation.error.issues);
      return;
    }

    try {
      this.isSubmitting = true;
      if (validation.data.transactionType === ClTxTypeCode.CreditNote) {
        await this.cityLedgerService.voidInvoiceByCreditNote({
          FD_ID: Number(validation.data.invoiceId),
          VOID_DATE: validation.data.date,
          REASON: validation.data.reference,
        });
      } else {
        const result = await this.cityLedgerService.issueManualCLTx(this.buildParams(validation.data));
        if (result?.My_Fd?.FD_TYPE_CODE && result.My_Fd.DOC_NUMBER) {
          this.clFiscalDocumentPreview.emit({
            fdTypeCode: result.My_Fd.FD_TYPE_CODE,
            documentNumber: result.My_Fd.DOC_NUMBER,
            agentId: this.agent.id,
            agentName: result.My_Fd.AGENCY_NAME ?? '',
            externalRef: result.My_Fd.EXTERNAL_REF,
          });
        }
      }
      this.transactionSaved.emit();
    } catch (error) {
      console.error('Failed to save transaction', error);
    } finally {
      this.isSubmitting = false;
    }
  };

  private renderTransactionTypeField() {
    return (
      <div class="transaction-form__field">
        <ir-validator schema={transactionTypeFieldSchema} value={this.formData.transactionType} valueEvent="change">
          <wa-select
            label="Transaction Type"
            size="s"
            defaultValue={this.formData.transactionType}
            value={this.formData.transactionType}
            required
            disabled={this.transaction !== null}
            onchange={event => {
              const value = (event.target as HTMLSelectElement).value as TransactionType;
              this.handleTransactionTypeChange(value);
            }}
          >
            {this.clTxTypes.map(type => {
              const rate = TRANSACTION_TYPE_RATES[type.CODE_NAME];
              const label = type.CODE_VALUE_EN;
              if (ClTxTypeCode.DebitNote === type.CODE_NAME || (type.CODE_NAME === ClTxTypeCode.OpeningBalance && (this.agent.has_opening_balance || this.booking !== null))) {
                return null;
              }
              if (
                [ClTxTypeCode.Discount, ClTxTypeCode.CancellationPenalty].includes(type.CODE_NAME as any) &&
                !this.booking &&
                this.transaction?.CL_TX_TYPE_CODE !== type.CODE_NAME
              ) {
                return null;
              }
              return (
                <wa-option key={type.CODE_NAME} value={type.CODE_NAME} label={label}>
                  <div class="tx-option">
                    <span class="tx-option__label">{label}</span>
                    <span class="tx-option__badges">
                      {(rate === 'CR' || rate === 'CR|DB') && <wa-badge variant="success">Credit</wa-badge>}
                      {(rate === 'DB' || rate === 'CR|DB') && <wa-badge variant="danger">Debit</wa-badge>}
                    </span>
                  </div>
                </wa-option>
              );
            })}
          </wa-select>
        </ir-validator>
      </div>
    );
  }

  private renderCommonFields(withTaxes: boolean = true) {
    const minAllowedDate = moment().subtract(12, 'months').format(DATE_INPUT_FORMAT);

    return (
      <Fragment>
        {this.renderTransactionTypeField()}

        <div class="transaction-form__field">
          <ir-validator schema={dateFieldSchema} value={this.formData.date} valueEvent="DateChanged">
            <ir-date-select
              label="Date"
              date={this.formData.date}
              minDate={minAllowedDate}
              maxDate={moment().format('YYYY-MM-DD')}
              emitEmptyDate={true}
              onDateChanged={event => {
                this.updateFormData({
                  date: event.detail.start ? event.detail.start.format(DATE_INPUT_FORMAT) : '',
                });
              }}
            ></ir-date-select>
          </ir-validator>
        </div>
        {this.formData.transactionType !== ClTxTypeCode.CreditNote && (
          <Fragment>
            {withTaxes ? (
              <div class="amount-tax-group">
                <span class="amount-tax-group__label">Amount (including taxes)</span>
                <div class="amount-tax-group__row">
                  <ir-validator class="amount-tax-group__amount" schema={amountFieldSchema} value={this.formData.amount} valueEvent="text-change input-change">
                    <ir-input
                      label="Amount (including taxes)"
                      mask="price"
                      value={this.formData.amount}
                      onText-change={(event: CustomEvent<string>) => {
                        this.updateFormData({ amount: event.detail ?? '' });
                      }}
                    >
                      <span slot="start">{calendar_data.property?.currency?.symbol}</span>
                    </ir-input>
                  </ir-validator>
                  <ir-validator schema={taxIdFieldSchema} value={this.formData.taxId} valueEvent="change">
                    <wa-select
                      size="s"
                      placeholder="Tax"
                      value={this.formData.taxId}
                      defaultValue={this.formData.taxId}
                      onchange={event => {
                        this.updateFormData({ taxId: (event.target as HTMLSelectElement).value });
                      }}
                    >
                      {this.taxOptions
                        .filter(tx => tx.id !== ClTxTypeCode.DebitNote)
                        .map(tax => (
                          <wa-option key={tax.id} label={tax.label} value={tax.id}>
                            {tax.label}
                          </wa-option>
                        ))}
                      <wa-option value="N/A" label="Not Applicable">
                        Not Applicable
                      </wa-option>
                    </wa-select>
                  </ir-validator>
                </div>
              </div>
            ) : (
              <div class="transaction-form__field">
                <ir-validator schema={amountFieldSchema} value={this.formData.amount} valueEvent="text-change input-change">
                  <ir-input
                    label="Amount"
                    mask="price"
                    value={this.formData.amount}
                    required
                    onText-change={(event: CustomEvent<string>) => {
                      this.updateFormData({ amount: event.detail ?? '' });
                    }}
                  >
                    <span slot="start">{calendar_data.property?.currency?.symbol}</span>
                  </ir-input>
                </ir-validator>
              </div>
            )}
          </Fragment>
        )}
      </Fragment>
    );
  }

  private renderTypeFields() {
    const onFieldChange = (e: CustomEvent<Partial<CityLedgerTransactionFormDraft>>) => this.updateFormData(e.detail);

    switch (this.formData.transactionType) {
      case ClTxTypeCode.OpeningBalance:
        return <ir-cl-opening-balance-fields entryType={this.formData.entryType} onFieldChange={onFieldChange} />;

      case ClTxTypeCode.Payment:
        return (
          <ir-cl-payment-fields
            paymentMethodCode={this.formData.payment_method?.code ?? ''}
            isOnAccount={this.formData.onAccount}
            invoiceId={this.formData.invoiceId}
            paymentMethods={this.paymentEntries?.methods ?? []}
            unpaidInvoiceOptions={this.unpaidInvoiceOptions}
            noInvoices={this.fiscalDocuments.length === 0}
            language={this.language}
            onFieldChange={onFieldChange}
          />
        );

      case ClTxTypeCode.Adjustment:
        return (
          <ir-cl-adjustment-fields
            entryType={this.formData.entryType}
            linkType={this.formData.linkType}
            linkedId={this.formData.linkedId}
            bookingOptions={this.bookingOptions}
            unpaidInvoiceOptions={this.unpaidInvoiceOptions}
            onFieldChange={onFieldChange}
          />
        );

      case ClTxTypeCode.CreditNote:
        return (
          <ir-cl-credit-note-fields
            creditNoteMode={this.formData.creditNoteMode}
            invoiceId={this.formData.invoiceId}
            fiscalDocuments={this.fiscalDocuments}
            isFetchingFiscalDocs={this.isLoading}
            onFieldChange={onFieldChange}
          />
        );

      case ClTxTypeCode.DebitNote:
        return <ir-cl-debit-note-fields invoiceId={this.formData.invoiceId} fiscalDocuments={this.fiscalDocuments} onFieldChange={onFieldChange} />;

      default:
        return null;
    }
  }

  render() {
    if (this.isLoading) {
      return (
        <div class="dialog__loader-container">
          <ir-spinner></ir-spinner>
        </div>
      );
    }

    if (this.isSubmitDisabled) {
      return (
        <form id={this.formId} class="transaction-form" onSubmit={this.handleSubmit} novalidate>
          {this.renderTransactionTypeField()}
          {this.renderTypeFields()}
        </form>
      );
    }
    return (
      <form id={this.formId} class="transaction-form" onSubmit={this.handleSubmit} novalidate>
        {this.renderCommonFields(
          this.formData.transactionType !== ClTxTypeCode.OpeningBalance &&
            ![ClTxTypeCode.Payment, ClTxTypeCode.Discount, ClTxTypeCode.CancellationPenalty].includes(this.formData.transactionType as any),
        )}
        {this.renderTypeFields()}
        {this.formData.transactionType !== ClTxTypeCode.CreditNote && (
          <ir-input
            label="Reference"
            value={this.formData.reference}
            defaultValue={this.formData.reference}
            onText-change={(event: CustomEvent<string>) => {
              this.updateFormData({ reference: event.detail ?? '' });
            }}
          ></ir-input>
        )}
      </form>
    );
  }
}
