import { Booking, OTAManipulations } from '@/models/booking.dto';
import { Component, Fragment, Host, Prop, h } from '@stencil/core';
import { t } from '@/services/locale/t';
import { formatDate } from '@/utils/date';
import { formatNumber } from '@/utils/number';

@Component({
  tag: 'ir-status-activity-cell',
  styleUrl: 'ir-status-activity-cell.css',
  scoped: true,
})
export class IrStatusActivityCell {
  @Prop() isRequestToCancel: boolean;
  @Prop() status: Booking['status'];
  @Prop() showModifiedBadge: boolean;
  @Prop() showManipulationBadge: boolean;
  @Prop() lastManipulation: OTAManipulations;
  @Prop() bookingNumber: string;

  render() {
    return (
      <Host>
        <ir-booking-status-tag status={this.status} isRequestToCancel={this.isRequestToCancel}></ir-booking-status-tag>
        {this.showModifiedBadge && <p class="status-activity__modified">{t('Lcz_Modified', { fallback: 'Modified' })}</p>}
        {this.showManipulationBadge && (
          <Fragment>
            <wa-tooltip for={`manipulation_badge_${this.bookingNumber}`}>
              {t('Lcz_ModifiedByTooltip', {
                fallback: 'Modified by %1 at %2 %3:%4',
                params: [
                  this.lastManipulation.user,
                  formatDate(this.lastManipulation.date, 'MMM DD, YYYY'),
                  formatNumber(Number(this.lastManipulation.hour), { minimumIntegerDigits: 2, useGrouping: false }),
                  formatNumber(Number(this.lastManipulation.minute), { minimumIntegerDigits: 2, useGrouping: false }),
                ],
              })}
            </wa-tooltip>
            <p class="status-activity__manipulation" id={`manipulation_badge_${this.bookingNumber}`}>
              {t('Lcz_Modified', { fallback: 'Modified' })}
            </p>
          </Fragment>
        )}
      </Host>
    );
  }
}
