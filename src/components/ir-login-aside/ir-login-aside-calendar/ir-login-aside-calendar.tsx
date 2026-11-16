import { Component, Prop, State, h } from '@stencil/core';
import { formatDate } from '@/utils/date';
import { formatNumber, formatPercent } from '@/utils/number';
import { interpolate } from '@/services/locale/t';
import type { TLocaleEntries } from '@/stores/locales.store';

const CYCLE_MS = 5200;
const TOAST_MS = 3200;

const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)';
const EASE_IN_OUT = 'cubic-bezier(0.77, 0, 0.175, 1)';

// Fast in (~300ms), long hold, quicker exit; per-keyframe easing keeps one animation
const TOAST_IN_OUT: Keyframe[] = [
  { opacity: 0, transform: 'translateY(-6px) scale(0.96)', easing: EASE_OUT },
  { opacity: 1, transform: 'translateY(0) scale(1)', offset: 0.1 },
  { opacity: 1, transform: 'translateY(0) scale(1)', offset: 0.92, easing: 'ease-in' },
  { opacity: 0, transform: 'translateY(-4px) scale(0.98)' },
];

const TOAST_FADE: Keyframe[] = [
  { opacity: 0 },
  { opacity: 1, offset: 0.1 },
  { opacity: 1, offset: 0.92 },
  { opacity: 0 },
];

// The bar wrapper itself is unskewed (only its base is), so these compose cleanly
const BAR_OUT: Keyframe[] = [
  { opacity: 1, transform: 'scaleX(1)' },
  { opacity: 0, transform: 'scaleX(0.9)' },
];

const BAR_IN: Keyframe[] = [
  { opacity: 0, transform: 'scaleX(0.6)', filter: 'blur(2px)' },
  { opacity: 1, transform: 'scaleX(1)', filter: 'blur(0)' },
];

const COUNT_TICK: Keyframe[] = [
  { opacity: 0, transform: 'translateY(40%)' },
  { opacity: 1, transform: 'translateY(0)' },
];

// "+1" rises in next to the counter, holds, then fades off
const DELTA_POP: Keyframe[] = [
  { opacity: 0, transform: 'translateY(4px) scale(0.95)', easing: EASE_OUT },
  { opacity: 1, transform: 'translateY(0) scale(1)', offset: 0.15 },
  { opacity: 1, transform: 'translateY(0) scale(1)', offset: 0.75, easing: 'ease-in' },
  { opacity: 0, transform: 'translateY(-3px) scale(1)' },
];

const DELTA_FADE: Keyframe[] = [{ opacity: 0 }, { opacity: 1, offset: 0.15 }, { opacity: 1, offset: 0.75 }, { opacity: 0 }];

/** Default booking-status colors of the property calendar legend. */
const STATUS = {
  inHouse: '#31bef1',
  confirmed: '#45b16d',
  checkedOut: '#a0a0a0',
} as const;

type Status = keyof typeof STATUS;

/**
 * A stay positioned relative to today: `offset` is the check-in day (0 = today), `nights` its
 * length. `number` is the booking number shown after the name; `ota` stays get the dark border
 * the calendar gives channel (non-direct) bookings. A `null` guest is a walk-in.
 */
type Stay = { offset: number; nights: number; status: Status; guest: string | null; number: string; ota?: boolean };

/** `channel` is the OTA it came through; `null` means a walk-in added at the front desk. */
type Booking = Stay & { slot: number; channel: string | null };

/** Mirrors the main calendar's layout: room-type header rows, then their units. */
const CATEGORIES: { key: string; name: string; available: number[]; units: { slot: number; name: string; past?: Stay }[] }[] = [
  {
    key: 'Lcz_LoginPromoDeluxeDouble',
    name: 'Deluxe Double',
    available: [1, 0, 1, 2, 1, 0, 0],
    units: [
      { slot: 1, name: '101' },
      { slot: 2, name: '102', past: { offset: -2, nights: 2, status: 'checkedOut', guest: 'J. Saab', number: '58201746' } },
      { slot: 3, name: '103' },
    ],
  },
  {
    key: 'Lcz_LoginPromoGardenSuite',
    name: 'Garden Suite',
    available: [0, 1, 0, 0, 1, 1, 0],
    units: [
      { slot: 4, name: 'S1' },
      { slot: 5, name: 'S2', past: { offset: -3, nights: 3, status: 'checkedOut', guest: 'T. Younes', number: '58199302' } },
    ],
  },
];

