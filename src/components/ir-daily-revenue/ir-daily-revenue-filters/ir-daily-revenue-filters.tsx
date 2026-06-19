import { Component, Event, EventEmitter, Prop, State, Watch, h } from '@stencil/core';
import moment from 'moment';
import { DailyPaymentFilter, GroupedFolioPayment } from '../types';
import locales from '@/stores/locales.store';

@Component({
  tag: 'ir-daily-revenue-filters',
  styleUrl: 'ir-daily-revenue-filters.css',
  scoped: true,
})
export class IrDailyRevenueFilters {
  @Prop() payments: GroupedFolioPayment;
  @Prop() isLoading: boolean;

  @State() users: Set<string> = new Set();
  @State() filters: DailyPaymentFilter;
  private baseFilters: DailyPaymentFilter = {
    date: moment().format('YYYY-MM-DD'),
    from_date: moment().format('YYYY-MM-DD'),
    to_date: moment().format('YYYY-MM-DD'),
    users: null,
  };

  @Event() fetchNewReports: EventEmitter<DailyPaymentFilter>;

  componentWillLoad() {
    this.filters = { ...this.baseFilters };
    this.updateGuests();
  }

  @Watch('payments')
  handlePaymentChange() {
    this.updateGuests();
  }

  private updateGuests() {
    const set: Set<string> = new Set();
    this.payments.forEach(payment => {
      payment.forEach(p => {
        set.add(p.user);
      });
    });
    this.users = new Set(set);
  }

  private applyFiltersEvt(e: CustomEvent): void {
    e.stopImmediatePropagation();
    e.stopPropagation();
    this.fetchNewReports.emit(this.filters);
  }

  private resetFilters(e: CustomEvent): void {
    e.stopImmediatePropagation();
    e.stopPropagation();
    this.filters = { ...this.baseFilters };
    this.fetchNewReports.emit(this.filters);
  }

  private updateFilter(params: Partial<DailyPaymentFilter>) {
    this.filters = { ...this.filters, ...params };
  }

  private getLast30Days(): { text: string; value: string }[] {
    return Array.from({ length: 30 }, (_, i) => {
      const date = moment().subtract(i, 'days');
      const label = i === 0 ? 'Today' : date.format('MMM DD, YYYY');
      return { text: label, value: date.format('YYYY-MM-DD') };
    });
  }

  render() {
    return (
      <ir-filter-card>
        <wa-select
          label="Selected period"
          size="s"
          value={this.filters?.date?.toString()}
          defaultValue={this.filters?.date?.toString()}
          onchange={(e: CustomEvent) => {
            const value = (e.target as HTMLSelectElement).value;
            this.updateFilter({ date: value, to_date: value, from_date: value });
          }}
        >
          {this.getLast30Days().map(({ text, value }) => (
            <wa-option key={value} value={value}>
              {text}
            </wa-option>
          ))}
        </wa-select>
        <div class="or-divider">
          <span class="or-divider__line"></span>
          <span class="or-divider__text">Or</span>
          <span class="or-divider__line"></span>
        </div>
        <ir-date-range-filter
          showQuickActions={false}
          label="Date range"
          fromDate={this.filters?.from_date}
          toDate={this.filters?.to_date}
          selectionMode="auto"
          withClear={false}
          maxDate={moment().format('YYYY-MM-DD')}
          onDatesChanged={e => {
            e.stopImmediatePropagation();
            e.stopPropagation();
            const { from, to } = e.detail;
            this.updateFilter({ from_date: from, to_date: to, date: null });
          }}
        ></ir-date-range-filter>
        <div slot="footer">
          <ir-custom-button variant="neutral" appearance="outlined" onClickHandler={e => this.resetFilters(e)}>
            {locales.entries?.Lcz_Reset ?? 'Reset'}
          </ir-custom-button>
          <ir-custom-button variant="brand" loading={this.isLoading} onClickHandler={e => this.applyFiltersEvt(e)}>
            {locales.entries?.Lcz_Apply ?? 'Apply'}
          </ir-custom-button>
        </div>
      </ir-filter-card>
    );
  }
}
