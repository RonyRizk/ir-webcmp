import { Component, Prop, State, Event, EventEmitter, h, Watch, Host } from '@stencil/core';
import moment, { Moment } from 'moment';

/** The current from/to selection, as Moments (null = unset side). */
export interface DateRange {
  from: Moment | null;
  to: Moment | null;
}

/**
 * A quick-date preset button definition. `getDate` is evaluated lazily
 * (at render time for the disabled check, and again on click) so presets
 * like "Today" stay correct in long-lived pages.
 */
export interface QuickDatePreset {
  label: string;
  getDate: () => Moment;
}

/** Inner parts of ir-date-select that are re-exported by this component. */
const DATE_SELECT_PARTS = ['base', 'anchor', 'combobox', 'body'] as const;

/** Builds an `exportparts` string that re-exposes ir-date-select parts under a from-/to- prefix. */
const buildExportParts = (side: 'from' | 'to'): string => DATE_SELECT_PARTS.map(part => `${part}:${side}-${part}`).join(', ');

/**
 * `exportparts` strings are constant per side, so build them once at module load.
 * (Module scope, not static class fields: Stencil compiles components to class
 * expressions, where self-referencing static initializers throw at runtime.)
 */
const EXPORT_PARTS = {
  from: buildExportParts('from'),
  to: buildExportParts('to'),
};

