import { ClickOutside } from '@/decorators/ClickOutside';
import locales from '@/stores/locales.store';
import { calculateDaysBetweenDates } from '@/utils/booking';
import { Component, Element, Event, EventEmitter, Method, Prop, State, Watch, h } from '@stencil/core';
import moment, { Moment } from 'moment';

export type DateRangeChangeEvent = { checkIn: Moment; checkOut: Moment };

/**
 * @component ir-date-range
 * @description An accessible, popup-based date-range picker.
 * Composed of a combobox trigger (ir-input) and a floating calendar panel (ir-custom-date-range).
 *
 * @csspart popup      - The `wa-popup` root wrapper.
 * @csspart anchor     - The trigger wrapper div that holds the combobox.
 * @csspart combobox   - The clickable/keyboard-accessible control div.
 * @csspart input      - The read-only `ir-input` element that displays the selected range.
 * @csspart calendar-icon - The calendar `wa-icon` rendered inside the input start slot.
 * @csspart nights-badge  - The span showing the number of nights (booking variant only).
 * @csspart body       - The popup panel that wraps the calendar.
 * @csspart calendar   - The `ir-custom-date-range` calendar element.
 *
 * All CSS parts of `ir-custom-date-range` are re-exported and can be targeted via `::part()` on this host.
 */
@Component({
  tag: 'ir-date-range',
  styleUrl: 'ir-date-range.css',
  shadow: true,
})
export class IrDateRange {
  @Element() el: HTMLIrDateRangeElement;

  /**
   * Controls the visual size of the input trigger.
   * @reflect
   */
  @Prop({ reflect: true }) size: 'small' | 'medium' | 'large' = 'small';

  /**
   * Initial date values. Expects `{ fromDate: string | Date, toDate: string | Date }`.
   * Re-initializes dates whenever this prop reference changes.
   */
  @Prop() defaultData: { [key: string]: any };

  /**
   * When `true`, the picker is disabled and cannot be opened.
   * @reflect
   */
  @Prop({ reflect: true }) disabled: boolean = false;

  /**
   * ISO date string (YYYY-MM-DD) for the earliest selectable date.
   */
  @Prop() minDate: string;

  /**
   * Optional label text shown above the input (forwarded to ir-input).
   */
  @Prop() dateLabel: string;

  /**
   * ISO date string (YYYY-MM-DD) for the latest selectable date.
   */
  @Prop() maxDate: string;

  /**
   * When `true` and `variant="booking"`, a nights badge is shown inside the input.
   */
  @Prop() withDateDifference: boolean = true;

  /**
   * `"booking"` shows the nights badge; `"default"` hides it.
   */
  @Prop() variant: 'booking' | 'default' = 'default';

  /**
   * Optional hint text rendered below the input.
   */
  @Prop() hint: string;

  /** Whether the calendar popup is open. */
  @State() private isActive: boolean = false;

  /** Currently selected check-in date. */
  @State() private fromDate: Date = moment().toDate();

  /** Currently selected check-out date. */
  @State() private toDate: Date = moment().add(1, 'day').toDate();

  /** Mirrors the `aria-invalid` attribute so the input reflects validity state. */
  @State() private isInvalid: string;

  /** Computed number of nights between the selected dates. Triggers re-render on change. */
  @State() private totalNights: number = 0;

  /**
   * Legacy event – emits `{ key, data }` for backward-compatible consumers.
   * @deprecated Prefer `dateRangeChange`.
   */
  @Event() dateSelectEvent: EventEmitter<{ [key: string]: any }>;

  /**
   * Emits the selected check-in / check-out as Moment objects.
   */
  @Event({ composed: true, cancelable: true, bubbles: true }) dateRangeChange: EventEmitter<DateRangeChangeEvent>;

  /** Fired when the calendar popup opens. */
  @Event({ composed: true, bubbles: true }) dateRangeShow: EventEmitter<void>;

  /** Fired when the calendar popup closes. */
  @Event({ composed: true, bubbles: true }) dateRangeHide: EventEmitter<void>;

  private static instanceCounter = 0;
  private popupId: string;

  componentWillLoad() {
    IrDateRange.instanceCounter += 1;
    this.popupId = `ir-date-range-popup-${IrDateRange.instanceCounter}`;
    this.initializeDates();
  }

  /** Re-initializes dates when `defaultData` reference changes. */
  @Watch('defaultData')
  handleDataChange(newValue: any, oldValue: any) {
    if (JSON.stringify(newValue) !== JSON.stringify(oldValue)) {
      this.initializeDates();
    }
  }

  /** Syncs `isInvalid` with the reflected `aria-invalid` attribute. */
  @Watch('aria-invalid')
  handleAriaInvalidChange(newValue: string) {
    this.isInvalid = newValue;
  }

