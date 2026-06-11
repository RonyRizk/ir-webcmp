import { Component, Event, EventEmitter, Prop, h } from '@stencil/core';
import moment from 'moment';
import { formatAmount } from '@/utils/utils';
import calendar_data from '@/stores/calendar-data';
import type { FiscalDocuments } from '@/services/city-ledger/types';
import { invoiceIdRequiredFieldSchema } from '../../ir-city-ledger-transaction-form.schema';

@Component({
  tag: 'ir-cl-invoice-select',
  styleUrl: 'ir-cl-invoice-select.css',
  scoped: true,
})
export class IrClInvoiceSelect {
  @Prop() value: string = '';
  @Prop() fiscalDocuments: FiscalDocuments = [];
  @Prop() label: string = 'Invoice';
  @Prop() hint: string = '';

  @Event() invoiceChange: EventEmitter<string>;

  render() {
    return (
      <ir-validator schema={invoiceIdRequiredFieldSchema} value={this.value} valueEvent="change">
        <wa-select
          label={this.label}
          size="small"
          required
          hint={this.hint || undefined}
          placeholder="Select invoice"
          value={this.value}
          onchange={event => {
            this.invoiceChange.emit((event.target as HTMLSelectElement).value || '');
          }}
        >
          {this.fiscalDocuments.map(doc => {
            const date = doc.ISSUE_DATE_DISPLAY ?? (doc.ISSUE_DATE ? moment(doc.ISSUE_DATE, 'YYYY-MM-DD').format('MMM D, YYYY') : '');
            const amount = doc.TOTAL_AMOUNT != null ? formatAmount(calendar_data.property?.currency?.symbol, doc.TOTAL_AMOUNT) : '';
            const docNumber = doc.DOC_NUMBER ?? '';

            return (
              <wa-option key={doc.FD_ID} value={String(doc.FD_ID)} label={docNumber}>
                <div class="invoice-option">
                  <div class="invoice-option__left">
                    <span class="invoice-option__number">{docNumber}</span>
                    {date && <span class="invoice-option__date">{date}</span>}
                    {doc.EXTERNAL_REF && <span class="invoice-option__ref">Ref: {doc.EXTERNAL_REF}</span>}
                  </div>
                  {amount && <span class="invoice-option__amount">{amount}</span>}
                </div>
              </wa-option>
            );
          })}
        </wa-select>
      </ir-validator>
    );
  }
}
