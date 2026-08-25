import { Component, Fragment, h } from '@stencil/core';
import booking_store, { setBookingDraft } from '@/stores/booking.store';
import calendar_data from '@/stores/calendar-data';
import { formatAmount } from '@/utils/utils';
import { DAY_USE_STATUS_ICON, formatDayUseStatusText, getDayUseUnitAvailability } from '@/utils/booking';
import { createTimeToMask } from '@/components/ui/ir-input/masks';
import { DayUseHoursSchema } from '../types';
import moment from 'moment';

/**
 * Owns the day-use-only parts of the booking editor form: the selected unit's summary
 * (date, room type, unit, price, same-day movement status) and the hours picker. Rendered
 * by `ir-booking-editor-form` only when `booking_store.bookingDraft.dayUse` is true.
 */
@Component({
  tag: 'ir-booking-editor-day-use',
  styleUrl: 'ir-booking-editor-day-use.css',
  scoped: true,
})
export class IrBookingEditorDayUse {
  private isValidDayUseTime(value: string): boolean {
    return DayUseHoursSchema.shape.from.safeParse(value).success;
  }

  private getDayUseHour(value: string): number {
    return this.isValidDayUseTime(value) ? Number(value.slice(0, 2)) : 0;
  }

  private handleDayUseFromChange(from: string, dayUseHours: { from: string; to: string }) {
    const fromIsBeforeTo = this.isValidDayUseTime(from) && this.isValidDayUseTime(dayUseHours.to) && this.getDayUseHour(dayUseHours.to) < this.getDayUseHour(from);
    setBookingDraft({ dayUseHours: { from, to: fromIsBeforeTo ? '' : dayUseHours.to } });
  }

  private getDayUseDuration(dayUseHours: { from: string; to: string }): string {
    if (!this.isValidDayUseTime(dayUseHours.from) || !this.isValidDayUseTime(dayUseHours.to)) {
      return '';
    }
    const minutes = moment(dayUseHours.to, 'HH:mm').diff(moment(dayUseHours.from, 'HH:mm'), 'minutes');
    if (minutes <= 0) {
      return '';
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return [hours && `${hours}h`, remainingMinutes && `${remainingMinutes}m`].filter(Boolean).join(' ');
  }

  render() {
    const { dates, dayUseHours } = booking_store.bookingDraft;
    const { dayUseSelection } = booking_store;
    const { dayStatus, checkoutTime, checkinTime } = getDayUseUnitAvailability(dayUseSelection?.unit?.calendar_cell);
    const dayStatusIcon = dayStatus ? DAY_USE_STATUS_ICON[dayStatus] : null;

    return (
      <Fragment>
        <div class="booking-editor__header">
          <span class="booking-editor__dates">{dates.checkIn.format('DD MMM YYYY')}</span>
          <div class="booking-editor__total">
            <span class="booking-editor__total-label">
              {dayUseSelection?.roomType?.name} <ir-unit-tag unit={dayUseSelection?.unit?.name}></ir-unit-tag>
            </span>{' '}
            <span class="booking-editor__total-amount">{formatAmount(calendar_data.property.currency.symbol, dayUseSelection?.price ?? 0)}</span>
            <span style={{ marginInlineStart: '0.5rem', padding: '0', fontSize: '0.75rem' }}>Including taxes and fees</span>
          </div>
          {dayStatus && dayStatusIcon && (
            <span class="booking-editor__day-use-status">
              <wa-icon name={dayStatusIcon} class={`booking-editor__day-use-status-icon booking-editor__day-use-status-icon--${dayStatus}`}></wa-icon>
              {formatDayUseStatusText(dayStatus, checkoutTime, checkinTime)}
            </span>
          )}
        </div>
        <section class="booking-editor__day-use-hours">
          <div class="booking-editor__day-use-hours-row">
            <ir-validator value={dayUseHours.from} schema={DayUseHoursSchema.shape.from}>
              <ir-input
                label="Time period"
                mask="time"
                placeholder="11:30"
                value={dayUseHours.from}
                onText-change={e => this.handleDayUseFromChange(e.detail, dayUseHours)}
              ></ir-input>
            </ir-validator>
            <wa-icon class="booking-editor__day-use-hours-connector" name="arrow-right"></wa-icon>
            <ir-validator value={dayUseHours.to} schema={DayUseHoursSchema.shape.to}>
              <ir-input
                disabled={!this.isValidDayUseTime(dayUseHours.from)}
                mask={createTimeToMask(this.getDayUseHour(dayUseHours.from))}
                placeholder="16:00"
                value={dayUseHours.to}
                onText-change={e => setBookingDraft({ dayUseHours: { ...dayUseHours, to: e.detail } })}
              ></ir-input>
            </ir-validator>
            {this.getDayUseDuration(dayUseHours) && (
              <span class="booking-editor__day-use-duration booking-editor__day-use-hours-connector">Duration: {this.getDayUseDuration(dayUseHours)}</span>
            )}
          </div>
        </section>
      </Fragment>
    );
  }
}
