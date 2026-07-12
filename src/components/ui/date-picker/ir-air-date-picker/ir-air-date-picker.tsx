import { Component, Element, Event, EventEmitter, Method, Prop, Watch } from '@stencil/core';
import AirDatepicker, { AirDatepickerLocale } from 'air-datepicker';
import moment, { Moment } from 'moment';
import { LanguageObserver } from '@/utils/language-observer';

type SupportedLocale = 'en' | 'ar' | 'fr';

/** Loaders are dynamic `import()`s so a page only ever downloads the locale packs it actually uses. */
const localeLoaders: Record<SupportedLocale, () => Promise<{ default: AirDatepickerLocale }>> = {
  en: () => import('air-datepicker/locale/en'),
  ar: () => import('air-datepicker/locale/ar'),
  fr: () => import('air-datepicker/locale/fr'),
};

/** Module-level cache: shared across every `ir-air-date-picker` instance, loaded at most once per locale. */
const localeCache = new Map<SupportedLocale, AirDatepickerLocale>();

async function loadLocale(lang: SupportedLocale): Promise<AirDatepickerLocale> {
  const cached = localeCache.get(lang);
  if (cached) return cached;
  const { default: locale } = await localeLoaders[lang]();
  localeCache.set(lang, locale);
  return locale;
}

/**
 * `ir-air-date-picker` — a headless Stencil wrapper around the `air-datepicker` library.
 *
 * The component renders nothing itself (`render()` returns `null`); on `componentDidLoad`
 * it instantiates an inline `AirDatepicker` calendar directly into the host element and
 * keeps it in sync with the `date` / `dates` / `minDate` / `maxDate` props via watchers.
 *
 * Design notes:
 * - All prop-driven picker mutations use `{ silent: true }` so they never re-trigger
 *   `onSelect` → `dateChanged`, preventing parent ↔ child feedback loops.
 * - All date inputs (`string | Moment`) are normalized through {@link toMoment} before
 *   touching the picker, and value-compared (`isSameDates`) so re-renders of the parent
 *   with equal values are no-ops.
 * - The primary consumer is `ir-date-select`, which hosts this component inside its popup
 *   and forwards its own props one-to-one.
 */
@Component({
  tag: 'ir-air-date-picker',
  styleUrl: 'ir-air-date-picker.css',
  shadow: false,
})
export class IrAirDatePicker {
  /** Host element; AirDatepicker mounts its calendar DOM inside it (`inline: true`). */
  @Element() el: HTMLElement;

  /** Not wired to the picker. Accepted only for API parity with `ir-date-select`, which forwards all of its props. */
  @Prop() withClear: boolean;

  /** Not wired to the picker (this component renders no input). Forwarded by `ir-date-select` for API parity. */
  @Prop() placeholder: string;

  /** Not wired to the picker (this component renders no input). Forwarded by `ir-date-select` for API parity. */
  @Prop() label: string;

  /**
   * Pre-selected dates for multi-select/range mode. Takes precedence over `date`
   * at initialization, and is re-applied through the `dates` watcher on change.
   */
  @Prop() dates: (string | Moment)[];

  /**
   * Not wired to the picker: the calendar is always created with `inline: true`
   * (visibility is controlled by the parent `ir-date-select` popup).
   */
  @Prop() inline: boolean = false;

  /**
   * The selected date (single-select mode). Mutable: the component writes the latest
   * selection back into it from `onSelect`, and the parent can set it to move the
   * calendar selection programmatically (applied silently, no `dateChanged` emitted).
   */
  @Prop({ mutable: true, reflect: true }) date: string | Moment | null = null;

  /** `true` for unlimited multi-select, or a number for a fixed max. Passed to AirDatepicker at init only. */
  @Prop() multipleDates: boolean | number = false;

  /** Enables range selection (start + end). Passed to AirDatepicker at init only. */
  @Prop() range: boolean = false;

