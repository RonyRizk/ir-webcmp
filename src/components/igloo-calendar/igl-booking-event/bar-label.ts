/**
 * Keeping a booking bar's label in the part of the bar the user can see.
 *
 * A long stay (50 nights is ~2,900px) is usually wider than the viewport, so a label centred in the
 * bar sits off screen. The label is instead centred in the bar's *visible* part, recomputed as the
 * calendar scrolls.
 */

/** Gap kept between the label and each visible edge of the bar. */
export const LABEL_INSET = 5;

export interface LabelSpan {
  /** Where the label's centre goes, in px from the bar's physical left edge. */
  center: number;
}

/**
 * Where to centre a bar's label, or `null` when the default (centred in the whole bar) is already
 * right: the bar is entirely visible, or entirely out of view. All inputs are physical px in the
 * bars' container; the view is the scroll viewport minus the sticky room-name column.
 *
 * The label is centred in the bar's visible part. When the name is wider than that part, it is
 * kept inside the bar instead - resting against the bar's visible end, with the viewport edge
 * cutting the rest - because pure positioning costs no layout, where narrowing the label to the
 * visible width would cost one per clipped bar per scroll frame.
 */
export function visibleLabelSpan({
  barLeft,
  barWidth,
  viewStart,
  viewEnd,
  labelWidth,
}: {
  barLeft: number;
  barWidth: number;
  viewStart: number;
  viewEnd: number;
  /** The label's natural (untruncated) width. */
  labelWidth: number;
}): LabelSpan | null {
  const barRight = barLeft + barWidth;
  const start = Math.max(barLeft, viewStart);
  const end = Math.min(barRight, viewEnd);
  if (end <= start || (start === barLeft && end === barRight)) {
    return null;
  }
  // The label never grows past the bar (CSS truncates it there), so half its rendered width:
  const half = Math.min(labelWidth, barWidth - 2 * LABEL_INSET) / 2;
  const center = (start + end) / 2 - barLeft;
  return { center: Math.min(Math.max(center, LABEL_INSET + half), barWidth - LABEL_INSET - half) };
}

/** A bar whose label the tracker keeps in view. */
export interface LabelledBar {
  readonly element: HTMLElement;
  /**
   * The label element itself. The position is written straight onto it, never onto the bar: custom
   * properties inherit, so setting them on the bar restyles everything inside it - tooltips and
   * their shadow trees included - and that cost ~20ms per scroll frame at 1,000 bookings.
   */
  labelElement(): HTMLElement | null;
  /** Physical position the bar is displayed at (cached by the bar, not read from the DOM), or `null` while a gesture owns it. */
  displayedGeometry(): { top: number; left: number; width: number } | null;
}

/** Rows this far beyond the top/bottom of the view are still kept up to date, so they arrive centred. */
const VERTICAL_MARGIN = 100;

/**
 * One per calendar scroll container: a passive scroll listener and a resize observer feed a single
 * animation frame. It reads two rects, does arithmetic over the bars' cached positions, and then
 * writes one transform offset to each bar the viewport edge clips (rows out of view are skipped).
 * Fully visible bars carry no inline label style and fall back to plain centring in CSS.
 * Measured at 1,000 bookings: no extra layout, ~0.8ms of style per horizontally scrolled frame.
 */
class LabelTracker {
  private bars = new Set<LabelledBar>();
  private applied = new WeakMap<LabelledBar, number | null>();
  private naturalWidth = new WeakMap<LabelledBar, { text: string; width: number }>();
  private frame = 0;
  private resizeObserver: ResizeObserver | null = null;

