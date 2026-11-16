// Network boundary: the bar's only collaborators that talk to the backend.
const mockBookingService = { getExposedBooking: jest.fn() };
const mockEventsService = { reallocateEvent: jest.fn(() => Promise.resolve()) };
jest.mock('axios', () => ({
  __esModule: true,
  default: { post: jest.fn(), get: jest.fn(), create: jest.fn(), interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } } },
}));
jest.mock('../../../../services/booking-service/booking.service', () => ({ BookingService: jest.fn(() => mockBookingService) }));
jest.mock('../../../../services/events.service', () => ({ EventsService: jest.fn(() => mockEventsService) }));

import { newSpecPage, SpecPage } from '@stencil/core/testing';
import { IglBookingEvent } from '../igl-booking-event';
import calendar_dates from '@/stores/calendar-dates.store';
import calendar_data from '@/stores/calendar-data';
import locales from '@/stores/locales.store';

/*
 * Grid used throughout: 170px room column, 58px day cells, 8px gap between bars.
 * The booking below starts on day index 2 (2026-09-03) for 2 nights in room 12, whose row top is 100.
 *   left  = 170 + 2*58 + 58/2 + 8/2 = 319
 *   width = 2*58 - 8              = 108
 *   top   = 100 + (30 - 20)/2     = 105
 */
const DAYS = Array.from({ length: 14 }, (_, i) => ({ value: `2026-09-${String(i + 1).padStart(2, '0')}` }));
const BAR = { left: 319, width: 108, top: 105 };
const DAY = 58;

const legendData = {
  2: { color: '#00aa00' },
  6: { color: '#cc0000' },
  8: { color: '#ffaa00' },
  10: { color: '#f34752' },
  statusId: {
    'CONFIRMED': { id: 2, clsName: 'CONFIRMED' },
    'BLOCKED': { id: 6, clsName: 'BLOCKED' },
    'NOTES': { id: 8, clsName: 'NOTES' },
    'OUTSTANDING-BALANCE': { id: 10, clsName: 'OUTSTANDING_BALANCE' },
  },
};

const booking = (overrides: Record<string, any> = {}) => ({
  ID: 'b1',
  POOL: 'pool-1',
  BOOKING_NUMBER: '100',
  IDENTIFIER: 'room-1',
  NAME: 'Ada Lovelace',
  STATUS: 'CONFIRMED',
  STATUS_CODE: '001',
  FROM_DATE: '2026-09-03',
  TO_DATE: '2026-09-05',
  NO_OF_DAYS: 2,
  PR_ID: 12,
  is_direct: true,
  BALANCE: 0,
  ROOMS: [],
  defaultDates: { from_date: '2026-09-03', to_date: '2026-09-05' },
  legendData,
  roomsInfo: [],
  ...overrides,
});

/** A block (out-of-service) bar: tapping it opens the bubble straight away, no booking fetch. */
const block = (overrides: Record<string, any> = {}) => booking({ STATUS: 'BLOCKED', STATUS_CODE: '003', BOOKING_NUMBER: undefined, ...overrides });

type Emitted = { name: string; detail: any };

// newSpecPage reuses one window and document between tests and wipes their listeners without
// disconnecting the previous test's components, so unmount them here, as a real page would.
let mounted: HTMLElement[] = [];
afterEach(() => {
  mounted.forEach(el => el.remove());
  mounted = [];
});

async function renderBars(bookings: Record<string, any>[], { phone = false } = {}) {
  calendar_dates.days = DAYS as any;
  calendar_data.property = { is_automatic_check_in_out: true, currency: { symbol: '$' }, roomtypes: [] } as any;
  calendar_data.colorsForegrounds = {} as any;
  locales.direction = 'ltr' as any;

  const page = await newSpecPage({
    components: [IglBookingEvent],
    // No `.calendarScrollContainer`: mock-doc has no layout to scroll, and edge auto-scroll is covered by drag-autoscroll.spec.
    html: `<div class="bodyContainer"></div>`,
  });
  if (phone) {
    page.win.matchMedia = (() => ({ matches: true })) as unknown as typeof window.matchMedia;
  }
  const container = page.body.querySelector('.bodyContainer') as HTMLElement;
  mounted.push(container);
  const bars = bookings.map(b => {
    const bar = page.doc.createElement('igl-booking-event') as any;
    bar.bookingEvent = b;
    bar.roomTop = 100;
    bar.getAllBookingEvents = () => bookings;
    container.appendChild(bar);
    return bar as HTMLElement & { bookingEvent: any };
  });
  await page.waitForChanges();

  const emitted: Emitted[] = [];
  for (const name of ['dragOverEventData', 'showDialog', 'showRoomNightsDialog', 'updateBookingEvent']) {
    page.win.addEventListener(name, (e: CustomEvent) => emitted.push({ name, detail: e.detail }));
  }
  return { page, bars, emitted };
}

