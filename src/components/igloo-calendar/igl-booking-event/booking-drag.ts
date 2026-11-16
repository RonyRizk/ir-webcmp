/**
 * Pure geometry for dragging and stretching a booking bar. No DOM, no component state: every
 * input is a number in the same physical `.bodyContainer` pixel space the bar is positioned in.
 */
import { CELL_WIDTH, EVENT_SPACE } from '@/utils/calendar-grid';

/**
 * Number of nights a stretched bar covers once released.
 *
 * An N-night bar is `N * CELL_WIDTH - EVENT_SPACE` wide, so the gap is added back before dividing:
 * that puts the rounding boundary at the true midpoint between two neighbouring snapped widths.
 * A bar that continues in from before the loaded window carries an extra half cell on its start
 * edge (see `computeEventHorizontalGeometry`), which is not a night and is discounted first.
 */
export function nightsFromWidth(width: number, startsAfterWindowOpen: boolean): number {
  return Math.round((width + EVENT_SPACE - (startsAfterWindowOpen ? CELL_WIDTH / 2 : 0)) / CELL_WIDTH);
}

/** Narrowest a stretch can make a bar: one night. */
export const MIN_BAR_WIDTH = CELL_WIDTH - EVENT_SPACE;

/** The physical drag handle being pulled. */
export type ResizeSide = 'leftSide' | 'rightSide';

export interface ResizeInput {
  side: ResizeSide;
  /** Physical `left` and width of the bar when the stretch began. */
  initialLeft: number;
  initialWidth: number;
  /** Physical horizontal pointer travel since the stretch began (already scroll-compensated). */
  deltaX: number;
  isRtl: boolean;
  canGrow: boolean;
  splitRole: 'fullSplit' | 'leftSplit' | 'rightSplit' | null | '';
}

export interface ResizeResult {
  left: number;
  width: number;
  shrinking: boolean;
}

/** How far a handle may travel: lengthen or shorten, shorten only, or not at all. */
export type HandleReach = 'both' | 'shrink' | 'none';

/**
 * What a physical handle is allowed to do, before any pointer moves. Drives both the stretch itself
 * and the handle's cursor, so the cursor never promises a stretch the bar will refuse.
 *
 * Handles are physical, but split-stay locks are chronological: a segment joined to an earlier one
 * (`leftSplit`) can't move its check-in edge, one joined to a later one (`rightSplit`) can't move its
 * check-out edge. Check-in is the physical left in LTR and the physical right in RTL.
 */
export function getHandleReach({ side, isRtl, canGrow, splitRole }: Pick<ResizeInput, 'side' | 'isRtl' | 'canGrow' | 'splitRole'>): HandleReach {
  const edge = (side === 'leftSide') !== isRtl ? 'checkIn' : 'checkOut';
  if (splitRole === 'fullSplit' || (splitRole === 'leftSplit' && edge === 'checkIn') || (splitRole === 'rightSplit' && edge === 'checkOut')) {
    return 'none';
  }
  return canGrow ? 'both' : 'shrink';
}

/** Where a stretch leaves the bar, or `null` when this handle may not move that way (see `getHandleReach`). */
export function resolveResize({ side, initialLeft, initialWidth, deltaX, isRtl, canGrow, splitRole }: ResizeInput): ResizeResult | null {
  const reach = getHandleReach({ side, isRtl, canGrow, splitRole });
  if (reach === 'none') {
    return null;
  }
  // Pulling the right handle right, or the left handle left, lengthens the stay.
  const growth = side === 'rightSide' ? deltaX : -deltaX;
  const shrinking = growth < 0;
  if (!shrinking && reach === 'shrink') {
    return null;
  }
  const width = Math.max(MIN_BAR_WIDTH, initialWidth + growth);
  const left = side === 'rightSide' ? initialLeft : initialLeft + (initialWidth - width);
  return { left, width, shrinking };
}
