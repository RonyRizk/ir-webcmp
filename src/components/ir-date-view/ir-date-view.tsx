import locales from '@/stores/locales.store';
import { calculateDaysBetweenDates } from '@/utils/booking';
import { Component, Host, Prop, h } from '@stencil/core';
import moment from 'moment';

@Component({
  tag: 'ir-date-view',
  styleUrl: 'ir-date-view.css',
  shadow: true,
})
export class IrDateView {
  /** Raw from-date — accepts ISO string, JS Date, or Moment */
  @Prop() from_date: string | Date | moment.Moment;
  /** Raw to-date — accepts ISO string, JS Date, or Moment */
  @Prop() to_date: string | Date | moment.Moment;
  /** Show the night-count badge after the to-date */
  @Prop() showDateDifference: boolean = true;
  /** Input format used when `from_date` / `to_date` are plain strings */
  @Prop() dateOption: string = 'YYYY-MM-DD';
  /** Display format for both dates */
  @Prop() format: string = 'MMM DD, YYYY';

  private formatDate(date: string | Date | moment.Moment): string {
    if (!date) return '';
    if (typeof date === 'string') return moment(date, this.dateOption).format(this.format);
    if (date instanceof Date) return moment(date).format(this.format);
    if (moment.isMoment(date)) return (date as moment.Moment).format(this.format);
    return '';
  }

  render() {
    const fromStr = this.formatDate(this.from_date);
    const toStr = this.formatDate(this.to_date);
    const diff = calculateDaysBetweenDates(moment(fromStr, this.format).format('YYYY-MM-DD'), moment(toStr, this.format).format('YYYY-MM-DD'));
    const nightLabel = diff === 1 ? locales.entries.Lcz_Night : locales.entries.Lcz_Nights;

    return (
      <Host>
        <span part="base">
          <span part="from-date">{fromStr}</span>

          <span part="separator" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" part="separator-icon" viewBox="0 0 512 512" aria-hidden="true" focusable="false">
              <path
                fill="currentColor"
                d="M502.6 278.6c12.5-12.5 12.5-32.8 0-45.3l-128-128c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L402.7 224 32 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l370.7 0-73.4 73.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l128-128z"
              />
            </svg>
          </span>

          <span part="to-date">{toStr}</span>

          {this.showDateDifference && diff > 0 && (
            <span part="night-count">
              {diff}&nbsp;{nightLabel}
            </span>
          )}
        </span>
      </Host>
    );
  }
}