async function renderBar(b: Record<string, any> = booking(), options: { phone?: boolean } = {}) {
  const { page, bars, emitted } = await renderBars([b], options);
  return { page, bar: bars[0], emitted };
}

const pointer = (page: SpecPage, target: Element, type: string, x: number, y: number, init: Record<string, any> = {}) => {
  const ev = new (page.win as any).MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX: x,
    clientY: y,
    button: 0,
    pointerId: 1,
    pointerType: 'mouse',
    isPrimary: true,
    ...init,
  } as any);
  target.dispatchEvent(ev as any);
  return ev;
};

/** Press on `target`, move by (dx, dy) in a few steps, release. */
async function drag(page: SpecPage, target: Element, dx: number, dy = 0, init: Record<string, any> = {}) {
  const x = 50;
  const y = 50;
  pointer(page, target, 'pointerdown', x, y, init);
  for (const f of [0.25, 0.5, 1]) {
    pointer(page, target, 'pointermove', x + dx * f, y + dy * f, init);
  }
  pointer(page, target, 'pointerup', x + dx, y + dy, init);
  await page.waitForChanges();
}

/** Lets a tap's burst-guard window pass, so the next tap counts as a separate one. */
const settle = () => new Promise(resolve => setTimeout(resolve, 350));

const dragEvents = (emitted: Emitted[]) => emitted.filter(e => e.name === 'dragOverEventData').map(e => e.detail);
const lastDragEvent = (emitted: Emitted[]) => dragEvents(emitted).slice(-1)[0];

describe('igl-booking-event: moving a booking', () => {
  it('drops a bar dragged two days later at the start of that day, in the same room', async () => {
    const { page, bar, emitted } = await renderBar();
    await drag(page, bar.querySelector('.bookingEventBase'), 2 * DAY);

    expect(lastDragEvent(emitted)).toEqual({
      id: 'DRAG_OVER_END',
      data: expect.objectContaining({ id: 'b1', fromRoomId: 12, x: BAR.left + 2 * DAY, y: BAR.top, pool: 'pool-1', nbOfDays: 2 }),
    });
  });

  it('puts the bar back and lets go when the browser cancels the pointer mid-drag', async () => {
    const { page, bar, emitted } = await renderBar();
    const base = bar.querySelector('.bookingEventBase');
    pointer(page, base, 'pointerdown', 50, 50, { pointerType: 'touch' });
    pointer(page, base, 'pointermove', 150, 80, { pointerType: 'touch' });
    pointer(page, base, 'pointercancel', 150, 80, { pointerType: 'touch' });
    pointer(page, base, 'pointermove', 300, 80, { pointerType: 'touch' });
    pointer(page, base, 'pointerup', 300, 80, { pointerType: 'touch' });
    await page.waitForChanges();

    expect(dragEvents(emitted).map(e => e.id)).toEqual(['CALCULATE_DRAG_OVER_BOUNDS', 'DRAG_OVER', 'DRAG_CANCEL']);
    expect(bar.style.transform).toBe('');
    expect(bar.style.left).toBe(`${BAR.left}px`);
    expect(bar.style.top).toBe(`${BAR.top}px`);
  });

  it('does not pick the bar up on a right-click or a macOS ctrl-click', async () => {
    const { page, bar, emitted } = await renderBar();
    const base = bar.querySelector('.bookingEventBase');
    await drag(page, base, 2 * DAY, 0, { button: 2 });
    await drag(page, base, 2 * DAY, 0, { ctrlKey: true });

    expect(dragEvents(emitted)).toEqual([]);
  });

  it('follows only the finger that picked the bar up when a second one lands', async () => {
    const { page, bar, emitted } = await renderBar();
    const base = bar.querySelector('.bookingEventBase');
    const touch = (id: number) => ({ pointerType: 'touch', pointerId: id, isPrimary: id === 1 });
    pointer(page, base, 'pointerdown', 50, 50, touch(1));
    pointer(page, base, 'pointermove', 50 + 2 * DAY, 50, touch(1));
    pointer(page, base, 'pointerdown', 400, 50, touch(2));
    pointer(page, base, 'pointermove', 900, 300, touch(2));
    pointer(page, base, 'pointerup', 900, 300, touch(2));
    pointer(page, base, 'pointerup', 50 + 2 * DAY, 50, touch(1));
    await page.waitForChanges();

    expect(dragEvents(emitted).filter(e => e.id === 'DRAG_OVER_END')).toEqual([{ id: 'DRAG_OVER_END', data: expect.objectContaining({ x: BAR.left + 2 * DAY, y: BAR.top }) }]);
  });

  it('stops listening for the pointer when the bar is removed mid-drag', async () => {
    const { page, bar, emitted } = await renderBar();
    const base = bar.querySelector('.bookingEventBase');
    pointer(page, base, 'pointerdown', 50, 50);
    pointer(page, base, 'pointermove', 150, 50);
    bar.remove();
    const before = dragEvents(emitted).length;
    pointer(page, page.body, 'pointermove', 250, 50);
    pointer(page, page.body, 'pointerup', 250, 50);

    expect(dragEvents(emitted).length).toBe(before);
  });
});

