import { DEFAULT_EDGE_SIZE, DEFAULT_MAX_SPEED, DragAutoScroller } from './drag-autoscroll';

/**
 * Minimal stand-in for a scrollable element: `scrollLeft`/`scrollTop` clamp to the configured
 * extents the way a real one does, which is what `offset` relies on to stop accumulating at the
 * ends of the grid. `min`/`max` are separate so the RTL range (non-positive scrollLeft) can be
 * modelled as well as the LTR one.
 */
function createContainer({
  rect,
  xRange = [0, 1000],
  yRange = [0, 1000],
}: {
  rect: { left: number; top: number; width: number; height: number };
  xRange?: [number, number];
  yRange?: [number, number];
}) {
  let scrollLeft = 0;
  let scrollTop = 0;
  const clamp = (value: number, [min, max]: [number, number]) => Math.min(Math.max(value, min), max);
  return {
    getBoundingClientRect: () => ({
      left: rect.left,
      top: rect.top,
      right: rect.left + rect.width,
      bottom: rect.top + rect.height,
      width: rect.width,
      height: rect.height,
    }),
    get scrollLeft() {
      return scrollLeft;
    },
    set scrollLeft(value: number) {
      scrollLeft = clamp(value, xRange);
    },
    get scrollTop() {
      return scrollTop;
    },
    set scrollTop(value: number) {
      scrollTop = clamp(value, yRange);
    },
  } as unknown as HTMLElement;
}

