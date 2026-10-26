import { addDaysISO, todayISO, type ISODate } from '@/utils/calendar-dates';
import { Component, Event, EventEmitter, Host, Prop, h } from '@stencil/core';
import moment from 'moment';
import locales from '@/stores/locales.store';
import { MAX_DAY_OFFSET } from '../dashboard.helpers';

/**
 * Day picker for the dashboard header: a pill showing the selected day that opens a list of the days from
 * today to `MAX_DAY_OFFSET` after it. Past days aren't offered.
 */
@Component({
  tag: 'ir-dashboard-date-navigator',
  styleUrl: 'ir-dashboard-date-navigator.css',
  scoped: true,
})
export class IrDashboardDateNavigator {
  /** Selected day (`YYYY-MM-DD`). */
  @Prop() date: ISODate;

  /** Emitted with the new day when the user picks another day. */
  @Event() dateChange: EventEmitter<ISODate>;

  private handleSelect(e: CustomEvent<{ item: HTMLElement & { value: string } }>) {
    e.stopPropagation();
    const value = e.detail.item.value as ISODate;
    if (value && value !== this.date) {
      this.dateChange.emit(value);
    }
  }

  render() {
    const today = todayISO();
    const days = Array.from({ length: MAX_DAY_OFFSET + 1 }, (_, index) => addDaysISO(today, index));
    // Locale- and calendar-aware (Gregorian or Hijri), like every other displayed date.
    const label = (day: ISODate) => moment(day, 'YYYY-MM-DD').format('dddd, D MMMM');

    return (
      <Host>
        <wa-dropdown class="date-navigator" placement="bottom-end" onwa-select={e => this.handleSelect(e as CustomEvent<{ item: HTMLElement & { value: string } }>)}>
          <button type="button" slot="trigger" class="date-navigator__trigger" aria-label="Select date">
            <wa-icon class="date-navigator__icon" name="calendar-days" aria-hidden="true"></wa-icon>
            <time class="date-navigator__date" dateTime={this.date}>
              {label(this.date)}
            </time>
            <wa-icon class="date-navigator__chevron" name="chevron-down" aria-hidden="true"></wa-icon>
          </button>
          {days.map(day => (
            <wa-dropdown-item key={day} value={day} type="checkbox" checked={day === this.date}>
              {label(day)}
              {day === today && (
                <span slot="details" class="date-navigator__today">
                  {locales.entries?.Lcz_Today ?? 'Today'}
                </span>
              )}
            </wa-dropdown-item>
          ))}
        </wa-dropdown>
      </Host>
    );
  }
}
