import { Component, Event, EventEmitter, Fragment, Host, Prop, State, Watch, h } from '@stencil/core';
import moment from 'moment';
import { DayUseBookings } from '@/services/property/types';
import locales from '@/stores/locales.store';
import calendar_data from '@/stores/calendar-data';
import { RoomBookingDetails } from '@/models/IBooking';
import { _formatTime } from '@/components/ir-booking-details/functions';

type DayUseStatus = 'scheduled' | 'upcoming' | 'in-progress';

const STATUS_LABEL: Record<DayUseStatus, string> = {
  'scheduled': 'Scheduled',
  'upcoming': 'Upcoming',
  'in-progress': 'In Progress',
};

const GUEST_NAME_CROP_SIZE = 16;

/** A stay checking out of (`departure`) or into (`arrival`) the day-use unit on the same date. Both at once is a turnover. */
type StayMovementKind = 'departure' | 'arrival';

const MOVEMENT_DISPLAY: Record<StayMovementKind, { icon: string; label: string }> = {
  departure: { icon: 'plane-departure', label: 'Departure' },
  arrival: { icon: 'plane-arrival', label: 'Arrival' },
};

/** `_DEPARTURE_TIME` code meaning the guest never picked one — the property's standard check-out applies. */
const UNSET_DEPARTURE_TIME_CODE = '000';

/** `_ARRIVAL_TIME` code for "Not sure yet" — same idea, the property's standard check-in applies. */
const UNSET_ARRIVAL_TIME_CODE = '001';

interface StayMovement {
  kind: StayMovementKind;
  bookingNumber: string;
  guestName: string;
  /** Formatted clock time (`02:00 PM`), or whatever label the setup entry carries when it isn't a clock time. */
  time: string | null;
  /** The property's standard check-in/check-out time is being shown because the stay has none of its own. */
  isStandard: boolean;
}

@Component({
  tag: 'igl-day-use-bookings',
  styleUrl: 'igl-day-use-bookings.css',
  scoped: true,
})
export class IglDayUseBookings {
  /** Day-use bookings for whatever calendar window has been loaded (from `getDayUseBookingsForCalendar`) — same source `igl-cal-body` uses for its cell markers. */
  @Prop() dayUseBookings: DayUseBookings[] = [];
  @Prop() calendarData: { [key: string]: any };

  @State() selectedDate: string = '';

  @Event() optionEvent: EventEmitter<{ [key: string]: any }>;
  @Event() showBookingPopup: EventEmitter<{ [key: string]: any }>;

  componentWillLoad() {
    this.selectDefaultDate();
  }

  @Watch('dayUseBookings')
  handleDayUseBookingsChange() {
    if (!this.orderedDates.includes(this.selectedDate)) {
      this.selectDefaultDate();
    }
  }

  private selectDefaultDate() {
    const today = moment().format('YYYY-MM-DD');
    const dates = this.orderedDates;
    this.selectedDate = dates.includes(today) ? today : (dates[0] ?? today);
  }

  private get orderedDates(): string[] {
    const today = moment().format('YYYY-MM-DD');
    return Array.from(new Set(this.dayUseBookings.map(booking => booking.target_date)))
      .filter(date => date >= today)
      .sort();
  }

  private get bookingsForSelectedDate(): DayUseBookings[] {
    return this.dayUseBookings.filter(booking => booking.target_date === this.selectedDate);
  }

  private getUnitName(unitId: number): string {
    for (const roomType of this.calendarData?.roomsInfo ?? []) {
      const unit = roomType.physicalrooms?.find(room => room.id === unitId);
      if (unit) {
        return unit.name;
      }
    }
    return '';
  }

  private getRoomTypeName(roomTypeId: number): string {
    return this.calendarData?.roomsInfo?.find(roomType => roomType.id === roomTypeId)?.name ?? '';
  }

  private getGuestName(booking: DayUseBookings): string {
    const name = [booking.guest_first_name, booking.guest_last_name].filter(Boolean).join(' ').trim();
    if (name) {
      return name;
    }
    const bookingEvent = (this.calendarData?.bookingEvents ?? []).find(event => event.BOOKING_NUMBER?.toString() === booking.book_nbr?.toString());
    return bookingEvent?.NAME ?? '';
  }

  private getPrice(amount: number): string {
    const symbol = this.calendarData?.currency?.symbol ?? '';
    return `${symbol}${Number(amount ?? 0).toFixed(2)}`;
  }

  private getStatus(booking: DayUseBookings): DayUseStatus {
    if (booking.target_date !== moment().format('YYYY-MM-DD')) {
      return 'scheduled';
    }
    const from = moment(`${booking.target_date} ${booking.from_time}`, 'YYYY-MM-DD HH:mm');
    return moment().isBefore(from) ? 'upcoming' : 'in-progress';
  }