  /** Display format for the picker (AirDatepicker format tokens, not moment tokens). Passed at init only. */
  @Prop() dateFormat: string = 'yyyy-MM-dd';

  /** Enables the timepicker. Also switches `isSameDates` comparisons from day precision to minute precision. */
  @Prop() timepicker: boolean = false;

  /** Earliest selectable date. Reactive: changes call `datePicker.update()` while preserving the current selection. */
  @Prop() minDate?: string | Moment;

  /** Latest selectable date. Reactive: changes call `datePicker.update()` while preserving the current selection. */
  @Prop() maxDate?: string | Moment;

  /** Not wired to the picker. Forwarded by `ir-date-select` (which handles disabling interaction itself). */
  @Prop() disabled: boolean = false;

  /** Passed to AirDatepicker at init only. Has no visual effect on an inline calendar; the parent popup handles closing. */
  @Prop() autoClose: boolean = true;

  /** Shows days from the previous/next month in the current view. Passed at init only. */
  @Prop() showOtherMonths: boolean = true;

  /** Allows selecting the previous/next-month days shown in the current view. Passed at init only. */
  @Prop() selectOtherMonths: boolean = true;

  /** Not wired to the picker. Forwarded by `ir-date-select` (trigger rendering is the parent's concern). */
  @Prop() customPicker: boolean = false;

  /** Optional element AirDatepicker appends its calendar to (for positioning/styling). Defaults to the host. */
  @Prop() container?: HTMLElement;

  /**
   * If `true`, a `date` prop change destroys and rebuilds the AirDatepicker instance
   * instead of calling `selectDate`. Use only when the picker must fully re-initialize;
   * rebuilding on every change is expensive.
   */
  @Prop() forceDestroyOnUpdate: boolean = false;

  /**
   * If `true`, emits `dateChanged` with null values when the selection is cleared.
   * Otherwise clear-events are swallowed.
   */
  @Prop() emitEmptyDate: boolean = false;

  /** Not wired to the picker. Forwarded by `ir-date-select` for API parity. */
  @Prop() triggerContainerStyle: string = '';

  /**
   * Emitted when the user picks a date in the calendar (never for silent, prop-driven updates).
   * `start`/`end` are equal in single-select mode; `dates` holds every selected date as `YYYY-MM-DD`.
   */
  @Event() dateChanged: EventEmitter<{
    start: Moment | null;
    end: Moment | null;
    dates: string | string[];
  }>;

  /** Emitted when the AirDatepicker reports `onShow`. */
  @Event() datePickerFocus: EventEmitter<void>;

  /** Emitted when the AirDatepicker reports `onHide`. */
  @Event() datePickerBlur: EventEmitter<void>;

  /**
   * The current selection, normalized to a Moment. Used as the comparison baseline so
   * prop updates that match the existing selection don't touch the picker.
   * Deliberately a plain field, not `@State`: this component renders `null`, so
   * state-driven re-renders would be pure overhead.
   */
  private currentDate: Moment | null = null;

  /** The AirDatepicker instance. `undefined` until `componentDidLoad` and after disconnect. */
  private datePicker?: AirDatepicker<HTMLElement>;

  /** Language currently applied to the picker, tracked so `handleLangChange` can detect real changes. */
  private currentLang: SupportedLocale = this.normalizeLang(LanguageObserver.getLang());

  /** Unsubscribes this instance from `LanguageObserver`. */
  private unsubscribeLang?: () => void;

  componentWillLoad() {
    if (this.date) {
      this.currentDate = this.toMoment(this.date);
    }
  }

  componentDidLoad() {
    this.initializeDatepicker();
    this.unsubscribeLang = LanguageObserver.subscribe(lang => this.handleLangChange(lang));
  }

  disconnectedCallback() {
    this.unsubscribeLang?.();
    this.unsubscribeLang = undefined;
    this.datePicker?.destroy?.();
    this.datePicker = undefined;
  }

