import { Component, Host, Prop, State, h } from '@stencil/core';
import { AllowedProperties, FetchUnBookableRoomsResult } from '@/services/property.service';
import { Debounce } from '@/decorators/debounce';
import moment from 'moment';

type UnbookableRoomsMode = 'default' | 'mpo';
type UnbookableRoomsFilters = { period_to_check: number; consecutive_period: number; country: string };

@Component({
  tag: 'ir-unbookable-rooms-data',
  styleUrl: 'ir-unbookable-rooms-data.css',
  scoped: true,
})
export class IrUnbookableRoomsData {
  @Prop({ reflect: true }) mode: UnbookableRoomsMode = 'default';
  @Prop() isLoading = false;
  @Prop() errorMessage = '';
  @Prop() unbookableRooms: FetchUnBookableRoomsResult = [];
  @Prop() allowedProperties: AllowedProperties = null;
  @Prop() filters: UnbookableRoomsFilters = { period_to_check: 2, consecutive_period: 14, country: 'all' };
  @Prop() progressFilters = { period_to_check: 2, consecutive_period: 14 };

  @State() propertyNameFilter = '';

  private todayFormatted = moment().format('MMM DD');

  private getPropertyName(propertyId: number) {
    if (!this.allowedProperties?.length) {
      return `Property ${propertyId}`;
    }
    const match = this.allowedProperties.find(property => property.id === propertyId);
    return match?.name ?? `Property ${propertyId}`;
  }

  private getPeriodOffset(firstNight: string): number {
    if (!firstNight) return 0;

    const today = moment().startOf('day');
    const firstUnbookable = moment(firstNight, 'YYYY-MM-DD');

    if (!firstUnbookable.isValid()) {
      return 0;
    }

    const daysUntil = firstUnbookable.diff(today, 'days');

    // Account for consecutive nights
    const effectiveStart = daysUntil - (this.progressFilters.consecutive_period - 1);

    const offset = (effectiveStart / (this.progressFilters.period_to_check * 30)) * 100;

    return Math.max(0, Math.min(100, offset));
  }

  private getEndDateFormatted(): string {
    return moment().add(this.progressFilters.period_to_check, 'months').format('MMM DD');
  }

  @Debounce(300)
  private filterProperties(value: string): void {
    this.propertyNameFilter = value?.trim().toLowerCase() ?? '';
  }

  render() {
    const totalIssues = this.unbookableRooms?.length ?? 0;
    const selectedCountryId = this.filters.country !== 'all' ? Number(this.filters.country) : null;
    const hasCountryFilter = this.mode === 'mpo' && Number.isFinite(selectedCountryId);
    const filteredRooms = hasCountryFilter ? this.unbookableRooms.filter(entry => entry.country?.id === selectedCountryId) : this.unbookableRooms;
    const groupedByProperty = filteredRooms.reduce((acc, entry) => {
      const list = acc.get(entry.property_id) ?? [];
      acc.set(entry.property_id, [...list, entry]);
      return acc;
    }, new Map<number, FetchUnBookableRoomsResult>());
    const groupedEntries = [...groupedByProperty.entries()].map(([propertyId, entries]) => ({
      propertyId,
      entries,
      name: this.getPropertyName(propertyId),
    }));
    const sortedEntries = groupedEntries.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }) || a.propertyId - b.propertyId);
    const filteredEntries =
      this.mode === 'mpo' && this.propertyNameFilter ? sortedEntries.filter(item => item.name.toLowerCase().includes(this.propertyNameFilter)) : sortedEntries;
    console.log(filteredEntries);
    return (
      <Host>
        {!this.isLoading && !this.errorMessage && totalIssues === 0 && (
          <wa-card class="unbookable-rooms__empty-state">
            <wa-icon name="check-circle" class="unbookable-rooms__empty-state--icon"></wa-icon>
            <p>Hooray! Nothing to report.</p>
          </wa-card>
        )}
        {totalIssues > 0 && (
          <wa-card class="unbookable-rooms__card-container">
            {this.mode === 'mpo' && (
              <ir-input
                withClear
                class="mb-2"
                onText-change={e => this.filterProperties(e.detail)}
                style={{ maxWidth: '400px' }}
                placeholder="Search properties"
                appearance="filled"
              >
                <wa-icon slot="start" name="magnifying-glass"></wa-icon>
              </ir-input>
            )}
            {filteredEntries.map(({ propertyId, entries }, i) => [
              <article class="property-card">
                <wa-details
                  name="issue-card"
                  onwa-hide={e => {
                    e.stopImmediatePropagation();
                    e.stopPropagation();
                    if (this.mode === 'default') {
                      e.preventDefault();
                    }
                  }}
                  open={this.mode === 'default'}
                  appearance="plain"
                  class="issue__detail"
                >
                  {this.mode === 'mpo' && (
                    <header slot="summary" class="property-card__header">
                      <span>{entries[0].aname}</span>
                      <span>{this.getPropertyName(propertyId)}</span>

                      <b>
                        ({entries.length}/{entries[0].total_room_types_nbr})
                      </b>
                    </header>
                  )}
                  <div class="property-card__body">
                    {entries.map(entry => [
                      <div class="issue">
                        <div class="issue__info">
                          <span class="issue__room">{entry.room_type_name}</span>
                        </div>
                        <div class="period-chart">
                          <span class="period-chart__start">{this.todayFormatted}</span>

                          <div class="period-chart__track">
                            <div
                              title="available"
                              class="period-chart__fill"
                              style={{
                                width: `${this.getPeriodOffset(entry.first_night_not_bookable)}%`,
                              }}
                            ></div>

                            <div
                              class="period-chart__marker"
                              style={{
                                left: `${this.getPeriodOffset(entry.first_night_not_bookable)}%`,
                              }}
                            >
                              <span class="period-chart__label">{moment(entry.first_night_not_bookable, 'YYYY-MM-DD').format('MMM DD')}</span>
                            </div>
                          </div>

                          <span class="period-chart__end">{this.getEndDateFormatted()}</span>
                        </div>
                      </div>,
                    ])}
                  </div>
                  <section class="period-chart__legend">
                    <div class="period-chart__legend-item">
                      <span class="period-chart__legend-swatch period-chart__legend-swatch--bookable"></span>
                      <span>Bookable period</span>
                    </div>

                    <div class="period-chart__legend-item">
                      <span class="period-chart__legend-swatch period-chart__legend-swatch--blocked"></span>
                      <span>Not bookable period</span>
                    </div>
                  </section>
                </wa-details>
              </article>,
              i !== filteredEntries.length - 1 && <wa-divider></wa-divider>,
            ])}
          </wa-card>
        )}
      </Host>
    );
  }
}