describe('igl-booking-event: opening the info bubble', () => {
  const bubble = (bar: Element) => bar.querySelector('igl-booking-event-hover');

  it('opens on a tap, even one that wobbles a few pixels, without starting a drag', async () => {
    const { page, bar, emitted } = await renderBar(block());
    await drag(page, bar.querySelector('.bookingEventTitle'), 3, 2, { pointerType: 'touch' });

    expect(bubble(bar)).not.toBeNull();
    expect(dragEvents(emitted)).toEqual([]);
  });

  it('asks the server for the booking once, however often the bar is tapped while it loads', async () => {
    mockBookingService.getExposedBooking.mockReset().mockReturnValue(new Promise(() => {})); // still loading
    const { page, bar } = await renderBar(booking());
    const base = bar.querySelector('.bookingEventBase');
    for (let i = 0; i < 4; i++) {
      await drag(page, base, 0); // an impatient burst
    }
    await settle();
    await drag(page, base, 0); // and again, well after the burst
    await settle();
    await drag(page, base, 0);

    expect(mockBookingService.getExposedBooking).toHaveBeenCalledTimes(1);
  });

  it('closes the open bubble when its bar is tapped again', async () => {
    const { page, bar } = await renderBar(block());
    await drag(page, bar.querySelector('.bookingEventBase'), 0);
    expect(bubble(bar)).not.toBeNull();

    await settle();
    await drag(page, bar.querySelector('.bookingEventBase'), 0);
    expect(bubble(bar)).toBeNull();
  });

  it('shows the bubble in an arrowed wa-popup anchored to the bar itself', async () => {
    const { page, bar } = await renderBar(block());
    await drag(page, bar.querySelector('.bookingEventBase'), 0);

    const popup = bar.querySelector('wa-popup') as any;
    expect(popup).not.toBeNull();
    expect(popup.contains(bubble(bar))).toBe(true);
    // wa-popup isn't registered in the spec harness, so Stencil sets these as attributes; in the
    // browser (where it is) they land as properties. Either way is the same instruction.
    const on = (name: string) => popup[name] === true || popup.hasAttribute(name);
    expect([on('active'), on('arrow')]).toEqual([true, true]);
    // Anchored to the bar: with no scroll container to clip it, the anchor reports the bar's own box.
    expect(popup.anchor.getBoundingClientRect()).toEqual(bar.getBoundingClientRect());
  });

  it('keeps one bubble open at a time and closes it on a click anywhere else', async () => {
    const { page, bars } = await renderBars([block({ ID: 'a', POOL: 'pa' }), block({ ID: 'b', POOL: 'pb', PR_ID: 13 })]);
    const [a, b] = bars;
    await drag(page, a.querySelector('.bookingEventBase'), 0);
    await drag(page, b.querySelector('.bookingEventBase'), 0);
    expect([bubble(a), bubble(b)].map(Boolean)).toEqual([false, true]);

    page.body.dispatchEvent(new (page.win as any).MouseEvent('click', { bubbles: true }) as any);
    await page.waitForChanges();
    expect(bubble(b)).toBeNull();
  });

  it('keeps a click inside the open bubble from closing it', async () => {
    const { page, bar } = await renderBar(block());
    await drag(page, bar.querySelector('.bookingEventBase'), 0);
    bubble(bar).dispatchEvent(new (page.win as any).MouseEvent('click', { bubbles: true }) as any);
    await page.waitForChanges();
    expect(bubble(bar)).not.toBeNull();
  });

  it('leaves presses inside the open bubble to the bubble: no drag, no swallowed input focus', async () => {
    const { page, bar, emitted } = await renderBar(block());
    await drag(page, bar.querySelector('.bookingEventBase'), 0);
    const inside = bubble(bar);
    const down = pointer(page, inside, 'pointerdown', 50, 50);
    pointer(page, inside, 'pointermove', 200, 120);
    pointer(page, inside, 'pointerup', 200, 120);
    await page.waitForChanges();

    expect(down.defaultPrevented).toBe(false);
    expect(dragEvents(emitted)).toEqual([]);
  });
});

