import { Component, Event, EventEmitter, Prop, State, Watch, h } from '@stencil/core';
import { IDateModifiers, IDateModifierOptions } from './ir-custom-date-range.types';
import moment, { Moment } from 'moment/min/moment-with-locales';
import { getAbbreviatedWeekdays } from './utils';

/**
 * @component ir-custom-date-range
 * @description A two-month inline calendar for selecting a date range.
 * Emits `dateChange` whenever the user clicks a day.
 *
 * @csspart base           - The root wrapper div.
 * @csspart calendar       - Each month `<table>` element.
 * @csspart calendar-header - The `<tr>` that contains the month navigation row.
 * @csspart month-navigation - The `<div>` holding prev/next buttons and the month label.
 * @csspart nav-prev       - The previous-month `<button>`.
 * @csspart nav-next       - The next-month `<button>` (both months).
 * @csspart month-label    - The `<span>` showing the current month and year.
 * @csspart weekday-row    - The `<tr>` containing weekday abbreviation headers.
 * @csspart weekday        - Each `<th>` weekday abbreviation cell.
 * @csspart days-grid      - The `<tbody>` containing all week rows.
 * @csspart week-row       - Each `<tr>` representing one week.
 * @csspart day-cell       - Each `<td>` grid cell.
 * @csspart day-button     - The `<button>` rendered for each visible day.
 */
@Component({ tag: 'ir-custom-date-range', styleUrl: 'ir-custom-date-range.css', shadow: true })
export class IrCustomDateRange {
  /** The currently selected check-in date. */
  @Prop() fromDate: Moment | null = null;

  /** The currently selected check-out date. */
  @Prop() toDate: Moment | null = null;

  /** The earliest selectable date. Defaults to 24 years in the past. */
  @Prop() minDate: Moment = moment().add(-24, 'years');

  /** The latest selectable date. Defaults to 24 years in the future. */
  @Prop() maxDate: Moment = moment().add(24, 'years');

  /**
   * An optional map of `YYYY-MM-DD` → `IDateModifierOptions` used to
   * mark specific dates as unavailable or attach pricing data.
   */
  @Prop() dateModifiers: IDateModifiers;

  /** Maximum number of nights that can be selected in one span. */
  @Prop() maxSpanDays: number = 90;

  /** When `true`, displays a price line inside each day button (requires `dateModifiers`). */
  @Prop() showPrice = false;

  /**
   * BCP-47 locale tag used to localise day names and month formatting.
   * @reflect
   */
  @Prop({ reflect: true }) locale: string = 'en';

  @State() private selectedDates: { start: Moment | null; end: Moment | null } = { start: moment(), end: moment() };
  @State() private displayedDaysArr: { month: Moment; days: Moment[] }[] = [];
  @State() private hoveredDate: Moment | null = null;
  @State() private weekdays: string[] = [];

  /**
   * Emits the selected start and end dates as native `Date` objects.
   * `end` is `null` when the user has only picked the first date.
   */
  @Event({ bubbles: true, composed: true }) dateChange: EventEmitter<{ start: Date | null; end: Date | null }>;

  componentWillLoad() {
    this.weekdays = getAbbreviatedWeekdays(this.locale);
    this.resetHours();
    this.selectedDates = { start: this.fromDate, end: this.toDate };
    const currentMonth = this.fromDate ? this.fromDate.clone() : moment();
    const nextMonth = currentMonth.clone().add(1, 'month');
    this.displayedDaysArr = [this.getMonthDays(currentMonth), this.getMonthDays(nextMonth)];
  }

  /** Re-localises weekday names when the locale changes. */
  @Watch('locale')
  handleLocale(newValue: string, oldLocale: string) {
    if (newValue !== oldLocale) {
      moment.locale(newValue);
      this.weekdays = getAbbreviatedWeekdays(newValue);
    }
  }

  /** Syncs the internal selection start when `fromDate` prop changes. */
  @Watch('fromDate')
  handleFromDateChange(newValue: Moment | null, oldValue: Moment | null) {
    if (!(newValue ?? moment()).isSame(oldValue ?? moment(), 'days')) {
      this.selectedDates = { ...this.selectedDates, start: newValue };
    }
  }

  /** Syncs the internal selection end when `toDate` prop changes. */
  @Watch('toDate')
  handleToDateChange(newValue: Moment | null, oldValue: Moment | null) {
    if (!(newValue ?? moment()).isSame(oldValue ?? moment(), 'days')) {
      this.selectedDates = { ...this.selectedDates, end: newValue };
    }
  }

  private getMonthDays(month: Moment): { month: Moment; days: Moment[] } {
    const startDate = moment(month).startOf('month').startOf('week');
    const endDate = moment(month).endOf('month').endOf('week');

    const days: Moment[] = [];
    let day = startDate.clone();

    while (day.isSameOrBefore(endDate)) {
      days.push(day.clone());
      day.add(1, 'day');
    }

    return { month, days };
  }

