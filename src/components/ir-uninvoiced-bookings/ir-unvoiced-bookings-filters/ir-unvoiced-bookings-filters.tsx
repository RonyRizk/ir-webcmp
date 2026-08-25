import { Component, Event, EventEmitter, h } from '@stencil/core';
import moment from 'moment';
import { QuickDatePreset } from '@/components/ui/ir-date-range-filter/ir-date-range-filter';
import uninvoiced_bookings, { updateUninvoicedBookingsFilters } from '@/stores/uninvoiced_bookings.store';

@Component({
  tag: 'ir-unvoiced-bookings-filters',
  styleUrl: 'ir-unvoiced-bookings-filters.css',
  scoped: true,
})
export class IrUnvoicedBookingsFilters {
  @Event() uninvoicedBookingsFiltersChange: EventEmitter<{ from: string; to: string; source: string }>;

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
    updateUninvoicedBookingsFilters({ from, to });
  };

  private handleSourceChanged = (e: Event) => {
    updateUninvoicedBookingsFilters({ source: (e.target as any).value });
  };

  private handleSearch = () => {
    this.uninvoicedBookingsFiltersChange.emit({
      from: uninvoiced_bookings.filters.from,
      to: uninvoiced_bookings.filters.to,
      source: uninvoiced_bookings.filters.source,
    });
  };

  render() {
    return (
      <div class="uninvoiced-bookings-filters">
        <ir-date-range-filter
          class="uninvoiced-bookings-filters__date-picker"
          fromDate={uninvoiced_bookings.filters.from}
          toDate={uninvoiced_bookings.filters.to}
          maxDate={moment().format('YYYY-MM-DD')}
          showQuickActions={true}
          quickDates={this.quickDates}
          quickDatesMode="range"
          withClear={false}
          selectionMode="auto"
          onDatesChanged={this.handleDatesChanged}
        ></ir-date-range-filter>
        <div class="uninvoiced-bookings-group">
          <wa-select onchange={this.handleSourceChanged} value={uninvoiced_bookings.filters.source} size="s">
            <wa-option value="">All channels</wa-option>
            {uninvoiced_bookings.channels.map(channel => (
              <wa-option key={channel.value} value={channel.value}>
                {channel.name}
              </wa-option>
            ))}
          </wa-select>
          <ir-custom-button
            id="uninvoiced-bookings-search-btn"
            loading={uninvoiced_bookings.isLoading}
            disabled={uninvoiced_bookings.isLoading}
            onClickHandler={this.handleSearch}
            variant="neutral"
            appearance="outlined"
          >
            <wa-icon name="magnifying-glass"></wa-icon>
          </ir-custom-button>
        </div>
        <wa-tooltip for="uninvoiced-bookings-search-btn">Search</wa-tooltip>
      </div>
    );
  }
}
