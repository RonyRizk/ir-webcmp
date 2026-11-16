import { Component, Host, Method, State, Watch, h } from '@stencil/core';
import moment from 'moment';
import { t } from '@/services/locale/t';

export type InvoiceScope = 'UNBILLED' | 'UNBILLED_CHECKED_OUT';

export interface CreateInvoiceFormValues {
  fromDate: string;
  toDate: string;
  scope: InvoiceScope;
  is_checked_out_only: boolean;
  is_compact: boolean;
}

@Component({
  tag: 'ir-cl-invoice-form',
  styleUrl: 'ir-cl-invoice-form.css',
  scoped: true,
})
export class IrClInvoiceForm {
  @State() fromDate: string = '';
  @State() toDate: string = '';
  @State() scope: InvoiceScope = 'UNBILLED_CHECKED_OUT';
  @State() dateError: boolean = false;
  @State() isCompact: boolean = false;

  @Watch('fromDate')
  @Watch('toDate')
  onDateChange() {
    if (this.fromDate && this.toDate) {
      this.dateError = false;
    }
  }

  @Method()
  async validate(): Promise<boolean> {
    if (!this.fromDate || !this.toDate) {
      this.dateError = true;
      return false;
    }
    this.dateError = false;
    return true;
  }

  @Method()
  async getValues(): Promise<CreateInvoiceFormValues> {
    return {
      fromDate: this.fromDate,
      toDate: this.toDate,
      scope: this.scope,
      is_checked_out_only: this.scope === 'UNBILLED_CHECKED_OUT',
      is_compact: this.isCompact,
    };
  }

  render() {
    return (
      <Host>
        <wa-callout>
          <wa-icon slot="icon" name="circle-info"></wa-icon>
          <div class="invoice-form__scope-text">
            <span class="invoice-form__scope-label">{t('Lcz_UnbilledFolioEntries', { fallback: 'Unbilled Folio Entries' })}</span>
            <span class="invoice-form__scope-desc">
              {t('Lcz_UnbilledFolioEntriesDesc', { fallback: 'Including all services from bookings, manual charges, adjustments and discounts.' })}
            </span>
          </div>
        </wa-callout>

        <div class={`invoice-form__field${this.dateError ? ' invoice-form__date-error' : ''}`}>
          <ir-date-range-filter
            selectionMode="auto"
            showQuickActions={false}
            style={{ width: '100%' }}
            fromDate={this.fromDate}
            toDate={this.toDate}
            maxDate={moment().format('YYYY-MM-DD')}
            onDatesChanged={e => {
              this.fromDate = e.detail.from ?? '';
              this.toDate = e.detail.to ?? '';
            }}
          ></ir-date-range-filter>
        </div>

        <div class="invoice-form__field">
          <wa-checkbox
            checked={this.scope === 'UNBILLED_CHECKED_OUT'}
            defaultChecked={this.scope === 'UNBILLED_CHECKED_OUT'}
            onchange={e => {
              this.scope = (e.target as HTMLInputElement).checked ? 'UNBILLED_CHECKED_OUT' : 'UNBILLED';
            }}
          >
            {t('Lcz_IncludeCheckedOutOnly', { fallback: 'Include checked-out bookings only' })}
          </wa-checkbox>
        </div>

        <div class="invoice-form__field">
          <wa-checkbox
            checked={this.isCompact}
            defaultChecked={this.isCompact}
            onchange={e => {
              this.isCompact = (e.target as HTMLInputElement).checked;
            }}
          >
            {t('Lcz_CompactVersion', { fallback: 'Compact version' })}
          </wa-checkbox>
        </div>
      </Host>
    );
  }
}
