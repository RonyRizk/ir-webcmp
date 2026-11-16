import { insetsWithin, visibleBarRect } from './bar-popup';

// Viewport px. `view` is the part of the grid not covered by the sticky header, footer or room column.
const view = { left: 170, top: 100, right: 1000, bottom: 600 };
const bar = (left: number, right: number, top = 300) => ({ left, right, top, bottom: top + 20 });

describe('visibleBarRect', () => {
  it('is the whole bar when the bar is fully in view', () => {
    expect(visibleBarRect(bar(300, 500), view)).toEqual({ x: 300, y: 300, left: 300, top: 300, right: 500, bottom: 320, width: 200, height: 20 });
  });

  it('is only the part on screen when the bar runs under the room column or off the edge', () => {
    expect(visibleBarRect(bar(50, 400), view)).toMatchObject({ left: 170, right: 400, width: 230 });
    expect(visibleBarRect(bar(800, 1500), view)).toMatchObject({ left: 800, right: 1000, width: 200 });
    expect(visibleBarRect(bar(-900, 3000), view)).toMatchObject({ left: 170, right: 1000, width: 830 });
  });

  it('is only the part below the sticky header when the bar is partly scrolled under it', () => {
    expect(visibleBarRect(bar(300, 500, 90), view)).toMatchObject({ top: 100, bottom: 110, height: 10 });
  });

  it('is nothing once the bar is entirely out of view, in any direction', () => {
    expect(visibleBarRect(bar(20, 160), view)).toBeNull();
    expect(visibleBarRect(bar(1000, 1200), view)).toBeNull();
    expect(visibleBarRect(bar(300, 500, 70), view)).toBeNull();
    expect(visibleBarRect(bar(300, 500, 600), view)).toBeNull();
  });
});

describe('insetsWithin', () => {
  // The scroll container's client box, and the visible grid inside it (header 82px, footer 40px,
  // room column 170px on the left in LTR / right in RTL).
  const container = { left: 0, top: 0, right: 1280, bottom: 800 };

  it('is how far each edge of the visible grid sits inside the container, plus a gap', () => {
    expect(insetsWithin(container, { left: 170, top: 82, right: 1280, bottom: 760 }, 8)).toEqual({ left: 178, top: 90, right: 8, bottom: 48 });
  });

  it('mirrors with the room column in RTL', () => {
    expect(insetsWithin(container, { left: 0, top: 82, right: 1110, bottom: 760 }, 8)).toEqual({ left: 8, top: 90, right: 178, bottom: 48 });
  });
});
