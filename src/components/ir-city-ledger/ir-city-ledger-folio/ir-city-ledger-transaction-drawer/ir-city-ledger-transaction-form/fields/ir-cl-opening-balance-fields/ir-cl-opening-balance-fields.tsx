import { Component, Event, EventEmitter, Prop, h } from '@stencil/core';
import { entryTypeFieldSchema, type CityLedgerTransactionFormDraft, type EntryType } from '../../ir-city-ledger-transaction-form.schema';

@Component({
  tag: 'ir-cl-opening-balance-fields',
  styleUrl: 'ir-cl-opening-balance-fields.css',
  scoped: true,
})
export class IrClOpeningBalanceFields {
  @Prop() entryType: EntryType | '' = '';

  @Event() fieldChange: EventEmitter<Partial<CityLedgerTransactionFormDraft>>;

  render() {
    return (
      <div class="field field--full-width">
        <ir-validator schema={entryTypeFieldSchema} value={this.entryType} valueEvent="change">
          <wa-radio-group
            label="Entry Type"
            orientation="horizontal"
            size="small"
            value={this.entryType}
            onchange={event => {
              this.fieldChange.emit({ entryType: (event.target as HTMLInputElement).value as EntryType });
            }}
          >
            <wa-radio value="CR" appearance="button" class="entry-type --credit">
              Credit
            </wa-radio>
            <wa-radio value="DB" appearance="button" class="entry-type --debit">
              Debit
            </wa-radio>
          </wa-radio-group>
        </ir-validator>
      </div>
    );
  }
}
