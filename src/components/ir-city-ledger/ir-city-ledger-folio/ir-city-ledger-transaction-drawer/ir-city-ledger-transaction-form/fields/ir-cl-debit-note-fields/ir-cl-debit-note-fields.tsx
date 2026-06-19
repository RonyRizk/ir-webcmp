import { Component, Event, EventEmitter, Prop, h } from '@stencil/core';
import type { FiscalDocuments } from '@/services/city-ledger/types';
import { type CityLedgerTransactionFormDraft } from '../../ir-city-ledger-transaction-form.schema';

@Component({
  tag: 'ir-cl-debit-note-fields',
  styleUrl: 'ir-cl-debit-note-fields.css',
  scoped: true,
})
export class IrClDebitNoteFields {
  @Prop() invoiceId: string | undefined;
  @Prop() fiscalDocuments: FiscalDocuments = [];

  @Event() fieldChange: EventEmitter<Partial<CityLedgerTransactionFormDraft>>;

  render() {
    if (this.fiscalDocuments.length === 0) {
      return (
        <wa-callout size="s" variant="warning">
          <wa-icon slot="icon" name="triangle-exclamation"></wa-icon>
          No paid invoices are available. A debit note requires at least one paid invoice to reference. Please issue an invoice first, then return to create the debit note.
        </wa-callout>
      );
    }

    return (
      <div class="field">
        <ir-cl-invoice-select
          value={this.invoiceId ?? ''}
          fiscalDocuments={this.fiscalDocuments}
          label="Invoice"
          onInvoiceChange={event => {
            this.fieldChange.emit({ invoiceId: event.detail || undefined });
          }}
        />
      </div>
    );
  }
}