  /** Applies external `date` changes to the calendar, skipping same-day (or same-minute) no-ops. */
  @Watch('date')
  datePropChanged(newDate: string | Moment | null, oldDate: string | Moment | null) {
    if (this.isSameDates(newDate, oldDate)) return;
    this.updatePickerDate(newDate);
  }

  @Watch('minDate')
  minDatePropChanged(newVal: string | Moment, oldVal: string | Moment) {
    if (!this.datePicker || this.isSameDates(newVal, oldVal)) return;
    // update() re-applies opts.selectedDates (the initial selection), so pass the current one to keep it
    this.datePicker.update({ minDate: this.toMoment(newVal)?.format('YYYY-MM-DD'), selectedDates: [...this.datePicker.selectedDates] }, { silent: true });
  }

  @Watch('maxDate')
  maxDatePropChanged(newVal: string | Moment, oldVal: string | Moment) {
    if (!this.datePicker || this.isSameDates(newVal, oldVal)) return;
    this.datePicker.update({ maxDate: this.toMoment(newVal)?.format('YYYY-MM-DD'), selectedDates: [...this.datePicker.selectedDates] }, { silent: true });
  }

  /** Applies external `dates` (multi/range) changes, skipping value-equal lists. */
  @Watch('dates')
  datesPropChanged(newDates: (string | Moment)[] = [], oldDates: (string | Moment)[] = []) {
    if (this.areDateListsEqual(newDates, oldDates)) return;
    this.updatePickerDates(newDates);
  }

  /** Clears the calendar selection. Not silent: fires `onSelect` with an empty value (see `emitEmptyDate`). */
  @Method()
  async clearDatePicker() {
    this.datePicker?.clear();
  }

  /**
   * Force-resyncs the calendar to the given (or current) value, bypassing the equality
   * checks the watchers perform. Escape hatch for parents whose prop value didn't change
   * but whose picker drifted (e.g. after a silent internal clear). Always silent.
   */
  @Method()
  async syncSelection(options?: { date?: string | Moment | null; dates?: (string | Moment)[] | null }) {
    if (Array.isArray(options?.dates) || this.range) {
      const list = Array.isArray(options?.dates) ? options.dates : this.dates;
      this.forceSyncPickerDates(list ?? []);
      return;
    }
    const nextDate = options?.date !== undefined ? options.date : this.date;
    this.forceSyncPickerDate(nextDate ?? null);
  }

  // ── Moment helpers ────────────────────────────────────────────────────────

  /**
   * Normalizes any accepted date input to a valid Moment, or `null`.
   * Parse order: strict `YYYY-MM-DD` → strict ISO-8601 → loose fallback,
   * so canonical app dates never hit moment's slow/ambiguous loose parser.
   */
  private toMoment(value: string | Moment | null | undefined): Moment | null {
    if (!value) return null;
    if (moment.isMoment(value)) return value.isValid() ? value : null;
    const strict = moment(value as string, 'YYYY-MM-DD', true);
    if (strict.isValid()) return strict;
    const iso = moment(value as string, moment.ISO_8601, true);
    if (iso.isValid()) return iso;
    const loose = moment(value as string);
    return loose.isValid() ? loose : null;
  }

  /** Normalizes a list of date inputs, dropping unparseable entries. */
  private toMoments(values?: (string | Moment)[] | null): Moment[] {
    if (!Array.isArray(values) || values.length === 0) return [];
    return values.map(v => this.toMoment(v)).filter((m): m is Moment => m !== null);
  }

  /**
   * Value-equality for two date inputs at day precision (minute precision when
   * `timepicker` is on). Unparseable values are never equal to anything.
   */
  private isSameDates(d1: string | Moment | null, d2: string | Moment | null): boolean {
    if (!d1 && !d2) return true;
    if (!d1 || !d2) return false;
    const m1 = this.toMoment(d1);
    const m2 = this.toMoment(d2);
    if (!m1 || !m2) return false;
    return m1.isSame(m2, this.timepicker ? 'minute' : 'date');
  }