  private formatTime(time: string): string {
    const [hour, minute] = time.split(':');
    return _formatTime(hour, minute);
  }

  private groupByRoomType(bookings: DayUseBookings[]): Map<number, DayUseBookings[]> {
    const grouped = new Map<number, DayUseBookings[]>();
    bookings.forEach(booking => {
      const list = grouped.get(booking.room_type_id) ?? [];
      list.push(booking);
      grouped.set(booking.room_type_id, list);
    });
    return grouped;
  }

  private openBookingDetails(booking: DayUseBookings) {
    this.showBookingPopup.emit({
      key: 'add',
      data: {
        BOOKING_NUMBER: booking.book_nbr,
        event_type: 'EDIT_BOOKING',
        TITLE: `${locales.entries.Lcz_EditBookingFor ?? 'Edit Booking For'} ${this.getGuestName(booking)}`,
      },
    });
  }

  private handleOptionEvent(key: string) {
    this.optionEvent.emit({ key, data: '' });
  }

  /**
   * Stays sitting on the same unit — day-use rows are extra services and never appear in `bookingEvents`,
   * and blocks are filtered out since they carry no booking number.
   */
  private getStayEvents(unitId: number): RoomBookingDetails[] {
    return (this.calendarData?.bookingEvents ?? []).filter((event: RoomBookingDetails) => event.PR_ID === unitId && !!event.BOOKING_NUMBER);
  }

  /** `FROM_DATE`/`TO_DATE` are clamped to the loaded window, so the untouched `defaultDates` win when present. */
  private getStayDates(event: RoomBookingDetails): { from: string; to: string } {
    return {
      from: event.defaultDates?.from_date ?? event.FROM_DATE,
      to: event.defaultDates?.to_date ?? event.TO_DATE,
    };
  }

  private getStayRoom(event: RoomBookingDetails) {
    return (event.ROOMS ?? []).find(room => room.identifier === event.IDENTIFIER);
  }

  /** Accepts both `HH:mm` values (formatted to `hh:mm A`) and plain setup labels such as "Not sure yet". */
  private formatClockTime(value: string | null | undefined): string | null {
    if (!value) {
      return null;
    }
    const match = value.match(/^(\d{1,2}):(\d{2})/);
    return match ? _formatTime(match[1], match[2]) : value.trim() || null;
  }

  private getDepartureTime(event: RoomBookingDetails): Pick<StayMovement, 'time' | 'isStandard'> {
    const departure = event.DEPARTURE_TIME ?? this.getStayRoom(event)?.departure_time;
    const requested = departure?.code && departure.code !== UNSET_DEPARTURE_TIME_CODE ? departure.description : null;
    return requested
      ? { time: this.formatClockTime(requested), isStandard: false }
      : { time: this.formatClockTime(calendar_data.property?.time_constraints?.check_out_till), isStandard: true };
  }

  private getArrivalTime(event: RoomBookingDetails): Pick<StayMovement, 'time' | 'isStandard'> {
    const arrival = this.getStayRoom(event)?.arrival_time;
    const requested = arrival?.code && arrival.code !== UNSET_ARRIVAL_TIME_CODE ? arrival.description : null;
    return requested
      ? { time: this.formatClockTime(requested), isStandard: false }
      : { time: this.formatClockTime(calendar_data.property?.time_constraints?.check_in_from), isStandard: true };
  }

  private toStayMovement(kind: StayMovementKind, event: RoomBookingDetails): StayMovement {
    const { time, isStandard } = kind === 'departure' ? this.getDepartureTime(event) : this.getArrivalTime(event);
    return { kind, bookingNumber: event.BOOKING_NUMBER, guestName: event.NAME ?? '', time, isStandard };
  }

  /**
   * The same-day movements the day use has to fit around: the stay leaving that morning, the stay
   * arriving that evening, or — when both exist — the turnover between the two.
   */
  private getStayMovements(booking: DayUseBookings): StayMovement[] {
    const events = this.getStayEvents(booking.unit_id);
    const movements: StayMovement[] = [];
    const departing = events.find(event => this.getStayDates(event).to === booking.target_date);
    if (departing) {
      movements.push(this.toStayMovement('departure', departing));
    }
    const arriving = events.find(event => this.getStayDates(event).from === booking.target_date);
    if (arriving) {
      movements.push(this.toStayMovement('arrival', arriving));
    }
    return movements;
  }