/**
 * `ir-date-range-filter` — a from/to date-range field for filter toolbars.
 *
 * Composition: each side renders a text button (shows the value, opens the popup),
 * an optional clear button, and an `ir-date-select` whose popup hosts the calendar
 * plus optional quick-date preset buttons.
 *
 * State model: the component is *optionally controlled*. If `fromDate`/`toDate` are
 * provided they seed and (via watchers) overwrite the internal `dates` state; either
 * side can be controlled independently. Internal selections always update local state
 * and emit `datesChanged` — a controlling parent is expected to echo the value back.
 *
 * Range integrity is enforced two ways:
 * - the from-calendar's max is capped at the to-date and the to-calendar's min is
 *   floored at the from-date (see {@link getFromMaxDate}/{@link getToMinDate}),
 * - quick-date presets that would invert the range are disabled.
 *
 * Styling: all inner pieces are exposed as CSS parts; the parts of each inner
 * `ir-date-select` are re-exported with `from-`/`to-` prefixes (e.g. `from-body`).
 */
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

  /** Size variant passed through to inner form controls. Reflected for CSS hooks (`ir-date-range-filter[size='...']`). */
  @Prop({ reflect: true }) size = 's';

  /** Whether to show the quick-action preset buttons in each calendar popup. */
  @Prop() showQuickActions: boolean = true;

  /** Earliest selectable date in YYYY-MM-DD format. Applied to both calendars. */
  @Prop() minDate?: string;

  /** Latest selectable date in YYYY-MM-DD format. Applied to both calendars. */
  @Prop() maxDate?: string;

  /**
   * Flow after picking a from-date:
   * - `'auto'`: the to-picker opens automatically so the user completes the range in one pass.
   * - `'manual'` (default): nothing opens; the user clicks the to-field themselves.
   */
  @Prop() selectionMode: 'auto' | 'manual' = 'manual';

  /** Shows an ✕ button next to each filled side that clears just that side. */
  @Prop() withClear: boolean = true;

  /**
   * Visible label rendered above the control. It names the group for assistive
   * technology (replacing the default visually-hidden "Date range selector") and,
   * like a native form label, clicking it opens the from-date picker.
   */
  @Prop() label: string;

  /** The selection rendered by the component (see the class doc for the controlled/uncontrolled rules). */
  @State() dates: DateRange = { from: null, to: null };

  /** Text for the polite live region, refreshed on every change so screen readers announce the new range. */
  @State() liveMessage: string = '';

  /** Fired whenever either date changes. Payload contains ISO date strings or null. */
  @Event() datesChanged: EventEmitter<{ from: string | null; to: string | null }>;

  /** Fired when the user explicitly clears a date field (after the accompanying `datesChanged`). */
  @Event() dateCleared: EventEmitter<{ field: 'from' | 'to' }>;

  /** Unique id linking the group wrapper to its visually-hidden label. */
  private groupId = `date-range-${Math.random().toString(36).substring(2, 9)}`;

  private toDateSelectRef: HTMLIrDateSelectElement;
  private fromDateSelectRef: HTMLIrDateSelectElement;

  /**
   * Latched to `true` the first time the corresponding prop is supplied, so a side
   * that was ever controlled keeps following the prop on subsequent syncs.
   */
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

  /**
   * Updates one side of the date range and emits the change. In `'auto'` selection
   * mode, picking a from-date opens the to-picker on the next frame (the popup needs
   * the click that closed the from-picker to finish propagating first).
   */
  private selectDate(date: Moment | null, type: 'from' | 'to') {
    let changes = { ...this.dates, [type]: date };
    if (this.dates.to && type === 'from' && date.isAfter(this.dates.to, 'date')) {
      changes = { ...changes, to: date };
    }
    this.dates = changes;
    this.emitChange();
    if (type === 'from' && date && this.selectionMode === 'auto') {
      requestAnimationFrame(() => {
        this.toDateSelectRef?.show();
      });
    }
  }

  /**
   * Clears one side of the range. State-only on purpose: nulling the date prop
   * cascades down to the calendar as a silent clear, whereas calling the picker's
   * `clear()` method would fire a second `dateChanged` and double-emit `datesChanged`.
   */
  private clearDate(type: 'from' | 'to') {
    this.selectDate(null, type);
    this.dateCleared.emit({ field: type });
  }

  /** Seeds internal state from whichever side is controlled (called once before first render). */
  private syncInitialDates() {
    this.dates = {
      from: this.hasControlledFromDate ? this.parseDate(this.fromDate) : this.dates.from,
      to: this.hasControlledToDate ? this.parseDate(this.toDate) : this.dates.to,
    };
  }

  /**
   * Applies a controlled-prop change to internal state: the changed side takes the
   * new value; the other side re-reads its prop only if it is controlled too.
   */
  private syncControlledDates(changedField: 'from' | 'to', changedValue?: string | null) {
    this.dates = {
      from: changedField === 'from' ? this.parseDate(changedValue) : this.hasControlledFromDate ? this.parseDate(this.fromDate) : this.dates.from,
      to: changedField === 'to' ? this.parseDate(changedValue) : this.hasControlledToDate ? this.parseDate(this.toDate) : this.dates.to,
    };
  }

  /** Strict `YYYY-MM-DD` parser; anything else (including partial ISO strings) yields null. */
  private parseDate(value?: string | null): Moment | null {
    if (!value) {
      return null;
    }

    const parsed = moment(value, 'YYYY-MM-DD', true);
    return parsed.isValid() ? parsed : null;
  }

  /** Emits `datesChanged` and refreshes the screen-reader live region. */
  private emitChange() {
    const from = this.dates.from?.format('YYYY-MM-DD') ?? null;
    const to = this.dates.to?.format('YYYY-MM-DD') ?? null;
    this.datesChanged.emit({ from, to });
    const fromText = this.dates.from?.format('MMMM D, YYYY') ?? 'not set';
    const toText = this.dates.to?.format('MMMM D, YYYY') ?? 'not set';
    this.liveMessage = `Date range updated. From ${fromText} to ${toText}.`;
  }

  /**
   * Floors the to-picker's min date at the from-date (or the global minDate),
   * whichever is later. String comparison is safe for YYYY-MM-DD.
   */
  private getToMinDate(fromStr: string | null): string | undefined {
    if (!fromStr) return this.minDate;
    if (!this.minDate) return fromStr;
    return fromStr > this.minDate ? fromStr : this.minDate;
  }

  render() {
    const fromLabel = this.dates.from?.format('YYYY-MM-DD') ?? null;
    const toLabel = this.dates.to?.format('YYYY-MM-DD') ?? null;
    // const fromMaxDate = this.getFromMaxDate(toLabel);
    const toMinDate = this.getToMinDate(fromLabel);

    return (
      <Host>
        {/* Native for/id association: clicking the label forwards the click to the
            from button, which opens the from-date picker — no JS handler needed. */}
        {this.label && (
          <label id={`${this.groupId}-label`} class="drf-label" part="label" htmlFor={`${this.groupId}-from-btn`}>
            {this.label}
          </label>
        )}
        <div part="container" class="drf-container" role="group" aria-labelledby={`${this.groupId}-label`}>
          {/* Fallback group name when no visible label is provided */}
          {!this.label && (
            <span id={`${this.groupId}-label`} class="sr-only">
              Date range selector
            </span>
          )}

          {/* FROM field */}
          <div part="field field-from" class="drf-field">
            <button
              id={`${this.groupId}-from-btn`}
              type="button"
              part="text-btn"
              class={`drf-text-btn${!fromLabel ? ' drf-text-btn--placeholder' : ''}`}
              onClick={() => this.fromDateSelectRef?.show()}
              aria-haspopup="dialog"
              aria-label={fromLabel ? `Start date: ${fromLabel}` : 'Select start date'}
            >
              {fromLabel ?? 'From'}
            </button>

            {fromLabel && this.withClear && (
              <button type="button" part="clear-btn" class="drf-clear-btn" onClick={() => this.clearDate('from')} aria-label="Clear start date">
                <wa-icon name="xmark" />
              </button>
            )}

            <ir-date-select
              ref={el => (this.fromDateSelectRef = el)}
              exportparts={EXPORT_PARTS.from}
              date={this.dates.from?.format('YYYY-MM-DD') || null}
              placeholder="From"
              minDate={this.minDate}
              maxDate={this.maxDate}
              emitEmptyDate
              class="drf-date-select"
              onDateChanged={evt => this.selectDate(evt.detail.start, 'from')}
            >
              <button slot="trigger" type="button" part="cal-trigger" class="drf-cal-trigger" aria-label="Open start date calendar">
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
                        this.fromDateSelectRef?.hide();
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
              type="button"
              part="text-btn"
              class={`drf-text-btn${!toLabel ? ' drf-text-btn--placeholder' : ''}`}
              onClick={() => this.toDateSelectRef?.show()}
              aria-haspopup="dialog"
              aria-label={toLabel ? `End date: ${toLabel}` : 'Select end date'}
            >
              {toLabel ?? 'To'}
            </button>

            {toLabel && this.withClear && (
              <button type="button" part="clear-btn" class="drf-clear-btn" onClick={() => this.clearDate('to')} aria-label="Clear end date">
                <wa-icon name="xmark" />
              </button>
            )}

            <ir-date-select
              ref={el => (this.toDateSelectRef = el)}
              exportparts={EXPORT_PARTS.to}
              date={this.dates.to?.format('YYYY-MM-DD') || null}
              placeholder="To"
              minDate={toMinDate}
              maxDate={this.maxDate}
              emitEmptyDate
              class="drf-date-select"
              onDateChanged={evt => this.selectDate(evt.detail.start, 'to')}
            >
              <button slot="trigger" type="button" part="cal-trigger" class="drf-cal-trigger" aria-label="Open end date calendar">
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
                        this.toDateSelectRef?.hide();
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
      </Host>
    );
  }
}