  /** Order-sensitive value-equality for two date lists (empty and missing lists are equal). */
  private areDateListsEqual(first?: (string | Moment)[] | null, second?: (string | Moment)[] | null): boolean {
    if (!first?.length && !second?.length) return true;
    if (!first || !second || first.length !== second.length) return false;
    return first.every((v, i) => this.isSameDates(v, second[i]));
  }

  // ── Picker state management ───────────────────────────────────────────────

  /**
   * Pushes a single-date value into the calendar without emitting `dateChanged`.
   * Clears on `null`/unparseable input; otherwise selects the day (or rebuilds the
   * whole instance when `forceDestroyOnUpdate` is set).
   */
  private updatePickerDate(newDate: string | Moment | null) {
    const m = this.toMoment(newDate);
    if (!m) {
      this.datePicker?.clear({ silent: true });
      this.currentDate = null;
      return;
    }
    if (!this.isSameDates(this.currentDate, m)) {
      this.currentDate = m;
      if (this.forceDestroyOnUpdate) {
        this.datePicker?.destroy();
        this.datePicker = undefined;
        this.initializeDatepicker();
      } else {
        this.datePicker?.selectDate(m.format('YYYY-MM-DD'), { silent: true });
      }
    }
  }

  /** Replaces the calendar's multi/range selection without emitting `dateChanged`. */
  private updatePickerDates(nextDates: (string | Moment)[] = []) {
    if (!this.datePicker) return;
    const moments = this.toMoments(nextDates);
    this.datePicker.clear({ silent: true });
    if (moments.length > 0) {
      this.datePicker.selectDate(
        moments.map(m => m.format('YYYY-MM-DD')),
        { silent: true },
      );
      this.currentDate = moments[0];
      return;
    }
    this.currentDate = null;
    this.date = null;
  }

  /**
   * Unconditional single-date resync used by `syncSelection`: clears, re-selects, and
   * writes back `currentDate`/`date`. Before the picker exists it just stores the value
   * so `initializeDatepicker` picks it up.
   */
  private forceSyncPickerDate(nextDate: string | Moment | null) {
    const m = this.toMoment(nextDate);
    if (!this.datePicker) {
      this.currentDate = m;
      this.date = m;
      return;
    }
    this.datePicker.clear({ silent: true });
    if (!m) {
      this.currentDate = null;
      this.date = null;
      return;
    }
    this.datePicker.selectDate(m.format('YYYY-MM-DD'), { silent: true });
    this.currentDate = m;
    this.date = m;
  }

  /** Unconditional multi/range resync used by `syncSelection`. Mirrors `forceSyncPickerDate`. */
  private forceSyncPickerDates(nextDates: (string | Moment)[] = []) {
    const moments = this.toMoments(nextDates);
    if (!this.datePicker) {
      this.currentDate = moments[0] ?? null;
      this.date = moments[0] ?? null;
      return;
    }
    this.datePicker.clear({ silent: true });
    if (moments.length > 0) {
      this.datePicker.selectDate(
        moments.map(m => m.format('YYYY-MM-DD')),
        { silent: true },
      );
    }
    this.currentDate = moments[0] ?? null;
    this.date = moments[0] ?? null;
  }

  /**
   * AirDatepicker `onSelect` handler — the only path that emits `dateChanged`.
   * Writes the selection back into `currentDate`/`date` so the watchers treat the
   * parent's echoed prop update as a no-op.
   */
  private handleDateSelect(date: Date | Date[]) {
    const dates = (Array.isArray(date) ? date : date ? [date] : []).filter(Boolean);
    if (!dates.length) {
      if (this.emitEmptyDate) {
        this.dateChanged.emit({ start: null, end: null, dates: [] });
      }
      this.currentDate = null;
      this.date = null;
      return;
    }
    const startMoment = moment(dates[0]);
    const endMoment = this.range && dates.length > 1 ? moment(dates[1]) : startMoment;
    this.currentDate = startMoment;
    this.date = startMoment;
    this.dateChanged.emit({
      start: startMoment,
      end: endMoment,
      dates: dates.map(d => moment(d).format('YYYY-MM-DD')),
    });
  }
  /** Normalizes an `<html lang>` value to one of the packs we ship; unrecognized/missing values fall back to `en`. */
  private normalizeLang(lang: string | null | undefined): SupportedLocale {
    const value = (lang ?? 'en').toLowerCase();
    return value === 'ar' || value === 'fr' ? value : 'en';
  }

