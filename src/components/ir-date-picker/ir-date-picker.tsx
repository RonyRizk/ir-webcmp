import { Component, h, Element, Prop, Event, EventEmitter, Host } from '@stencil/core';
import moment from 'moment';

@Component({
  tag: 'ir-date-picker',
  styleUrl: 'ir-date-picker.css',
  scoped: true,
})
export class IrDatePicker {
  @Element() private element: HTMLElement;
  @Prop() fromDate: Date;
  @Prop() toDate: Date;

  @Prop() opens: 'left' | 'right' | 'center';
  @Prop() autoApply: boolean;
  @Prop() firstDay: number = 1;
  @Prop() monthNames: string[] = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  @Prop() daysOfWeek: string[] = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  @Prop() format: string = 'MMM DD, YYYY';
  @Prop() separator: string = ' - ';
  @Prop() applyLabel: string = 'Apply';
  @Prop() cancelLabel: string = 'Cancel';
  @Prop() fromLabel: string = 'Form';
  @Prop() toLabel: string = 'To';
  @Prop() customRangeLabel: string = 'Custom';
  @Prop() weekLabel: string = 'W';
  @Prop() disabled: boolean = false;
  @Prop() singleDatePicker = false;
  @Prop() minDate: string;
  @Prop() maxDate: string;
  @Prop() maxSpan: moment.DurationInputArg1 = {
    days: 240,
  };
  @Event() dateChanged: EventEmitter<{
    start: moment.Moment;
    end: moment.Moment;
  }>;
  dateRangeInput: HTMLElement;
  componentDidLoad() {
    this.dateRangeInput = this.element.querySelector('.date-range-input');
    $(this.dateRangeInput).daterangepicker(
      {
        singleDatePicker: this.singleDatePicker,
        opens: this.opens,
        startDate: moment(this.fromDate),
        endDate: moment(this.toDate),
        minDate: moment(this.minDate || moment(new Date()).format('YYYY-MM-DD')),
        maxDate: this.maxDate ? moment(this.maxDate) : undefined,
        maxSpan: this.maxSpan,
        autoApply: this.autoApply,
        locale: {
          format: this.format,
          separator: this.separator,
          applyLabel: this.applyLabel,
          cancelLabel: this.cancelLabel,
          fromLabel: this.fromLabel,
          toLabel: this.toLabel,
          customRangeLabel: this.customRangeLabel,
          weekLabel: this.weekLabel,
          daysOfWeek: this.daysOfWeek,
          monthNames: this.monthNames,
          firstDay: this.firstDay,
        },
      },
      (start, end) => {
        this.dateChanged.emit({ start, end });
      },
    );
  }

  render() {
    return (
      <Host>
        <input class="date-range-input" type="text" disabled={this.disabled} />
      </Host>
    );
  }
}