  private initializeDates() {
    if (this.defaultData) {
      if (this.defaultData.fromDate) {
        this.fromDate = new Date(this.defaultData.fromDate);
        this.fromDate.setHours(0, 0, 0, 0);
      }
      if (this.defaultData.toDate) {
        this.toDate = new Date(this.defaultData.toDate);
        this.toDate.setHours(0, 0, 0, 0);
      }
    }
    if (this.fromDate && this.toDate) {
      this.calculateTotalNights();
    }
  }

  private calculateTotalNights() {
    this.totalNights = calculateDaysBetweenDates(moment(this.fromDate).format('YYYY-MM-DD'), moment(this.toDate).format('YYYY-MM-DD'));
  }

  private handleDateSelectEvent(key: string, data: any = '') {
    this.dateSelectEvent.emit({ key, data });
  }

  private handleCustomDateChange(evt: CustomEvent<{ start: Date | null; end: Date | null }>) {
    const { start, end } = evt.detail;
    if (!start || !end) return;

    this.fromDate = start;
    this.toDate = end;
    this.calculateTotalNights();

    const startMoment = moment(start);
    const endMoment = moment(end);

    this.handleDateSelectEvent('selectedDateRange', {
      fromDate: start.getTime(),
      toDate: end.getTime(),
      fromDateStr: startMoment.format('DD MMM YYYY'),
      toDateStr: endMoment.format('DD MMM YYYY'),
      dateDifference: this.totalNights,
    });
    this.dateRangeChange.emit({ checkIn: startMoment, checkOut: endMoment });

    this.closeDatePicker();
  }

  /** Opens the calendar popup. */
  @Method()
  async openDatePicker() {
    this.isActive = true;
    this.dateRangeShow.emit();
  }

  /** Closes the calendar popup. Also invoked automatically on outside clicks via `@ClickOutside`. */
  @ClickOutside()
  @Method()
  async closeDatePicker() {
    if (!this.isActive) return;
    this.isActive = false;
    this.dateRangeHide.emit();
  }

  private togglePicker() {
    this.isActive ? this.closeDatePicker() : this.openDatePicker();
  }

  private handleKeyDown(event: KeyboardEvent) {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.togglePicker();
        break;
      case 'Escape':
        if (this.isActive) {
          event.preventDefault();
          this.closeDatePicker();
        }
        break;
    }
  }

  private get formattedLabel(): string {
    const from = moment(this.fromDate).format('MMM DD, YYYY');
    const to = moment(this.toDate).format('MMM DD, YYYY');
    return `${from} → ${to}`;
  }

  render() {
    const showNights = this.variant === 'booking' && this.withDateDifference;
    return (
      <wa-popup part="popup" arrow placement="bottom" flip shift auto-size="vertical" auto-size-padding={10} active={this.isActive} class="igl-date-range__popup">
        <div slot="anchor" part="anchor" class="igl-date-range__trigger">
          <div
            part="combobox"
            class="igl-date-range__control"
            role="combobox"
            tabindex={this.disabled ? -1 : 0}
            aria-haspopup="dialog"
            aria-expanded={this.isActive ? 'true' : 'false'}
            aria-controls={this.popupId}
            aria-disabled={this.disabled ? 'true' : 'false'}
            aria-label="Select date range"
            onClick={!this.disabled ? this.togglePicker.bind(this) : undefined}
            onKeyDown={!this.disabled ? this.handleKeyDown.bind(this) : undefined}
          >
            <ir-input
              part="input"
              disabled={this.disabled}
              class="igl-date-range__input"
              readonly
              value={this.formattedLabel}
              aria-invalid={this.isInvalid}
              aria-expanded={String(this.isActive)}
              aria-disabled={this.disabled ? 'true' : undefined}
            >
              <wa-icon part="calendar-icon" slot="start" variant="regular" name="calendar"></wa-icon>
              {showNights && this.totalNights > 0 && (
                <span part="nights-badge" slot="end" class="igl-date-range__nights">
                  {this.totalNights} {this.totalNights > 1 ? locales.entries.Lcz_Nights : locales.entries.Lcz_Night}
                </span>
              )}
            </ir-input>
          </div>
        </div>

        <div part="body" id={this.popupId} class="igl-date-range__calendar" role="dialog" aria-modal="false" aria-label="Date range selection dialog">
          <ir-custom-date-range
            part="calendar"
            exportparts="base: calendar-base, calendar, calendar-header, month-navigation, nav-prev, nav-next, month-label, weekday-row, weekday, days-grid, week-row, day-cell, day-button"
            style={{ '--cal-button-size': '35px' }}
            fromDate={moment(this.fromDate)}
            toDate={moment(this.toDate)}
            minDate={this.minDate ? moment(this.minDate) : undefined}
            maxDate={this.maxDate ? moment(this.maxDate) : undefined}
            onDateChange={e => this.handleCustomDateChange(e)}
          ></ir-custom-date-range>
        </div>
      </wa-popup>
    );
  }
}