  /** `LanguageObserver` callback: live-swaps the calendar's locale, preserving the current selection. */
  private async handleLangChange(lang: string) {
    const nextLang = this.normalizeLang(lang);
    if (nextLang === this.currentLang || !this.datePicker) return;
    this.currentLang = nextLang;
    const locale = await loadLocale(nextLang);
    if (!this.datePicker) return;
    this.datePicker.update({ locale, selectedDates: [...this.datePicker.selectedDates] }, { silent: true });
  }

  /**
   * Creates the inline AirDatepicker on the host element (idempotent), seeding the
   * selection from `dates` (preferred) or `currentDate`, then applies the Web Awesome
   * theme via CSS custom properties on the generated calendar element.
   */
  private async initializeDatepicker() {
    if (this.datePicker) return;

    const preselectedMoments = this.toMoments(this.dates);
    const selectedDates = preselectedMoments.length > 0 ? preselectedMoments.map(m => m.format('YYYY-MM-DD')) : this.currentDate ? [this.currentDate.format('YYYY-MM-DD')] : [];

    const locale = await loadLocale(this.currentLang);
    if (this.datePicker) return;

    this.datePicker = new AirDatepicker(this.el, {
      container: this.container,
      inline: true,
      selectedDates,
      multipleDates: this.multipleDates,
      range: this.range,
      dateFormat: this.dateFormat,
      timepicker: this.timepicker,
      minDate: this.toMoment(this.minDate)?.format('YYYY-MM-DD'),
      maxDate: this.toMoment(this.maxDate)?.format('YYYY-MM-DD'),
      autoClose: this.autoClose,
      locale,
      showOtherMonths: this.showOtherMonths,
      selectOtherMonths: this.selectOtherMonths,
      onHide: () => this.datePickerBlur.emit(),
      onShow: () => this.datePickerFocus.emit(),
      onSelect: ({ date }) => this.handleDateSelect(date),
    });

    const datepickerEl = this.datePicker.$datepicker;
    if (!datepickerEl) return;

    datepickerEl.classList.add('ir-custom-date-picker__calendar');
    datepickerEl.classList.add('custom-date-picker__calendar');
    datepickerEl.style.borderWidth = '0px';
    datepickerEl.style.setProperty('--adp-cell-background-color-selected', 'var(--wa-color-brand-fill-loud)');
    datepickerEl.style.setProperty('--adp-cell-background-color-selected-hover', 'var(--wa-color-brand-fill-loud)');
    datepickerEl.style.setProperty('--adp-background-color-selected-other-month', 'var(--wa-color-brand-fill-normal)');
    datepickerEl.style.setProperty('--adp-background-color-selected-other-month-focused', 'var(--wa-color-brand-fill-loud)');
    datepickerEl.style.setProperty('--adp-accent-color', 'var(--wa-color-brand-fill-loud)');
    datepickerEl.style.setProperty('--adp-background-color', 'var(--wa-color-surface-default,white)');
    datepickerEl.style.setProperty('--adp-day-name-color', 'lab(48.496% 0 0)');
    datepickerEl.style.setProperty('--adp-padding', '0px 0px 0.5rem 0px', 'important');
    datepickerEl.style.setProperty('--adp-border-color-inner', 'transparent', 'important');
    datepickerEl.style.setProperty('--adp-color-other-month-hover', 'var(--wa-color-text-normal)', 'important');
  }

  /** Headless: the calendar DOM is injected by AirDatepicker, not Stencil. */
  render() {
    return null;
  }
}
