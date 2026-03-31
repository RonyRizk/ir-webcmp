import { ClickOutside } from '@/decorators/ClickOutside';
import locales from '@/stores/locales.store';
import { calculateDaysBetweenDates } from '@/utils/booking';
import { Component, Element, Event, EventEmitter, Method, Prop, State, Watch, h } from '@stencil/core';
import { IToast } from '@components/ui/ir-toast/toast';
import moment, { Moment } from 'moment';

export type DateRangeChangeEvent = { checkIn: Moment; checkOut: Moment };

@Component({
  tag: 'igl-date-range',
  styleUrl: 'igl-date-range.css',
  shadow: true,
})
export class IglDateRange {
  @Element() el: HTMLIglDateRangeElement;

  @Prop({ reflect: true }) size: 'small' | 'medium' | 'large' = 'small';
  @Prop() defaultData: { [key: string]: any };
  @Prop({ reflect: true }) disabled: boolean = false;
  @Prop() minDate: string;
  @Prop() dateLabel: string;
  @Prop() maxDate: string;
  @Prop() withDateDifference: boolean = true;
  @Prop() variant: 'booking' | 'default' = 'default';
  @Prop() hint: string;

  @State() renderAgain: boolean = false;
  @State() isActive: boolean = false;

  @Event() dateSelectEvent: EventEmitter<{ [key: string]: any }>;
  @Event({ composed: true, cancelable: true, bubbles: true }) dateRangeChange: EventEmitter<DateRangeChangeEvent>;
  @Event() toast: EventEmitter<IToast>;

  private totalNights: number = 0;
  private static instanceCounter = 0;
  private popupId: string;

  @State() fromDate: Date = moment().toDate();
  @State() toDate: Date = moment().add(1, 'day').toDate();
  @State() isInvalid: string;

  componentWillLoad() {
    IglDateRange.instanceCounter += 1;
    this.popupId = `igl-date-range-popup-${IglDateRange.instanceCounter}`;
    this.initializeDates();
  }

  @Watch('defaultData')
  handleDataChange(newValue: any, oldValue: any) {
    if (JSON.stringify(newValue) !== JSON.stringify(oldValue)) {
      this.initializeDates();
    }
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

  private handleDateSelectEvent(key, data: any = '') {
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
    this.renderAgain = !this.renderAgain;
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

  @Watch('aria-invalid')
  handleAriaInvalidChange(newValue) {
    this.isInvalid = newValue;
  }

  private get label(): string {
    const from = moment(this.fromDate).format('MMM DD, YYYY');
    const to = moment(this.toDate).format('MMM DD, YYYY');
    return `${from} → ${to}`;
  }

  render() {
    const showNights = this.variant === 'booking' && this.withDateDifference;
    return (
      <wa-popup arrow part="base" placement="bottom" flip shift auto-size="vertical" auto-size-padding={10} active={this.isActive} class="igl-date-range__popup">
        {/* Trigger */}
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
              disabled={this.disabled}
              class="igl-date-range__input"
              readonly
              value={this.label}
              aria-invalid={this.isInvalid}
              aria-expanded={String(this.isActive)}
              aria-disabled={this.disabled ? 'true' : undefined}
            >
              <wa-icon slot="start" variant="regular" name="calendar"></wa-icon>
              {showNights && this.totalNights > 0 && (
                <span slot="end" class="igl-date-range__nights">
                  {this.totalNights} {this.totalNights > 1 ? locales.entries.Lcz_Nights : locales.entries.Lcz_Night}
                </span>
              )}
            </ir-input>
          </div>
        </div>

        {/* Popup body */}
        <div part="body" id={this.popupId} class="igl-date-range__calendar" role="dialog" aria-modal="false" aria-label="Date range selection dialog">
          <ir-custom-date-range
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