describe('igl-booking-event: scale', () => {
  const windowListenerCount = (page: SpecPage) => ((page.win as any).__listeners ?? []).length;

  it('does not add window listeners per bar, so a click or a drop costs the same with 1 bar or 200', async () => {
    const { page } = await renderBar();
    const withOneBar = windowListenerCount(page);
    const container = page.body.querySelector('.bodyContainer');
    for (let i = 0; i < 199; i++) {
      const bar = page.doc.createElement('igl-booking-event') as any;
      bar.bookingEvent = booking({ ID: `b${i}`, POOL: `p${i}`, PR_ID: i });
      bar.roomTop = 100;
      container.appendChild(bar);
    }
    await page.waitForChanges();
    expect(windowListenerCount(page)).toBe(withOneBar);
  });
});

describe('igl-booking-event: when the calendar resolves a drop', () => {
  /** What igloo-calendar broadcasts once it has hit-tested a released bar against the grid. */
  const resolveDrop = async (page: SpecPage, detail: Record<string, any>) => {
    page.win.dispatchEvent(new (page.win as any).CustomEvent('moveBookingTo', { bubbles: true, detail: { bookingId: 'b1', fromRoomId: 12, pool: 'pool-1', ...detail } }) as any);
    await page.waitForChanges();
  };
  const dialogs = (emitted: Emitted[]) => emitted.filter(e => e.name === 'showDialog' || e.name === 'showRoomNightsDialog');

  it('treats a bar dropped back on its own cell as no change: no dialog, bar where it was', async () => {
    const { page, bar, emitted } = await renderBar();
    await drag(page, bar.querySelector('.bookingEventBase'), 12, 3);
    await resolveDrop(page, { toRoomId: 12, moveToDay: '2026-09-03', from_date: '2026-09-03', to_date: '2026-09-05' });

    expect(dialogs(emitted)).toEqual([]);
    expect([bar.style.left, bar.style.top]).toEqual([`${BAR.left}px`, `${BAR.top}px`]);
  });

  it('asks to confirm a move to another room, carrying the new room and dates', async () => {
    const roomsInfo = [{ id: 1, physicalrooms: [{ id: 12 }, { id: 13 }] }];
    const { page, bar, emitted } = await renderBar(booking({ roomsInfo }));
    await drag(page, bar.querySelector('.bookingEventBase'), DAY, 30);
    await resolveDrop(page, { toRoomId: 13, moveToDay: '2026-09-04', from_date: '2026-09-04', to_date: '2026-09-06' });

    expect(dialogs(emitted)).toEqual([
      {
        name: 'showDialog',
        detail: expect.objectContaining({ reason: 'reallocate', pool: 'pool-1', toRoomId: 13, from_date: '2026-09-04', to_date: '2026-09-06', hideConfirmButton: false }),
      },
    ]);
  });

  it('refuses a drop onto dates another booking already holds in that room, and puts the bar back', async () => {
    const other = booking({
      ID: 'b2',
      POOL: 'pool-2',
      PR_ID: 13,
      FROM_DATE: '2026-09-05',
      TO_DATE: '2026-09-08',
      defaultDates: { from_date: '2026-09-05', to_date: '2026-09-08' },
    });
    const { page, bars, emitted } = await renderBars([booking(), other]);
    await drag(page, bars[0].querySelector('.bookingEventBase'), DAY, 30);
    await resolveDrop(page, { toRoomId: 13, moveToDay: '2026-09-04', from_date: '2026-09-04', to_date: '2026-09-06' });

    expect(dialogs(emitted)).toEqual([]);
    expect([bars[0].style.left, bars[0].style.top]).toEqual([`${BAR.left}px`, `${BAR.top}px`]);
  });

  /**
   * igloo-calendar answers a released bar synchronously: its `dragOverEventData` handler emits
   * `moveBookingTo` before the bar's own emit call has even returned.
   */
  const calendarAnswersDropsImmediately = (page: SpecPage, answer: Record<string, any>) => {
    page.win.addEventListener('dragOverEventData', (e: CustomEvent) => {
      if (e.detail.id === 'DRAG_OVER_END' || e.detail.id === 'STRETCH_OVER_END') {
        const { id, fromRoomId, pool } = e.detail.data;
        page.win.dispatchEvent(
          new (page.win as any).CustomEvent('moveBookingTo', { bubbles: true, detail: { bookingId: id, fromRoomId, pool, moveToDay: answer.from_date, ...answer } }),
        );
      }
    });
  };

  it('asks to confirm a stretch the calendar resolves in the same call that reported it', async () => {
    const { page, bar, emitted } = await renderBar();
    calendarAnswersDropsImmediately(page, { toRoomId: 12, from_date: '2026-09-03', to_date: '2026-09-08' });
    await drag(page, bar.querySelector('.bookingEventDragHandle.rightSide'), 3 * DAY);

    expect(dialogs(emitted)).toEqual([{ name: 'showRoomNightsDialog', detail: expect.objectContaining({ from_date: '2026-09-03', to_date: '2026-09-08' }) }]);
  });

  it('asks to confirm a move the calendar resolves in the same call that reported it', async () => {
    const roomsInfo = [{ id: 1, physicalrooms: [{ id: 12 }, { id: 13 }] }];
    const { page, bar, emitted } = await renderBar(booking({ roomsInfo }));
    calendarAnswersDropsImmediately(page, { toRoomId: 13, from_date: '2026-09-04', to_date: '2026-09-06' });
    await drag(page, bar.querySelector('.bookingEventBase'), DAY, 30);

    expect(dialogs(emitted)).toEqual([{ name: 'showDialog', detail: expect.objectContaining({ reason: 'reallocate', toRoomId: 13 }) }]);
  });
});