const UNIT_NAMES = new Map(CATEGORIES.flatMap(c => c.units.map(u => [u.slot, u.name] as const)));

/** Seed state of each unit's live bar; `cycle()` reassigns bars by `slot` from here on. Mostly confirmed. */
const INITIAL_STAYS: Record<number, Stay> = {
  1: { offset: -2, nights: 4, status: 'inHouse', guest: 'L. Karam', number: '58204411' },
  2: { offset: 1, nights: 3, status: 'confirmed', guest: 'M. Assi', number: '4821937560', ota: true },
  3: { offset: 0, nights: 2, status: 'confirmed', guest: 'R. Fares', number: '58207325' },
  4: { offset: -1, nights: 5, status: 'confirmed', guest: 'C. Halabi', number: '2215408', ota: true },
  5: { offset: 2, nights: 3, status: 'confirmed', guest: 'N. Haddad', number: '58210068' },
};

/** Occupancy shown under each weekday, Sunday-first. */
const OCCUPANCY = [72, 85, 91, 64, 58, 77, 96];

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Grid placement for a stay. The grid has two half-columns per day, so (like the main
 * calendar) a bar starts mid check-in day and ends mid check-out day. Line 2 is the first
 * day's start, line 16 the last day's end. `cutStart`/`cutEnd` mark bars that run past the
 * visible week, which the calendar draws with a square edge. `null` when outside the week.
 */
function stayPlacement(stay: Stay, todayIndex: number): { column: string; cutStart: boolean; cutEnd: boolean } | null {
  const start = todayIndex + stay.offset;
  const end = start + stay.nights;
  if (start > 6 || end < 0) {
    return null;
  }
  const cutStart = start < 0;
  const cutEnd = end > 6;
  return { column: `${cutStart ? 2 : 3 + 2 * start} / ${cutEnd ? 16 : 3 + 2 * end}`, cutStart, cutEnd };
}

/** Looks a label up in the server-provided entries, falling back to the English text. */
type Translate = (key: string, fallback: string, params?: ReadonlyArray<string | number>) => string;

/** The guest's name, or "Walk-in" for front-desk stays that don't have one yet. */
function guestName(stay: Stay, tr: Translate): string {
  return stay.guest ?? tr('Lcz_LoginPromoWalkIn', 'Walk-in');
}

/** "Name - number", the same title igl-booking-event renders. */
function barTitle(stay: Stay, tr: Translate): string {
  return `${guestName(stay, tr)} - ${stay.number}`;
}

function nightsLabel(nights: number, tr: Translate): string {
  return nights === 1 ? tr('Lcz_LoginPromoOneNight', '1 night') : tr('Lcz_LoginPromoNights', '%1 nights', [formatNumber(nights)]);
}

/** The toast's two lines. Should read like a note from a colleague, not a log line. */
function toastCopy(booking: Booking, tr: Translate): { title: string; detail: string } {
  const unit = UNIT_NAMES.get(booking.slot);
  const nights = nightsLabel(booking.nights, tr);

  if (booking.channel === null) {
    return {
      title: tr('Lcz_LoginPromoWalkInCheckedIn', 'Walk-in guest checked into room %1', [unit]),
      detail: tr('Lcz_LoginPromoAddedAtFrontDesk', '%1, added at the front desk', [nights]),
    };
  }
  return {
    title: tr('Lcz_LoginPromoGuestBooked', '%1 just booked room %2', [guestName(booking, tr), unit]),
    detail: tr('Lcz_LoginPromoCameInFrom', '%1, came in from %2', [nights, booking.channel]),
  };
}

@Component({
  tag: 'ir-login-aside-calendar',
  styleUrl: 'ir-login-aside-calendar.css',
  shadow: false,
})
export class IrLoginAsideCalendar {
  /**
   * Translated labels from the server, keyed by `Lcz_*`. Any key that's missing (or the whole
   * object, until it arrives) falls back to the built-in English text.
   */
  @Prop() localeEntries: TLocaleEntries | null = null;

