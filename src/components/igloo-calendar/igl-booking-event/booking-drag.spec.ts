import { getHandleReach, nightsFromWidth, resolveResize } from './booking-drag';

// Grid: 58px day cells, 8px gap between neighbouring bars. A bar of N nights is N*58-8 wide,
// plus half a cell when it continues in from before the loaded window.
describe('nightsFromWidth', () => {
  it('reads a released bar width as the nights it covers', () => {
    expect(nightsFromWidth(108, false)).toBe(2);
  });

  it('discounts the half-cell lead-in of a bar that starts before the loaded window', () => {
    expect(nightsFromWidth(137, true)).toBe(2);
  });

  it('rounds a width released part-way through a day to the nearest night', () => {
    expect(nightsFromWidth(140, false)).toBe(3);
    expect(nightsFromWidth(120, false)).toBe(2);
  });
});

describe('resolveResize', () => {
  // A 2-night bar sitting at x=200.
  const bar = { initialLeft: 200, initialWidth: 108, isRtl: false, canGrow: true, splitRole: null };

  it('grows a bar from its right handle without moving its left edge', () => {
    expect(resolveResize({ ...bar, side: 'rightSide', deltaX: 58 })).toEqual({ left: 200, width: 166, shrinking: false });
  });

  it('shrinks a bar from its left handle by moving its left edge in', () => {
    expect(resolveResize({ ...bar, side: 'leftSide', deltaX: 58 })).toEqual({ left: 258, width: 50, shrinking: true });
  });

  it('never squeezes a bar below one night, from either handle', () => {
    expect(resolveResize({ ...bar, side: 'rightSide', deltaX: -500 })).toEqual({ left: 200, width: 50, shrinking: true });
    expect(resolveResize({ ...bar, side: 'leftSide', deltaX: 500 })).toEqual({ left: 258, width: 50, shrinking: true });
  });

  it('lets a booking that may not grow (OTA) be shortened but not lengthened', () => {
    const ota = { ...bar, canGrow: false };
    expect(resolveResize({ ...ota, side: 'rightSide', deltaX: 58 })).toBeNull();
    expect(resolveResize({ ...ota, side: 'leftSide', deltaX: -58 })).toBeNull();
    expect(resolveResize({ ...ota, side: 'rightSide', deltaX: -58 })).toEqual({ left: 200, width: 50, shrinking: true });
  });

  describe('split stays', () => {
    // leftSplit: an earlier segment is joined to this one's check-in edge.
    // rightSplit: a later segment is joined to this one's check-out edge.
    it('keeps the edge joined to another segment fixed in LTR, where check-in is on the left', () => {
      expect(resolveResize({ ...bar, splitRole: 'leftSplit', side: 'leftSide', deltaX: 58 })).toBeNull();
      expect(resolveResize({ ...bar, splitRole: 'leftSplit', side: 'rightSide', deltaX: 58 })).not.toBeNull();
      expect(resolveResize({ ...bar, splitRole: 'rightSplit', side: 'rightSide', deltaX: 58 })).toBeNull();
      expect(resolveResize({ ...bar, splitRole: 'rightSplit', side: 'leftSide', deltaX: -58 })).not.toBeNull();
    });

    it('keeps the edge joined to another segment fixed in RTL, where check-in is on the right', () => {
      const rtl = { ...bar, isRtl: true };
      expect(resolveResize({ ...rtl, splitRole: 'leftSplit', side: 'rightSide', deltaX: -58 })).toBeNull();
      expect(resolveResize({ ...rtl, splitRole: 'leftSplit', side: 'leftSide', deltaX: -58 })).not.toBeNull();
      expect(resolveResize({ ...rtl, splitRole: 'rightSplit', side: 'leftSide', deltaX: -58 })).toBeNull();
      expect(resolveResize({ ...rtl, splitRole: 'rightSplit', side: 'rightSide', deltaX: 58 })).not.toBeNull();
    });

    it('keeps both edges of a middle segment fixed', () => {
      expect(resolveResize({ ...bar, splitRole: 'fullSplit', side: 'leftSide', deltaX: 58 })).toBeNull();
      expect(resolveResize({ ...bar, splitRole: 'fullSplit', side: 'rightSide', deltaX: -58 })).toBeNull();
    });
  });
});

describe('getHandleReach', () => {
  const base = { isRtl: false, canGrow: true, splitRole: '' as const };

  it('lets both handles of a direct stay travel either way', () => {
    expect(getHandleReach({ ...base, side: 'leftSide' })).toBe('both');
    expect(getHandleReach({ ...base, side: 'rightSide' })).toBe('both');
  });

  it('only lets an OTA stay shrink', () => {
    expect(getHandleReach({ ...base, canGrow: false, side: 'leftSide' })).toBe('shrink');
    expect(getHandleReach({ ...base, canGrow: false, side: 'rightSide' })).toBe('shrink');
  });

  it('locks the joined edge of a split stay, in both directions', () => {
    expect(getHandleReach({ ...base, splitRole: 'leftSplit', side: 'leftSide' })).toBe('none');
    expect(getHandleReach({ ...base, splitRole: 'leftSplit', side: 'rightSide' })).toBe('both');
    expect(getHandleReach({ ...base, isRtl: true, splitRole: 'leftSplit', side: 'rightSide' })).toBe('none');
    expect(getHandleReach({ ...base, isRtl: true, splitRole: 'leftSplit', side: 'leftSide' })).toBe('both');
    expect(getHandleReach({ ...base, splitRole: 'fullSplit', side: 'leftSide' })).toBe('none');
    expect(getHandleReach({ ...base, splitRole: 'fullSplit', side: 'rightSide' })).toBe('none');
  });

  it('a locked edge stays locked even when the stay could grow', () => {
    expect(getHandleReach({ ...base, canGrow: false, splitRole: 'rightSplit', side: 'rightSide' })).toBe('none');
  });
});
