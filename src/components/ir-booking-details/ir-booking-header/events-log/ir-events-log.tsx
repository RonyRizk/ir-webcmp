import { isRequestPending } from '@/stores/ir-interceptor.store';
import { Component, Fragment, Prop, State, h } from '@stencil/core';
import { Booking, ExposedBookingEvent } from '@/models/booking.dto';
import { t } from '@/services/locale/t';
import { formatDate } from '@/utils/date';
import { formatNumber } from '@/utils/number';

@Component({
  tag: 'ir-events-log',
  styleUrl: 'ir-events-log.css',
  scoped: true,
})
export class IrEventsLog {
  @Prop() bookingNumber: string;
  @Prop() booking: Booking;

  @State() bookingEvents: ExposedBookingEvent[];

  componentWillLoad() {
    this.init();
  }

  private async init() {
    try {
      this.bookingEvents = this.booking.events;
    } catch (error) {
      console.error(error);
    }
  }

  render() {
    return (
      <div class="">
        {isRequestPending('/Get_Exposed_Booking_Events') ? (
          <div class={'d-flex align-items-center justify-content-center dialog-container-height'}>
            <ir-spinner></ir-spinner>
          </div>
        ) : (
          <Fragment>
            <table class=" dialog-container-height">
              <thead class="sr-only">
                <tr>
                  <th>{t('Lcz_DateLabel', { fallback: 'Date' })}</th>
                  <th>{t('Lcz_User', { fallback: 'user' })}</th>
                  <th>{t('Lcz_Status', { fallback: 'Status' })}</th>
                </tr>
              </thead>
              <tbody>
                {this.bookingEvents?.map(e => (
                  <tr key={e.id} class="pb-1">
                    <td class="event-row dates-row">
                      <span>{formatDate(e.date, 'MMM DD, YYYY')}</span>
                      <span>
                        {formatNumber(e.hour, { minimumIntegerDigits: 2, useGrouping: false })}:{formatNumber(e.minute, { minimumIntegerDigits: 2, useGrouping: false })}:
                        {formatNumber(e.second, { minimumIntegerDigits: 2, useGrouping: false })}
                      </span>
                    </td>
                    <td class="ir-ps-3 event-row ">{e.type}</td>
                    <td class="ir-ps-1 event-row ">{e.user}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Fragment>
        )}
      </div>
    );
  }
}
