import { Component, Event, EventEmitter, Fragment, Prop, h } from '@stencil/core';
import type { IEntries } from '@/models/IBooking';
import { getEntryValue } from '@/utils/utils';
import { paymentMethodCodeFieldSchema, type CityLedgerTransactionFormDraft, type LinkedOption, type PaymentMethodOption } from '../../ir-city-ledger-transaction-form.schema';

@Component({
  tag: 'ir-cl-payment-fields',
  styleUrl: 'ir-cl-payment-fields.css',
  scoped: true,
})
export class IrClPaymentFields {
  @Prop() paymentMethodCode: string = '';
  @Prop() isOnAccount: boolean = false;
  @Prop() invoiceId: string | undefined;
  @Prop() paymentMethods: IEntries[] = [];
  @Prop() unpaidInvoiceOptions: LinkedOption[] = [];
  @Prop() noInvoices: boolean = false;
  @Prop() language: string = 'en';

  @Event() fieldChange: EventEmitter<Partial<CityLedgerTransactionFormDraft>>;

  private stopPropagation(event: globalThis.Event) {
    event.stopImmediatePropagation();
  }

  private handlePaymentMethodChange(value: string) {
    const method = this.paymentMethods?.find(pm => pm.CODE_NAME === value);
    if (!method) {
      this.fieldChange.emit({ payment_method: null });
      return;
    }
    const payment_method: PaymentMethodOption = {
      code: method.CODE_NAME,
      description: method.CODE_VALUE_EN,
      operation: method.NOTES,
    };
    this.fieldChange.emit({ payment_method });
  }

  render() {
    return (
      <Fragment>
        {/* ── Payment Method ─────────────────────────── */}
        <div class="payment-section">
          <div class="field">
            <ir-validator schema={paymentMethodCodeFieldSchema} value={this.paymentMethodCode} valueEvent="change">
              <wa-select
                size="small"
                label="Payment method"
                placeholder="Select method…"
                value={this.paymentMethodCode}
                onwa-show={e => this.stopPropagation(e)}
                onwa-hide={e => this.stopPropagation(e)}
                onchange={e => {
                  this.stopPropagation(e);
                  this.handlePaymentMethodChange((e.target as HTMLSelectElement).value);
                }}
              >
                <wa-option value="">Select method…</wa-option>
                {this.paymentMethods.map(method => (
                  <wa-option key={method.CODE_NAME} label={method.CODE_VALUE_EN} value={method.CODE_NAME}>
                    {getEntryValue({ entry: method, language: this.language })}
                  </wa-option>
                ))}
              </wa-select>
            </ir-validator>
          </div>
        </div>

        {/* ── Payment Application ─────────────────────── */}
        {/* <div class="payment-section">
          <wa-radio-group
            label="Apply to"
            size="small"
            orientation="horizontal"
            value={this.isOnAccount ? 'on-account' : 'apply-to-invoice'}
            onchange={e => {
              const val = (e.target as HTMLInputElement).value;
              this.fieldChange.emit({
                onAccount: val === 'on-account',
                invoiceId: val === 'on-account' ? undefined : this.invoiceId,
              });
            }}
          >
            <wa-radio appearance="button" value="on-account">
              On Account
            </wa-radio>
            <wa-radio appearance="button" value="apply-to-invoice" disabled={this.noInvoices}>
              Allocate to Invoices
            </wa-radio>
          </wa-radio-group>

          {!this.isOnAccount && (
            <div class="field invoice-select">
              <wa-select
                label="Outstanding Invoices"
                size="small"
                placeholder="Search invoices…"
                value={this.invoiceId ?? ''}
                onwa-show={e => this.stopPropagation(e)}
                onwa-hide={e => this.stopPropagation(e)}
                onchange={e => {
                  this.stopPropagation(e);
                  this.fieldChange.emit({ invoiceId: (e.target as HTMLSelectElement).value || undefined });
                }}
              >
                <wa-option value="">No invoice linked</wa-option>
                {this.unpaidInvoiceOptions.length === 0 && (
                  <wa-option value="" disabled>
                    No outstanding invoices
                  </wa-option>
                )}
                {this.unpaidInvoiceOptions.map(invoice => (
                  <wa-option key={invoice.id} value={invoice.id}>
                    {invoice.label}
                  </wa-option>
                ))}
              </wa-select>
            </div>
          )}
        </div> */}
      </Fragment>
    );
  }
}