describe('igl-booking-event: stretching a stay', () => {
  const handle = (bar: Element, side: 'leftSide' | 'rightSide') => bar.querySelector(`.bookingEventDragHandle.${side}`);

  it('adds a night when the right handle is pulled one day later, settling on whole nights', async () => {
    const { page, bar, emitted } = await renderBar();
    await drag(page, handle(bar, 'rightSide'), DAY - 10);

    expect(lastDragEvent(emitted)).toEqual({
      id: 'STRETCH_OVER_END',
      data: expect.objectContaining({ id: 'b1', fromRoomId: 12, x: BAR.left, y: BAR.top, width: 3 * DAY - 8, pool: 'pool-1', nbOfDays: 3 }),
    });
    expect([bar.style.left, bar.style.width]).toEqual([`${BAR.left}px`, `${3 * DAY - 8}px`]);
  });
});

describe('igl-booking-event: info bubble on a phone', () => {
  const tap = (page: SpecPage, bar: Element) => drag(page, bar.querySelector('.bookingEventBase'), 0);

  it('shows a block unit in a dialog instead of a popup', async () => {
    const { page, bar } = await renderBar(block(), { phone: true });
    await tap(page, bar);

    expect(bar.querySelector('ir-dialog igl-booking-event-hover')).not.toBeNull();
    expect(bar.querySelector('ir-dialog').hasAttribute('open')).toBe(true);
    expect(bar.querySelector('wa-popup')).toBeNull();
  });

  it('titles a block unit’s dialog', async () => {
    const { page, bar } = await renderBar(block(), { phone: true });
    await tap(page, bar);

    expect(bar.querySelector('ir-dialog').getAttribute('label')).toBe('Block dates');
  });

  it('keeps the new-booking options in a popup', async () => {
    const { page, bar } = await renderBar(booking({ ID: 'NEW_TEMP_EVENT', STATUS: 'TEMP-EVENT' }), { phone: true });
    await settle();
    await page.waitForChanges();

    expect(bar.querySelector('wa-popup igl-booking-event-hover')).not.toBeNull();
    expect(bar.querySelector('ir-dialog')).toBeNull();
  });

  it('keeps the popup on a desktop', async () => {
    const { page, bar } = await renderBar(block());
    await tap(page, bar);

    expect(bar.querySelector('wa-popup igl-booking-event-hover')).not.toBeNull();
    expect(bar.querySelector('ir-dialog')).toBeNull();
  });

  describe('closing the dialog', () => {
    const openDialog = async () => {
      const { page, bar, emitted } = await renderBar(block(), { phone: true });
      await tap(page, bar);
      return { page, bar, emitted, dialog: bar.querySelector('ir-dialog') };
    };
    /** What ir-dialog emits as the user dismisses it, and once its closing animation has finished. */
    const dialogEvent = async (page: SpecPage, dialog: Element, name: string) => {
      dialog.dispatchEvent(new (page.win as any).CustomEvent(name, { bubbles: true, composed: true, detail: { source: dialog } }));
      await page.waitForChanges();
    };

    it('reports the bubble closed as soon as the user dismisses it', async () => {
      const { page, bar, dialog } = await openDialog();
      await dialogEvent(page, dialog, 'irDialogHide');

      expect(bar.getAttribute('aria-expanded')).toBe('false');
    });

    it('stays mounted until its closing animation has finished, then goes away', async () => {
      const { page, bar, dialog } = await openDialog();
      await dialogEvent(page, dialog, 'irDialogHide');
      expect(bar.querySelector('ir-dialog')).not.toBeNull();

      await dialogEvent(page, dialog, 'irDialogAfterHide');
      expect(bar.querySelector('ir-dialog')).toBeNull();
    });

    it('animates closed when an action in the panel closes the bubble', async () => {
      const { page, bar, dialog } = await openDialog();
      bar
        .querySelector('igl-booking-event-hover')
        .dispatchEvent(new (page.win as any).CustomEvent('hideBubbleInfo', { bubbles: true, composed: true, detail: { key: 'hidebubble' } }));
      await page.waitForChanges();

      expect(dialog.hasAttribute('open')).toBe(false);
      expect(bar.querySelector('ir-dialog')).not.toBeNull();
    });

    it('can be opened again after closing', async () => {
      const { page, bar, dialog } = await openDialog();
      await dialogEvent(page, dialog, 'irDialogHide');
      await dialogEvent(page, dialog, 'irDialogAfterHide');
      await settle();
      await tap(page, bar);

      expect(bar.querySelector('ir-dialog').hasAttribute('open')).toBe(true);
    });

    it('treats a press on the backdrop or close button as the dialog’s, not as a tap or drag on the bar', async () => {
      const { page, emitted, dialog } = await openDialog();
      await settle();
      await drag(page, dialog, 2 * DAY);

      expect(dragEvents(emitted)).toEqual([]);
      expect(dialog.hasAttribute('open')).toBe(true);
    });
  });
});

