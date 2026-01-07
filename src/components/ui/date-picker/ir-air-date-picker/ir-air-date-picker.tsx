import { Component, Element, Event, EventEmitter, Method, Prop, State, Watch } from '@stencil/core';
import AirDatepicker from 'air-datepicker';
import moment from 'moment';
import localeEn from 'air-datepicker/locale/en';

@Component({
  tag: 'ir-air-date-picker',
  styleUrl: 'ir-air-date-picker.css',
  shadow: false,
})
export class IrAirDatePicker {
  @Element() el: HTMLElement;

  @Prop() withClear: boolean;

  @Prop() placeholder: string;

  @Prop() label: string;

  @Prop() dates: string[];

  /**
   * Determines whether the date picker is rendered inline or in a pop-up.
   * If `true`, the picker is always visible inline.
   */
  @Prop() inline: boolean = false;

  /**
   * The initially selected date; can be a `Date` object or a string recognized by `AirDatepicker`.
   */
  @Prop({ mutable: true, reflect: true }) date: string | Date | null = null;

  /**
   * Enables multiple dates.
   * If `true`, multiple selection is allowed.
   * If you pass a number (e.g. 3), that is the maximum number of selectable dates.
   */
  @Prop() multipleDates: boolean | number = false;

  /**
   * Whether the picker should allow range selection (start and end date).
   */
  @Prop() range: boolean = false;

  /**
   * Format for the date as it appears in the input field.
   * Follows the `AirDatepicker` format rules.
   */
  @Prop() dateFormat: string = 'yyyy-MM-dd';

  /**
   * Enables the timepicker functionality (select hours and minutes).
   */
  @Prop() timepicker: boolean = false;

  /**
   * The earliest date that can be selected.
   */
  @Prop() minDate?: string | Date;

  /**
   * The latest date that can be selected.
   */
  @Prop() maxDate?: string | Date;

  /**
   * Disables the input and prevents interaction.
   */
  @Prop() disabled: boolean = false;

  /**
   * Closes the picker automatically after a date is selected.
   */
  @Prop() autoClose: boolean = true;

  /**
   * Shows days from previous/next month in the current month's calendar.
   */
  @Prop() showOtherMonths: boolean = true;

  /**
   * Allows selecting days from previous/next month shown in the current view.
   */
  @Prop() selectOtherMonths: boolean = true;

  /**
   * Controls how the date picker is triggered.
   * - **`true`**: The picker can be triggered by custom UI elements (provided via a `<slot name="trigger">`).
   * - **`false`**: A default button input is used to open the picker.
   *
   * Defaults to `false`.
   */
  @Prop() customPicker: boolean = false;

  /**
   * Pass a container element if you need the date picker to be appended to a specific element
   * for styling or positioning (particularly for arrow rendering).
   * If not provided, it defaults to `this.el`.
   */
  @Prop() container?: HTMLElement;

  /**
   * If `true`, the date picker instance is destroyed and rebuilt each time the `date` prop changes.
   * This can be useful if you need the picker to fully re-initialize in response to dynamic changes,
   * but note that it may affect performance if triggered frequently.
   * Defaults to `false`.
   */
  @Prop() forceDestroyOnUpdate: boolean = false;

  /**
   * If `true`, the component will emit a `dateChanged` event when the selected date becomes empty (null).
   * Otherwise, empty-date changes will be ignored (no event emitted).
   *
   * Defaults to `false`.
   */
  @Prop() emitEmptyDate: boolean = false;

  /**
   * Styles for the trigger container
   */
  @Prop() triggerContainerStyle: string = '';

  @State() currentDate: Date | null = null;

  /**
   * Emitted when the selected date changes.
   * Returns the selected date as Moment objects.
   */
  @Event() dateChanged: EventEmitter<{
    start: moment.Moment | null;
    end: moment.Moment | null;
    dates: Date | Date[];
  }>;

  /**
   * Emitted when the date picker gains focus or is opened.
   */
  @Event() datePickerFocus: EventEmitter<void>;

  /**
   * Emitted when the date picker loses focus or is closed.
   */
  @Event() datePickerBlur: EventEmitter<void>;

  private datePicker!: AirDatepicker<HTMLElement>;
  private openDatePickerTimeout?: ReturnType<typeof setTimeout>;

  componentWillLoad() {
    // Sync initial @Prop to internal state
    if (this.date) {
      this.currentDate = this.toValidDate(this.date);
    }
  }
  componentDidLoad() {
    this.initializeDatepicker();
  }

  @Watch('date')
  datePropChanged(newDate: string | Date | null, oldDate: string | Date | null) {
    if (this.isSameDates(newDate, oldDate)) {
      return;
    }
    this.updatePickerDate(newDate);
  }

