import {
  CELL_HEIGHT,
  CELL_WIDTH,
  computeEventHorizontalGeometry,
  EVENT_HEIGHT,
  EVENT_SPACE,
  getEventLeftWithinDay,
  getEventTopWithinRow,
  ROOM_HEADER_WIDTH,
  snapEventLeft,
  toLogicalLeft,
  toPhysicalLeft,
} from './calendar-grid';
import { DayData } from '@/models/DayType';

const days = Array.from({ length: 10 }, (_, i) => ({ value: `2026-09-0${i}` }) as DayData);
const totalGridWidth = ROOM_HEADER_WIDTH + days.length * CELL_WIDTH;

/** Where a bar starting on `dayIndex` comes to rest, which is what a snap has to reproduce. */
const restingLeft = (dayIndex: number, startsAfterWindowOpen = false) =>
  computeEventHorizontalGeometry({ days, fromDate: days[dayIndex].value, stayDays: 2, startsAfterWindowOpen }).left;

describe('getEventTopWithinRow', () => {
  it('centres the bar in a room row', () => {
    const offset = getEventTopWithinRow();
    expect(offset).toBe((CELL_HEIGHT - EVENT_HEIGHT) / 2);
    // Equal gap above and below is the whole point.
    expect(CELL_HEIGHT - offset - EVENT_HEIGHT).toBe(offset);
  });

  it('centres in a measured row of any height', () => {
    expect(getEventTopWithinRow(40)).toBe(10);
  });
});

describe('getEventLeftWithinDay', () => {
  it('starts a bar half a cell in, because check-in is midday', () => {
    expect(getEventLeftWithinDay(false)).toBe(CELL_WIDTH / 2 + EVENT_SPACE / 2);
  });

  it('drops the half cell for a booking that continues in from before the window', () => {
    expect(getEventLeftWithinDay(true)).toBe(EVENT_SPACE / 2);
  });
});

describe('toLogicalLeft', () => {
  it('round-trips a physical left back to the chronological one', () => {
    const logical = restingLeft(3);
    const physical = toPhysicalLeft(logical, 100, true, totalGridWidth);
    expect(toLogicalLeft(physical, 100, true, totalGridWidth)).toBe(logical);
  });
});

describe('snapEventLeft', () => {
  const width = 2 * CELL_WIDTH - EVENT_SPACE;

  it('leaves an already-resting bar exactly where it is', () => {
    const left = restingLeft(4);
    expect(snapEventLeft({ physicalLeft: left, width, isRtl: false, totalGridWidth, startsAfterWindowOpen: false })).toBe(left);
  });

  it('pulls a freely dragged bar back onto the nearest day', () => {
    const snapped = snapEventLeft({ physicalLeft: restingLeft(4) + 12, width, isRtl: false, totalGridWidth, startsAfterWindowOpen: false });
    expect(snapped).toBe(restingLeft(4));
  });

  it('moves on to the next day once the drag passes the halfway point', () => {
    const justBefore = snapEventLeft({ physicalLeft: restingLeft(4) + CELL_WIDTH / 2 - 1, width, isRtl: false, totalGridWidth, startsAfterWindowOpen: false });
    const justAfter = snapEventLeft({ physicalLeft: restingLeft(4) + CELL_WIDTH / 2 + 1, width, isRtl: false, totalGridWidth, startsAfterWindowOpen: false });

    expect(justBefore).toBe(restingLeft(4));
    expect(justAfter).toBe(restingLeft(5));
  });

  it('honours the phase of a booking that continues in from before the window', () => {
    const left = restingLeft(4, true);
    expect(snapEventLeft({ physicalLeft: left + 9, width, isRtl: false, totalGridWidth, startsAfterWindowOpen: true })).toBe(left);
  });

  it('snaps onto the same day in RTL as in LTR, not onto its reflection', () => {
    const dayIndex = 4;
    const resting = toPhysicalLeft(restingLeft(dayIndex), width, true, totalGridWidth);
    // Nudged toward the physical left, which in RTL is *later* in time - and still under half a
    // cell, so it must snap back to the day it started on.
    const snapped = snapEventLeft({ physicalLeft: resting - 12, width, isRtl: true, totalGridWidth, startsAfterWindowOpen: false });

    expect(snapped).toBe(resting);
    expect(toLogicalLeft(snapped, width, true, totalGridWidth)).toBe(restingLeft(dayIndex));
  });

  it('steps a whole day at a time in RTL, mirrored', () => {
    const resting = toPhysicalLeft(restingLeft(4), width, true, totalGridWidth);
    const snapped = snapEventLeft({ physicalLeft: resting - CELL_WIDTH, width, isRtl: true, totalGridWidth, startsAfterWindowOpen: false });

    // One cell toward the physical left in RTL is one day later.
    expect(toLogicalLeft(snapped, width, true, totalGridWidth)).toBe(restingLeft(5));
  });
});
