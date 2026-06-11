import { Component, Event, EventEmitter, Fragment, Prop, h } from '@stencil/core';
import { entryTypeFieldSchema, type CityLedgerTransactionFormDraft, type EntryType, type LinkType, type LinkedOption } from '../../ir-city-ledger-transaction-form.schema';

@Component({
  tag: 'ir-cl-adjustment-fields',
  styleUrl: 'ir-cl-adjustment-fields.css',
  scoped: true,
})
export class IrClAdjustmentFields {
  @Prop() entryType: EntryType | '' = '';
  @Prop() linkType: LinkType = 'NONE';
  @Prop() linkedId: string | undefined;
  @Prop() bookingOptions: LinkedOption[] = [];
  @Prop() unpaidInvoiceOptions: LinkedOption[] = [];

  @Event() fieldChange: EventEmitter<Partial<CityLedgerTransactionFormDraft>>;

  // private get linkedIdOptions(): LinkedOption[] {
  //   if (this.linkType === 'BOOKING') return this.bookingOptions;
  //   if (this.linkType === 'INVOICE') return this.unpaidInvoiceOptions;
  //   return [];
  // }

  render() {
    return (
      <Fragment>
        {/* ── Entry Type ─────────────────────────── */}
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

        {/* ── Link Type ──────────────────────────── */}
        {/* <div class="field">
          <ir-validator schema={linkTypeFieldSchema} value={this.linkType} valueEvent="change">
            <wa-select
              label="Link Type"
              size="small"
              value={this.linkType}
              onchange={event => {
                const linkType = (event.target as HTMLSelectElement).value as LinkType;
                this.fieldChange.emit({
                  linkType,
                  linkedId: linkType === 'NONE' ? undefined : this.linkedId,
                });
              }}
            >
              {LINK_TYPES.map(lt => (
                <wa-option key={lt} value={lt}>
                  {lt}
                </wa-option>
              ))}
            </wa-select>
          </ir-validator>
        </div> */}

        {/* ── Linked Record ──────────────────────── */}
        {/* {this.linkType !== 'NONE' && (
          <div class="field">
            <wa-select
              label="Linked Record"
              size="small"
              value={this.linkedId ?? ''}
              onchange={event => {
                this.fieldChange.emit({ linkedId: (event.target as HTMLSelectElement).value || undefined });
              }}
            >
              <wa-option value="">No linked record</wa-option>
              {this.linkedIdOptions.map(option => (
                <wa-option key={option.id} value={option.id}>
                  {option.label}
                </wa-option>
              ))}
            </wa-select>
          </div>
        )} */}
      </Fragment>
    );
  }
}