  @Watch('minDate')
  minDatePropChanged(newVal: string | Date, oldVal: string | Date) {
    if (!this.datePicker) {
      return;
    }
    if (!this.isSameDates(newVal, oldVal)) {
      this.datePicker?.update({ minDate: this.toValidDate(newVal) });
    }
  }

  @Watch('maxDate')
  maxDatePropChanged(newVal: string | Date, oldVal: string | Date) {
    if (!this.isSameDates(newVal, oldVal)) {
      this.datePicker?.update({ maxDate: this.toValidDate(newVal) });
    }
  }

  @Method()
  async clearDatePicker() {
    this.datePicker?.clear();
  }

  private isSameDates(d1: string | Date | null, d2: string | Date | null): boolean {
    if (!d1 && !d2) return true;
    if (!d1 || !d2) return false;
    return moment(d1).isSame(moment(d2), 'day');
  }

  private toValidDate(value: string | Date | null): Date | null {
    if (!value) return null;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }

  private updatePickerDate(newDate: string | Date | null) {
    const valid = this.toValidDate(newDate);

    if (!valid) {
      // If invalid or null, just clear
      this.datePicker?.clear();
      this.currentDate = null;
      return;
    }

    // If it's a truly new date, select it
    if (!this.isSameDates(this.currentDate, valid)) {
      this.currentDate = valid;
      if (this.forceDestroyOnUpdate) {
        this.datePicker.destroy();
        this.datePicker = null;
        this.initializeDatepicker();
      } else {
        this.datePicker?.selectDate(valid);
      }
    }
  }

  private initializeDatepicker() {
    if (this.datePicker) return;

    this.datePicker = new AirDatepicker(this.el, {
      container: this.container,
      inline: true,
      selectedDates: this.dates ? this.dates : this.currentDate ? [this.currentDate] : [],
      multipleDates: this.multipleDates,
      range: this.range,
      dateFormat: this.dateFormat,
      timepicker: this.timepicker,
      minDate: this.toValidDate(this.minDate) ?? undefined,
      maxDate: this.toValidDate(this.maxDate) ?? undefined,
      autoClose: this.autoClose,
      locale: localeEn,
      showOtherMonths: this.showOtherMonths,
      selectOtherMonths: this.selectOtherMonths,

      onHide: () => {
        this.datePickerBlur.emit();
      },
      onShow: () => {
        this.datePickerFocus.emit();
      },
      onSelect: ({ date }) => this.handleDateSelect(date),
    });
    // this.datePicker.$datepicker.style.height = '280px';
    this.datePicker.$datepicker?.classList.add('ir-custom-date-picker__calendar');
    this.datePicker.$datepicker.style.borderWidth = '0px';
    this.datePicker.$datepicker.style.setProperty('--adp-cell-background-color-selected', 'var(--wa-color-brand-fill-loud)');
    this.datePicker.$datepicker.style.setProperty('--adp-cell-background-color-selected-hover', 'var(--wa-color-brand-fill-loud)');
    this.datePicker.$datepicker.style.setProperty('--adp-background-color-selected-other-month', 'var(--wa-color-brand-fill-normal)');
    this.datePicker.$datepicker.style.setProperty('--adp-background-color-selected-other-month-focused', 'var(--wa-color-brand-fill-loud)');
    this.datePicker.$datepicker.style.setProperty('--adp-accent-color', 'var(--wa-color-brand-fill-loud)');
    this.datePicker.$datepicker.style.setProperty('--adp-day-name-color', 'lab(48.496% 0 0)');
    this.datePicker.$datepicker.style.setProperty('--adp-padding', '4px !important');
  }
  private handleDateSelect(selected: Date | Date[]) {
    const dates = Array.isArray(selected) ? selected.filter(Boolean) : selected ? [selected] : [];

    if (!dates.length || !(dates[0] instanceof Date)) {
      if (this.emitEmptyDate) {
        this.dateChanged.emit({
          start: null,
          end: null,
          dates: selected,
        });
      }
      this.currentDate = null;
      this.date = null;
      return;
    }

    const startDate = dates[0];
    const endDate = this.range && dates.length > 1 ? dates[1] : startDate;

    this.currentDate = startDate;
    this.date = startDate;
    this.dateChanged.emit({
      start: startDate ? moment(startDate) : null,
      end: endDate ? moment(endDate) : null,
      dates: selected,
    });
  }
  disconnectedCallback() {
    if (this.openDatePickerTimeout) {
      clearTimeout(this.openDatePickerTimeout);
    }
    this.datePicker?.destroy?.();
  }

  render() {
    return null;
  }
}
