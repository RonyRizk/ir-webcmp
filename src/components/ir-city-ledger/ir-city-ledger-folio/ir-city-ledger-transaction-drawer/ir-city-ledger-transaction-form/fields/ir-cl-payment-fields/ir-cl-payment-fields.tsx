import { Component, Event, EventEmitter, Fragment, Prop, h } from '@stencil/core';
import type { SetupEntries } from '@/models/IBooking';
import { getSetupEntryLabel } from '@/services/setup';
import { paymentMethodCodeFieldSchema, type CityLedgerTransactionFormDraft, type LinkedOption, type PaymentMethodOption } from '../../ir-city-ledger-transaction-form.schema';
import { t } from '@/services/locale/t';

@Component({
  tag: 'ir-cl-payment-fields',
  styleUrl: 'ir-cl-payment-fields.css',
  scoped: true,
})
export class IrClPaymentFields {
  @Prop() paymentMethodCode: string = '';
  @Prop() isOnAccount: boolean = false;
  @Prop() invoiceId: string | undefined;
  @Prop() paymentMethods: SetupEntries[] = [];
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
                size="s"
                label={t('Lcz_PaymentMethod', { fallback: 'Payment Method' })}
                placeholder={t('Lcz_SelectMethodPlaceholder', { fallback: 'Select method…' })}
                value={this.paymentMethodCode}
                onwa-show={e => this.stopPropagation(e)}
                onwa-hide={e => this.stopPropagation(e)}
                onchange={e => {
                  this.stopPropagation(e);
                  this.handlePaymentMethodChange((e.target as HTMLSelectElement).value);
                }}
              >
                <wa-option value="">{t('Lcz_SelectMethodPlaceholder', { fallback: 'Select method…' })}</wa-option>
                {this.paymentMethods.map(method => (
                  <wa-option key={method.CODE_NAME} label={getSetupEntryLabel(method)} value={method.CODE_NAME}>
                    {getSetupEntryLabel(method)}
                  </wa-option>
                ))}
              </wa-select>
            </ir-validator>
          </div>
        </div>

        {/* ── Payment Application ─────────────────────── */}
        {/* <div class="payment-section">
          <wa-radio-group
            label={t('Lcz_ApplyTo', { fallback: 'Apply to' })}
            size="s"
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
                label={t('Lcz_OutstandingInvoices', { fallback: 'Outstanding Invoices' })}
                size="s"
                placeholder={t('Lcz_SearchInvoicesPlaceholder', { fallback: 'Search invoices...' })}
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
