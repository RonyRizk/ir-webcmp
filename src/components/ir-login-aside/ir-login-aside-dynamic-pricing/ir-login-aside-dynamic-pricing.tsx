import { Component, Element, Prop, State, h } from '@stencil/core';
import { formatDate } from '@/utils/date';
import { formatCount, formatPercent } from '@/utils/number';
import type { TLocaleEntries } from '@/stores/locales.store';
import { createLoginAsideTranslate } from '../login-aside-text';
import {
  BASE_RATE,
  BEATS,
  BEAT_MS,
  Beat,
  CONTACT_EMAIL,
  CURRENCY,
  EXTRA_BOOKINGS,
  EXTRA_PROFIT,
  Night,
  ROOMS,
  SIGNALS,
  WEEK,
  nextBeat,
  rateLevel,
  upcomingWeek,
} from './dynamic-pricing-story';

const COUNT_MS = 1400;
const PAUSED_RETRY_MS = 1000;

/** Incentives move first, then the festival nights, so the eye sweeps across the week once. */
const RATE_ORDER = WEEK.map((night, index) => ({ night, index }))
  .filter(({ night }) => night.rate !== BASE_RATE)
  .sort((a, b) => a.night.rate - b.night.rate || a.index - b.index)
  .map(({ index }) => index);

const money = (amount: number) => `${CURRENCY}${formatCount(amount)}`;
const occupancy = (sold: number) => formatPercent((sold / ROOMS) * 100);

@Component({
  tag: 'ir-login-aside-dynamic-pricing',
  styleUrl: 'ir-login-aside-dynamic-pricing.css',
  shadow: false,
})
export class IrLoginAsideDynamicPricing {
  @Element() el: HTMLElement;

  /**
   * Translated labels from the host, keyed by `Lcz_*`. The `locales` store wins when it has a
   * key; a key missing from both (or the whole object, until it arrives) falls back to English.
   */
  @Prop() localeEntries: TLocaleEntries | null = null;

  @State() beat: Beat = 'fixed';
  @State() extraProfit = 0;
  @State() extraBookings = 0;

  private beatTimeout?: number;
  private countFrame?: number;
  private readonly week = upcomingWeek(new Date());

  private tr = createLoginAsideTranslate(() => this.localeEntries);

