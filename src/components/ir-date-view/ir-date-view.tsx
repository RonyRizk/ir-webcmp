import { calculateDaysBetweenDates } from '@/utils/booking';
import { DateStyle, formatDate, toDate } from '@/utils/date';
import { formatCount } from '@/utils/number';
import { Component, Host, Prop, h } from '@stencil/core';
import moment from 'moment';

import { t } from '@/services/locale/t';
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
  /** Display style for both dates */
  @Prop() format: DateStyle = 'medium';

  render() {
    const fromStr = formatDate(this.from_date, { style: this.format });
    const toStr = formatDate(this.to_date, { style: this.format });
    // Night-count is computed from the original values, never from the (possibly Hijri) display
    // string — re-parsing display text with a display-locale parser breaks once formatting can
    // switch calendar systems.
    const fromISO = toDate(this.from_date);
    const toISO = toDate(this.to_date);
    const diff = fromISO && toISO ? calculateDaysBetweenDates(moment(fromISO).format('YYYY-MM-DD'), moment(toISO).format('YYYY-MM-DD')) : 0;
    const nightLabel = diff === 1 ? t('Lcz_Night', { fallback: 'night' }) : t('Lcz_Nights', { fallback: 'nights' });

    return (
      <Host>
        <span part="base">
          <span part="from-date">{fromStr}</span>

          {/* <span part="separator" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" part="separator-icon" viewBox="0 0 512 512" aria-hidden="true" focusable="false">
              <path
                fill="currentColor"
                d="M502.6 278.6c12.5-12.5 12.5-32.8 0-45.3l-128-128c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L402.7 224 32 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l370.7 0-73.4 73.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l128-128z"
              />
            </svg>
          </span> */}
          <span part="separator" aria-hidden="true">
            <wa-icon class="ir-flip-rtl" name="arrow-right" part="separator-icon" aria-hidden="true"></wa-icon>
          </span>

          <span part="to-date">{toStr}</span>

          {this.showDateDifference && diff > 0 && (
            <span part="night-count">
              {formatCount(diff)}&nbsp;{nightLabel}
            </span>
          )}
        </span>
      </Host>
    );
  }
}