  private toast?: HTMLElement;
  private toastIcon?: HTMLElement;
  private toastTitle?: HTMLElement;
  private toastSub?: HTMLElement;
  private calBody?: HTMLElement;
  private statCount?: HTMLElement;
  private statDelta?: HTMLElement;

  private cycleTimeout?: number;
  private cycleInterval?: number;
  private landTimeout?: number;
  private reduceMotion = false;

  /** Local midnight of the current day; drives the month band, the week row and the highlighted column. */
  @State() today: Date = startOfDay(new Date());

  private index = 0;
  private bookingCount = 184;

  /** Incoming bookings: always in the future (never collide with past stays) and almost all confirmed. */
  private readonly bookings: Booking[] = [
    { slot: 3, offset: 2, nights: 3, status: 'confirmed', channel: 'Booking.com', guest: 'S. Nader', number: '4830215977', ota: true },
    { slot: 5, offset: 1, nights: 2, status: 'confirmed', channel: 'Expedia', guest: 'L. Karam', number: '2216734' },
    { slot: 2, offset: 3, nights: 4, status: 'confirmed', channel: 'Airbnb', guest: 'J. Haddad', number: 'HMQ4ZK2', ota: true },
    { slot: 4, offset: 1, nights: 1, status: 'confirmed', channel: null, guest: null, number: '58213350' },
    { slot: 1, offset: 2, nights: 3, status: 'confirmed', channel: 'Booking.com', guest: 'A. Saab', number: '4830477120', ota: true },
    { slot: 3, offset: 1, nights: 2, status: 'confirmed', channel: 'Expedia', guest: 'M. Fares', number: '2217011', ota: true },
    { slot: 5, offset: 3, nights: 3, status: 'confirmed', channel: 'Airbnb', guest: 'R. Khoury', number: 'HMT8PL6', ota: true },
    { slot: 2, offset: 1, nights: 2, status: 'confirmed', channel: null, guest: null, number: '58214102' },
  ];

  private tr: Translate = (key, fallback, params) => interpolate(this.localeEntries?.[key] || fallback, params);

  componentDidLoad() {
    this.reduceMotion = !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    this.cycleTimeout = window.setTimeout(() => {
      this.cycle();
      this.cycleInterval = window.setInterval(this.cycle, CYCLE_MS);
    }, 1600);
  }

  disconnectedCallback() {
    window.clearTimeout(this.cycleTimeout);
    window.clearTimeout(this.landTimeout);
    window.clearInterval(this.cycleInterval);
  }

  /** The current week, Sunday-first. */
  private get week(): Date[] {
    const sunday = this.today.getDate() - this.today.getDay();
    return Array.from({ length: 7 }, (_, i) => new Date(this.today.getFullYear(), this.today.getMonth(), sunday + i));
  }

  /** Month band segments over the week: two when the week straddles a month boundary. */
  private get monthSegments(): { label: string; start: number; days: number }[] {
    const segments: { label: string; start: number; days: number; key: number }[] = [];
    this.week.forEach((day, i) => {
      const last = segments[segments.length - 1];
      if (last && last.key === day.getMonth()) {
        last.days++;
      } else {
        segments.push({ label: formatDate(day, 'MMM YYYY'), start: i, days: 1, key: day.getMonth() });
      }
    });
    return segments;
  }

  /** Keeps the header honest if the page stays open past midnight. */
  private syncToday() {
    const now = startOfDay(new Date());
    if (now.getTime() !== this.today.getTime()) {
      this.today = now;
    }
  }

  private cycle = () => {
    // Don't burn cycles (or skip ahead) while the tab is in the background
    if (document.hidden) {
      return;
    }

    this.syncToday();

    if (!this.toast || !this.toastIcon || !this.toastTitle || !this.toastSub || !this.calBody) {
      return;
    }

    const booking = this.bookings[this.index];
    this.index = (this.index + 1) % this.bookings.length;

    const copy = toastCopy(booking, this.tr);

    this.toastIcon.style.backgroundColor = STATUS[booking.status];
    this.toastIcon.innerHTML = `<wa-icon name="${booking.channel === null ? 'pen' : 'calendar-plus'}" variant="solid"></wa-icon>`;
    this.toastTitle.textContent = copy.title;
    this.toastSub.textContent = copy.detail;

    this.toast.getAnimations().forEach(a => a.cancel());
    this.toast.animate(this.reduceMotion ? TOAST_FADE : TOAST_IN_OUT, { duration: TOAST_MS, easing: 'linear' });

    // Once the toast has been read, the booking "lands" in the calendar
    this.landTimeout = window.setTimeout(() => this.landBooking(booking), 900);
  };

