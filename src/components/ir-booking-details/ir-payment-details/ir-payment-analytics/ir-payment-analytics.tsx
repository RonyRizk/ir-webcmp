import { Booking } from '@/models/booking.dto';
import calendar_data, { isOptimReadOnly } from '@/stores/calendar-data';
import { formatAmount } from '@/utils/utils';
import { Component, Host, Prop, State, Watch, h } from '@stencil/core';

type DpEffectTone = 'neutral' | 'loss' | 'gain';

const COUNT_UP_DURATION_MS = 700;
/** Cubic ease-out — starts fast, settles gently instead of stopping abruptly. */
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

@Component({
  tag: 'ir-payment-analytics',
  styleUrl: 'ir-payment-analytics.css',
  scoped: true,
})
export class IrPaymentAnalytics {
  @Prop() booking: Booking;

  @State() private displayedValue = 0;

  private animationFrameId?: number;

  componentWillLoad() {
    this.runCountUp();
  }

  @Watch('booking')
  onBookingChange() {
    this.runCountUp();
  }

  disconnectedCallback() {
    if (this.animationFrameId !== undefined) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  private runCountUp() {
    if (this.animationFrameId !== undefined) {
      cancelAnimationFrame(this.animationFrameId);
    }
    const target = this.booking.dp_effect;
    const start = performance.now();

    const step = (now: number) => {
      const progress = Math.min((now - start) / COUNT_UP_DURATION_MS, 1);
      this.displayedValue = target * easeOutCubic(progress);
      if (progress < 1) {
        this.animationFrameId = requestAnimationFrame(step);
      } else {
        this.displayedValue = target;
        this.animationFrameId = undefined;
      }
    };

    this.animationFrameId = requestAnimationFrame(step);
  }

  private getTone(): DpEffectTone {
    const { dp_effect } = this.booking;
    if (dp_effect === 0) {
      return 'neutral';
    }
    return dp_effect < 0 ? 'loss' : 'gain';
  }

  render() {
    const tone = this.getTone();
    const calloutVariant = tone === 'gain' ? 'success' : tone === 'loss' ? 'danger' : 'neutral';
    const trendIcon = tone === 'gain' ? 'arrow-trend-up' : tone === 'loss' ? 'arrow-trend-down' : 'minus';

    return (
      <Host>
        <wa-tooltip for={`dp-effect-callout-${this.booking?.booking_nbr}`}>
          The dynamic pricing effect is calculated at the time the booking is created and remains fixed thereafter, serving as an indicator of the additional profit generated or of
          the incentive price reduction.
        </wa-tooltip>
        <wa-callout id={`dp-effect-callout-${this.booking?.booking_nbr}`} class={`dp-effect-callout --${tone}`} variant={calloutVariant} size="small">
          <wa-icon class="dp-effect-icon" slot="icon" name="wand-magic-sparkles"></wa-icon>
          <div class="booking-dp-effect">
            <p class="booking-dp-effect__label">Dynamic pricing {isOptimReadOnly() ? 'lost profit' : 'effect'}</p>
            <p class={`booking-dp-effect__value --${tone}`}>
              <span>{formatAmount(calendar_data.property.currency.symbol, this.displayedValue)}</span>
              <wa-icon class="booking-dp-effect__trend-icon" name={trendIcon}></wa-icon>
            </p>
          </div>
        </wa-callout>
      </Host>
    );
  }
}