  constructor(
    readonly scroller: HTMLElement,
    private stickyColumnWidth: number,
    private isRtl: () => boolean,
  ) {
    scroller.addEventListener('scroll', this.schedule, { passive: true });
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(this.schedule);
      this.resizeObserver.observe(scroller);
    }
  }

  get isEmpty() {
    return this.bars.size === 0;
  }

  add(bar: LabelledBar) {
    this.bars.add(bar);
    this.schedule();
  }

  remove(bar: LabelledBar) {
    this.bars.delete(bar);
    if (this.bars.size === 0) {
      this.scroller.removeEventListener('scroll', this.schedule);
      this.resizeObserver?.disconnect();
      if (this.frame) {
        cancelAnimationFrame(this.frame);
        this.frame = 0;
      }
    }
  }

  /** Shifts a label from its default centre (`null` = back to default), if that changed. */
  private write(bar: LabelledBar, label: HTMLElement, shift: number | null) {
    if (this.applied.get(bar) === shift) {
      return;
    }
    this.applied.set(bar, shift);
    if (shift === null) {
      label.style.removeProperty('--ir-label-shift');
    } else {
      label.style.setProperty('--ir-label-shift', `${shift}px`);
    }
  }

  schedule = () => {
    if (!this.frame) {
      this.frame = requestAnimationFrame(this.update);
    }
  };

  private update = () => {
    this.frame = 0;
    const origin = this.bars.values().next().value?.element.parentElement;
    if (!origin) {
      return;
    }
    // Reads first, all together: the view, in the bars' own physical coordinate space.
    const view = this.scroller.getBoundingClientRect();
    const originRect = origin.getBoundingClientRect();
    const originLeft = originRect.left;
    const { clientLeft, clientWidth } = this.scroller;
    // Bars on rows scrolled out of view are skipped; scrolling them back in schedules another frame.
    const viewTop = view.top - originRect.top - VERTICAL_MARGIN;
    const viewBottom = view.bottom - originRect.top + VERTICAL_MARGIN;
    let viewStart: number;
    let viewEnd: number;
    if (this.isRtl()) {
      // The sticky room column pins to the inline start edge, which is the physical right in RTL.
      viewEnd = view.right - clientLeft - this.stickyColumnWidth - originLeft;
      viewStart = view.right - clientLeft - clientWidth - originLeft;
    } else {
      viewStart = view.left + clientLeft + this.stickyColumnWidth - originLeft;
      viewEnd = view.left + clientLeft + clientWidth - originLeft;
    }
    // Pass 1, arithmetic only: which bars the viewport clips. Every other bar goes back to default.
    const clipped: { bar: LabelledBar; label: HTMLElement; geometry: { left: number; width: number } }[] = [];
    for (const bar of this.bars) {
      const geometry = bar.displayedGeometry();
      if (!geometry || geometry.top > viewBottom || geometry.top < viewTop) {
        continue;
      }
      const label = bar.labelElement();
      if (!label) {
        continue;
      }
      const isClipped = visibleLabelSpan({ barLeft: geometry.left, barWidth: geometry.width, viewStart, viewEnd, labelWidth: 0 }) !== null;
      if (isClipped) {
        clipped.push({ bar, label, geometry });
      } else {
        this.write(bar, label, null);
      }
    }
    // Pass 2, reads: a label's natural width, measured once per text, all before any write.
    for (const { bar, label } of clipped) {
      const text = label.textContent;
      if (this.naturalWidth.get(bar)?.text !== text) {
        this.naturalWidth.set(bar, { text, width: label.scrollWidth });
      }
    }
    // Pass 3, writes: a transform shift only - no layout.
    for (const { bar, label, geometry } of clipped) {
      const span = visibleLabelSpan({ barLeft: geometry.left, barWidth: geometry.width, viewStart, viewEnd, labelWidth: this.naturalWidth.get(bar).width });
      this.write(bar, label, Math.round(span.center - geometry.width / 2));
    }
  };
}

const trackers = new WeakMap<HTMLElement, LabelTracker>();
const trackerOf = new WeakMap<LabelledBar, LabelTracker>();

/** Starts keeping `bar`'s label in view, if it sits inside a calendar scroll container. */
export function trackLabel(bar: LabelledBar, stickyColumnWidth: number, isRtl: () => boolean) {
  const scroller = bar.element.closest<HTMLElement>('.calendarScrollContainer');
  if (!scroller) {
    return;
  }
  let tracker = trackers.get(scroller);
  if (!tracker) {
    tracker = new LabelTracker(scroller, stickyColumnWidth, isRtl);
    trackers.set(scroller, tracker);
  }
  tracker.add(bar);
  trackerOf.set(bar, tracker);
}

export function untrackLabel(bar: LabelledBar) {
  const tracker = trackerOf.get(bar);
  if (!tracker) {
    return;
  }
  tracker.remove(bar);
  trackerOf.delete(bar);
  // Called from disconnectedCallback, when the bar can no longer find its scroller - the tracker can.
  if (tracker.isEmpty && trackers.get(tracker.scroller) === tracker) {
    trackers.delete(tracker.scroller);
  }
}

/** The bar moved or resized: recompute labels on the next frame. */
export function refreshLabel(bar: LabelledBar) {
  trackerOf.get(bar)?.schedule();
}