  private goToNextMonth(e: MouseEvent) {
    e.stopPropagation();
    e.stopImmediatePropagation();
    const newSecondMonth = this.displayedDaysArr[1].month.clone().add(1, 'months');
    if (newSecondMonth.endOf('month').isBefore(this.minDate) || newSecondMonth.startOf('month').isAfter(this.maxDate)) {
      return;
    }
    this.displayedDaysArr = [this.displayedDaysArr[1], this.getMonthDays(newSecondMonth)];
  }

  private goToPreviousMonth(e: MouseEvent) {
    e.stopPropagation();
    e.stopImmediatePropagation();
    const newFirstMonth = this.displayedDaysArr[0].month.clone().add(-1, 'month');
    if (newFirstMonth.endOf('month').isBefore(this.minDate) || newFirstMonth.startOf('month').isAfter(this.maxDate)) {
      return;
    }
    this.displayedDaysArr = [this.getMonthDays(newFirstMonth), this.displayedDaysArr[0]];
  }

  // private handleMonthChange(e: Event, index: number) {
  //   e.stopPropagation();
  //   e.stopImmediatePropagation();
  //   const newMonth = parseInt((e.target as HTMLSelectElement).value);
  //   const current = this.displayedDaysArr[index].month.clone().month(newMonth);
  //   if (index === 0) {
  //     this.displayedDaysArr = [this.getMonthDays(current), this.getMonthDays(current.clone().add(1, 'month'))];
  //   } else {
  //     this.displayedDaysArr = [this.getMonthDays(current.clone().subtract(1, 'month')), this.getMonthDays(current)];
  //   }
  // }

  // private handleYearChange(e: Event, index: number) {
  //   e.stopPropagation();
  //   e.stopImmediatePropagation();
  //   const newYear = parseInt((e.target as HTMLSelectElement).value);
  //   const current = this.displayedDaysArr[index].month.clone().year(newYear);
  //   if (index === 0) {
  //     this.displayedDaysArr = [this.getMonthDays(current), this.getMonthDays(current.clone().add(1, 'month'))];
  //   } else {
  //     this.displayedDaysArr = [this.getMonthDays(current.clone().subtract(1, 'month')), this.getMonthDays(current)];
  //   }
  // }

  // private getYearRange(): number[] {
  //   const start = this.minDate.year();
  //   const end = this.maxDate.year();
  //   const years: number[] = [];
  //   for (let y = start; y <= end; y++) {
  //     years.push(y);
  //   }
  //   return years;
  // }

  private selectDay(day: Moment) {
    let isDateDisabled = false;
    if (this.dateModifiers) {
      isDateDisabled = !!this.dateModifiers[day.format('YYYY-MM-DD')];
    }
    if (isDateDisabled && !this.selectedDates.start) {
      return;
    }

    if ((this.selectedDates.start && day.isSame(this.selectedDates.start, 'day')) || (this.selectedDates.end && day.isSame(this.selectedDates.end, 'day'))) {
      this.selectedDates = { start: day.clone(), end: null };
    } else {
      if (this.selectedDates.start === null) {
        this.selectedDates = { start: day.clone(), end: null };
      } else {
        if (this.selectedDates.end === null) {
          if (day.isBefore(this.selectedDates.start)) {
            if (isDateDisabled) {
              return;
            }
            this.selectedDates = { start: day.clone(), end: null };
          } else {
            this.selectedDates = { start: this.selectedDates.start.clone(), end: day.clone() };
          }
        } else {
          if (!isDateDisabled) {
            this.selectedDates = { start: day.clone(), end: null };
          }
        }
      }
    }

    const startDate = this.selectedDates.start ? this.selectedDates.start.toDate() : null;
    const endDate = this.selectedDates.end ? this.selectedDates.end.toDate() : null;
    this.dateChange.emit({ start: startDate, end: endDate });
  }

  private resetHours() {
    this.minDate.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
    this.maxDate.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
    if (this.fromDate) {
      this.fromDate.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
    }
    if (this.toDate) {
      this.toDate.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
    }
  }

  private handleMouseEnter(day: Moment) {
    this.hoveredDate = day.clone();
  }

  private handleMouseLeave() {
    this.hoveredDate = null;
  }

  private isDaySelected(day: Moment): boolean {
    const date = day.clone();
    const start = this.selectedDates.start ? this.selectedDates.start.clone() : moment();
    const end = this.selectedDates.end ? this.selectedDates.end.clone() : this.hoveredDate;

    if (this.selectedDates.start && !this.selectedDates.end && this.hoveredDate && this.hoveredDate.isAfter(start, 'day')) {
      if (date.isAfter(start, 'day') && date.isBefore(end, 'day')) {
        return true;
      }
    } else if (date.isAfter(start) && this.selectedDates.end && date.isBefore(end, 'day')) {
      return true;
    }
    return false;
  }

  private checkDatePresence(day: Moment): IDateModifierOptions | undefined {
    if (!this.dateModifiers) {
      return;
    }
    return this.dateModifiers[day.format('YYYY-MM-DD')];
  }

