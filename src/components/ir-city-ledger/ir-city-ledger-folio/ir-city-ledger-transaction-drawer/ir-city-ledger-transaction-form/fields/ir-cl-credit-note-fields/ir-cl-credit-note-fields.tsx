import { Component, Event, EventEmitter, Fragment, Prop, h } from '@stencil/core';
import type { FiscalDocuments } from '@/services/city-ledger/types';
import { type CityLedgerTransactionFormDraft, type CreditNoteMode } from '../../ir-city-ledger-transaction-form.schema';

@Component({
  tag: 'ir-cl-credit-note-fields',
  styleUrl: 'ir-cl-credit-note-fields.css',
  scoped: true,
})
export class IrClCreditNoteFields {
  @Prop() creditNoteMode: CreditNoteMode = 'cancel-invoice';
  @Prop() invoiceId: string | undefined;
  @Prop() fiscalDocuments: FiscalDocuments = [];
  @Prop() isFetchingFiscalDocs: boolean = false;

  @Event() fieldChange: EventEmitter<Partial<CityLedgerTransactionFormDraft>>;

  render() {
    // const noInvoices = this.fiscalDocuments.length === 0;

    return (
      <Fragment>
        {/* ── Credit Note Mode ───────────────────────── */}
        {/* <div class="field field--full-width">
          <wa-radio-group
            label="Credit Note Type"
            orientation="horizontal"
            size="small"
            value={this.creditNoteMode}
            onchange={e => {
              const val = (e.target as HTMLInputElement).value as CreditNoteMode;
              this.fieldChange.emit({
                creditNoteMode: val,
                invoiceId: val === 'goodwill' ? undefined : this.invoiceId,
              });
            }}
          >
            <wa-radio value="cancel-invoice" appearance="button" disabled={noInvoices || this.isFetchingFiscalDocs}>
              Cancel invoice and unlock all items
            </wa-radio>
            <wa-radio value="goodwill" appearance="button">
              Goodwill credit
            </wa-radio>
          </wa-radio-group>
        </div> */}

        {/* ── Invoice Selector ───────────────────────── */}
        {this.creditNoteMode === 'cancel-invoice' && (
          <div class="field">
            <ir-cl-invoice-select
              value={this.invoiceId ?? ''}
              fiscalDocuments={this.fiscalDocuments}
              label="Invoice"
              onInvoiceChange={event => {
                this.fieldChange.emit({ invoiceId: event.detail || undefined });
              }}
              hint="Issuing this credit note will void the selected invoice and unlock all associated line items."
            />
          </div>
        )}
      </Fragment>
    );
  }
}
