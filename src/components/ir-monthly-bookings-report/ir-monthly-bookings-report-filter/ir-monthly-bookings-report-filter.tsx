import { Component, Event, EventEmitter, Prop, State, h } from '@stencil/core';
import { DailyReportFilter, ReportDate } from '../types';
import moment from 'moment';
import locales from '@/stores/locales.store';

@Component({
  tag: 'ir-monthly-bookings-report-filter',
  styleUrl: 'ir-monthly-bookings-report-filter.css',
  scoped: true,
})
export class IrMonthlyBookingsReportFilter {
  @Prop() isLoading: boolean;
  @Prop() baseFilters: DailyReportFilter;

  @State() filters: DailyReportFilter;

  @Event() applyFilters: EventEmitter<DailyReportFilter>;

  private dates: ReportDate[] = [];

  componentWillLoad() {
    this.dates = this.generateMonths();
    this.filters = this.baseFilters;
  }

  private updateFilter(params: Partial<DailyReportFilter>) {
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
    this.applyFilters.emit(this.filters);
  }

  private generateMonths(): ReportDate[] {
    const format = 'YYYY-MM-DD';

    const firstOfThisMonth = moment().startOf('month');
    const startDate = moment().subtract(1, 'year').startOf('month');

    const dates: ReportDate[] = [];
    let cursor = startDate.clone();

    while (cursor.isSameOrBefore(firstOfThisMonth, 'month')) {
      dates.push({
        description: cursor.format('MMMM YYYY'),
        firstOfMonth: cursor.format(format),
        lastOfMonth: cursor.clone().endOf('month').format(format),
      });
      cursor.add(1, 'month');
    }

    const futureCursor = firstOfThisMonth.clone().add(1, 'month');
    for (let i = 0; i < 6; i++) {
      dates.push({
        description: futureCursor.format('MMMM YYYY'),
        firstOfMonth: futureCursor.format(format),
        lastOfMonth: futureCursor.clone().endOf('month').format(format),
      });
      futureCursor.add(1, 'month');
    }

    return dates.reverse();
  }

  render() {
    return (
      <ir-filter-card>
        <wa-select
          label="For"
          size="s"
          value={this.filters?.date?.description}
          defaultValue={this.filters?.date?.description}
          onchange={(e: CustomEvent) => {
            const value = (e.target as HTMLSelectElement).value;
            this.updateFilter({ date: this.dates.find(d => d.description === value) });
          }}
        >
          {this.dates.map(d => (
            <wa-option value={d.description}>{d.description}</wa-option>
          ))}
        </wa-select>

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
