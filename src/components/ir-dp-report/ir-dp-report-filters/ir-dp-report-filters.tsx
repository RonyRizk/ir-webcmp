import { Component, Event, EventEmitter, Prop, h } from '@stencil/core';
import moment from 'moment';
import dp_report, { updateDpReportFilters } from '@/stores/dp_report.store';
import { QuickDatePreset } from '@/components/ui/ir-date-range-filter/ir-date-range-filter';

@Component({
  tag: 'ir-dp-report-filters',
  styleUrl: 'ir-dp-report-filters.css',
  scoped: true,
})
export class IrDpReportFilters {
  /**
   * Earliest selectable date. Set by the parent once it discovers that the property's
   * data does not go back the full default lookback window.
   */
  @Prop() minDate?: string;

  /**
   * Emitted only when the user clicks Search. The shared store (updated as soon as the
   * dates change) keeps every filter instance (chart tab + table tab) visually in sync
   * regardless of whether a search has been triggered yet.
   */
  @Event() dpFiltersChange: EventEmitter<{ from: string; to: string }>;

  /**
   * `getDate` is the "N ago" anchor. Picked from the from-side it sets only the from-date
   * (see `quickDatesMode="range"` on ir-date-range-filter); picked from the to-side it sets
   * from-date to this anchor *and* to-date to today, producing a complete last-N-days range.
   */
  private quickDates: QuickDatePreset[] = [
    { label: '7 Days Ago', getDate: () => moment().subtract(7, 'days') },
    { label: '14 Days Ago', getDate: () => moment().subtract(14, 'days') },
    { label: '30 Days Ago', getDate: () => moment().subtract(30, 'days') },
    { label: '90 Days Ago', getDate: () => moment().subtract(90, 'days') },
  ];

  private handleDatesChanged = (e: CustomEvent<{ from: string | null; to: string | null }>) => {
    e.stopImmediatePropagation();
    e.stopPropagation();
    const { from, to } = e.detail;
    if (!from || !to) {
      return;
    }
    updateDpReportFilters({ from, to });
  };

  private handleSearch = () => {
    this.dpFiltersChange.emit({ from: dp_report.filters.from, to: dp_report.filters.to });
  };

  render() {
    return (
      <div class="dp-report-filters">
        <ir-date-range-filter
          class="dp-report-filters__date-picker"
          fromDate={dp_report.filters.from}
          toDate={dp_report.filters.to}
          minDate={this.minDate}
          maxDate={moment().format('YYYY-MM-DD')}
          showQuickActions={true}
          quickDates={this.quickDates}
          quickDatesMode="range"
          withClear={false}
          selectionMode="auto"
          onDatesChanged={this.handleDatesChanged}
        ></ir-date-range-filter>
        <wa-tooltip for="search-btn">Search</wa-tooltip>
        <ir-custom-button id="search-btn" loading={dp_report.isLoading} disabled={dp_report.isLoading} onClickHandler={this.handleSearch} variant="neutral" appearance="outlined">
          <wa-icon name="magnifying-glass"></wa-icon>
        </ir-custom-button>
      </div>
    );
  }
}
