import { Component, Prop, State, Event, EventEmitter, h, Watch } from '@stencil/core';
import moment, { Moment } from 'moment';

export interface DateRange {
  from: Moment | null;
  to: Moment | null;
}

export interface QuickDatePreset {
  label: string;
  getDate: () => Moment;
}

@Component({
  tag: 'ir-date-range-filter',
  styleUrl: 'ir-date-range-filter.css',
  shadow: true,
})
export class IrDateRangeFilter {
  /** Configurable quick-date preset buttons shown alongside each calendar. */
  @Prop() quickDates: QuickDatePreset[] = [
    { label: 'Today', getDate: () => moment() },
    { label: '30 Days Ago', getDate: () => moment().subtract(30, 'days') },
    { label: '60 Days Ago', getDate: () => moment().subtract(60, 'days') },
    { label: '90 Days Ago', getDate: () => moment().subtract(90, 'days') },
    { label: '1 Year Ago', getDate: () => moment().subtract(1, 'year') },
  ];

  /** Controlled start date in YYYY-MM-DD format. */
  @Prop() fromDate?: string;

  /** Controlled end date in YYYY-MM-DD format. */
  @Prop() toDate?: string;

  /** Size variant passed through to inner form controls. */
  @Prop({ reflect: true }) size = 'small';

  /** Whether to show the quick-action preset buttons in each calendar popup. */
  @Prop() showQuickActions: boolean = true;

  /** Earliest selectable date in YYYY-MM-DD format. */
  @Prop() minDate?: string;

  /** Latest selectable date in YYYY-MM-DD format. */
  @Prop() maxDate?: string;

  @State() dates: DateRange = { from: null, to: null };
  @State() liveMessage: string = '';

  /** Fired whenever either date changes. Payload contains ISO date strings or null. */
  @Event() datesChanged: EventEmitter<{ from: string | null; to: string | null }>;

  /** Fired when the user explicitly clears a date field. */
  @Event() dateCleared: EventEmitter<{ field: 'from' | 'to' }>;

  /** Inner parts of ir-date-select that are re-exported by this component. */
  private static readonly dateSelectParts = ['base', 'anchor', 'combobox', 'body'];

  /** Builds an `exportparts` string that re-exposes ir-date-select parts under a from-/to- prefix. */
  private exportPartsFor(side: 'from' | 'to'): string {
    return IrDateRangeFilter.dateSelectParts.map(part => `${part}:${side}-${part}`).join(', ');
  }

  private groupId = `date-range-${Math.random().toString(36).substring(2, 9)}`;
  private toDateSelectRef: HTMLIrDateSelectElement;
  private fromDateSelectRef: HTMLIrDateSelectElement;
  private hasControlledFromDate = false;
  private hasControlledToDate = false;

  componentWillLoad() {
    this.hasControlledFromDate = this.fromDate !== undefined;
    this.hasControlledToDate = this.toDate !== undefined;
    this.syncInitialDates();
  }

  @Watch('fromDate')
  onFromDateChange(newValue?: string | null) {
    this.hasControlledFromDate = this.hasControlledFromDate || newValue !== undefined;
    this.syncControlledDates('from', newValue);
  }

  @Watch('toDate')
  onToDateChange(newValue?: string | null) {
    this.hasControlledToDate = this.hasControlledToDate || newValue !== undefined;
    this.syncControlledDates('to', newValue);
  }

  /** Updates one side of the date range and emits the change. */
  private selectDate(date: Moment | null, type: 'from' | 'to') {
    this.dates = { ...this.dates, [type]: date };
    this.emitChange();
  }

  /** Clears one side of the date range. */
  private clearDate(type: 'from' | 'to') {
    const pickerRef = type === 'from' ? this.fromDateSelectRef : this.toDateSelectRef;
    pickerRef?.clearDatePicker();
    this.selectDate(null, type);
    this.dateCleared.emit({ field: type });
  }

  private syncInitialDates() {
    this.dates = {
      from: this.hasControlledFromDate ? this.parseDate(this.fromDate) : this.dates.from,
      to: this.hasControlledToDate ? this.parseDate(this.toDate) : this.dates.to,
    };
  }

  private syncControlledDates(changedField: 'from' | 'to', changedValue?: string | null) {
    this.dates = {
      from: changedField === 'from' ? this.parseDate(changedValue) : this.hasControlledFromDate ? this.parseDate(this.fromDate) : this.dates.from,
      to: changedField === 'to' ? this.parseDate(changedValue) : this.hasControlledToDate ? this.parseDate(this.toDate) : this.dates.to,
    };
  }

  private parseDate(value?: string | null): Moment | null {
    if (!value) {
      return null;
    }

    const parsed = moment(value, 'YYYY-MM-DD', true);
    return parsed.isValid() ? parsed : null;
  }

  private emitChange() {
    const from = this.dates.from?.format('YYYY-MM-DD') ?? null;
    const to = this.dates.to?.format('YYYY-MM-DD') ?? null;
    this.datesChanged.emit({ from, to });
    this.liveMessage = `Date range updated. From ${from ?? 'not set'} to ${to ?? 'not set'}.`;
  }

