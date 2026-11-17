import { Component, Prop, State, h } from '@stencil/core';
import type { TLocaleEntries } from '@/stores/locales.store';
import { createLoginAsideTranslate } from '../login-aside-text';
import { STORY_MS } from '../ir-login-aside-dynamic-pricing/dynamic-pricing-story';

/** Keep in step with `aside-showcase-in` in the stylesheet. */
const CROSSFADE_MS = 420;

/** Long enough for the calendar's first two bookings to land (first at 1.6s, then every 5.2s). */
const CALENDAR_MS = 12000;

type Slide = { id: 'calendar' | 'dynamic-pricing'; labelKey: string; label: string; durationMs: number };

const SLIDES: Slide[] = [
  { id: 'calendar', labelKey: 'Lcz_LoginPromoSlideCalendar', label: 'One calendar', durationMs: CALENDAR_MS },
  // Leaves during the payoff, so the crossfade never catches the story resetting
  { id: 'dynamic-pricing', labelKey: 'Lcz_LoginPromoSlideDynamicPricing', label: 'Dynamic Pricing', durationMs: STORY_MS - CROSSFADE_MS },
];

@Component({
  tag: 'ir-login-aside-showcase',
  styleUrl: 'ir-login-aside-showcase.css',
  shadow: false,
})
export class IrLoginAsideShowcase {
  /** Host-provided `Lcz_*` translations, passed through to the slides. The `locales` store wins when it has a key. */
  @Prop() localeEntries: TLocaleEntries | null = null;

  /** Index into `SLIDES` of the slide on show. */
  @State() active = 0;

  /** The slide fading out underneath the active one, while a switch is in progress. */
  @State() leaving: number | null = null;

  /** How many times each slide has been shown. It keys the slide, so every showing is a fresh mount. */
  @State() showings: number[] = SLIDES.map(() => 0);

  /** Half-turns of the loop icon: it only ever spins forward. */
  @State() turns = 0;

  private crossfadeTimeout?: number;

  private tr = createLoginAsideTranslate(() => this.localeEntries);

  disconnectedCallback() {
    window.clearTimeout(this.crossfadeTimeout);
  }

  private show(index: number) {
    if (index === this.active) {
      return;
    }

    window.clearTimeout(this.crossfadeTimeout);
    this.leaving = this.active;
    this.active = index;
    this.showings = this.showings.map((count, i) => (i === index ? count + 1 : count));
    this.crossfadeTimeout = window.setTimeout(() => (this.leaving = null), CROSSFADE_MS);
  }

  private next = () => {
    this.show((this.active + 1) % SLIDES.length);
  };

  private handleLoopClick = () => {
    this.turns++;
    this.next();
  };

  private renderSlide(slide: Slide) {
    if (slide.id === 'calendar') {
      return <ir-login-aside-calendar localeEntries={this.localeEntries}></ir-login-aside-calendar>;
    }
    return <ir-login-aside-dynamic-pricing localeEntries={this.localeEntries}></ir-login-aside-dynamic-pricing>;
  }

  render() {
    const tr = this.tr;
    const nextLabel = tr('Lcz_LoginPromoShowNext', 'Show next');

    return (
      <section class="aside-showcase" aria-roledescription="carousel" aria-label={tr('Lcz_LoginPromoShowcaseLabel', 'What igloorooms can do')}>
        <div class="aside-showcase__controls">
          {SLIDES.map((slide, index) => {
            const label = tr(slide.labelKey, slide.label);
            return (
              <button
                type="button"
                class="aside-showcase__segment"
                title={label}
                aria-label={label}
                aria-current={index === this.active ? 'true' : undefined}
                onClick={() => this.show(index)}
              >
                <span class="aside-showcase__track">
                  {/* The fill is the timer: when its animation ends, the next slide takes over */}
                  {index === this.active && <span class="aside-showcase__fill" style={{ animationDuration: `${slide.durationMs}ms` }} onAnimationEnd={this.next}></span>}
                </span>
              </button>
            );
          })}

          <button type="button" class="aside-showcase__loop" title={nextLabel} aria-label={nextLabel} onClick={this.handleLoopClick}>
            <wa-icon class="aside-showcase__loop-icon" name="arrows-rotate" style={{ transform: `rotate(${this.turns * 180}deg)` }}></wa-icon>
          </button>
        </div>

        <div class="aside-showcase__stage">
          {/* Only what's on screen is mounted, and the key changes each showing, so a slide always starts from its beginning */}
          {SLIDES.map((slide, index) => {
            const isActive = index === this.active;
            if (!isActive && index !== this.leaving) {
              return null;
            }
            return (
              <div
                key={`${slide.id}-${this.showings[index]}`}
                class={{ 'aside-showcase__slide': true, 'is-active': isActive, 'is-entering': isActive && this.leaving !== null }}
                inert={!isActive}
              >
                {this.renderSlide(slide)}
              </div>
            );
          })}
        </div>
      </section>
    );
  }
}
