import { Booking } from '@/models/booking.dto';
import calendar_data from '@/stores/calendar-data';
import { isRequestPending } from '@/stores/ir-interceptor.store';
import { formatAmount } from '@/utils/utils';
import { Component, Host, Prop, h } from '@stencil/core';

@Component({
  tag: 'ir-payment-analytics',
  styleUrl: 'ir-payment-analytics.css',
  scoped: true,
})
export class IrPaymentAnalytics {
  @Prop() booking: Booking;
  @Prop() optimBaseGrossAmount: number | null = null;
  @Prop() directBookingGrossAmount: number | null = null;
  @Prop() loading: boolean = false;

  private renderAmount(value: number | null, currencySymbol: string) {
    if (this.loading) {
      return <p class="analytics__row-value analytics__row-value--loading">…</p>;
    }
    return <p class="analytics__row-value">{value === null ? '—' : formatAmount(currencySymbol, value)}</p>;
  }

  private renderShimmer() {
    return (
      <div class="analytics__shimmer">
        <span class="analytics__shimmer-bar analytics__shimmer-bar--value"></span>
        <span class="analytics__shimmer-bar analytics__shimmer-bar--delta"></span>
      </div>
    );
  }

  private renderBaseRateDelta(delta: number | null, currencySymbol: string) {
    if (this.loading || delta === null) {
      return null;
    }
    if (delta === 0) {
      return (
        <span class="analytics__delta analytics__delta--flat">
          <wa-icon name="minus" aria-hidden="true"></wa-icon>
          Break-even
        </span>
      );
    }
    const isProfit = delta > 0;
    return (
      <span class={{ 'analytics__delta': true, 'analytics__delta--profit': isProfit, 'analytics__delta--loss': !isProfit }}>
        <wa-icon name={isProfit ? 'arrow-trend-up' : 'arrow-trend-down'} aria-hidden="true"></wa-icon>
        {formatAmount(currencySymbol, Math.abs(delta))}
      </span>
    );
  }

  render() {
    const currencySymbol = calendar_data.property?.currency?.symbol;
    const totalAccommodation = this.booking?.rooms?.reduce((prev, curr) => prev + curr.total, 0) ?? 0;
    const baseRateTotal = this.optimBaseGrossAmount;
    const directTotal = this.directBookingGrossAmount;
    const baseRateDelta = baseRateTotal !== null ? totalAccommodation - baseRateTotal : null;
    const directTotalDelta = baseRateTotal !== null ? totalAccommodation - directTotal : null;

    return (
      <Host>
        <wa-card appearance="outlined" class="analytics" aria-label="Rate analytics">
          <header class="analytics__header">
            {/* <span class="analytics__header-icon">
              <wa-icon name="scale-balanced" aria-hidden="true"></wa-icon>
            </span> */}
            <div class="analytics__heading">
              <p class="analytics__title">Rate analytics</p>
              <p class="analytics__subtitle">How this booking compares to other rate scenarios</p>
            </div>
            <wa-badge variant="danger" pill>
              BETA
            </wa-badge>
          </header>
          <div class="analytics__rows">
            <div class="analytics__row analytics__row--primary">
              <p class="analytics__row-label">
                {/* <wa-icon name="bed" aria-hidden="true"></wa-icon> */}
                Total accommodation:
              </p>
              <p class="analytics__row-value">{formatAmount(currencySymbol, totalAccommodation)}</p>
            </div>
            <div class="analytics__row">
              <p class="analytics__row-label">
                {/* <wa-icon name="tag" aria-hidden="true"></wa-icon> */}
                If issued on base rate:
              </p>
              {isRequestPending('/Calculate_Optim_Base_Gross_Amount') ? (
                this.renderShimmer()
              ) : (
                <div class="analytics__row-figures">
                  {this.renderAmount(baseRateTotal, currencySymbol)}
                  {this.renderBaseRateDelta(baseRateDelta, currencySymbol)}
                </div>
              )}
            </div>
            {!this.booking?.is_direct && (
              <div class="analytics__row">
                <p class="analytics__row-label">
                  {/* <wa-icon name="building" aria-hidden="true"></wa-icon> */}
                  If issued as direct:
                </p>
                {isRequestPending('/Simulate_Direct_Booking') ? (
                  this.renderShimmer()
                ) : (
                  <div class="analytics__row-figures">
                    {this.renderAmount(directTotal, currencySymbol)}
                    {this.renderBaseRateDelta(directTotalDelta, currencySymbol)}
                  </div>
                )}
              </div>
            )}
          </div>
        </wa-card>
      </Host>
    );
  }
}