  /**
   * Caps the from-picker's max date at the to-date (or the global maxDate),
   * whichever is earlier.
   */
  private getFromMaxDate(toStr: string | null): string | undefined {
    if (!toStr) return this.maxDate;
    if (!this.maxDate) return toStr;
    return toStr < this.maxDate ? toStr : this.maxDate;
  }

  /**
   * Floors the to-picker's min date at the from-date (or the global minDate),
   * whichever is later.
   */
  private getToMinDate(fromStr: string | null): string | undefined {
    if (!fromStr) return this.minDate;
    if (!this.minDate) return fromStr;
    return fromStr > this.minDate ? fromStr : this.minDate;
  }

  render() {
    const fromLabel = this.dates.from?.format('YYYY-MM-DD') ?? null;
    const toLabel = this.dates.to?.format('YYYY-MM-DD') ?? null;
    const fromMaxDate = this.getFromMaxDate(toLabel);
    const toMinDate = this.getToMinDate(fromLabel);

    return (
      <div part="container" class="drf-container" role="group" aria-labelledby={`${this.groupId}-label`}>
        <span id={`${this.groupId}-label`} class="sr-only">
          Date range selector
        </span>

        {/* FROM field */}
        <div part="field field-from" class="drf-field">
          <button
            part="text-btn"
            class={`drf-text-btn${!fromLabel ? ' drf-text-btn--placeholder' : ''}`}
            onClick={() => this.fromDateSelectRef?.openDatePicker()}
            aria-label={fromLabel ? `Start date: ${fromLabel}` : 'Select start date'}
          >
            {fromLabel ?? 'From'}
          </button>

          {fromLabel && (
            <button part="clear-btn" class="drf-clear-btn" onClick={() => this.clearDate('from')} aria-label="Clear start date">
              <wa-icon name="xmark" />
            </button>
          )}

          <ir-date-select
            ref={el => (this.fromDateSelectRef = el)}
            exportparts={this.exportPartsFor('from')}
            date={this.dates.from?.format('YYYY-MM-DD') || null}
            placeholder="From"
            minDate={this.minDate}
            maxDate={fromMaxDate}
            class="drf-date-select"
            onDateChanged={evt => this.selectDate(evt.detail.start, 'from')}
          >
            <button slot="trigger" part="cal-trigger" class="drf-cal-trigger" aria-label="Open start date calendar">
              <wa-icon name="calendar" variant="regular" />
            </button>
            {this.showQuickActions && (
              <div part="quick-actions" class="drf-quick-actions" role="group" aria-label="Quick start date options">
                {this.quickDates.map(action => (
                  <ir-custom-button
                    type="button"
                    variant="neutral"
                    appearance="outlined"
                    disabled={this.dates?.to?.isSameOrBefore(action.getDate(), 'date')}
                    aria-label={`Set start date to ${action.label}`}
                    onClickHandler={() => {
                      this.selectDate(action.getDate(), 'from');
                      this.fromDateSelectRef.closeDatePicker();
                    }}
                  >
                    {action.label}
                  </ir-custom-button>
                ))}
              </div>
            )}
          </ir-date-select>
        </div>

        <span part="divider" class="drf-divider" aria-hidden="true" />

        {/* TO field */}
        <div part="field field-to" class="drf-field">
          <button
            part="text-btn"
            class={`drf-text-btn${!toLabel ? ' drf-text-btn--placeholder' : ''}`}
            onClick={() => this.toDateSelectRef?.openDatePicker()}
            aria-label={toLabel ? `End date: ${toLabel}` : 'Select end date'}
          >
            {toLabel ?? 'To'}
          </button>

          {toLabel && (
            <button part="clear-btn" class="drf-clear-btn" onClick={() => this.clearDate('to')} aria-label="Clear end date">
              <wa-icon name="xmark" />
            </button>
          )}

          <ir-date-select
            ref={el => (this.toDateSelectRef = el)}
            exportparts={this.exportPartsFor('to')}
            date={this.dates.to?.format('YYYY-MM-DD') || null}
            placeholder="To"
            minDate={toMinDate}
            maxDate={this.maxDate}
            class="drf-date-select"
            onDateChanged={evt => this.selectDate(evt.detail.start, 'to')}
          >
            <button slot="trigger" part="cal-trigger" class="drf-cal-trigger" aria-label="Open end date calendar">
              <wa-icon name="calendar" variant="regular" />
            </button>
            {this.showQuickActions && (
              <div part="quick-actions" class="drf-quick-actions" role="group" aria-label="Quick end date options">
                {this.quickDates.map(action => (
                  <ir-custom-button
                    type="button"
                    variant="neutral"
                    appearance="outlined"
                    aria-label={`Set end date to ${action.label}`}
                    disabled={this.dates?.from?.isSameOrAfter(action.getDate(), 'date')}
                    onClickHandler={() => {
                      this.selectDate(action.getDate(), 'to');
                      this.toDateSelectRef.closeDatePicker();
                    }}
                  >
                    {action.label}
                  </ir-custom-button>
                ))}
              </div>
            )}
          </ir-date-select>
        </div>

        {/* Live region for screen readers */}
        <span aria-live="polite" aria-atomic="true" class="sr-only">
          {this.liveMessage}
        </span>
      </div>
    );
  }
}