  render() {
    const maxSpanDays = this.selectedDates.start ? this.selectedDates.start.clone().add(this.maxSpanDays, 'days') : null;
    return (
      <div part="base" class="date-picker">
        {this.displayedDaysArr.map((month, index) => (
          <table part="calendar" class="calendar" role="grid">
            <thead>
              <tr part="calendar-header" class="calendar-header">
                <th colSpan={7}>
                  <div part="month-navigation" class="month-navigation">
                    {index === 0 && this.displayedDaysArr[0].month.clone().startOf('month').isAfter(this.minDate) && (
                      <button part="nav-prev" name="previous month" class="navigation-buttons previous-month" type="button" onClick={this.goToPreviousMonth.bind(this)}>
                        <p class="sr-only">previous month</p>
                        <svg xmlns="http://www.w3.org/2000/svg" height="16" width="25.6" viewBox="0 0 320 512">
                          <path
                            fill="currentColor"
                            d="M41.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.3 256 246.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160z"
                          />
                        </svg>
                      </button>
                    )}
                    <span part="month-label" class="month-year-label">
                      {month.month.locale(this.locale ?? 'en').format('MMMM YYYY')}
                    </span>
                    {index === 0 && (
                      <button part="nav-next" name="next month" class="navigation-buttons button-next" type="button" onClick={this.goToNextMonth.bind(this)}>
                        <p class="sr-only">next month</p>
                        <svg xmlns="http://www.w3.org/2000/svg" height="16" width="25.6" viewBox="0 0 320 512">
                          <path d="M278.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-160 160c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L210.7 256 73.4 118.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l160 160z" />
                        </svg>
                      </button>
                    )}
                    {index === 1 && this.displayedDaysArr[1].month.clone().endOf('month').isBefore(this.maxDate) && (
                      <button part="nav-next" name="next month" class="navigation-buttons button-next-main" type="button" onClick={this.goToNextMonth.bind(this)}>
                        <p class="sr-only">next month</p>
                        <svg xmlns="http://www.w3.org/2000/svg" height="16" width="25.6" viewBox="0 0 320 512">
                          <path
                            fill="currentColor"
                            d="M278.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-160 160c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L210.7 256 73.4 118.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l160 160z"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                </th>
              </tr>
              <tr part="weekday-row" class="weekday-header" role="row">
                {this.weekdays.map(weekday => (
                  <th part="weekday" class="weekday-name" key={weekday}>
                    {weekday.replace('.', '')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody part="days-grid" class="days-grid">
              {month.days
                .reduce<Moment[][]>((acc, day, i) => {
                  const weekIndex = Math.floor(i / 7);
                  if (!acc[weekIndex]) {
                    acc[weekIndex] = [];
                  }
                  acc[weekIndex].push(day);
                  return acc;
                }, [])
                .map(week => (
                  <tr part="week-row" class="week-row" role="row">
                    {week.map((day: Moment) => {
                      const checkedDate = this.checkDatePresence(day);
                      const isDaySelected = this.isDaySelected(day);
                      const isDaySameEnd = day.isSame(this.selectedDates.end, 'day');
                      const isDaySameStart = day.isSame(this.selectedDates.start, 'day');
                      const isDayAfterMaxDate = day.isAfter(this.maxDate, 'day');
                      const isDayBeforeMinDate = day.isBefore(this.minDate, 'day');
                      return (
                        <td part="day-cell" class="day-cell" key={day.format('YYYY-MM-DD')} role="gridcell">
                          {day.isSame(month.month, 'month') && (
                            <button
                              part="day-button"
                              disabled={isDayBeforeMinDate || isDayAfterMaxDate || (this.selectedDates.start && maxSpanDays && day.isAfter(maxSpanDays) && !this.selectedDates.end)}
                              onMouseEnter={() => this.handleMouseEnter(day)}
                              onMouseLeave={() => this.handleMouseLeave()}
                              onClick={e => {
                                e.stopImmediatePropagation();
                                e.stopPropagation();
                                this.selectDay(day);
                              }}
                              style={checkedDate?.disabled && this.selectedDates.start && { cursor: 'pointer' }}
                              title={checkedDate?.disabled ? 'No availability' : ''}
                              aria-unavailable={checkedDate?.disabled ? 'true' : 'false'}
                              aria-label={`${day.format('dddd, MMMM Do YYYY')} ${isDayBeforeMinDate || isDayAfterMaxDate ? 'Not available' : ''}`}
                              aria-disabled={isDayBeforeMinDate || isDayAfterMaxDate || checkedDate?.disabled ? 'true' : 'false'}
                              aria-selected={(this.selectedDates.start && isDaySameStart) || isDaySelected || (this.selectedDates.end && isDaySameEnd)}
                              class={{
                                'day-button': true,
                                'day-range-start': this.selectedDates.start && isDaySameStart,
                                'day-range-end': this.selectedDates.end && isDaySameEnd,
                                'highlight': isDaySelected && !isDaySameStart,
                              }}
                            >
                              <p class={`day ${day.isSame(moment(), 'day') ? 'current-date' : ''}`}>{day.locale(this.locale).format('D')}</p>
                              {this.showPrice && <p class="price">{checkedDate?.withPrice.price ? '_' : checkedDate.withPrice.price}</p>}
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
            </tbody>
          </table>
        ))}
      </div>
    );
  }
}
