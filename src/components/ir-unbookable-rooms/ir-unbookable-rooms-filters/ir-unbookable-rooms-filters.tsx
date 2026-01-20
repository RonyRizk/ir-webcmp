import { Component, Event, EventEmitter, Host, Prop, h } from '@stencil/core';
import { FetchUnBookableRoomsResult } from '@/services/property.service';

type UnbookableRoomsMode = 'default' | 'mpo';
type UnbookableRoomsFilters = { period_to_check: number; consecutive_period: number; country: string };

@Component({
  tag: 'ir-unbookable-rooms-filters',
  styleUrl: 'ir-unbookable-rooms-filters.css',
  scoped: true,
})
export class IrUnbookableRoomsFilters {
  @Prop() mode: UnbookableRoomsMode = 'default';
  @Prop() filters: UnbookableRoomsFilters = { period_to_check: 2, consecutive_period: 14, country: 'all' };
  @Prop() unbookableRooms: FetchUnBookableRoomsResult = [];
  @Prop() isLoading = false;

  @Event() filtersChange: EventEmitter<Partial<UnbookableRoomsFilters>>;
  @Event() filtersReset: EventEmitter<void>;
  @Event() filtersSave: EventEmitter<void>;

  private normalizePositiveNumber(value: number, fallback: number) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) {
      return Math.floor(parsed);
    }
    return fallback;
  }

  private handlePeriodChange = (value: string) => {
    this.filtersChange.emit({
      period_to_check: this.normalizePositiveNumber(Number(value), this.filters.period_to_check),
    });
  };

  private handleConsecutiveChange = (value: string) => {
    this.filtersChange.emit({
      consecutive_period: this.normalizePositiveNumber(Number(value), this.filters.consecutive_period),
    });
  };

  private handleCountryChange = (value: string) => {
    this.filtersChange.emit({ country: value });
  };

  render() {
    const countries = new Map<number, string>();
    this.unbookableRooms.forEach(entry => {
      if (entry.country?.id != null) {
        countries.set(entry.country.id, entry.country.name);
      }
    });
    const sortedCountries = [...countries.entries()].sort(
      (a, b) => a[1].localeCompare(b[1], undefined, { sensitivity: 'base' }) || a[0] - b[0],
    );
    return (
      <Host>
        <wa-card class="unbookable-rooms__filters-card" appearance="outlined">
          <div slot="header" class="filters-card__header">
            <wa-icon name="filter"></wa-icon>
            <h4 class="filters-card__title m-0">Filters</h4>
          </div>
          <wa-select
            label="Look ahead"
            size="small"
            value={this.filters.period_to_check?.toString()}
            defaultValue={this.filters.period_to_check?.toString()}
            onchange={e => {
              this.handlePeriodChange((e.target as HTMLSelectElement).value);
            }}
          >
            {Array.from({ length: 5 }, (_, i) => i + 2).map(value => (
              <wa-option value={value.toString()}>
                {value} month{value > 1 ? 's' : ''}
              </wa-option>
            ))}
          </wa-select>
          <ir-input
            type="number"
            label="Minimum consecutive nights"
            min="7"
            hint="Period where room types are closed for booking."
            max="60"
            value={this.filters.consecutive_period?.toString()}
            onText-change={e => {
              this.handleConsecutiveChange(e.detail);
            }}
          ></ir-input>
          {this.mode === 'mpo' && sortedCountries.length > 1 && (
            <wa-select
              label="Country"
              size="small"
              value={this.filters.country?.toString()}
              defaultValue="all"
              onchange={e => {
                this.handleCountryChange((e.target as HTMLSelectElement).value);
              }}
            >
              <wa-option value="all">Show all</wa-option>
              {sortedCountries.map(([id, name]) => (
                <wa-option value={id.toString()}>{name}</wa-option>
              ))}
            </wa-select>
          )}
          <div class="filter__actions">
            <ir-custom-button onClickHandler={() => this.filtersReset.emit()} variant="neutral" appearance="filled">
              Reset
            </ir-custom-button>
            <ir-custom-button loading={this.isLoading} onClickHandler={() => this.filtersSave.emit()} variant="brand">
              Save
            </ir-custom-button>
          </div>
        </wa-card>
      </Host>
    );
  }
}