  connectedCallback() {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      // The payoff frame still tells the whole story, it just doesn't play
      this.beat = 'payoff';
      this.extraProfit = EXTRA_PROFIT;
      this.extraBookings = EXTRA_BOOKINGS;
      return;
    }
    this.schedule();
  }

  disconnectedCallback() {
    window.clearTimeout(this.beatTimeout);
    window.cancelAnimationFrame(this.countFrame);
  }

  private schedule() {
    this.beatTimeout = window.setTimeout(this.advance, BEAT_MS[this.beat]);
  }

  private advance = () => {
    // Don't play to nobody: a background tab, or the aside hidden on small screens
    if (document.hidden || !this.el.offsetWidth) {
      this.beatTimeout = window.setTimeout(this.advance, PAUSED_RETRY_MS);
      return;
    }

    this.beat = nextBeat(this.beat);

    if (this.beat === 'payoff') {
      this.countUp();
    } else if (this.beat === 'fixed') {
      this.extraProfit = 0;
      this.extraBookings = 0;
    }

    this.schedule();
  };

  private countUp() {
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / COUNT_MS, 1);
      const eased = 1 - Math.pow(1 - progress, 4);

      this.extraProfit = Math.round(EXTRA_PROFIT * eased);
      this.extraBookings = Math.round(EXTRA_BOOKINGS * eased);

      if (progress < 1) {
        this.countFrame = window.requestAnimationFrame(tick);
      }
    };

    this.countFrame = window.requestAnimationFrame(tick);
  }

  private reached(beat: Beat) {
    return BEATS.indexOf(this.beat) >= BEATS.indexOf(beat);
  }

  private renderRate(night: Night, index: number) {
    const up = night.rate > BASE_RATE;
    const down = night.rate < BASE_RATE;
    const moved = up || down;

    return (
      <span
        class={{ 'dp-rate': true, 'is-up': up, 'is-down': down, 'is-moved': moved && this.reached('rates') }}
        style={{ '--dp-order': String(Math.max(RATE_ORDER.indexOf(index), 0)), '--dp-to': String(rateLevel(night.rate)) }}
      >
        <span class="dp-rate__bar">
          {moved && <span class="dp-rate__tag">{up ? `+${money(night.rate - BASE_RATE)}` : this.tr('Lcz_LoginPromoDpIncentive', 'Incentive')}</span>}
        </span>
        {/* The fixed-rate slab stays put on rising nights, so only the gain above it shows in color */}
        {!down && <span class="dp-rate__base"></span>}
        <span class="dp-rate__price">
          {moved ? (
            <span class="dp-swap">
              <span class="dp-swap__from dp-rate__value">{money(BASE_RATE)}</span>
              <span class="dp-swap__to dp-rate__value">{money(night.rate)}</span>
            </span>
          ) : (
            <span class="dp-rate__value">{money(BASE_RATE)}</span>
          )}
        </span>
      </span>
    );
  }

  private renderOccupancy(night: Night, index: number) {
    const changed = night.soldAfter !== night.soldBefore;
    const before = night.soldBefore / ROOMS;
    const after = night.soldAfter / ROOMS;

    return (
      <span
        class={{ 'dp-occ': true, 'is-up': night.rate > BASE_RATE, 'is-down': night.rate < BASE_RATE, 'is-moved': changed && this.reached('bookings') }}
        style={{ '--dp-order': String(index), '--dp-from': String(before), '--dp-to': String(after) }}
      >
        {changed ? (
          <span class="dp-swap dp-occ__label">
            <span class="dp-swap__from">{occupancy(night.soldBefore)}</span>
            <span class="dp-swap__to">{occupancy(night.soldAfter)}</span>
          </span>
        ) : (
          <span class="dp-occ__label">{occupancy(night.soldBefore)}</span>
        )}
        <span class="dp-occ__track">
          <span class="dp-occ__fill"></span>
        </span>
      </span>
    );
  }

  render() {
    const tr = this.tr;

    const steps: Record<Beat, string> = {
      fixed: tr('Lcz_LoginPromoDpStepFixed', 'Every night, the same rate.'),
      signals: tr('Lcz_LoginPromoDpStepSignals', "Dynamic Pricing spots what's coming."),
      rates: tr('Lcz_LoginPromoDpStepRates', 'Rates adjust, night by night.'),
      bookings: tr('Lcz_LoginPromoDpStepBookings', 'Busy nights earn more. Quiet nights fill up.'),
      payoff: tr('Lcz_LoginPromoDpStepPayoff', 'Same week. More money.'),
    };

    const subject = encodeURIComponent(tr('Lcz_LoginPromoDpEmailSubject', 'Enable Dynamic Pricing'));

    return (
      <aside class="dp-promo" data-beat={this.beat}>
        <div class="dp-promo__intro">
          <h2 class="dp-promo__title">{tr('Lcz_LoginPromoDpTitle', 'Your rates should move when demand does.')}</h2>
          <p class="dp-promo__copy">
            {tr('Lcz_LoginPromoDpCopy', "Dynamic Pricing watches what's coming, raises rates when demand climbs, and adds Incentives when dates run quiet.")}
          </p>
        </div>

        {/* The story is told by the copy above; this replay would only be noise to a screen reader */}
        <div class="dp-promo__stage" aria-hidden="true">
          <div class="dp-promo__steps">
            {BEATS.map(beat => (
              <span class={{ 'dp-promo__step': true, 'is-active': beat === this.beat }}>{steps[beat]}</span>
            ))}
          </div>

          <div class="dp-board-wrap">
            <div class="dp-board">
              <div class="dp-board__row dp-board__row--head">
                <span class="dp-board__label"></span>
                {this.week.map(day => (
                  <span class="dp-board__day">{formatDate(day, 'ddd D')}</span>
                ))}
              </div>

              <div class="dp-board__row dp-board__row--signals">
                <span class="dp-board__label">{tr('Lcz_LoginPromoDpDemandSignals', 'Demand Signals')}</span>
                {SIGNALS.map((signal, index) => (
                  <span
                    class={{ 'dp-signal': true, [`dp-signal--${signal.tone}`]: true, 'is-on': this.reached('signals') }}
                    style={{ 'gridColumn': `${signal.first + 2} / ${signal.last + 3}`, '--dp-order': String(index) }}
                  >
                    <wa-icon name={signal.icon} variant="solid"></wa-icon>
                    <span class="dp-signal__label">{tr(signal.key, signal.label)}</span>
                  </span>
                ))}
              </div>

              <div class="dp-board__row dp-board__row--rates" style={{ '--dp-from': String(rateLevel(BASE_RATE)) }}>
                <span class="dp-board__label">{tr('Lcz_LoginPromoDpNightlyRate', 'Nightly rate')}</span>
                <span class="dp-board__fixed">
                  {tr('Lcz_LoginPromoDpFixedRate', 'Fixed rate')} {money(BASE_RATE)}
                </span>
                {WEEK.map((night, index) => this.renderRate(night, index))}
              </div>

              <div class="dp-board__row dp-board__row--occupancy">
                <span class="dp-board__label">{tr('Lcz_LoginPromoDpOccupancy', 'Occupancy')}</span>
                {WEEK.map((night, index) => this.renderOccupancy(night, index))}
              </div>
            </div>
          </div>

          <dl class="dp-promo__stats">
            <div class="dp-stat">
              <dt class="dp-stat__label">{tr('Lcz_LoginPromoDpExtraProfit', 'Extra Profit')}</dt>
              <dd class="dp-stat__value dp-stat__value--profit">+{money(this.extraProfit)}</dd>
            </div>
            <div class="dp-stat">
              <dt class="dp-stat__label">{tr('Lcz_LoginPromoDpExtraBookings', 'Extra Bookings')}</dt>
              <dd class="dp-stat__value">+{formatCount(this.extraBookings)}</dd>
            </div>
          </dl>
        </div>

        <p class="dp-promo__footer">
          {tr('Lcz_LoginPromoDpPrompt', 'Not using Dynamic Pricing yet?')}{' '}
          <a class="dp-promo__link" href={`mailto:${CONTACT_EMAIL}?subject=${subject}`}>
            {tr('Lcz_LoginPromoDpCta', 'Contact igloorooms to enable it')}
            <wa-icon class="dp-promo__arrow" name="arrow-right"></wa-icon>
          </a>
        </p>
      </aside>
    );
  }
}