  private async landBooking(booking: Booking) {
    const bar = this.calBody?.querySelector<HTMLElement>(`.cal__bar[data-slot="${booking.slot}"]`);
    const placement = stayPlacement(booking, this.today.getDay());

    if (bar && placement) {
      bar.getAnimations().forEach(a => a.cancel());

      // Exit quickly, swap while invisible, then enter with a strong ease-out
      await bar.animate(this.reduceMotion ? [{ opacity: 1 }, { opacity: 0 }] : BAR_OUT, { duration: 160, easing: EASE_IN_OUT, fill: 'forwards' }).finished.catch(() => {});

      bar.hidden = false;
      bar.style.gridColumn = placement.column;
      bar.style.setProperty('--bar-color', STATUS[booking.status]);
      bar.classList.toggle('is-ota', !!booking.ota);
      bar.classList.toggle('is-cut-start', placement.cutStart);
      bar.classList.toggle('is-cut-end', placement.cutEnd);
      const title = bar.querySelector('.cal__bar-title');
      if (title) {
        title.textContent = barTitle(booking, this.tr);
      }

      bar.getAnimations().forEach(a => a.cancel());
      bar.animate(this.reduceMotion ? [{ opacity: 0 }, { opacity: 1 }] : BAR_IN, { duration: 420, easing: EASE_OUT });
    }

    this.bookingCount++;

    if (this.statCount) {
      this.statCount.textContent = formatNumber(this.bookingCount);
      this.statCount.animate(this.reduceMotion ? [{ opacity: 0.4 }, { opacity: 1 }] : COUNT_TICK, { duration: 280, easing: EASE_OUT });
    }

    if (this.statDelta) {
      this.statDelta.getAnimations().forEach(a => a.cancel());
      this.statDelta.animate(this.reduceMotion ? DELTA_FADE : DELTA_POP, { duration: 1600, easing: 'linear' });
    }
  }

  /** The seven day cells behind a row; today's carries the `.currentDay` tint. */
  private renderCells(todayIndex: number, values?: number[]) {
    return Array.from({ length: 7 }, (_, i) => (
      <span class={{ 'cal__cell': true, 'is-today': i === todayIndex, 'is-zero': values?.[i] === 0 }} style={{ gridColumn: `${2 + 2 * i} / span 2` }}>
        {values ? formatNumber(values[i]) : null}
      </span>
    ));
  }

  /** Same anatomy as igl-booking-event: a skewed colored base with an unskewed title over it. */
  private renderBar(stay: Stay, todayIndex: number, slot?: number) {
    const placement = stayPlacement(stay, todayIndex);
    return (
      <span
        class={{ 'cal__bar': true, 'is-ota': !!stay.ota, 'is-cut-start': !!placement?.cutStart, 'is-cut-end': !!placement?.cutEnd }}
        data-slot={slot}
        hidden={!placement}
        style={{ 'gridColumn': placement?.column ?? '2 / 3', '--bar-color': STATUS[stay.status] }}
      >
        <span class="cal__bar-base"></span>
        <span class="cal__bar-title">{barTitle(stay, this.tr)}</span>
      </span>
    );
  }