describe('DragAutoScroller', () => {
  let frames: FrameRequestCallback[];
  let realRaf: typeof requestAnimationFrame;
  let realCancelRaf: typeof cancelAnimationFrame;

  // Stubbed on `globalThis`, not `window`: the two are distinct objects under Stencil's test
  // environment, and a bare `requestAnimationFrame` call inside the module resolves to the former.
  beforeEach(() => {
    frames = [];
    realRaf = globalThis.requestAnimationFrame;
    realCancelRaf = globalThis.cancelAnimationFrame;
    globalThis.requestAnimationFrame = ((cb: FrameRequestCallback) => {
      frames.push(cb);
      return frames.length;
    }) as typeof requestAnimationFrame;
    globalThis.cancelAnimationFrame = ((id: number) => {
      frames[id - 1] = undefined;
    }) as typeof cancelAnimationFrame;
  });

  afterEach(() => {
    globalThis.requestAnimationFrame = realRaf;
    globalThis.cancelAnimationFrame = realCancelRaf;
  });

  /** Runs every frame currently queued, collecting whatever those frames queue next. */
  const runFrames = (count = 1) => {
    for (let i = 0; i < count; i++) {
      const pending = frames;
      frames = [];
      pending.forEach(cb => cb?.(0));
    }
  };

  const baseRect = { left: 100, top: 100, width: 600, height: 400 };

  it('does not scroll while the pointer is away from every edge', () => {
    const container = createContainer({ rect: baseRect });
    const scroller = new DragAutoScroller({ container, axes: { x: true, y: true } });
    scroller.start();
    scroller.update(400, 300);
    runFrames(3);

    expect(scroller.offset).toEqual({ x: 0, y: 0 });
    expect(container.scrollTop).toBe(0);
  });

  it('scrolls down at full speed once the pointer reaches the bottom edge', () => {
    const container = createContainer({ rect: baseRect });
    const scroller = new DragAutoScroller({ container, axes: { y: true } });
    scroller.start();
    scroller.update(400, baseRect.top + baseRect.height);
    runFrames(1);

    expect(container.scrollTop).toBe(DEFAULT_MAX_SPEED);
    expect(scroller.offset.y).toBe(DEFAULT_MAX_SPEED);
  });

  it('ramps speed with how deep into the hot zone the pointer is', () => {
    const container = createContainer({ rect: baseRect });
    const scroller = new DragAutoScroller({ container, axes: { y: true } });
    scroller.start();
    // Halfway into the bottom hot zone.
    scroller.update(400, baseRect.top + baseRect.height - DEFAULT_EDGE_SIZE / 2);
    runFrames(1);

    expect(container.scrollTop).toBeCloseTo(DEFAULT_MAX_SPEED / 2);
  });

  it('scrolls up when the pointer is above the top edge', () => {
    const container = createContainer({ rect: baseRect, yRange: [-500, 500] });
    const scroller = new DragAutoScroller({ container, axes: { y: true } });
    scroller.start();
    scroller.update(400, baseRect.top - 50);
    runFrames(1);

    expect(container.scrollTop).toBe(-DEFAULT_MAX_SPEED);
  });

  it('ignores an axis the drag did not enable', () => {
    const container = createContainer({ rect: baseRect });
    // A stretch scrolls horizontally only - the bar never changes rows.
    const scroller = new DragAutoScroller({ container, axes: { x: true, y: false } });
    scroller.start();
    scroller.update(baseRect.left + baseRect.width, baseRect.top + baseRect.height);
    runFrames(1);

    expect(container.scrollLeft).toBe(DEFAULT_MAX_SPEED);
    expect(container.scrollTop).toBe(0);
  });

  describe('sticky column inset', () => {
    const inset = 170;
    // Far enough in that it clears an un-inset hot zone, but inside one shifted by the column.
    const depth = inset + DEFAULT_EDGE_SIZE - 10;

    it('leaves the hot zone at the container edge when there is no inset', () => {
      const container = createContainer({ rect: baseRect, xRange: [-1000, 1000] });
      const scroller = new DragAutoScroller({ container, axes: { x: true } });
      scroller.start();
      scroller.update(baseRect.left + depth, 300);
      runFrames(1);

      expect(container.scrollLeft).toBe(0);
    });

    it('moves the hot zone inward past the column pinned to the left edge in LTR', () => {
      const container = createContainer({ rect: baseRect, xRange: [-1000, 1000] });
      const scroller = new DragAutoScroller({ container, axes: { x: true }, inlineStartInset: inset, inlineStartEdge: 'left' });
      scroller.start();
      scroller.update(baseRect.left + depth, 300);
      runFrames(1);

      expect(container.scrollLeft).toBeLessThan(0);
    });

    it('moves the hot zone inward past the column pinned to the right edge in RTL', () => {
      const container = createContainer({ rect: baseRect, xRange: [-1000, 1000] });
      const scroller = new DragAutoScroller({ container, axes: { x: true }, inlineStartInset: inset, inlineStartEdge: 'right' });
      scroller.start();
      // Mirror of the LTR probe: the same depth measured in from the physical right edge.
      scroller.update(baseRect.left + baseRect.width - depth, 300);
      runFrames(1);

      expect(container.scrollLeft).toBeGreaterThan(0);
    });

    it('scrolls at full speed while the pointer is over the column itself', () => {
      // The column can't be dropped on, so sitting on it means "keep scrolling", not "stop".
      const container = createContainer({ rect: baseRect, xRange: [-1000, 1000] });
      const scroller = new DragAutoScroller({ container, axes: { x: true }, inlineStartInset: inset, inlineStartEdge: 'left' });
      scroller.start();
      scroller.update(baseRect.left + 10, 300);
      runFrames(1);

      expect(container.scrollLeft).toBe(-DEFAULT_MAX_SPEED);
    });
  });

  it('reports the same physical offset in RTL, where scrollLeft runs non-positive', () => {
    const container = createContainer({ rect: baseRect, xRange: [-1000, 0] });
    const scroller = new DragAutoScroller({ container, axes: { x: true } });
    scroller.start();
    // Toward the physical left edge: scrollLeft decreases, and so does the physical offset.
    scroller.update(baseRect.left, 300);
    runFrames(1);

    expect(container.scrollLeft).toBe(-DEFAULT_MAX_SPEED);
    expect(scroller.offset.x).toBe(-DEFAULT_MAX_SPEED);
  });

  it('stops accumulating offset once the container hits its scroll extent', () => {
    const container = createContainer({ rect: baseRect, yRange: [0, DEFAULT_MAX_SPEED + 5] });
    const scroller = new DragAutoScroller({ container, axes: { y: true } });
    scroller.start();
    scroller.update(400, baseRect.top + baseRect.height);
    runFrames(5);

    expect(scroller.offset.y).toBe(DEFAULT_MAX_SPEED + 5);
  });

  it('honours bounds tighter than the container’s own scroll extent', () => {
    // A dragged element that lives inside the scroll container inflates `scrollHeight` as it
    // follows the pointer; `getBounds` pins the travel to the real content instead.
    const container = createContainer({ rect: baseRect, yRange: [0, 100000] });
    const scroller = new DragAutoScroller({ container, axes: { y: true }, getBounds: () => ({ y: [0, 30] }) });
    scroller.start();
    scroller.update(400, baseRect.top + baseRect.height);
    runFrames(6);

    expect(container.scrollTop).toBe(30);
    expect(scroller.offset.y).toBe(30);
  });

  it('honours the mirrored bounds an RTL container reports', () => {
    const container = createContainer({ rect: baseRect, xRange: [-100000, 0] });
    const scroller = new DragAutoScroller({ container, axes: { x: true }, getBounds: () => ({ x: [-30, 0] }) });
    scroller.start();
    scroller.update(baseRect.left, 300);
    runFrames(6);

    expect(container.scrollLeft).toBe(-30);
  });

  it('includes scrolling from other sources in the reported offset', () => {
    const container = createContainer({ rect: baseRect });
    const scroller = new DragAutoScroller({ container, axes: { y: true } });
    scroller.start();
    // A mouse wheel, say, moving the grid while the pointer sits still.
    container.scrollTop = 120;

    expect(scroller.offset.y).toBe(120);
  });

  it('notifies only on frames that actually moved the container', () => {
    const onScroll = jest.fn();
    const container = createContainer({ rect: baseRect, yRange: [0, DEFAULT_MAX_SPEED] });
    const scroller = new DragAutoScroller({ container, axes: { y: true }, onScroll });
    scroller.start();
    scroller.update(400, baseRect.top + baseRect.height);
    runFrames(4);

    expect(onScroll).toHaveBeenCalledTimes(1);
  });

  it('stops scrolling once the pointer leaves the hot zone', () => {
    const container = createContainer({ rect: baseRect });
    const scroller = new DragAutoScroller({ container, axes: { y: true } });
    scroller.start();
    scroller.update(400, baseRect.top + baseRect.height);
    runFrames(1);
    const afterOneFrame = container.scrollTop;

    scroller.update(400, 300);
    runFrames(3);

    expect(container.scrollTop).toBe(afterOneFrame);
  });

  it('stop() cancels the loop', () => {
    const container = createContainer({ rect: baseRect });
    const scroller = new DragAutoScroller({ container, axes: { y: true } });
    scroller.start();
    scroller.update(400, baseRect.top + baseRect.height);
    scroller.stop();
    runFrames(3);

    expect(container.scrollTop).toBe(0);
  });
});