describe('igl-booking-event: keyboard', () => {
  const key = async (page: SpecPage, target: Element, k: string) => {
    target.dispatchEvent(new (page.win as any).KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }) as any);
    await page.waitForChanges();
  };

  it('is a focusable button named after the guest', async () => {
    const { bar } = await renderBar();
    expect([bar.getAttribute('tabindex'), bar.getAttribute('role')]).toEqual(['0', 'button']);
    expect(bar.getAttribute('aria-label')).toContain('Ada Lovelace');
  });

  it('opens the bubble with Enter or Space and closes it with Escape', async () => {
    const { page, bar } = await renderBar(block());
    await key(page, bar, 'Enter');
    expect(bar.querySelector('igl-booking-event-hover')).not.toBeNull();
    expect(bar.getAttribute('aria-expanded')).toBe('true');

    await key(page, bar, 'Escape');
    expect(bar.querySelector('igl-booking-event-hover')).toBeNull();

    await key(page, bar, ' ');
    expect(bar.querySelector('igl-booking-event-hover')).not.toBeNull();
  });

  it('cancels a drag in progress with Escape, wherever focus is', async () => {
    const { page, bar, emitted } = await renderBar();
    const base = bar.querySelector('.bookingEventBase');
    pointer(page, base, 'pointerdown', 50, 50);
    pointer(page, base, 'pointermove', 200, 90);
    await key(page, page.body, 'Escape');
    pointer(page, base, 'pointerup', 200, 90);
    await page.waitForChanges();

    expect(lastDragEvent(emitted).id).toBe('DRAG_CANCEL');
    expect([bar.style.left, bar.style.top, bar.style.transform]).toEqual([`${BAR.left}px`, `${BAR.top}px`, '']);
  });
});