  render() {
    const todayIndex = this.today.getDay();
    const tr = this.tr;
    // The toast is invisible until the first cycle; this just keeps its markup meaningful
    const firstToast = toastCopy(this.bookings[0], tr);

    return (
      <aside class="pms-auth__promo">
        <div>
          <h2 class="pms-auth__promo-title">{tr('Lcz_LoginPromoTitle', 'One calendar. Every booking.')}</h2>

          <p class="pms-auth__promo-copy">
            {tr(
              'Lcz_LoginPromoCopy',
              'Booking.com, Expedia, Airbnb and walk-ins all land on the same calendar. Your team always knows which rooms are taken, and double bookings stop slipping through.',
            )}
          </p>
        </div>

        <div class="cal-wrap" aria-hidden="true">
          <div class="cal">
            <div class="cal__toast" ref={el => (this.toast = el)}>
              <span class="cal__toast-icon" style={{ backgroundColor: STATUS.confirmed }} ref={el => (this.toastIcon = el)}>
                <wa-icon name="calendar-plus" variant="solid"></wa-icon>
              </span>

              <span>
                <span ref={el => (this.toastTitle = el)}>{firstToast.title}</span>
                <span class="cal__toast-sub" ref={el => (this.toastSub = el)}>
                  {firstToast.detail}
                </span>
              </span>
            </div>

            <div class="cal__grid" ref={el => (this.calBody = el)}>
              {/* Header: search corner + month band + day cells, as in igl-cal-header */}
              <div class="cal__row cal__row--head">
                <span class="cal__corner">
                  <span class="cal__search">
                    <wa-icon name="magnifying-glass"></wa-icon>
                    {tr('Lcz_LoginPromoFindUnit', 'Find a unit')}
                  </span>
                </span>

                {this.monthSegments.map((segment, i) => (
                  <span class={{ 'cal__month': true, 'is-alt': i % 2 === 1 }} style={{ gridColumn: `${2 + 2 * segment.start} / span ${2 * segment.days}` }}>
                    {segment.label}
                  </span>
                ))}

                {this.week.map((day, i) => (
                  <span class={{ 'cal__day': true, 'is-today': i === todayIndex, 'is-weekend': i === 0 || i === 6 }} style={{ gridColumn: `${2 + 2 * i} / span 2` }}>
                    <span class="cal__day-title">{formatDate(day, 'ddd D')}</span>
                    <span class="cal__day-occupancy">{formatPercent(OCCUPANCY[i])}</span>
                  </span>
                ))}
              </div>

              {CATEGORIES.map(category => [
                <div class="cal__row cal__row--category">
                  <span class="cal__label">{tr(category.key, category.name)}</span>
                  {this.renderCells(todayIndex, category.available)}
                </div>,
                ...category.units.map(unit => (
                  <div class="cal__row">
                    <span class="cal__label cal__label--unit">{unit.name}</span>
                    {this.renderCells(todayIndex)}
                    {unit.past && this.renderBar(unit.past, todayIndex)}
                    {this.renderBar(INITIAL_STAYS[unit.slot], todayIndex, unit.slot)}
                  </div>
                )),
              ])}
            </div>
          </div>
        </div>

        <dl class="promo-stats">
          <div class="promo-stat">
            <dt class="promo-stat__label">
              <wa-icon name="calendar-days" variant="solid"></wa-icon>
              {tr('Lcz_LoginPromoCalendarForEveryChannel', 'Calendar for every channel')}
            </dt>
            <dd class="promo-stat__num">{formatNumber(1)}</dd>
          </div>

          <div class="promo-stat">
            <dt class="promo-stat__label">
              <wa-icon name="calendar-check" variant="solid"></wa-icon>
              {tr('Lcz_LoginPromoBookingsToday', 'Bookings today')}
            </dt>
            <dd class="promo-stat__value">
              <span class="promo-stat__num" ref={el => (this.statCount = el)}>
                {formatNumber(this.bookingCount)}
              </span>
              <span class="promo-stat__delta" aria-hidden="true" ref={el => (this.statDelta = el)}>
                +{formatNumber(1)}
              </span>
            </dd>
          </div>

          <div class="promo-stat">
            <dt class="promo-stat__label">
              <wa-icon name="shield-halved" variant="solid"></wa-icon>
              {tr('Lcz_LoginPromoDoubleBookings', 'Double bookings')}
            </dt>
            <dd class="promo-stat__num">{formatNumber(0)}</dd>
          </div>
        </dl>

        <a class="pms-auth__promo-link" href="https://info.igloorooms.com" target="_blank" rel="noopener noreferrer">
          {tr('Lcz_LoginPromoSeeHowItWorks', 'See how igloorooms works')}
          <wa-icon name="arrow-right"></wa-icon>
        </a>
      </aside>
    );
  }
}
