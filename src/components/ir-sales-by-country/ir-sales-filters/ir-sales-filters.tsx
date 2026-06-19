import { Component, Event, EventEmitter, h, Prop, State } from '@stencil/core';
import locales from '@/stores/locales.store';
import moment from 'moment';
import { CountrySalesFilter } from '../types';

@Component({
  tag: 'ir-sales-filters',
  styleUrl: 'ir-sales-filters.css',
  scoped: true,
})
export class IrSalesFilters {
  @Prop() isLoading: boolean;
  @Prop() baseFilters: CountrySalesFilter;

  @State() filters: CountrySalesFilter;
  @State() window: string;

  @Event() applyFilters: EventEmitter<CountrySalesFilter>;

  componentWillLoad() {
    this.filters = this.baseFilters;
    this.window = this.baseFilters.WINDOW.toString();
  }

  private updateFilter(params: Partial<CountrySalesFilter>) {
    this.filters = { ...this.filters, ...params };
  }

  private applyFiltersEvt(e: CustomEvent) {
    e.stopImmediatePropagation();
    e.stopPropagation();
    this.applyFilters.emit(this.filters);
  }

  private resetFilters(e: CustomEvent) {
    e.stopImmediatePropagation();
    e.stopPropagation();
    this.filters = this.baseFilters;
    this.window = this.baseFilters.WINDOW.toString();
    this.applyFilters.emit(this.filters);
  }

  render() {
    return (
      <ir-filter-card>
        <wa-radio-group
          label="Rooms"
          orientation="horizontal"
          size="s"
          style={{ width: '100%' }}
          value={this.filters?.BOOK_CASE}
          onchange={(e: CustomEvent) => {
            this.updateFilter({ BOOK_CASE: (e.target as any).value });
          }}
        >
          <wa-radio style={{ flex: '1 1 0%' }} appearance="button" value="001">
            Booked
          </wa-radio>
          <wa-radio style={{ flex: '1 1 0%' }} appearance="button" value="002">
            Stayed
          </wa-radio>
        </wa-radio-group>

        <wa-select
          label="Selected period"
          size="s"
          value={this.window}
          defaultValue={this.window}
          onchange={(e: CustomEvent) => {
            const val = (e.target as HTMLSelectElement).value;
            const dateDiff = Number(val);
            this.updateFilter({
              WINDOW: dateDiff,
              TO_DATE: moment().format('YYYY-MM-DD'),
              FROM_DATE: moment().subtract(dateDiff, 'days').format('YYYY-MM-DD'),
            });
            this.window = val;
          }}
        >
          <wa-option value="7">For the past 7 days</wa-option>
          <wa-option value="14">For the past 14 days</wa-option>
          <wa-option value="30">For the past 30 days</wa-option>
          <wa-option value="60">For the past 60 days</wa-option>
          <wa-option value="90">For the past 90 days</wa-option>
          <wa-option value="365">For the past 365 days</wa-option>
        </wa-select>

        <div class="or-divider">
          <span class="or-divider__line"></span>
          <span class="or-divider__text">Or</span>
          <span class="or-divider__line"></span>
        </div>

        <ir-date-range-filter
          label="Date range"
          fromDate={this.filters?.FROM_DATE}
          toDate={this.filters?.TO_DATE}
          maxDate={moment().format('YYYY-MM-DD')}
          selectionMode="auto"
          showQuickActions={false}
          withClear={false}
          onDatesChanged={e => {
            e.stopImmediatePropagation();
            e.stopPropagation();
            const { from, to } = e.detail;
            this.updateFilter({ FROM_DATE: from, TO_DATE: to });
            this.window = '';
          }}
        ></ir-date-range-filter>

        <wa-checkbox
          checked={this.filters?.include_previous_year}
          onchange={(e: CustomEvent) => {
            e.stopImmediatePropagation();
            e.stopPropagation();
            this.updateFilter({ include_previous_year: (e.target as HTMLInputElement).checked });
          }}
        >
          Compare with previous year
        </wa-checkbox>

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
