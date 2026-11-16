import { Component, Event, EventEmitter, Host, Method, Prop, State, Watch, h } from '@stencil/core';
import { formatAmount } from '@/utils/utils';
import { CityLedgerService, type CLAccountOverview } from '@/services/city-ledger';
import calendar_data from '@/stores/calendar-data';
import moment from 'moment';
import { _formatTime } from '@/components/ir-booking-details/functions';
import { formatDate } from '@/utils/date';
import { t } from '@/services/locale/t';

@Component({
  tag: 'ir-city-ledger-toolbar',
  styleUrl: 'ir-city-ledger-toolbar.css',
  scoped: true,
})
export class IrCityLedgerToolbar {
  @Prop() agentId: number | null = null;

  @State() accountOverview: CLAccountOverview | null = null;

  @Event() createInvoice: EventEmitter<void>;

  private cityLedgerService = new CityLedgerService();

  componentWillLoad() {
    if (this.agentId) this.fetchOverview();
  }

  @Watch('agentId')
  async handleAgentIdChange(newValue: number | null, oldValue: number | null) {
    if (newValue === oldValue) return;
    this.accountOverview = null;
    if (newValue) await this.fetchOverview();
  }

  @Method()
  async refresh() {
    await this.fetchOverview();
  }

  private async fetchOverview() {
    if (!this.agentId) return;
    this.accountOverview = await this.cityLedgerService.getCLAccountOverview({
      AGENCY_ID: this.agentId,
      CURRENCY_ID: calendar_data?.property?.currency?.id,
    });
  }

  render() {
    return (
      <Host>
        <div class="toolbar">
          {this.accountOverview ? (
            <div class="toolbar__stats">
              <div id="netbalance" class="toolbar__stat">
                <span class="toolbar__stat-label">{t('Lcz_NetBalance', { fallback: 'Net Balance' })}</span>
                <span
                  class={{
                    'toolbar__stat-value': true,
                    'toolbar__stat-value--negative': this.accountOverview.ACCOUNT_NET_BALANCE < 0,
                  }}
                >
                  {this.accountOverview.ACCOUNT_NET_BALANCE < 0 ? '-' : ''}
                  {formatAmount(calendar_data.currency.symbol, Math.abs(this.accountOverview.ACCOUNT_NET_BALANCE))}
                </span>
              </div>

              {/* <div class="toolbar__stats-sep" />

              <div id="due-invoiced" class="toolbar__stat">
                <span class="toolbar__stat-label">Due Invoiced</span>
                <span class="toolbar__stat-value">{formatAmount(calendar_data.currency.symbol, this.accountOverview.TOTAL_DUE_INVOICED)}</span>
              </div> */}

              <div class="toolbar__stats-sep" />

              <div id="uninvoiced" class="toolbar__stat">
                <span class="toolbar__stat-label">{t('Lcz_Uninvoiced', { fallback: 'Uninvoiced' })}</span>
                <span class="toolbar__stat-value">{formatAmount(calendar_data.currency.symbol, this.accountOverview.TOTAL_UNINVOICED)}</span>
              </div>
              <wa-tooltip for="netbalance">
                {t('Lcz_EndingBalanceAsOfTooltip', {
                  fallback: 'Ending balance as of %1 %2',
                  params: [formatDate(moment(), 'MMM DD, YYYY'), _formatTime(new Date().getHours().toString(), new Date().getMinutes().toString())],
                })}
              </wa-tooltip>
              <wa-tooltip for="due-invoice"></wa-tooltip>
              <wa-tooltip for="uninvoiced">
                {t('Lcz_UnbilledEntriesTooltip', { fallback: 'Total unbilled entries from bookings, manual charges, adjustments and discounts.' })}
              </wa-tooltip>
              <wa-tooltip for="toolbar-held">{t('Lcz_HeldEntriesTooltip', { fallback: 'Total held entries to resolve with agent.' })}</wa-tooltip>
              {/* //Find total held */}
            </div>
          ) : (
            <div class="toolbar__stats-placeholder" />
          )}

          <div class="toolbar__actions">
            <ir-custom-button variant="brand" onClickHandler={() => this.createInvoice.emit()}>
              {t('Lcz_CreateInvoice', { fallback: 'Create Invoice' })}
            </ir-custom-button>
          </div>
        </div>
      </Host>
    );
  }
}
