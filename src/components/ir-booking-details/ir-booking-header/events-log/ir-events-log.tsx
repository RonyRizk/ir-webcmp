import { Component, Prop, h } from '@stencil/core';
import { ExposedBookingEvent } from '@/models/booking.dto';
import { t } from '@/services/locale/t';
import { formatDate } from '@/utils/date';
import { formatNumber } from '@/utils/number';

const pad = (n: number) => formatNumber(n, { minimumIntegerDigits: 2, useGrouping: false });

@Component({
  tag: 'ir-events-log',
  styleUrl: 'ir-events-log.css',
  scoped: true,
})
export class IrEventsLog {
  /** Booking events, rendered in the order received. */
  @Prop() events: ExposedBookingEvent[] = [];

  render() {
    if (!this.events?.length) {
      return <ir-empty-state class="events-log__empty"></ir-empty-state>;
    }
    return (
      <div class="events-log">
        <table class="events-log__table">
          <thead class="sr-only">
            <tr>
              <th scope="col">{t('Lcz_DateLabel', { fallback: 'Date' })}</th>
              <th scope="col">{t('Lcz_Status', { fallback: 'Status' })}</th>
              <th scope="col">{t('Lcz_User', { fallback: 'User' })}</th>
            </tr>
          </thead>
          <tbody>
            {this.events.map(e => (
              <tr key={e.id} class="events-log__row" data-testid="events-log-entry">
                <td class="events-log__cell events-log__cell--when">
                  <span class="events-log__date">{formatDate(e.date, 'MMM DD, YYYY')}</span>
                  <span class="events-log__time">
                    {pad(e.hour)}:{pad(e.minute)}:{pad(e.second)}
                  </span>
                </td>
                <td class="events-log__cell events-log__cell--event">
                  <span class="events-log__event">{e.type}</span>
                </td>
                <td class="events-log__cell events-log__cell--user">{e.user}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
}
