import { Component, Host, Prop, h } from '@stencil/core';

/**
 * Module-level counter — survives HMR but is reset on full page reload.
 * Guarantees each instance gets a stable, unique DOM id without needing
 * @Element or lifecycle hooks.
 */
let titleIdCounter = 0;

/**
 * @component ir-interactive-title
 *
 * Renders a room/category name inside a flex row that:
 *  - Truncates via CSS `text-overflow: ellipsis` when the text overflows.
 *  - Shows a `<wa-tooltip>` with the full title on hover when the title
 *    exceeds `cropSize` characters (lightweight proxy for overflow detection).
 *  - Optionally renders a trailing `.hk-dot` container (via `slot[name="end"]`)
 *    for housekeeping status icons or alert badges.
 *
 * The `.hk-dot` participates in the flex layout (`flex-shrink: 0`) so the
 * title span is guaranteed to truncate *before* reaching the icons — no JS
 * width measurement needed.
 *
 * @slot end - Icon(s) placed after the title (broom, alert, etc.).
 *             Only rendered when `hkStatus` is `true`.
 *
 * @cssvar --ir-popover-left   Horizontal padding of the `.hk-dot` overlay.
 * @cssvar --ir-interactive-hk-bg  Background fill of `.hk-dot` (used for
 *                                  hover highlight from the parent row).
 * @cssvar --dot-color          Icon colour inside `.hk-dot`.
 */
@Component({
  tag: 'ir-interactive-title',
  styleUrl: 'ir-interactive-title.css',
  scoped: true,
})
export class IrInteractiveTitle {
  /**
   * The full title string. When its length exceeds `cropSize` the tooltip
   * is activated so the user can read the complete text on hover.
   */
  @Prop() popoverTitle: string = '';

  /**
   * Horizontal padding of the `.hk-dot` slot container, forwarded as the
   * `--ir-popover-left` CSS custom property on the host element.
   * @default '10px'
   */
  @Prop() irPopoverLeft: string = '10px';

  /**
   * When `true`, renders the `.hk-dot` container and the `slot[name="end"]`
   * inside it. Must be `true` whenever slot content is provided, otherwise
   * the slotted nodes are silently discarded by the browser.
   */
  @Prop() hkStatus: boolean = false;

  /**
   * Character-count threshold above which the full-title tooltip is shown.
   * Acts as a fast approximation of visual overflow; the browser independently
   * applies `text-overflow: ellipsis` via CSS regardless of this value.
   * @default 20
   */
  @Prop() cropSize: number = 20;

  /**
   * Unique DOM id assigned once at instantiation time to the inner `<span>`.
   * `<wa-tooltip for="…">` references this id to anchor the tooltip.
   * Declared `readonly` — must never be reassigned after construction.
   */
  private readonly titleId = `ir-title-${++titleIdCounter}`;

  render() {
    const title = this.popoverTitle || '';

    return (
      <Host style={{ '--ir-popover-left': this.irPopoverLeft }}>
        <p class="popover-title">
          {title.length > this.cropSize && (
            <wa-tooltip for={this.titleId} placement="top">
              {title}
            </wa-tooltip>
          )}
          <span id={this.titleId} class="cropped-title">
            {title}
          </span>
          {this.hkStatus && (
            <div class="hk-dot">
              <slot name="end"></slot>
            </div>
          )}
        </p>
      </Host>
    );
  }
}
