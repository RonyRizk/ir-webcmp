import { ClickOutside } from '@/decorators/ClickOutside';
import { createSlotManager } from '@/utils/slot';
import { Component, Element, Event, EventEmitter, Host, Method, Prop, State, Watch, h } from '@stencil/core';
import moment, { Moment } from 'moment';

@Component({
  tag: 'ir-date-select',
  styleUrl: 'ir-date-select.css',
  shadow: true,
})
export class IrDateSelect {
  @Element() el: HTMLIrDateSelectElement;
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

  @State() isActive: boolean = false;
  @State() currentDate: Moment;
  @State() private slotManagerHasSlot = 0;
  @State() isValid: string;

  @Event() datePickerFocus: EventEmitter<void>;
  @Event() datePickerBlur: EventEmitter<void>;
  @Event() dateChanged: EventEmitter<{
    start: moment.Moment | null;
    end: moment.Moment | null;
  }>;

  private static instanceCounter = 0;
  private popupId: string;
  private readonly SLOT_NAMES = ['label', 'start', 'end', 'clear-icon', 'hide-password-icon', 'show-password-icon', 'hint'] as const;
  // Create slot manager with state change callback
  private slotManager = createSlotManager(
    null as any, // Will be set in componentWillLoad
    this.SLOT_NAMES,
    () => {
      // Trigger re-render when slot state changes
      this.slotManagerHasSlot++;
    },
  );
  airDatePickerRef: HTMLIrAirDatePickerElement;

  componentWillLoad() {
    IrDateSelect.instanceCounter += 1;
    this.popupId = `ir-date-select-popup-${IrDateSelect.instanceCounter}`;
    this.slotManager = createSlotManager(this.el, this.SLOT_NAMES, () => {
      this.slotManagerHasSlot++;
    });
    this.slotManager.initialize();
    if (this.el.hasAttribute('aria-invalid')) {
      this.isValid = this.el.getAttribute('aria-invalid');
    }
  }

  componentDidLoad() {
    this.slotManager.setupListeners();
  }

  disconnectedCallback() {
    this.slotManager.destroy();
  }

  @Watch('aria-invalid')
  handleAriaInvalidChange(newVal: string, oldVal: string) {
    if (newVal !== oldVal) this.isValid = newVal;
  }

  @Method()
  async clearDatePicker() {
    this.airDatePickerRef?.clearDatePicker();
  }

  @Method()
  async openDatePicker() {
    this.isActive = true;
  }

  @ClickOutside()
  @Method()
  async closeDatePicker() {
    this.isActive = false;
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

  private get _label(): string {
    if (this.range) {
      return this.dates.map(d => moment(d).format('MMM DD, YYYY')).join(' → ');
    }
    if (!this.currentDate) {
      return null;
    }
    return this.timepicker ? moment(this.currentDate).format('MMM DD, YYYY, HH:mm') : moment(this.currentDate).format('MMM DD, YYYY');
  }

  render() {
    return (
      <Host
        class={{
          'ir-date-select': true,
          'ir-date-select--active': this.isActive,
          'ir-date-select--inline': this.inline,
          'ir-date-select--disabled': this.disabled,
        }}
      >
        <wa-popup arrow part="base" placement="bottom" flip shift auto-size="vertical" auto-size-padding={10} active={this.isActive} class="ir-date-select__popup">
          {/* Trigger */}
          <div slot="anchor" part="anchor" class="ir-date-select__trigger">
            <div
              part="combobox"
              class="ir-date-select__control"
              role="combobox"
              tabindex={this.disabled ? -1 : 0}
              aria-haspopup="dialog"
              aria-expanded={this.isActive ? 'true' : 'false'}
              aria-controls={this.popupId}
              aria-disabled={this.disabled ? 'true' : 'false'}
              aria-label="Select date"
              onClick={!this.disabled ? this.togglePicker.bind(this) : undefined}
              onKeyDown={!this.disabled ? this.handleKeyDown.bind(this) : undefined}
            >
              <slot name="trigger">
                <ir-input
                  disabled={this.disabled}
                  class="ir-date-select__input"
                  placeholder={this.placeholder}
                  withClear={this.withClear}
                  tabIndex={!this.customPicker && !this.disabled ? 0 : undefined}
                  aria-expanded={!this.customPicker ? String(this.isActive) : undefined}
                  aria-disabled={this.disabled ? 'true' : undefined}
                  aria-invalid={this.isValid}
                  readonly
                  defaultValue={this._label}
                  label={this.label}
                  value={this._label}
                >
                  {this.slotManager.hasSlot('label') && <slot name="label" slot="label"></slot>}
                  {this.slotManager.hasSlot('start') && <slot name="start" slot="start"></slot>}
                  {this.slotManager.hasSlot('end') && <slot name="end" slot="end"></slot>}
                  {this.slotManager.hasSlot('clear-icon') && <slot name="clear-icon" slot="clear-icon"></slot>}
                  {this.slotManager.hasSlot('hint') && <slot name="hint" slot="hint"></slot>}
                </ir-input>
              </slot>
            </div>
          </div>

          {/* Popup */}
          <div part="body" id={this.popupId} class="ir-date-select__calendar" role="dialog" aria-modal="false" aria-label="Date selection dialog">
            <ir-air-date-picker
              ref={el => (this.airDatePickerRef = el)}
              withClear={this.withClear}
              placeholder={this.placeholder}
              label={this.label}
              dates={this.dates}
              inline={this.inline}
              date={this.date}
              multipleDates={this.multipleDates}
              range={this.range}
              dateFormat={this.dateFormat}
              timepicker={this.timepicker}
              minDate={this.minDate}
              maxDate={this.maxDate}
              disabled={this.disabled}
              autoClose={this.autoClose}
              showOtherMonths={this.showOtherMonths}
              selectOtherMonths={this.selectOtherMonths}
              customPicker={this.customPicker}
              container={this.container}
              forceDestroyOnUpdate={this.forceDestroyOnUpdate}
              emitEmptyDate={this.emitEmptyDate}
              onDateChanged={e => {
                e.stopImmediatePropagation();
                e.stopPropagation();
                this.currentDate = e.detail?.start;
                this.dateChanged.emit(e.detail);
                const shouldClose = this.autoClose && (!this.range || (this.range && (e.detail.dates as any).length > 1));
                if (shouldClose) {
                  this.togglePicker();
                }
              }}
            />
            <slot></slot>
          </div>
        </wa-popup>
      </Host>
    );
  }
}