  /** Movement chips plus the tooltip spelling out the stay(s) behind them — both bookings when it's a turnover. */
  private renderStayMovements(booking: DayUseBookings, movements: StayMovement[]) {
    const movementsId = `dub-movements-${booking.bh_id}`;
    const isTurnover = movements.length > 1;
    return (
      <Fragment>
        <div class="dub-booking__movements" id={movementsId}>
          {isTurnover && (
            <span class="dub-movement dub-movement--turnover">
              <wa-icon name="rotate" class="dub-movement__icon"></wa-icon>
              Turnover
            </span>
          )}
          {movements.map(movement => (
            <span class={`dub-movement dub-movement--${movement.kind}`} key={`${movementsId}-${movement.kind}`}>
              <wa-icon name={MOVEMENT_DISPLAY[movement.kind].icon} class="dub-movement__icon"></wa-icon>
              {MOVEMENT_DISPLAY[movement.kind].label}
              {movement.time && <span class="dub-movement__time">{movement.time}</span>}
            </span>
          ))}
        </div>
        <wa-tooltip for={movementsId} placement="top">
          <span class="dub-movement-tip">
            {movements.map(movement => (
              <span class="dub-movement-tip__line" key={`${movementsId}-tip-${movement.kind}`}>
                <span class="dub-movement-tip__label">{MOVEMENT_DISPLAY[movement.kind].label}</span>
                <span>
                  #{movement.bookingNumber}
                  {movement.guestName ? ` \u00b7 ${movement.guestName}` : ''}
                </span>
                {movement.time && (
                  <span class="dub-movement-tip__time">
                    {movement.time}
                    {movement.isStandard ? ' (standard)' : ''}
                  </span>
                )}
              </span>
            ))}
          </span>
        </wa-tooltip>
      </Fragment>
    );
  }

  private renderBooking(booking: DayUseBookings) {
    const guestName = this.getGuestName(booking);
    const guestNameId = `dub-guest-${booking.bh_id}`;
    const status = this.getStatus(booking);
    const movements = this.getStayMovements(booking);
    return (
      <button type="button" class="dub-booking" key={`booking-${booking.bh_id}`} onClick={() => this.openBookingDetails(booking)}>
        <div class="dub-booking__main">
          <ir-unit-tag unit={this.getUnitName(booking.unit_id)}></ir-unit-tag>
          <span class="dub-booking__time">
            {this.formatTime(booking.from_time)} – {this.formatTime(booking.to_time)}
          </span>
          <span class="dub-booking__price">{this.getPrice(booking.gross_amount)}</span>
        </div>
        <div class="dub-booking__meta">
          <span class="dub-booking__number">#{booking.book_nbr}</span>
          {guestName && (
            <span class="dub-booking__guest" id={guestNameId}>
              {guestName}
            </span>
          )}
          {guestName && guestName.length > GUEST_NAME_CROP_SIZE && (
            <wa-tooltip for={guestNameId} placement="top">
              {guestName}
            </wa-tooltip>
          )}
          <span class={`dub-status dub-status--${status}`}>{STATUS_LABEL[status]}</span>
        </div>
        {movements.length > 0 && this.renderStayMovements(booking, movements)}
      </button>
    );
  }

  private renderCategory(roomTypeId: number, bookings: DayUseBookings[]) {
    return (
      <div class="dub-category" key={`category-${roomTypeId}`}>
        <h5 class="dub-category__title">{this.getRoomTypeName(roomTypeId)}</h5>
        <div class="dub-category__list">{bookings.sort((a, b) => a.from_time.localeCompare(b.from_time)).map(booking => this.renderBooking(booking))}</div>
      </div>
    );
  }

  render() {
    const bookings = this.bookingsForSelectedDate;
    const grouped = this.groupByRoomType(bookings);
    const hasDates = this.orderedDates.length > 0;
    const isEmpty = bookings.length === 0;

    return (
      <Host>
        <div class="dub-panel">
          <div class="dub-panel__head">
            <header class="dub-panel__header">
              <h2 class="dub-panel__title" id="day-use-bookings-title">
                Day Use Bookings
              </h2>
              <ir-custom-button size="m" appearance="plain" variant="neutral" onClickHandler={() => this.handleOptionEvent('closeSideMenu')}>
                <wa-icon name="xmark" variant="solid" label="Close" aria-label="Close" role="img"></wa-icon>
              </ir-custom-button>
            </header>

            {hasDates && (
              <div class="dub-panel__toolbar">
                <wa-select
                  size="s"
                  aria-label="Date"
                  value={this.selectedDate}
                  defaultValue={this.selectedDate}
                  onchange={evt => (this.selectedDate = (evt.target as HTMLSelectElement).value)}
                >
                  {this.orderedDates.map(date => (
                    <wa-option value={date}>{moment(date, 'YYYY-MM-DD').format('ddd, DD MMM YYYY')}</wa-option>
                  ))}
                </wa-select>
              </div>
            )}
          </div>

          <div class="dub-panel__body">
            {isEmpty ? (
              <ir-empty-state message="No day-use bookings for this date."></ir-empty-state>
            ) : (
              Array.from(grouped.entries()).map(([roomTypeId, roomTypeBookings]) => this.renderCategory(roomTypeId, roomTypeBookings))
            )}
          </div>
        </div>
      </Host>
    );
  }
}
