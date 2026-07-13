import { Component, Event, EventEmitter, Host, Prop, h } from '@stencil/core';

export type MetricIntent = 'neutral' | 'brand' | 'success' | 'warning' | 'danger';
export type MetricSize = 's' | 'm';

/**
 * A compact, themeable KPI / metric card. Displays a label, a primary value with an
 * optional unit, an optional leading icon, a trend delta, a caption, and arbitrary
 * slotted body content. Fully styleable via CSS parts and custom properties.
 *
 * @part base - The outer card container.
 * @part header - Row holding the icon and label.
 * @part icon - The leading icon chip.
 * @part label - The metric label text.
 * @part value - Row holding the primary value and unit.
 * @part unit - The unit text rendered after the value.
 * @part trend - The trend (delta) indicator.
 * @part caption - The secondary caption line.
 * @part body - Wrapper around the default slot.
 * @part footer - Wrapper around the footer slot.
 *
 * @slot - Default slot for custom body content below the value.
 * @slot icon - Overrides the leading icon.
 * @slot label - Overrides the label markup.
 * @slot value - Overrides the value display.
 * @slot footer - Footer / actions row.
 */
@Component({
  tag: 'ir-metric-card',
  styleUrl: 'ir-metric-card.css',
  shadow: true,
})
export class IrMetricCard {
  /** Metric label / title. */
  @Prop() label: string;

  /** Primary metric value. Rendered with tabular figures. */
  @Prop() value: string | number;

  /** Unit rendered after the value (e.g. `guests`, `%`, `nights`). */
  @Prop() unit: string;

  /** Name of a `wa-icon` rendered in the leading icon chip. */
  @Prop() icon: string;

  /** Trend delta. Sign selects the up/down arrow and color. Rendered as `{trend}%` unless `trendValue` is given. */
  @Prop() trend: number;

  /** Preformatted text to render in place of `{trend}%` (e.g. a currency amount), while `trend`'s sign still drives the icon/color. */
  @Prop() trendValue: string;

  /** Context text shown beside the trend (e.g. `vs last week`). */
  @Prop() trendLabel: string;

  /** Flip trend color semantics so a decrease reads as positive (good). */
  @Prop() invertTrend: boolean = false;

  /** Secondary descriptive line shown beneath the value. */
  @Prop() caption: string;

  /** Render skeleton placeholders instead of content. */
  @Prop({ reflect: true }) loading: boolean = false;

  /** Visual density. `small` is compact (default); `medium` enlarges the value and padding. */
  @Prop({ reflect: true }) size: MetricSize = 's';

  /** Make the whole card interactive: adds hover/focus affordance and emits `metricClick`. */
  @Prop({ reflect: true }) clickable: boolean = false;

  /** Emitted when a clickable card is activated by click or keyboard (Enter / Space). */
  @Event() metricClick: EventEmitter<void>;

  private handleActivate = () => {
    if (this.clickable && !this.loading) {
      this.metricClick.emit();
    }
  };

  private handleKeyDown = (event: KeyboardEvent) => {
    if (!this.clickable) {
      return;
    }
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
      event.preventDefault();
      this.handleActivate();
    }
  };

  private get trendDirection(): 'up' | 'down' | 'flat' {
    if (this.trend === undefined || this.trend === null || Number.isNaN(this.trend) || this.trend === 0) {
      return 'flat';
    }
    return this.trend > 0 ? 'up' : 'down';
  }

  private get trendIsPositive(): boolean {
    const rising = this.trendDirection === 'up';
    return this.invertTrend ? !rising : rising;
  }

  private renderTrend() {
    if (this.trend === undefined || this.trend === null || Number.isNaN(this.trend)) {
      return null;
    }
    const direction = this.trendDirection;
    const tone = direction === 'flat' ? 'flat' : this.trendIsPositive ? 'positive' : 'negative';
    const iconName = direction === 'up' ? 'arrow-trend-up' : direction === 'down' ? 'arrow-trend-down' : 'minus';
    const magnitude = Math.abs(this.trend);
    const displayValue = this.trendValue ?? `${magnitude}%`;
    const ariaLabel = `${direction === 'flat' ? 'no change' : direction} ${this.trendValue ?? `${magnitude} percent`}`;
    return (
      <span part="trend" class={`metric__trend metric__trend--${tone}`} aria-label={ariaLabel}>
        <wa-icon name={iconName} aria-hidden="true"></wa-icon>
        <span>{displayValue}</span>
        {this.trendLabel && <span class="metric__trend-label">{this.trendLabel}</span>}
      </span>
    );
  }

  private renderIcon() {
    return (
      <span part="icon" class="metric__icon">
        <slot name="icon">{this.icon && <wa-icon name={this.icon} aria-hidden="true"></wa-icon>}</slot>
      </span>
    );
  }

  render() {
    const hasIcon = !!this.icon;
    const interactive = this.clickable && !this.loading;
    const ariaLabel = [this.label, this.value, this.unit].filter(Boolean).join(' ') || undefined;

    return (
      <Host
        role={this.clickable ? 'button' : null}
        tabindex={interactive ? '0' : null}
        aria-label={this.clickable ? ariaLabel : null}
        aria-busy={this.loading ? 'true' : null}
        onClick={interactive ? this.handleActivate : undefined}
        onKeyDown={interactive ? this.handleKeyDown : undefined}
      >
        <div part="base" class="metric">
          {(hasIcon || this.label) && (
            <div part="header" class="metric__header">
              {hasIcon && this.renderIcon()}
              <span part="label" class="metric__label">
                <slot name="label">{this.label}</slot>
              </span>
            </div>
          )}

          {this.loading ? (
            <div class="metric__skeleton">
              <span class="metric__skeleton-bar metric__skeleton-bar--value"></span>
              <span class="metric__skeleton-bar metric__skeleton-bar--caption"></span>
            </div>
          ) : (
            <div class="metric__main">
              <div part="value" class="metric__value">
                <slot name="value">
                  {this.value !== undefined && this.value !== null && <span class="metric__value-number">{this.value}</span>}
                  {this.unit && (
                    <span part="unit" class="metric__unit">
                      {this.unit}
                    </span>
                  )}
                </slot>
                {this.renderTrend()}
              </div>
              {this.caption && (
                <p part="caption" class="metric__caption">
                  {this.caption}
                </p>
              )}
            </div>
          )}

          <div part="body" class="metric__body">
            <slot></slot>
          </div>

          <div part="footer" class="metric__footer">
            <slot name="footer"></slot>
          </div>
        </div>
      </Host>
    );
  }
}
