import { ClTx } from '@/services/city-ledger/types';

type Row = ClTx;

export type GroupedItem = Row | BookingGroup | UnitGroup;

export interface BookingGroup {
  BOOK_NBR: Row['BOOK_NBR'];
  subRows: GroupedItem[];
}

export interface UnitGroup {
  PR_ID: Row['PR_ID'];
  subRows: Row[];
  occupancy: number;
  GUEST_FIRST_NAME: string;
  GUEST_LAST_NAME: string;
  FROM_DATE: string;
  TO_DATE: string;
  ROOM_CATEGORY_ID: number;
  ROOM_TYPE_ID: number;
}
/**
 * Groups a flat array of transaction rows into a two-level hierarchy,
 * then sorts every level so the oldest SERVICE_DATE appears first.
 *
 * Level 1 — Booking groups:
 *   Rows that share the same BOOK_NBR are collapsed into a parent object
 *   { BOOK_NBR, subRows: [...] }. Rows with no BOOK_NBR are kept flat.
 *   The top-level array is sorted by each item's oldest SERVICE_DATE so that
 *   a booking group is "pulled up" by whichever of its rows has the earliest date.
 *
 * Level 2 — Unit groups (inside each booking's subRows):
 *   Within a booking, rows that share the same PR_ID (room/unit identifier)
 *   are further collapsed into { PR_ID, subRows: [...] }.
 *   Rows with PR_ID = 0 / null, or whose PR_ID is unique within the booking,
 *   are kept flat inside the booking's subRows.
 *   The booking's subRows array is sorted by each item's oldest SERVICE_DATE
 *   so that a unit group is pulled up by its earliest row.
 *
 *   The rows inside each unit group are also sorted oldest-first.
 *
 * @param  rows - Raw transaction rows from the API.
 * @returns {Array} Grouped and sorted rows ready for rendering.
 */
export const groupData = (rows: ClTx[]): UnitGroup[] => {
  // ── Sorting helper ────────────────────────────────────────────────────────

  /**
   * Returns the oldest SERVICE_DATE found within an item.
   * If the item is a group (has subRows), recurse to find the minimum date
   * across all descendants. If it is a plain row, return its own SERVICE_DATE.
   */
  const getOldestDate = item => {
    if (item.subRows && item.subRows.length > 0) {
      return item.subRows.reduce((oldest, child) => {
        const childDate = getOldestDate(child);
        if (!oldest) return childDate;
        return childDate < oldest ? childDate : oldest;
      }, '');
    }
    return item.SERVICE_DATE ?? '';
  };

  const sortByOldestDate = arr => {
    return arr.sort((a, b) => {
      const dateA = getOldestDate(a);
      const dateB = getOldestDate(b);
      return dateA.localeCompare(dateB);
    });
  };

  // ── Level 1: split rows into "no booking" vs "has booking" ──────────────

  const standalone = [];
  const bookingMap = new Map();

  for (const row of rows) {
    if (!row.BOOK_NBR) {
      standalone.push(row);
    } else {
      if (!bookingMap.has(row.BOOK_NBR)) {
        bookingMap.set(row.BOOK_NBR, []);
      }
      bookingMap.get(row.BOOK_NBR).push(row);
    }
  }

  // ── Level 2: within each booking, group rows by PR_ID (unit/room) ───────

  const groupByUnit = bookingRows => {
    const unitStandalone = [];
    const unitMap = new Map();

    for (const row of bookingRows) {
      if (!row.PR_ID) {
        unitStandalone.push(row);
      } else {
        if (!unitMap.has(row.PR_ID)) {
          unitMap.set(row.PR_ID, []);
        }
        unitMap.get(row.PR_ID).push(row);
      }
    }

    const unitGroups = [];
    for (const [prId, subRows] of unitMap.entries()) {
      const sorted = sortByOldestDate(subRows);
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      unitGroups.push({
        PR_ID: prId,
        subRows: sorted,
        occupancy: (first.ADULTS_NBR ?? 0) + (first.CHILD_NBR ?? 0) + (first.INFANT_NBR ?? 0),
        GUEST_FIRST_NAME: first.GUEST_FIRST_NAME ?? '',
        GUEST_LAST_NAME: first.GUEST_LAST_NAME ?? '',
        FROM_DATE: first.FROM_DATE ?? '',
        TO_DATE: last.TO_DATE ?? '',
        ROOM_CATEGORY_ID: first.ROOM_CATEGORY_ID ?? 0,
        ROOM_TYPE_ID: first.ROOM_TYPE_ID ?? 0,
      });
    }

    return sortByOldestDate([...unitStandalone, ...unitGroups]);
  };

  // ── Assemble final result ─────────────────────────────────────────────────

  const bookingGroups = [];
  for (const [bookNbr, bookingRows] of bookingMap.entries()) {
    bookingGroups.push({
      BOOK_NBR: bookNbr,
      subRows: groupByUnit(bookingRows),
    });
  }

  return sortByOldestDate([...standalone, ...bookingGroups]);
};
