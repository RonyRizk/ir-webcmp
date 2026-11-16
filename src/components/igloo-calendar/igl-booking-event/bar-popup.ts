/**
 * Anchoring a booking bar's info popup (`wa-popup`) to the part of the bar the user can see.
 *
 * The popup is anchored to a virtual element whose rect is the bar's *visible* part: the bar
 * clipped to the calendar grid, minus the sticky day header, footer and room-name column. Centring
 * on that keeps the popup over what is on screen for a 50-night stay, and keeps its arrow between
 * the visible edges of the bar. When the visible part is empty the bar has left the view and the
 * popup closes.
 */

export interface Edges {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface Rect extends Edges {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** The part of `bar` inside `view` (both in viewport px), or `null` when none of it is. */
export function visibleBarRect(bar: Edges, view: Edges): Rect | null {
  const left = Math.max(bar.left, view.left);
  const right = Math.min(bar.right, view.right);
  const top = Math.max(bar.top, view.top);
  const bottom = Math.min(bar.bottom, view.bottom);
  if (right <= left || bottom <= top) {
    return null;
  }
  return { x: left, y: top, left, top, right, bottom, width: right - left, height: bottom - top };
}

/**
 * Per-side distance from each edge of `outer` in to the matching edge of `inner`, plus `gap`. Used as
 * Floating UI padding, so a popup bounded by the scroll container stays inside its visible grid.
 */
export function insetsWithin(outer: Edges, inner: Edges, gap: number): Edges {
  return {
    left: inner.left - outer.left + gap,
    top: inner.top - outer.top + gap,
    right: outer.right - inner.right + gap,
    bottom: outer.bottom - inner.bottom + gap,
  };
}

/** The scroll container's client box (inside borders and scrollbars), in viewport px. */
export function clientBox(scroller: HTMLElement): Edges {
  const rect = scroller.getBoundingClientRect();
  const left = rect.left + scroller.clientLeft;
  const top = rect.top + scroller.clientTop;
  return { left, top, right: left + scroller.clientWidth, bottom: top + scroller.clientHeight };
}

/**
 * The part of the calendar grid the user can see, in viewport px: the scroll container's client
 * area minus the sticky day header (top), footer (bottom) and room-name column (inline start -
 * physical right in RTL). `clientLeft` covers a vertical scrollbar on the left in RTL.
 */
export function measureGridView(scroller: HTMLElement, stickyColumnWidth: number, isRtl: boolean): Edges {
  const { left, right } = clientBox(scroller);
  let { top, bottom } = clientBox(scroller);
  // Every header cell sticks at the same height, so one is enough.
  const header = scroller.querySelector('.stickyCell');
  if (header) {
    top = Math.max(top, header.getBoundingClientRect().bottom);
  }
  const footer = scroller.querySelector('igl-cal-footer');
  if (footer) {
    bottom = Math.min(bottom, footer.getBoundingClientRect().top);
  }
  return isRtl ? { left, right: right - stickyColumnWidth, top, bottom } : { left: left + stickyColumnWidth, right, top, bottom };
}

/**
 * A Floating UI virtual element: what `wa-popup` accepts as an anchor besides a real element.
 *
 * Deliberately without `contextElement`: Web Awesome 3.8.0's `isVirtualElement` tests
 * `e instanceof Element` where it means `e.contextElement instanceof Element`, so any virtual anchor
 * carrying one is rejected and the popup never shows. Without it the popup no longer hears the
 * calendar's scroll container, so the bar calls `reposition()` on scroll itself while it is open.
 */
export interface BarAnchor {
  getBoundingClientRect(): DOMRect;
}

/**
 * The bar, as a popup anchor whose rect is the bar's visible part. `isVisible()` measures afresh
 * every time: a cached answer from an earlier frame (say, from when the bar had scrolled away) is
 * exactly what made a reopened popup close itself again.
 */
export function createBarAnchor(bar: HTMLElement, getView: () => Edges | null) {
  const visiblePart = () => {
    const view = getView();
    return view ? visibleBarRect(bar.getBoundingClientRect(), view) : null;
  };
  const anchor: BarAnchor = {
    getBoundingClientRect() {
      const part = visiblePart();
      // Out of view: the whole bar, so the last frame before the popup closes stays on it.
      return part ? new DOMRect(part.x, part.y, part.width, part.height) : bar.getBoundingClientRect();
    },
  };
  return { anchor, isVisible: () => !getView() || visiblePart() !== null };
}

/**
 * Viewports the info panel cannot be trusted to fit in beside its bar: too narrow for the panel's
 * width, or - a phone on its side - too short for its height.
 */
const COMPACT_VIEWPORT_QUERY = '(max-width: 600px), (max-height: 500px)';

export function isCompactViewport(): boolean {
  return window.matchMedia?.(COMPACT_VIEWPORT_QUERY).matches ?? false;
}
