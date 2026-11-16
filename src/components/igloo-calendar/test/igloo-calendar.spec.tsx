/*
 * The calendar root, tested at its three seams: the props it is mounted with, the realtime messages
 * it subscribes to, and the DOM events its children raise. What it does is observed from outside
 * only: the requests it makes, what it hands its children, the shared stores, the events it emits.
 *
 * Fakes sit at the network boundary: the service classes, the realtime socket, and axios for the
 * one helper that posts directly. Children are not registered, so they are inert elements whose
 * props can be read back.
 */
const mockAxios = { post: jest.fn(), get: jest.fn(), create: jest.fn(), defaults: {}, interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } } };
const mockBookingService = { getCalendarData: jest.fn(), getCountries: jest.fn(), handleExposedRoomInOut: jest.fn() };
const mockRoomService = { getExposedProperty: jest.fn() };
const mockSetupService = { getSetupEntriesByTableName: jest.fn() };
const mockPropertyService = { getDayUseBookingsForCalendar: jest.fn() };
const mockEventsService = { deleteEvent: jest.fn(), reallocateEvent: jest.fn() };
const mockUnassignedUnitsService = { getAggregatedUnAssignedRoomsByDateRange: jest.fn() };
const mockHousekeepingService = { getHkIssues: jest.fn(), getExposedHKSetup: jest.fn(), getHkTasks: jest.fn() };
const mockLocaleService = { getExposedLanguage: jest.fn() };
const mockRealtime = { subscribe: jest.fn() };

jest.mock('axios', () => ({ __esModule: true, default: mockAxios }));
// ESM-only packages Jest cannot load here.
let mockUuid = 0;
jest.mock('uuid', () => ({ v4: () => `uuid-${++mockUuid}` }));
jest.mock('../../../services/booking-service/booking.service', () => ({ BookingService: jest.fn(() => mockBookingService) }));
jest.mock('../../../services/room.service', () => ({ RoomService: jest.fn(() => mockRoomService) }));
jest.mock('../../../services/setup', () => ({ SetupService: jest.fn(() => mockSetupService) }));
jest.mock('../../../services/property.service', () => ({ PropertyService: jest.fn(() => mockPropertyService) }));
jest.mock('../../../services/events.service', () => ({ EventsService: jest.fn(() => mockEventsService) }));
jest.mock('../../../services/unassigned-units', () => ({ UnassignedUnitsService: jest.fn(() => mockUnassignedUnitsService) }));
jest.mock('../../../services/housekeeping', () => ({ HouseKeepingService: jest.fn(() => mockHousekeepingService) }));
jest.mock('../../../services/locale/locale.service', () => ({ LocaleService: jest.fn(() => mockLocaleService) }));
jest.mock('../../../services/realtime/realtime.service', () => ({ realtimeService: mockRealtime }));

import { newSpecPage, SpecPage } from '@stencil/core/testing';
import { IglooCalendar } from '../igloo-calendar';
import calendar_dates from '@/stores/calendar-dates.store';
import calendar_data from '@/stores/calendar-data';
import unassigned_units from '@/stores/unassigned-units.store';
import locales from '@/stores/locales.store';
import { LocaleController } from '@/services/locale/locale.controller';
import moment from 'moment';

/** "Now" for every test: noon on 10 September 2026, local time. */
const TODAY = '2026-09-10';
const PROPERTY_ID = 42;

/** September 2026, one room type (id 1) with two rate plans (11, 12) and two units (101, 102). */
const september = () =>
  Array.from({ length: 30 }, (_, i) => ({
    value: `2026-09-${String(i + 1).padStart(2, '0')}`,
    rate: [
      {
        id: 1,
        is_available_to_book: true,
        exposed_inventory: { rts: 2 },
        rateplans: [
          { id: 11, is_available_to_book: true },
          { id: 12, is_available_to_book: true },
        ],
        physicalrooms: [{ id: 101 }, { id: 102 }],
      },
    ],
  }));

const booking = (overrides: Record<string, any> = {}) => ({
  ID: 'pool-1',
  POOL: 'pool-1',
  BOOKING_NUMBER: '100',
  IDENTIFIER: 'room-1',
  NAME: 'Ada Lovelace',
  STATUS: 'CONFIRMED',
  STATUS_CODE: '001',
  BASE_STATUS_CODE: '002',
  FROM_DATE: '2026-09-12',
  TO_DATE: '2026-09-14',
  NO_OF_DAYS: 2,
  PR_ID: 101,
  BALANCE: 0,
  ROOM_INFO: { in_out: { code: '000' } },
  ...overrides,
});

const calendarResponse = (overrides: Record<string, any> = {}) => ({
  days: september(),
  months: [{ monthName: 'Sep 2026', daysCount: 30 }],
  myBookings: [booking()],
  My_Params_Get_Rooming_Data: { FROM: '2026-09-01', TO: '2026-09-30' },
  ...overrides,
});

const propertyResponse = (overrides: Record<string, any> = {}) => ({
  My_Result: {
    id: PROPERTY_ID,
    currency: { id: 1, code: 'USD', symbol: '$' },
    allowed_booking_sources: [],
    adult_child_constraints: {},
    calendar_legends: Array.from({ length: 11 }, (_, i) => ({ id: String(i + 1), name: `legend ${i + 1}`, color: '#000000' })),
    is_vacation_rental: false,
    allowed_payment_methods: [],
    roomtypes: [
      {
        id: 1,
        name: 'Double',
        physicalrooms: [
          { id: 101, name: '101', hk_status: '001' },
          { id: 102, name: '102', hk_status: '001' },
        ],
      },
    ],
    ...overrides,
  },
});

type Realtime = (reason: string, payload: unknown) => Promise<void>;
const unsubscribeRealtime = jest.fn();

function answerRequests() {
  mockBookingService.getCalendarData.mockResolvedValue(calendarResponse());
  mockBookingService.getCountries.mockResolvedValue([{ id: 1, name: 'Lebanon' }]);
  mockBookingService.handleExposedRoomInOut.mockResolvedValue(undefined);
  mockRoomService.getExposedProperty.mockResolvedValue(propertyResponse());
  mockSetupService.getSetupEntriesByTableName.mockResolvedValue([{ CODE_NAME: '002', CODE_VALUE_EN: 'Late morning' }]);
  mockPropertyService.getDayUseBookingsForCalendar.mockResolvedValue([]);
  mockEventsService.deleteEvent.mockResolvedValue(undefined);
  mockEventsService.reallocateEvent.mockResolvedValue(undefined);
  mockUnassignedUnitsService.getAggregatedUnAssignedRoomsByDateRange.mockResolvedValue([]);
  mockHousekeepingService.getHkIssues.mockResolvedValue([]);
  mockHousekeepingService.getExposedHKSetup.mockResolvedValue({});
  mockHousekeepingService.getHkTasks.mockResolvedValue({ tasks: [] });
  mockLocaleService.getExposedLanguage.mockResolvedValue({ entries: {}, direction: 'ltr', fallbackKeys: [] });
  mockRealtime.subscribe.mockReturnValue(unsubscribeRealtime);
}

let mounted: HTMLElement[] = [];

beforeEach(() => {
  jest.spyOn(Date, 'now').mockReturnValue(new Date(2026, 8, 10, 12, 0, 0).getTime());
  jest.spyOn(console, 'log').mockImplementation(() => {});
  answerRequests();
  LocaleController.reset();
  locales.direction = 'ltr' as any;
  calendar_dates.days = [];
  calendar_dates.months = [];
  calendar_dates.disabled_cells = new Map();
  calendar_dates.cleaningTasks = new Map();
  calendar_data.unitIssues = new Map();
  unassigned_units.byDate = new Map();
  unassigned_units.loadingRanges = [];
});

// newSpecPage reuses one document between tests without disconnecting the previous test's
// components, so unmount them here, as a real page would.
afterEach(() => {
  jest.useRealTimers();
  keepAnimationFrames();
  mounted.forEach(el => el.remove());
  mounted = [];
  jest.restoreAllMocks();
  jest.clearAllMocks();
});

/**
 * Puts the calendar's batching timers under test control. Legacy timers, because the modern ones
 * also fake `process.nextTick`, which Stencil's render queue runs on. They leave `Date` alone; the
 * date is pinned separately.
 */
function useFakeClock() {
  jest.useFakeTimers('legacy');
  keepAnimationFrames();
}

/** Switching timer implementations drops `requestAnimationFrame`; Stencil calls it on every unmount. */
function keepAnimationFrames() {
  (globalThis as any).requestAnimationFrame ??= (callback: () => void) => setTimeout(callback, 0);
}

async function settle(page: SpecPage) {
  for (let i = 0; i < 5; i++) {
    await page.waitForChanges();
  }
}

/** Mounts the calendar the way the PMS does: a ticket, a property and a date range. */
async function mountCalendar(props: Record<string, any> = {}) {
  const page = await newSpecPage({ components: [IglooCalendar], html: '<div></div>' });
  const calendar = page.doc.createElement('igloo-calendar') as any;
  Object.assign(calendar, { ticket: 'ticket-1', propertyid: PROPERTY_ID, from_date: '2026-09-01', to_date: '2026-09-30', language: 'en', ...props });
  page.body.appendChild(calendar);
  mounted.push(calendar);
  await settle(page);

  const child = <T extends HTMLElement = HTMLElement & Record<string, any>>(tag: string) => calendar.querySelector(tag) as T;
  /** Delivers a realtime message for this property, as the socket would. */
  const realtime: Realtime = async (reason, payload) => {
    const [, handler] = mockRealtime.subscribe.mock.calls[mockRealtime.subscribe.mock.calls.length - 1];
    await handler({ reason, payload });
    await settle(page);
  };
  /** The bookings the grid is currently asked to draw. */
  const bookings = () => child('igl-cal-body').calendarData.bookingEvents as Record<string, any>[];
  const bookingById = (id: string) => bookings().find(b => b.ID === id);
  /** Raises a child's event the way the real child would, then lets the calendar react. */
  const raise = async (target: EventTarget, name: string, detail?: unknown) => {
    target.dispatchEvent(new (page.win as any).CustomEvent(name, { detail, bubbles: true, composed: true, cancelable: true }));
    await settle(page);
  };
  /** Moves the clock forward, for the calendar's batching timers. */
  const wait = async (ms: number) => {
    jest.advanceTimersByTime(ms);
    await settle(page);
  };
  /** Events the calendar itself has emitted, oldest first. */
  const emitted: { name: string; detail: any }[] = [];
  for (const name of ['dragOverHighlightElement', 'moveBookingTo', 'revertBooking', 'openCalendarSidebar', 'showRoomNightsDialog']) {
    calendar.addEventListener(name, (e: CustomEvent) => e.target === calendar && emitted.push({ name, detail: e.detail }));
  }
  const emittedAs = (name: string) => emitted.filter(e => e.name === name).map(e => e.detail);
  // The confirmation modal is opened imperatively; the inert stand-in needs the method.
  const modal = child('ir-modal');
  if (modal) {
    modal.openModal = jest.fn();
  }
  return { page, calendar: calendar as HTMLElement & Record<string, any>, child, realtime, bookings, bookingById, raise, wait, emittedAs };
}

/** A prop handed to an inert child: objects arrive as properties, strings and numbers as attributes. */
const prop = (el: HTMLElement & Record<string, any>, name: string) => el[name] ?? el.getAttribute(name);
const isOpen = (el: HTMLElement & Record<string, any>) => el.open === true || el.hasAttribute('open');

/**
 * A test for behaviour the calendar should have but does not yet. It passes while the bug is
 * there and fails once it is fixed, so it gets promoted to a plain `it` (Jest 27 has no `it.failing`).
 */
function knownBug(name: string, fn: () => Promise<void>) {
  it(`[known bug] ${name}`, async () => {
    let fixed = false;
    try {
      await fn();
      fixed = true;
    } catch {
      // Still broken, as recorded.
    }
    if (fixed) {
      throw new Error('This now passes: the bug is fixed. Turn this knownBug into an it.');
    }
  });
}

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => ((resolve = res), (reject = rej)));
  return { promise, resolve, reject };
};

const dayUse = (overrides: Record<string, any> = {}) => ({ unit_id: 101, target_date: '2026-09-12', book_nbr: '300', from_time: '10:00', to_time: '14:00', ...overrides });

describe('mounting the calendar', () => {
  it('shows the loading screen until a ticket is given, and asks the server for nothing', async () => {
    const { child } = await mountCalendar({ ticket: '' });

    expect(child('ir-loading-screen')).not.toBeNull();
    expect(child('igl-cal-body')).toBeNull();
    expect(mockBookingService.getCalendarData).not.toHaveBeenCalled();
  });

  it('loads the property’s range and hands the grid its days and bookings', async () => {
    const { child, bookings } = await mountCalendar();

    expect(mockBookingService.getCalendarData).toHaveBeenCalledWith({ propertyid: PROPERTY_ID, from_date: '2026-09-01', to_date: '2026-09-30', language: 'en' });
    expect(child('ir-loading-screen')).toBeNull();
    expect(child('igl-cal-body').calendarData.days).toHaveLength(30);
    expect(bookings().map(b => b.ID)).toEqual(['pool-1']);
    expect(prop(child('igl-cal-body'), 'today')).toBe(TODAY);
    expect(prop(child('igl-cal-header'), 'today')).toBe(TODAY);
  });

  it('starts loading when the ticket arrives after mount', async () => {
    const { page, calendar, child } = await mountCalendar({ ticket: '' });

    calendar.ticket = 'ticket-1';
    await settle(page);

    expect(child('igl-cal-body')).not.toBeNull();
  });

  it('finds the property by its username when no id is given, and loads that property', async () => {
    await mountCalendar({ propertyid: undefined, p: 'seaside' });

    expect(mockRoomService.getExposedProperty).toHaveBeenCalledTimes(1);
    expect(mockRoomService.getExposedProperty).toHaveBeenCalledWith(expect.objectContaining({ id: 0, aname: 'seaside' }));
    expect(mockBookingService.getCalendarData).toHaveBeenCalledWith(expect.objectContaining({ propertyid: PROPERTY_ID }));
    expect(mockRealtime.subscribe).toHaveBeenCalledWith(PROPERTY_ID, expect.any(Function));
  });

  it('stays on the loading screen when it is given neither a property id nor a username', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const { child } = await mountCalendar({ propertyid: undefined });

    expect(child('ir-loading-screen')).not.toBeNull();
    expect(mockBookingService.getCalendarData).not.toHaveBeenCalled();
  });

  it('stays on the loading screen when the calendar request fails', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    mockBookingService.getCalendarData.mockRejectedValue(new Error('gateway down'));
    const { child } = await mountCalendar();

    expect(child('ir-loading-screen')).not.toBeNull();
    expect(mockRealtime.subscribe).not.toHaveBeenCalled();
  });

  it('does not draw a stay of zero nights', async () => {
    mockBookingService.getCalendarData.mockResolvedValue(calendarResponse({ myBookings: [booking(), booking({ ID: 'pool-0', FROM_DATE: '2026-09-05', TO_DATE: '2026-09-05' })] }));
    const { bookings } = await mountCalendar();

    expect(bookings().map(b => b.ID)).toEqual(['pool-1']);
  });

  it('draws a checked-in guest as in-house whatever status the booking carries', async () => {
    mockBookingService.getCalendarData.mockResolvedValue(calendarResponse({ myBookings: [booking({ STATUS: 'CONFIRMED', ROOM_INFO: { in_out: { code: '001' } } })] }));
    const { bookingById } = await mountCalendar();

    expect(bookingById('pool-1').STATUS).toBe('IN-HOUSE');
  });

  it('leaves a blocked unit’s status alone', async () => {
    mockBookingService.getCalendarData.mockResolvedValue(calendarResponse({ myBookings: [booking({ ID: 'block-1', STATUS: 'BLOCKED', STATUS_CODE: '004' })] }));
    const { bookingById } = await mountCalendar();

    expect(bookingById('block-1').STATUS).toBe('BLOCKED');
  });

  it('expands every room type and hands the grid the property’s units', async () => {
    const { child } = await mountCalendar();

    const [roomType] = child('igl-cal-body').calendarData.roomsInfo;
    expect(roomType.expanded).toBe(true);
    expect(roomType.physicalrooms.map(r => r.id)).toEqual([101, 102]);
  });

  it('loads the unassigned units of a hotel for the mounted range', async () => {
    mockUnassignedUnitsService.getAggregatedUnAssignedRoomsByDateRange.mockResolvedValue([{ date: '2026-09-12', room_types: [{ unassigned_rooms: [{ room_identifier: 'r' }] }] }]);
    await mountCalendar();

    expect(mockUnassignedUnitsService.getAggregatedUnAssignedRoomsByDateRange).toHaveBeenCalledWith({ propertyid: PROPERTY_ID, from_date: '2026-09-01', to_date: '2026-09-30' });
    expect([...unassigned_units.byDate.keys()]).toEqual(['2026-09-12']);
    expect(unassigned_units.loadingRanges).toEqual([]);
  });

  it('never asks for unassigned units on a vacation rental, where there are none', async () => {
    mockRoomService.getExposedProperty.mockResolvedValue(propertyResponse({ is_vacation_rental: true }));
    await mountCalendar();

    expect(mockUnassignedUnitsService.getAggregatedUnAssignedRoomsByDateRange).not.toHaveBeenCalled();
  });

  it('loads the range’s day-use bookings and hands them to the grid and the header', async () => {
    mockPropertyService.getDayUseBookingsForCalendar.mockResolvedValue([dayUse()]);
    const { child } = await mountCalendar();

    expect(mockPropertyService.getDayUseBookingsForCalendar).toHaveBeenCalledWith({ property_id: PROPERTY_ID, from_date: '2026-09-01', to_date: '2026-09-30' });
    expect(child('igl-cal-body').dayUseBookings).toEqual([dayUse()]);
    expect(child('igl-cal-header').dayUseBookings).toEqual([dayUse()]);
  });

  it('asks for the next 30 days of housekeeping tasks and publishes them per unit and day', async () => {
    mockHousekeepingService.getHkTasks.mockResolvedValue({ tasks: [{ unit: { id: 101 }, date: '2026-09-11' }] });
    await mountCalendar();

    expect(mockHousekeepingService.getHkTasks).toHaveBeenCalledWith(expect.objectContaining({ property_id: PROPERTY_ID, from_date: '2026-09-10', to_date: '2026-10-10' }));
    expect(calendar_dates.cleaningTasks.get(101).has('2026-09-11')).toBe(true);
  });

  it('groups open housekeeping issues by unit', async () => {
    mockHousekeepingService.getHkIssues.mockResolvedValue([
      { id: 1, unit: { id: 101 } },
      { id: 2, unit: { id: 102 } },
      { id: 3, unit: { id: 101 } },
    ]);
    await mountCalendar();

    expect(calendar_data.unitIssues.get(101).map(i => i.id)).toEqual([1, 3]);
    expect(calendar_data.unitIssues.get(102).map(i => i.id)).toEqual([2]);
  });

  it('loads again with the new ticket when the ticket changes', async () => {
    const { page, calendar } = await mountCalendar();

    calendar.ticket = 'ticket-2';
    await settle(page);

    expect(mockBookingService.getCalendarData).toHaveBeenCalledTimes(2);
  });

  it('loads again in the new language when the host switches language', async () => {
    const { page, calendar } = await mountCalendar();

    calendar.language = 'ar';
    await settle(page);

    expect(mockBookingService.getCalendarData).toHaveBeenLastCalledWith(expect.objectContaining({ language: 'ar' }));
    expect(mockBookingService.getCountries).toHaveBeenLastCalledWith('ar');
  });

  it('stops listening for realtime messages when it is removed from the page', async () => {
    const { calendar } = await mountCalendar();
    expect(mockRealtime.subscribe).toHaveBeenCalledWith(PROPERTY_ID, expect.any(Function));

    calendar.remove();

    expect(unsubscribeRealtime).toHaveBeenCalledTimes(1);
  });

  knownBug('a reload keeps a single realtime subscription instead of stacking a second one', async () => {
    const { page, calendar } = await mountCalendar();

    calendar.ticket = 'ticket-2';
    await settle(page);

    expect(mockRealtime.subscribe).toHaveBeenCalledTimes(2);
    expect(unsubscribeRealtime).toHaveBeenCalledTimes(1);
  });

  knownBug('a reload replaces the day-use bookings instead of listing each one twice', async () => {
    mockPropertyService.getDayUseBookingsForCalendar.mockResolvedValue([dayUse()]);
    const { page, calendar, child } = await mountCalendar();

    calendar.ticket = 'ticket-2';
    await settle(page);

    expect(child('igl-cal-body').dayUseBookings).toEqual([dayUse()]);
  });
});

/** A reservation as the socket sends it: one room, assigned to unit 102 for 20-23 September. */
const reservation = (overrides: Record<string, any> = {}, room: Record<string, any> = {}) => ({
  booking_nbr: '200',
  extras: null,
  arrival: { code: '001', description: 'Noon' },
  financial: { due_amount: 50, gross_total: 300 },
  status: { code: '002' },
  guest: { first_name: 'Grace', last_name: 'Hopper', mobile_without_prefix: '', country_phone_prefix: '', country_id: 1 },
  format: { from_date: '', to_date: '' },
  origin: {},
  channel_booking_nbr: null,
  is_direct: true,
  remark: '',
  source: { code: '', description: '', tag: '' },
  ota_notes: [],
  rooms: [
    {
      assigned_units_pool: 'pool-9',
      from_date: '2026-09-20',
      to_date: '2026-09-23',
      identifier: 'room-9',
      total: 300,
      in_out: { code: '000' },
      sharing_persons: [{ is_main: true, first_name: 'Grace', last_name: 'Hopper' }],
      guest: { first_name: 'Grace', last_name: 'Hopper' },
      rateplan: { id: 11, name: 'BB', cancelation: '', guarantee: '', selected_variation: { adult_child_offering: '' } },
      roomtype: { id: 1 },
      occupancy: { adult_nbr: 2, children_nbr: 0 },
      unit: { id: 102 },
      departure_time: null,
      calendar_extra: null,
      parent_room_identifier: null,
      ...room,
    },
  ],
  ...overrides,
});

/** A unit block as the socket sends it: unit 102 out of service for 20-22 September. */
const unitBlock = (overrides: Record<string, any> = {}) => ({
  POOL: 'block-9',
  NOTES: 'Painting',
  STAY_STATUS_CODE: '004',
  DESCRIPTION: '',
  pr_id: 102,
  BLOCKED_TILL_DATE: null,
  BLOCKED_TILL_HOUR: null,
  BLOCKED_TILL_MINUTE: null,
  from_date: '2026-09-20',
  to_date: '2026-09-22',
  format: { from_date: '', to_date: '' },
  ...overrides,
});

describe('realtime messages: bookings', () => {
  it('ignores a reason it does not know', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { realtime, bookings } = await mountCalendar();

    await realtime('SOMETHING_NEW', { pools: ['pool-1'] });

    expect(bookings()).toHaveLength(1);
  });

  it('draws a new reservation on the unit and nights it was assigned', async () => {
    const { realtime, bookingById, bookings } = await mountCalendar();

    await realtime('DORESERVATION', reservation());

    expect(bookings().map(b => b.ID)).toEqual(['pool-1', 'pool-9']);
    expect(bookingById('pool-9')).toMatchObject({ PR_ID: 102, FROM_DATE: '2026-09-20', TO_DATE: '2026-09-23', NAME: 'Grace Hopper', BOOKING_NUMBER: '200', STATUS: 'CONFIRMED' });
  });

  it('redraws a reservation it already shows instead of adding a second bar', async () => {
    const { realtime, bookingById, bookings } = await mountCalendar();
    await realtime('DORESERVATION', reservation());

    await realtime('DORESERVATION', reservation({}, { to_date: '2026-09-25' }));

    expect(bookings()).toHaveLength(2);
    expect(bookingById('pool-9').TO_DATE).toBe('2026-09-25');
  });

  it('draws nothing for a reserved room that has no unit yet', async () => {
    const { realtime, bookings } = await mountCalendar();

    await realtime('DORESERVATION', reservation({}, { assigned_units_pool: null }));

    expect(bookings().map(b => b.ID)).toEqual(['pool-1']);
  });

  it('clips a reservation that started before the loaded range to the first loaded day', async () => {
    const { realtime, bookingById } = await mountCalendar();

    await realtime('DORESERVATION', reservation({}, { from_date: '2026-08-28', to_date: '2026-09-03' }));

    expect(bookingById('pool-9')).toMatchObject({ FROM_DATE: '2026-09-01', TO_DATE: '2026-09-03' });
  });

  it('refreshes housekeeping tasks when a reservation lands in the next 30 days', async () => {
    const { realtime } = await mountCalendar();
    mockHousekeepingService.getHkTasks.mockClear();

    await realtime('DORESERVATION', reservation());

    expect(mockHousekeepingService.getHkTasks).toHaveBeenCalledTimes(1);
  });

  it('draws a room once it is assigned a unit', async () => {
    const { realtime, bookingById } = await mountCalendar();

    await realtime('ASSIGN_EXPOSED_ROOM', reservation());

    expect(bookingById('pool-9')).toMatchObject({ PR_ID: 102, FROM_DATE: '2026-09-20', TO_DATE: '2026-09-23' });
  });

  it('draws a blocked unit with its note as the label', async () => {
    mockAxios.post.mockResolvedValue({ data: { My_Result: [{ CODE_NAME: '004', CODE_VALUE_EN: 'Out of service' }] } });
    const { realtime, bookingById } = await mountCalendar();

    await realtime('BLOCK_EXPOSED_UNIT', unitBlock());

    expect(bookingById('block-9')).toMatchObject({ PR_ID: 102, FROM_DATE: '2026-09-20', TO_DATE: '2026-09-22', STATUS: 'BLOCKED', NAME: 'Painting', OUT_OF_SERVICE: true });
  });

  it('moves a block to its new unit when it is reallocated', async () => {
    mockAxios.post.mockResolvedValue({ data: { My_Result: [{ CODE_NAME: '004', CODE_VALUE_EN: 'Out of service' }] } });
    const { realtime, bookingById, bookings } = await mountCalendar();
    await realtime('BLOCK_EXPOSED_UNIT', unitBlock());

    await realtime('REALLOCATE_EXPOSED_ROOM_BLOCK', unitBlock({ pr_id: 101 }));

    expect(bookings()).toHaveLength(2);
    expect(bookingById('block-9').PR_ID).toBe(101);
  });

  it('removes a bar whose pool was deleted', async () => {
    const { realtime, bookings } = await mountCalendar();

    await realtime('DELETE_CALENDAR_POOL', 'pool-1');

    expect(bookings()).toEqual([]);
  });

  it('updates the balance of the bars a payment applies to, and no others', async () => {
    mockBookingService.getCalendarData.mockResolvedValue(calendarResponse({ myBookings: [booking({ BALANCE: 120 }), booking({ ID: 'pool-2', POOL: 'pool-2', BALANCE: 80 })] }));
    const { realtime, bookingById } = await mountCalendar();

    await realtime('CHANGE_IN_DUE_AMOUNT', { pools: ['pool-1'], due_amount: 0 });

    expect(bookingById('pool-1').BALANCE).toBe(0);
    expect(bookingById('pool-2').BALANCE).toBe(80);
  });

  it('shows a pending booking as confirmed once it is confirmed', async () => {
    mockBookingService.getCalendarData.mockResolvedValue(calendarResponse({ myBookings: [booking({ BASE_STATUS_CODE: '001' })] }));
    const { realtime, bookingById } = await mountCalendar();
    expect(bookingById('pool-1').STATUS).toBe('PENDING-CONFIRMATION');

    await realtime('CHANGE_IN_BOOK_STATUS', { pools: ['pool-1'], status_code: '002' });

    expect(bookingById('pool-1').STATUS).toBe('CONFIRMED');
  });

  it('keeps an in-house guest in-house when the booking is confirmed', async () => {
    mockBookingService.getCalendarData.mockResolvedValue(calendarResponse({ myBookings: [booking({ ROOM_INFO: { in_out: { code: '001' } } })] }));
    const { realtime, bookingById } = await mountCalendar();

    await realtime('CHANGE_IN_BOOK_STATUS', { pools: ['pool-1'], status_code: '002' });

    expect(bookingById('pool-1').STATUS).toBe('IN-HOUSE');
  });

  it('shows the private note of the booking it was added to', async () => {
    const { realtime, bookingById } = await mountCalendar();

    await realtime('NON_TECHNICAL_CHANGE_IN_BOOKING', { booking_nbr: '100', extras: [{ key: 'private_note', value: 'Late arrival' }] });

    expect(bookingById('pool-1').PRIVATE_NOTE).toBe('Late arrival');
  });

  it('clears the private note when it is removed', async () => {
    mockBookingService.getCalendarData.mockResolvedValue(calendarResponse({ myBookings: [booking({ PRIVATE_NOTE: 'Late arrival' })] }));
    const { realtime, bookingById } = await mountCalendar();

    await realtime('NON_TECHNICAL_CHANGE_IN_BOOKING', { booking_nbr: '100', extras: [] });

    expect(bookingById('pool-1').PRIVATE_NOTE).toBeNull();
  });

  it('marks a room in-house when its guest checks in', async () => {
    const { realtime, bookingById } = await mountCalendar();

    await realtime('ROOM_STATUS_CHANGED', { room_identifier: 'room-1', status: '001' });

    expect(bookingById('pool-1')).toMatchObject({ STATUS: 'IN-HOUSE', CHECKIN: true, CHECKOUT: false });
    expect(bookingById('pool-1').ROOM_INFO.in_out.code).toBe('001');
  });

  it('marks a room checked out when its guest leaves after the stay has ended', async () => {
    mockBookingService.getCalendarData.mockResolvedValue(
      calendarResponse({ myBookings: [booking({ FROM_DATE: '2026-09-05', TO_DATE: '2026-09-08', ROOM_INFO: { in_out: { code: '001' } } })] }),
    );
    const { realtime, bookingById } = await mountCalendar();

    await realtime('ROOM_STATUS_CHANGED', { room_identifier: 'room-1', status: '002' });

    expect(bookingById('pool-1')).toMatchObject({ STATUS: 'CHECKED-OUT', CHECKIN: false, CHECKOUT: true });
  });

  it('relabels a bar with the new main guest when the room’s guests change', async () => {
    const guests = [
      { is_main: false, first_name: 'Alan', last_name: 'Turing' },
      { is_main: true, first_name: 'Grace', last_name: 'Hopper' },
    ];
    const { realtime, bookingById } = await mountCalendar();

    await realtime('SHARING_PERSONS_UPDATED', { identifier: 'room-1', guests });

    expect(bookingById('pool-1').NAME).toBe('Grace Hopper');
    expect(bookingById('pool-1').ROOM_INFO.sharing_persons).toEqual(guests);
  });

  it('shows the departure time a room was given, by its description', async () => {
    const { realtime, bookingById } = await mountCalendar();

    await realtime('SET_DEPARTURE_TIME', { room_identifier: 'room-1', code: '002' });

    expect(bookingById('pool-1').DEPARTURE_TIME).toEqual({ code: '002', description: 'Late morning' });
  });

  it('stores a room’s calendar extras, and clears them when they are emptied', async () => {
    const { realtime, bookingById } = await mountCalendar();

    await realtime('SET_ROOM_CALENDAR_EXTRA', { room_identifier: 'room-1', value: '{"flag":"vip"}' });
    expect(bookingById('pool-1').ROOM_INFO.calendar_extra).toEqual({ flag: 'vip' });

    await realtime('SET_ROOM_CALENDAR_EXTRA', { room_identifier: 'room-1', value: '' });
    expect(bookingById('pool-1').ROOM_INFO.calendar_extra).toBeNull();
  });

  knownBug('a calendar extra added to a room keeps the extras it already had', async () => {
    mockBookingService.getCalendarData.mockResolvedValue(calendarResponse({ myBookings: [booking({ ROOM_INFO: { in_out: { code: '000' }, calendar_extra: { flag: 'vip' } } })] }));
    const { realtime, bookingById } = await mountCalendar();

    await realtime('SET_ROOM_CALENDAR_EXTRA', { room_identifier: 'room-1', value: '{"cot":true}' });

    expect(bookingById('pool-1').ROOM_INFO.calendar_extra).toEqual({ flag: 'vip', cot: true });
  });
});

describe('realtime messages: housekeeping', () => {
  it('marks a unit dirty and due for cleaning today', async () => {
    const { realtime, child } = await mountCalendar();

    await realtime('UNIT_HK_STATUS_CHANGED', { ROOM_CATEGORY_ID: 1, PR_ID: 101, HKS_CODE: '002' });

    const units = child('igl-cal-body').calendarData.roomsInfo[0].physicalrooms;
    expect(units.map(u => u.hk_status)).toEqual(['002', '001']);
    expect(calendar_dates.cleaningTasks.get(101).has(TODAY)).toBe(true);
  });

  it('drops today’s cleaning task once the unit is clean', async () => {
    mockHousekeepingService.getHkTasks.mockResolvedValue({ tasks: [{ unit: { id: 101 }, date: TODAY }] });
    const { realtime } = await mountCalendar();

    await realtime('UNIT_HK_STATUS_CHANGED', { ROOM_CATEGORY_ID: 1, PR_ID: 101, HKS_CODE: '001' });

    expect(calendar_dates.cleaningTasks.get(101).has(TODAY)).toBe(false);
  });

  it('drops the cleaning task of a day housekeeping skipped', async () => {
    mockHousekeepingService.getHkTasks.mockResolvedValue({
      tasks: [
        { unit: { id: 101 }, date: '2026-09-11' },
        { unit: { id: 101 }, date: '2026-09-12' },
      ],
    });
    const { realtime } = await mountCalendar();

    await realtime('HK_SKIP', { PR_ID: 101, DATE: '2026-09-11' });

    expect([...calendar_dates.cleaningTasks.get(101).keys()]).toEqual(['2026-09-12']);
  });

  it('lists a new issue under its unit, and removes it when it is fixed', async () => {
    const { realtime } = await mountCalendar();

    await realtime('HK_ISSUE_FOUND', {
      HK_ISSUE_ID: 7,
      My_Hka: { PR_ID: 101, ENTRY_DATE: '2026-09-10', COMMENT: 'Leaking tap', HKA_ID: 3, HOUR: 9, MINUTE: 30, My_Hkm: { NAME: 'Rita' }, My_Pr: { NAME: '101' } },
    });
    expect(calendar_data.unitIssues.get(101)).toEqual([
      { id: 7, date: '2026-09-10', description: 'Leaking tap', hka_id: 3, housekeeper_name: 'Rita', hour: 9, minute: 30, unit: { id: 101, name: '101' } },
    ]);

    await realtime('HK_ISSUE_FIXED', { HK_ISSUE_ID: 7, My_Hka: { PR_ID: 101 } });
    expect(calendar_data.unitIssues.has(101)).toBe(false);
  });

  it('keeps a unit’s other issues when one of them is fixed', async () => {
    mockHousekeepingService.getHkIssues.mockResolvedValue([
      { id: 1, unit: { id: 101 } },
      { id: 2, unit: { id: 101 } },
    ]);
    const { realtime } = await mountCalendar();

    await realtime('HK_ISSUE_FIXED', { HK_ISSUE_ID: 1, My_Hka: { PR_ID: 101 } });

    expect(calendar_data.unitIssues.get(101).map(i => i.id)).toEqual([2]);
  });
});

describe('realtime messages: day-use bookings', () => {
  it('fetches the nights of a day-use booking made elsewhere and adds them to the grid', async () => {
    const { realtime, child } = await mountCalendar();
    mockPropertyService.getDayUseBookingsForCalendar.mockResolvedValue([dayUse({ target_date: '2026-09-15' })]);

    await realtime('DAY_USE_CREATED', { extra_service: { start_date: '2026-09-15', end_date: '2026-09-15' } });

    expect(mockPropertyService.getDayUseBookingsForCalendar).toHaveBeenLastCalledWith({ property_id: PROPERTY_ID, from_date: '2026-09-15', to_date: '2026-09-15' });
    expect(child('igl-cal-body').dayUseBookings).toEqual([dayUse({ target_date: '2026-09-15' })]);
  });

  it('falls back to the booking’s own dates when the message carries no service dates', async () => {
    const { realtime } = await mountCalendar();

    await realtime('DAY_USE_CREATED', { booking: { from_date: '2026-09-16', to_date: '2026-09-17' } });

    expect(mockPropertyService.getDayUseBookingsForCalendar).toHaveBeenLastCalledWith({ property_id: PROPERTY_ID, from_date: '2026-09-16', to_date: '2026-09-17' });
  });

  knownBug('a day-use booking created on a day that already has one does not list the first one twice', async () => {
    mockPropertyService.getDayUseBookingsForCalendar.mockResolvedValue([dayUse()]);
    const { realtime, child } = await mountCalendar();
    mockPropertyService.getDayUseBookingsForCalendar.mockResolvedValue([dayUse(), dayUse({ unit_id: 102 })]);

    await realtime('DAY_USE_CREATED', { extra_service: { start_date: '2026-09-12', end_date: '2026-09-12' } });

    expect(child('igl-cal-body').dayUseBookings).toEqual([dayUse(), dayUse({ unit_id: 102 })]);
  });

  it('replaces a day’s day-use bookings when one of them is edited, leaving other days alone', async () => {
    mockPropertyService.getDayUseBookingsForCalendar.mockResolvedValue([dayUse(), dayUse({ target_date: '2026-09-13' })]);
    const { realtime, child } = await mountCalendar();
    mockPropertyService.getDayUseBookingsForCalendar.mockResolvedValue([dayUse({ unit_id: 102 })]);

    await realtime('DAY_USE_MODIFIED', { start_date: '2026-09-12' });

    expect(mockPropertyService.getDayUseBookingsForCalendar).toHaveBeenLastCalledWith({ property_id: PROPERTY_ID, from_date: '2026-09-12', to_date: '2026-09-12' });
    expect(child('igl-cal-body').dayUseBookings).toEqual([dayUse({ target_date: '2026-09-13' }), dayUse({ unit_id: 102 })]);
  });

  it('removes exactly the removed day-use booking, without asking the server', async () => {
    mockPropertyService.getDayUseBookingsForCalendar.mockResolvedValue([dayUse(), dayUse({ unit_id: 102 }), dayUse({ target_date: '2026-09-13' })]);
    const { realtime, child } = await mountCalendar();
    mockPropertyService.getDayUseBookingsForCalendar.mockClear();

    await realtime('DAY_USE_REMOVED', { START_DATE: '2026-09-12', PR_ID: 101 });

    expect(child('igl-cal-body').dayUseBookings).toEqual([dayUse({ unit_id: 102 }), dayUse({ target_date: '2026-09-13' })]);
    expect(mockPropertyService.getDayUseBookingsForCalendar).not.toHaveBeenCalled();
  });
});

const cell = (unitId: number, date: string) => calendar_dates.disabled_cells.get(`${unitId}_${date}`);
const roomTypeOn = (date: string) => calendar_dates.days.find(d => d.value === date).rate[0] as Record<string, any>;

describe('realtime messages: stop-sale and availability', () => {
  /** Sales and availability changes are applied in batches, one second after the first arrives. */
  const BATCH_MS = 1000;
  beforeEach(useFakeClock);

  it('keeps a room type sellable while one of its rate plans is still open', async () => {
    const { realtime, wait } = await mountCalendar();

    await realtime('ROOM_TYPE_CLOSE', { night: '2026-09-15', rate_plan_id: 11 });
    await wait(BATCH_MS);

    expect(roomTypeOn('2026-09-15').is_available_to_book).toBe(true);
    expect(cell(101, '2026-09-15')).toEqual({ disabled: false, reason: 'stop_sale' });
  });

  it('disables every unit of a room type for a night once all its rate plans are closed', async () => {
    const { realtime, wait } = await mountCalendar();

    await realtime('ROOM_TYPE_CLOSE', { night: '2026-09-15', rate_plan_id: 11 });
    await realtime('ROOM_TYPE_CLOSE', { night: '2026-09-15', rate_plan_id: 12 });
    await wait(BATCH_MS);

    expect(roomTypeOn('2026-09-15').is_available_to_book).toBe(false);
    expect(cell(101, '2026-09-15')).toEqual({ disabled: true, reason: 'stop_sale' });
    expect(cell(102, '2026-09-15')).toEqual({ disabled: true, reason: 'stop_sale' });
    expect(cell(101, '2026-09-16')).toBeUndefined();
  });

  it('enables the units again when a rate plan reopens', async () => {
    const { realtime, wait } = await mountCalendar();
    await realtime('ROOM_TYPE_CLOSE', { night: '2026-09-15', rate_plan_id: 11 });
    await realtime('ROOM_TYPE_CLOSE', { night: '2026-09-15', rate_plan_id: 12 });
    await wait(BATCH_MS);

    await realtime('ROOM_TYPE_OPEN', { night: '2026-09-15', rate_plan_id: 12 });
    await wait(BATCH_MS);

    expect(cell(101, '2026-09-15')).toEqual({ disabled: false, reason: 'stop_sale' });
  });

  it('treats a rate update that closes a plan as a stop-sale for that night', async () => {
    const { realtime, wait } = await mountCalendar();

    await realtime('UPDATE_CALENDAR_RATE', { date: '2026-09-15', rate_plan_id: 11, is_closed: true });
    await realtime('UPDATE_CALENDAR_RATE', { date: '2026-09-15', rate_plan_id: 12, is_closed: true });
    await wait(BATCH_MS);

    expect(cell(101, '2026-09-15')).toEqual({ disabled: true, reason: 'stop_sale' });
  });

  it('applies nothing until the batch window has passed', async () => {
    const { realtime, wait } = await mountCalendar();

    await realtime('ROOM_TYPE_CLOSE', { night: '2026-09-15', rate_plan_id: 11 });
    await wait(BATCH_MS - 1);

    expect(cell(101, '2026-09-15')).toBeUndefined();
  });

  it('skips a stop-sale for a night or rate plan it does not show, and applies the rest of the batch', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { realtime, wait } = await mountCalendar();

    await realtime('ROOM_TYPE_CLOSE', { night: '2027-01-01', rate_plan_id: 11 });
    await realtime('ROOM_TYPE_CLOSE', { night: '2026-09-15', rate_plan_id: 99 });
    await realtime('ROOM_TYPE_CLOSE', { night: '2026-09-15', rate_plan_id: 11 });
    await realtime('ROOM_TYPE_CLOSE', { night: '2026-09-15', rate_plan_id: 12 });
    await wait(BATCH_MS);

    expect(cell(101, '2026-09-15')).toEqual({ disabled: true, reason: 'stop_sale' });
  });

  it('disables a room type’s units for a night when its last room is sold', async () => {
    const { realtime, wait } = await mountCalendar();

    await realtime('UPDATE_CALENDAR_AVAILABILITY', { date: '2026-09-15', room_type_id: 1, availability: 0 });
    await wait(BATCH_MS);

    expect(roomTypeOn('2026-09-15').exposed_inventory.rts).toBe(0);
    expect(cell(101, '2026-09-15')).toEqual({ disabled: true, reason: 'inventory' });
    expect(cell(102, '2026-09-15')).toEqual({ disabled: true, reason: 'inventory' });
  });

  it('enables them again when a room frees up', async () => {
    const { realtime, wait } = await mountCalendar();
    await realtime('UPDATE_CALENDAR_AVAILABILITY', { date: '2026-09-15', room_type_id: 1, availability: 0 });
    await wait(BATCH_MS);

    await realtime('UPDATE_CALENDAR_AVAILABILITY', { date: '2026-09-15', room_type_id: 1, availability: 1 });
    await wait(BATCH_MS);

    expect(roomTypeOn('2026-09-15').exposed_inventory.rts).toBe(1);
    expect(cell(101, '2026-09-15')).toEqual({ disabled: false, reason: 'inventory' });
  });

  knownBug('an availability change for a night it does not show does not swallow the rest of the batch', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { realtime, wait } = await mountCalendar();

    await realtime('UPDATE_CALENDAR_AVAILABILITY', { date: '2027-01-01', room_type_id: 1, availability: 0 });
    await realtime('UPDATE_CALENDAR_AVAILABILITY', { date: '2026-09-15', room_type_id: 1, availability: 0 });
    await wait(BATCH_MS);

    expect(cell(101, '2026-09-15')).toEqual({ disabled: true, reason: 'inventory' });
  });
});

describe('realtime messages: rectified availability', () => {
  const soldOut = (date: string) => ({ ...september().find(d => d.value === date), rate: [{ ...september()[0].rate[0], exposed_inventory: { rts: 0 } }] });
  const closed = (date: string) => ({ ...september().find(d => d.value === date), rate: [{ ...september()[0].rate[0], is_available_to_book: false }] });

  it('re-reads the rectified nights and disables the units that are sold out or closed', async () => {
    const { realtime, child } = await mountCalendar();
    mockBookingService.getCalendarData.mockResolvedValue({ days: [soldOut('2026-09-02'), closed('2026-09-03')] });

    await realtime('UPDATE_CALENDAR_AVAILABILITIES', { from: '2026-09-02', to: '2026-09-03' });

    expect(mockBookingService.getCalendarData).toHaveBeenLastCalledWith({ propertyid: PROPERTY_ID, from_date: '2026-09-02', to_date: '2026-09-03' });
    expect(cell(101, '2026-09-02')).toEqual({ disabled: true, reason: 'inventory' });
    expect(cell(102, '2026-09-03')).toEqual({ disabled: true, reason: 'stop_sale' });
    expect(roomTypeOn('2026-09-02').exposed_inventory.rts).toBe(0);
    expect(roomTypeOn('2026-09-04').exposed_inventory.rts).toBe(2);
    expect(child('igl-cal-body').calendarData.days).toHaveLength(30);
  });

  it('only re-reads the part of the period that is on screen', async () => {
    const { realtime } = await mountCalendar();
    mockBookingService.getCalendarData.mockResolvedValue({ days: [] });

    await realtime('UPDATE_CALENDAR_AVAILABILITIES', { from: '2026-08-20 00:00:00', to: '2026-09-03 00:00:00' });

    expect(mockBookingService.getCalendarData).toHaveBeenLastCalledWith({ propertyid: PROPERTY_ID, from_date: '2026-09-01', to_date: '2026-09-03' });
  });

  it.each([
    ['is entirely outside the loaded range', { from: '2026-11-01', to: '2026-11-05' }],
    ['has no usable dates', { from: null, to: 'soon' }],
  ])('asks the server for nothing when the period %s', async (_, payload) => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { realtime } = await mountCalendar();
    mockBookingService.getCalendarData.mockClear();

    await realtime('UPDATE_CALENDAR_AVAILABILITIES', payload);

    expect(mockBookingService.getCalendarData).not.toHaveBeenCalled();
  });

  it('keeps what it shows when the re-read fails', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const { realtime } = await mountCalendar();
    mockBookingService.getCalendarData.mockRejectedValue(new Error('gateway down'));

    await realtime('UPDATE_CALENDAR_AVAILABILITIES', { from: '2026-09-02', to: '2026-09-03' });

    expect(roomTypeOn('2026-09-02').exposed_inventory.rts).toBe(2);
  });
});

describe('realtime messages: unassigned units', () => {
  /** A burst is fetched once no notification has arrived for two seconds... */
  const QUIET_MS = 2000;
  /** ...or three seconds after its first notification, whichever comes first. */
  const MAX_WAIT_MS = 3000;
  const fetchUnassigned = mockUnassignedUnitsService.getAggregatedUnAssignedRoomsByDateRange;
  const notification = (from: string, to: string) => `FROM_DATE:${from} 00:00:00|TO_DATE:${to} 00:00:00`;
  const fetchedRanges = () => fetchUnassigned.mock.calls.map(([params]) => `${params.from_date}..${params.to_date}`);
  const unassigned = (date: string) => ({ date, room_types: [{ unassigned_rooms: [{ room_identifier: `r-${date}` }] }] });

  /** A calendar that has finished its own initial unassigned-units load, with the clock under test control. */
  async function mountSettled({ range = ['2026-09-01', '2026-09-30'], property = {} }: { range?: [string, string]; property?: Record<string, any> } = {}) {
    mockBookingService.getCalendarData.mockResolvedValue(calendarResponse({ My_Params_Get_Rooming_Data: { FROM: range[0], TO: range[1] } }));
    mockRoomService.getExposedProperty.mockResolvedValue(propertyResponse(property));
    const mounted = await mountCalendar({ from_date: range[0], to_date: range[1] });
    fetchUnassigned.mockClear();
    useFakeClock();
    return mounted;
  }

  it('answers a burst of overlapping notifications with one fetch covering them all, once it settles', async () => {
    const { realtime, wait } = await mountSettled();

    await realtime('GET_UNASSIGNED_DATES', notification('2026-09-12', '2026-09-14'));
    await realtime('GET_UNASSIGNED_DATES', notification('2026-09-13', '2026-09-16'));
    await realtime('GET_UNASSIGNED_DATES', notification('2026-09-12', '2026-09-14'));
    await wait(QUIET_MS - 1);
    expect(fetchUnassigned).not.toHaveBeenCalled();

    await wait(1);
    expect(fetchUnassigned).toHaveBeenCalledTimes(1);
    expect(fetchUnassigned).toHaveBeenCalledWith({ propertyid: PROPERTY_ID, from_date: '2026-09-12', to_date: '2026-09-16' });
  });

  it('replaces what it knew about the fetched nights, clearing the ones that emptied out', async () => {
    mockUnassignedUnitsService.getAggregatedUnAssignedRoomsByDateRange.mockResolvedValue([unassigned('2026-09-12'), unassigned('2026-09-20')]);
    const { realtime, wait } = await mountSettled();
    fetchUnassigned.mockResolvedValue([unassigned('2026-09-13')]);

    await realtime('GET_UNASSIGNED_DATES', notification('2026-09-12', '2026-09-14'));
    await wait(QUIET_MS);

    expect([...unassigned_units.byDate.keys()].sort()).toEqual(['2026-09-13', '2026-09-20']);
    expect(unassigned_units.loadingRanges).toEqual([]);
  });

  it('marks the nights as loading while the fetch is in flight', async () => {
    const { realtime, wait } = await mountSettled();
    const response = deferred<unknown[]>();
    fetchUnassigned.mockReturnValue(response.promise);

    await realtime('GET_UNASSIGNED_DATES', notification('2026-09-12', '2026-09-14'));
    await wait(QUIET_MS);
    expect(unassigned_units.loadingRanges.map(r => `${r.fromDate}..${r.toDate}`)).toEqual(['2026-09-12..2026-09-14']);

    response.resolve([]);
    await wait(0);
    expect(unassigned_units.loadingRanges).toEqual([]);
  });

  it('only fetches the part of a stay that is on screen', async () => {
    const { realtime, wait } = await mountSettled();

    await realtime('GET_UNASSIGNED_DATES', notification('2026-08-25', '2026-09-03'));
    await realtime('GET_UNASSIGNED_DATES', notification('2026-09-28', '2026-10-04'));
    await wait(QUIET_MS);

    expect(fetchedRanges()).toEqual(['2026-09-01..2026-09-03', '2026-09-28..2026-09-30']);
  });

  it.each([
    ['is entirely outside the loaded range', notification('2026-11-01', '2026-11-05')],
    ['carries no dates', 'FROM_DATE|TO_DATE'],
  ])('fetches nothing for a notification that %s', async (_, payload) => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { realtime, wait } = await mountSettled();

    await realtime('GET_UNASSIGNED_DATES', payload);
    await wait(MAX_WAIT_MS);

    expect(fetchUnassigned).not.toHaveBeenCalled();
  });

  it('fetches nothing on a vacation rental', async () => {
    const { realtime, wait } = await mountSettled({ property: { is_vacation_rental: true } });

    await realtime('GET_UNASSIGNED_DATES', notification('2026-09-12', '2026-09-14'));
    await wait(MAX_WAIT_MS);

    expect(fetchUnassigned).not.toHaveBeenCalled();
  });

  it('bridges periods up to two weeks apart with a single fetch', async () => {
    const { realtime, wait } = await mountSettled();

    await realtime('GET_UNASSIGNED_DATES', notification('2026-09-01', '2026-09-02'));
    await realtime('GET_UNASSIGNED_DATES', notification('2026-09-16', '2026-09-17'));
    await wait(QUIET_MS);

    expect(fetchedRanges()).toEqual(['2026-09-01..2026-09-17']);
  });

  it('fetches periods more than two weeks apart separately, rather than everything in between', async () => {
    const { realtime, wait } = await mountSettled();

    await realtime('GET_UNASSIGNED_DATES', notification('2026-09-17', '2026-09-18'));
    await realtime('GET_UNASSIGNED_DATES', notification('2026-09-01', '2026-09-02'));
    await wait(QUIET_MS);

    expect(fetchedRanges()).toEqual(['2026-09-01..2026-09-02', '2026-09-17..2026-09-18']);
  });

  it('never makes more than three fetches for a burst, bridging the narrowest gap first', async () => {
    const { realtime, wait } = await mountSettled({ range: ['2026-01-01', '2026-12-31'] });

    await realtime('GET_UNASSIGNED_DATES', notification('2026-01-05', '2026-01-06'));
    await realtime('GET_UNASSIGNED_DATES', notification('2026-04-01', '2026-04-02'));
    await realtime('GET_UNASSIGNED_DATES', notification('2026-05-01', '2026-05-02'));
    await realtime('GET_UNASSIGNED_DATES', notification('2026-08-01', '2026-08-02'));
    await wait(QUIET_MS);

    expect(fetchedRanges()).toEqual(['2026-01-05..2026-01-06', '2026-04-01..2026-05-02', '2026-08-01..2026-08-02']);
  });

  it('does not let a steady stream of notifications postpone the fetch for ever', async () => {
    const { realtime, wait } = await mountSettled();

    await realtime('GET_UNASSIGNED_DATES', notification('2026-09-12', '2026-09-14'));
    await wait(1500);
    await realtime('GET_UNASSIGNED_DATES', notification('2026-09-13', '2026-09-15'));
    await wait(1499);
    expect(fetchUnassigned).not.toHaveBeenCalled();

    await wait(1);
    expect(fetchedRanges()).toEqual(['2026-09-12..2026-09-15']);
  });

  it('holds notifications that arrive during a fetch for the next one, so only one is ever in flight', async () => {
    const { realtime, wait } = await mountSettled();
    const first = deferred<unknown[]>();
    fetchUnassigned.mockReturnValueOnce(first.promise);
    await realtime('GET_UNASSIGNED_DATES', notification('2026-09-12', '2026-09-14'));
    await wait(QUIET_MS);

    await realtime('GET_UNASSIGNED_DATES', notification('2026-09-20', '2026-09-21'));
    await wait(MAX_WAIT_MS);
    expect(fetchedRanges()).toEqual(['2026-09-12..2026-09-14']);

    first.resolve([]);
    await wait(0);
    await wait(QUIET_MS);
    expect(fetchedRanges()).toEqual(['2026-09-12..2026-09-14', '2026-09-20..2026-09-21']);
  });

  it('keeps serving notifications after a fetch fails', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const { realtime, wait } = await mountSettled();
    fetchUnassigned.mockRejectedValueOnce(new Error('gateway down'));
    await realtime('GET_UNASSIGNED_DATES', notification('2026-09-12', '2026-09-14'));
    await wait(QUIET_MS);
    expect(unassigned_units.loadingRanges).toEqual([]);

    await realtime('GET_UNASSIGNED_DATES', notification('2026-09-20', '2026-09-21'));
    await wait(QUIET_MS);

    expect(fetchedRanges()).toEqual(['2026-09-12..2026-09-14', '2026-09-20..2026-09-21']);
  });

  it('drops a pending fetch when the calendar is removed from the page', async () => {
    const { realtime, wait, calendar } = await mountSettled();
    await realtime('GET_UNASSIGNED_DATES', notification('2026-09-12', '2026-09-14'));

    calendar.remove();
    await wait(MAX_WAIT_MS);

    expect(fetchUnassigned).not.toHaveBeenCalled();
  });

  it('re-reads the nights of a cancelled booking, whose rooms are no longer waiting for a unit', async () => {
    const { realtime, wait } = await mountSettled();

    await realtime('CHANGE_IN_BOOK_STATUS', { pools: ['pool-1'], status_code: '003', from_date: '2026-09-12', to_date: '2026-09-14' });
    await wait(QUIET_MS);

    expect(fetchedRanges()).toEqual(['2026-09-12..2026-09-14']);
  });

  it('does not re-read anything for a status change that is not a cancellation', async () => {
    const { realtime, wait } = await mountSettled();

    await realtime('CHANGE_IN_BOOK_STATUS', { pools: ['pool-1'], status_code: '002', from_date: '2026-09-12', to_date: '2026-09-14' });
    await wait(MAX_WAIT_MS);

    expect(fetchUnassigned).not.toHaveBeenCalled();
  });
});

describe('side panels and drawers', () => {
  it('opens the legend, the unassigned list or the day-use list from the header, one at a time', async () => {
    const { child, raise } = await mountCalendar();
    expect(child('igl-legend')).toBeNull();

    await raise(child('igl-cal-header'), 'optionEvent', { key: 'showLegend' });
    expect(child('igl-legend')).not.toBeNull();

    await raise(child('igl-cal-header'), 'optionEvent', { key: 'showAssigned' });
    expect(child('igl-to-be-assigned')).not.toBeNull();
    expect(child('igl-legend')).toBeNull();

    await raise(child('igl-cal-header'), 'optionEvent', { key: 'showDayUseBookings' });
    expect(child('igl-day-use-bookings')).not.toBeNull();
    expect(child('igl-to-be-assigned')).toBeNull();
  });

  it('closes the legend when its button is pressed again', async () => {
    const { child, raise } = await mountCalendar();
    await raise(child('igl-cal-footer'), 'optionEvent', { key: 'showLegend' });

    await raise(child('igl-cal-footer'), 'optionEvent', { key: 'showLegend' });

    expect(child('igl-legend')).toBeNull();
  });

  it('closes the open panel and clears the highlighted day when the panel asks to close', async () => {
    const { child, raise } = await mountCalendar();
    await raise(child('igl-cal-header'), 'optionEvent', { key: 'showAssigned' });
    await raise(child('igl-to-be-assigned'), 'optionEvent', { key: 'calendar', data: '2026-09-12', noScroll: true });
    expect(prop(child('igl-cal-header'), 'highlightedDate')).toBe('2026-09-12');

    await raise(child('igl-to-be-assigned'), 'optionEvent', { key: 'closeSideMenu' });

    expect(child('igl-to-be-assigned')).toBeNull();
    expect(prop(child('igl-cal-header'), 'highlightedDate')).toBeFalsy();
  });

  it('accepts the same requests raised anywhere on the page', async () => {
    const { page, child, raise } = await mountCalendar();

    await raise(page.win, 'showBookingPopup', { key: 'showLegend' });

    expect(child('igl-legend')).not.toBeNull();
  });

  it('clears the highlighted day once there are no unassigned units left anywhere', async () => {
    mockUnassignedUnitsService.getAggregatedUnAssignedRoomsByDateRange.mockResolvedValue([{ date: '2026-09-12', room_types: [{ unassigned_rooms: [{ room_identifier: 'r' }] }] }]);
    const { page, child, raise } = await mountCalendar();
    await raise(child('igl-cal-header'), 'optionEvent', { key: 'calendar', data: '2026-09-12', noScroll: true });

    unassigned_units.byDate = new Map();
    await settle(page);

    expect(prop(child('igl-cal-header'), 'highlightedDate')).toBeFalsy();
  });

  it.each([
    ['bulk', 'igl-bulk-operations-drawer'],
    ['rectify', 'ir-rectifier-drawer'],
  ])('opens the %s drawer from the header and closes it when the drawer asks', async (key, drawer) => {
    const { child, raise } = await mountCalendar();
    expect(isOpen(child(drawer))).toBe(false);

    await raise(child('igl-cal-header'), 'optionEvent', { key });
    expect(isOpen(child(drawer))).toBe(true);

    await raise(child(drawer), 'closeDrawer');
    expect(isOpen(child(drawer))).toBe(false);
  });

  it('opens the booking editor for a new booking on the chosen unit and nights', async () => {
    const { child, raise } = await mountCalendar();

    await raise(child('igl-cal-body'), 'showBookingPopup', {
      key: 'add',
      data: { event_type: 'BAR_BOOKING', PR_ID: 102, FROM_DATE: '2026-09-18', TO_DATE: '2026-09-20', TITLE: 'New booking' },
    });

    const editor = child('ir-booking-editor-drawer');
    expect(isOpen(editor)).toBe(true);
    expect(prop(editor, 'mode')).toBe('BAR_BOOKING');
    expect(String(prop(editor, 'unitId'))).toBe('102');
    expect(prop(editor, 'checkIn')).toBe('2026-09-18');
    expect(prop(editor, 'checkOut')).toBe('2026-09-20');
    expect(isOpen(child('igl-blocked-date-drawer'))).toBe(false);

    await raise(editor, 'bookingEditorClosed');
    expect(isOpen(editor)).toBe(false);
  });

  it('opens the block-dates drawer, not the booking editor, when blocking a unit', async () => {
    const { child, raise } = await mountCalendar();

    await raise(child('igl-cal-body'), 'showBookingPopup', { key: 'add', data: { event_type: 'BLOCK_DATES', PR_ID: 102, FROM_DATE: '2026-09-18', TO_DATE: '2026-09-20' } });

    const drawer = child('igl-blocked-date-drawer');
    expect(isOpen(drawer)).toBe(true);
    expect(prop(drawer, 'fromDate')).toBe('2026-09-18');
    expect(prop(drawer, 'toDate')).toBe('2026-09-20');
    expect(isOpen(child('ir-booking-editor-drawer'))).toBe(false);

    await raise(drawer, 'blockedDateDrawerClosed');
    expect(isOpen(drawer)).toBe(false);
  });

  it('opens the booking’s details when a bar is edited', async () => {
    const { child, raise } = await mountCalendar();

    await raise(child('igl-cal-body'), 'showBookingPopup', { key: 'add', data: { event_type: 'EDIT_BOOKING', BOOKING_NUMBER: '100' } });

    const details = child('ir-booking-details-drawer');
    expect(isOpen(details)).toBe(true);
    expect(prop(details, 'bookingNumber')).toBe('100');
    expect(isOpen(child('ir-booking-editor-drawer'))).toBe(false);

    await raise(details, 'bookingDetailsDrawerClosed');
    expect(isOpen(details)).toBe(false);
  });

  it.each([
    ['split', 'igl-split-booking-drawer'],
    ['reallocate-drawer', 'ir-reallocation-drawer'],
    ['room-guests', 'ir-room-guests'],
  ])('opens the %s drawer when a bar asks for it, and closes it when the drawer asks', async (type, drawer) => {
    const { page, child, raise } = await mountCalendar();

    await raise(page.win, 'openCalendarSidebar', { type, payload: { identifier: 'room-1', bookingNumber: '100' } });
    expect(isOpen(child(drawer))).toBe(true);

    await raise(child(drawer), 'closeModal');
    expect(isOpen(child(drawer))).toBe(false);
  });
});

describe('searching for dates', () => {
  const october = () => Array.from({ length: 31 }, (_, i) => ({ value: `2026-10-${String(i + 1).padStart(2, '0')}`, rate: [] }));
  const search = (start: string, end: string) => ({ key: 'calendar', data: { start: moment(start, 'YYYY-MM-DD'), end: moment(end, 'YYYY-MM-DD') } });

  it('highlights a day that is already loaded without asking the server', async () => {
    const { child, raise } = await mountCalendar();
    mockBookingService.getCalendarData.mockClear();

    await raise(child('igl-cal-header'), 'optionEvent', search('2026-09-12', '2026-09-14'));

    expect(prop(child('igl-cal-header'), 'highlightedDate')).toBe('2026-09-12');
    expect(prop(child('igl-cal-body'), 'highlightedDate')).toBe('2026-09-12');
    expect(mockBookingService.getCalendarData).not.toHaveBeenCalled();
  });

  it('loads forward to two months past a search beyond the loaded range, and appends the new days', async () => {
    const { child, raise } = await mountCalendar();
    mockBookingService.getCalendarData.mockResolvedValue({
      days: october(),
      months: [{ monthName: 'Oct 2026', daysCount: 31 }],
      myBookings: [booking({ ID: 'pool-oct', FROM_DATE: '2026-10-05', TO_DATE: '2026-10-07' })],
    });
    mockUnassignedUnitsService.getAggregatedUnAssignedRoomsByDateRange.mockClear();

    await raise(child('igl-cal-header'), 'optionEvent', search('2026-10-05', '2026-10-07'));

    expect(mockBookingService.getCalendarData).toHaveBeenLastCalledWith({ propertyid: PROPERTY_ID, from_date: '2026-10-01', to_date: '2026-12-07', language: 'en' });
    const { days, monthsInfo, bookingEvents } = child('igl-cal-body').calendarData;
    expect(days).toHaveLength(61);
    expect(days[30].value).toBe('2026-10-01');
    expect(monthsInfo.map(m => m.monthName)).toEqual(['Sep 2026', 'Oct 2026']);
    expect(bookingEvents.map(b => b.ID)).toEqual(['pool-1', 'pool-oct']);
    expect(calendar_dates.toDate).toBe('2026-12-07');
    expect(mockUnassignedUnitsService.getAggregatedUnAssignedRoomsByDateRange).toHaveBeenCalledWith({ propertyid: PROPERTY_ID, from_date: '2026-10-01', to_date: '2026-12-07' });
    expect(mockPropertyService.getDayUseBookingsForCalendar).toHaveBeenLastCalledWith({ property_id: PROPERTY_ID, from_date: '2026-10-01', to_date: '2026-12-07' });
  });

  // The follow-up unassigned-units read comes back empty, which is taken as "the unassigned list
  // emptied out" and clears the highlight, although this highlight came from a date search.
  knownBug('a searched day stays highlighted once its days have loaded, in a hotel with no unassigned units', async () => {
    const { child, raise } = await mountCalendar();
    mockBookingService.getCalendarData.mockResolvedValue({ days: october(), months: [{ monthName: 'Oct 2026', daysCount: 31 }], myBookings: [] });

    await raise(child('igl-cal-header'), 'optionEvent', search('2026-10-05', '2026-10-07'));

    expect(prop(child('igl-cal-header'), 'highlightedDate')).toBe('2026-10-05');
  });

  it('loads back to the day before a search that starts before the loaded range, and prepends the new days', async () => {
    const august = Array.from({ length: 13 }, (_, i) => ({ value: `2026-08-${19 + i}`, rate: [] }));
    const { child, raise } = await mountCalendar();
    mockBookingService.getCalendarData.mockResolvedValue({ days: august, months: [{ monthName: 'Aug 2026', daysCount: 13 }], myBookings: [] });
    mockUnassignedUnitsService.getAggregatedUnAssignedRoomsByDateRange.mockClear();

    await raise(child('igl-cal-header'), 'optionEvent', search('2026-08-20', '2026-08-22'));

    expect(mockBookingService.getCalendarData).toHaveBeenLastCalledWith({ propertyid: PROPERTY_ID, from_date: '2026-08-19', to_date: '2026-08-31', language: 'en' });
    const { days, monthsInfo } = child('igl-cal-body').calendarData;
    expect(days).toHaveLength(43);
    expect(days[0].value).toBe('2026-08-19');
    expect(monthsInfo.map(m => m.monthName)).toEqual(['Aug 2026', 'Sep 2026']);
    expect(calendar_dates.fromDate).toBe('2026-08-19');
    // Three weeks back: nobody assigns units that far in the past, so they are not fetched.
    expect(mockUnassignedUnitsService.getAggregatedUnAssignedRoomsByDateRange).not.toHaveBeenCalled();
  });

  it('counts a month split across two loads as one month', async () => {
    mockBookingService.getCalendarData.mockResolvedValue(
      calendarResponse({
        days: september().slice(0, 15),
        months: [{ monthName: 'Sep 2026', daysCount: 15 }],
        My_Params_Get_Rooming_Data: { FROM: '2026-09-01', TO: '2026-09-15' },
      }),
    );
    const { child, raise } = await mountCalendar({ to_date: '2026-09-15' });
    mockBookingService.getCalendarData.mockResolvedValue({
      days: [...september().slice(15), ...october()],
      months: [
        { monthName: 'Sep 2026', daysCount: 15 },
        { monthName: 'Oct 2026', daysCount: 31 },
      ],
      myBookings: [],
    });

    await raise(child('igl-cal-header'), 'optionEvent', search('2026-09-20', '2026-09-22'));

    expect(child('igl-cal-body').calendarData.monthsInfo).toEqual([
      { monthName: 'Sep 2026', daysCount: 30 },
      { monthName: 'Oct 2026', daysCount: 31 },
    ]);
  });

  it('extends a bar that was cut off at the old edge instead of drawing its remainder as a second bar', async () => {
    mockBookingService.getCalendarData.mockResolvedValue(calendarResponse({ myBookings: [booking({ FROM_DATE: '2026-09-28', TO_DATE: '2026-09-30', NO_OF_DAYS: 2 })] }));
    const { child, raise, bookings } = await mountCalendar();
    mockBookingService.getCalendarData.mockResolvedValue({
      days: october(),
      months: [{ monthName: 'Oct 2026', daysCount: 31 }],
      myBookings: [booking({ FROM_DATE: '2026-10-01', TO_DATE: '2026-10-03' })],
    });

    await raise(child('igl-cal-header'), 'optionEvent', search('2026-10-05', '2026-10-07'));

    expect(bookings()).toHaveLength(1);
    expect(bookings()[0]).toMatchObject({ FROM_DATE: '2026-09-28', TO_DATE: '2026-10-03', NO_OF_DAYS: 5 });
  });

  knownBug('a search that starts on screen but ends past the loaded range loads the missing days', async () => {
    const { child, raise } = await mountCalendar();
    mockBookingService.getCalendarData.mockClear();
    mockBookingService.getCalendarData.mockResolvedValue({ days: october(), months: [{ monthName: 'Oct 2026', daysCount: 31 }], myBookings: [] });

    await raise(child('igl-cal-header'), 'optionEvent', search('2026-09-28', '2026-10-03'));

    expect(mockBookingService.getCalendarData).toHaveBeenCalledTimes(1);
  });
});

describe('requests raised by booking bars', () => {
  it('opens the guests drawer for a check-in, with the room it is for', async () => {
    const { child, raise, emittedAs } = await mountCalendar();
    const sidebarPayload = { identifier: 'room-1', bookingNumber: '100', roomName: '101', totalGuests: 2 };

    await raise(child('igl-cal-body'), 'showDialog', { reason: 'checkin', bookingNumber: '100', roomIdentifier: 'room-1', roomName: '101', sidebarPayload });

    expect(emittedAs('openCalendarSidebar')).toEqual([{ type: 'room-guests', payload: sidebarPayload }]);
    const guests = child('ir-room-guests');
    expect(isOpen(guests)).toBe(true);
    expect(prop(guests, 'identifier')).toBe('room-1');
    expect(prop(guests, 'bookingNumber')).toBe('100');
    expect(child('ir-modal').openModal).not.toHaveBeenCalled();
  });

  it('opens the check-out dialog for a guest leaving on their departure day', async () => {
    const stay = { rooms: [{ identifier: 'room-1', to_date: TODAY }] };
    const { child, raise } = await mountCalendar();

    await raise(child('igl-cal-body'), 'showDialog', { reason: 'checkout', bookingNumber: '100', roomIdentifier: 'room-1', booking: stay });

    const dialog = child('ir-checkout-dialog');
    expect(isOpen(dialog)).toBe(true);
    expect(dialog.booking).toBe(stay);
    expect(prop(dialog, 'identifier')).toBe('room-1');
    expect(isOpen(child('ir-booking-details-drawer'))).toBe(false);
  });

  it('sends an early check-out to the booking’s details instead, where the penalty is handled', async () => {
    const stay = { rooms: [{ identifier: 'room-1', to_date: '2026-09-14' }] };
    const { child, raise } = await mountCalendar();

    await raise(child('igl-cal-body'), 'showDialog', { reason: 'checkout', bookingNumber: '100', roomIdentifier: 'room-1', booking: stay });

    const details = child('ir-booking-details-drawer');
    expect(isOpen(details)).toBe(true);
    expect(prop(details, 'bookingNumber')).toBe('100');
    expect(prop(details, 'checkoutRoomIdentifier')).toBe('room-1');
    expect(isOpen(child('ir-checkout-dialog'))).toBe(false);

    await raise(details, 'bookingDetailsDrawerClosed');
    expect(isOpen(details)).toBe(false);
  });

  it('opens the invoice for the room when the check-out dialog closes asking for it', async () => {
    const stay = { rooms: [{ identifier: 'room-1', to_date: TODAY }] };
    const { child, raise } = await mountCalendar();
    await raise(child('igl-cal-body'), 'showDialog', { reason: 'checkout', bookingNumber: '100', roomIdentifier: 'room-1', booking: stay });

    await raise(child('ir-checkout-dialog'), 'checkoutDialogClosed', { reason: 'openInvoice' });

    const invoice = child('ir-invoice');
    expect(isOpen(invoice)).toBe(true);
    expect(invoice.booking).toBe(stay);
    expect(prop(invoice, 'roomIdentifier')).toBe('room-1');
    expect(isOpen(child('ir-checkout-dialog'))).toBe(false);

    await raise(invoice, 'invoiceClose');
    expect(isOpen(invoice)).toBe(false);
  });

  it('just closes the check-out dialog when it is dismissed', async () => {
    const stay = { rooms: [{ identifier: 'room-1', to_date: TODAY }] };
    const { child, raise } = await mountCalendar();
    await raise(child('igl-cal-body'), 'showDialog', { reason: 'checkout', bookingNumber: '100', roomIdentifier: 'room-1', booking: stay });

    await raise(child('ir-checkout-dialog'), 'checkoutDialogClosed', { reason: 'dialogClose' });

    expect(isOpen(child('ir-checkout-dialog'))).toBe(false);
    expect(isOpen(child('ir-invoice'))).toBe(false);
  });

  it('hands a move between units to the reallocation dialog', async () => {
    const move = { reason: 'reallocate', pool: 'pool-1', toRoomId: 102, from_date: '2026-09-12', to_date: '2026-09-14', description: 'Move to 102?' };
    const { child, raise } = await mountCalendar();

    await raise(child('igl-cal-body'), 'showDialog', move);

    expect(child('igl-reallocation-dialog').data).toEqual(move);
    expect(child('ir-modal').openModal).not.toHaveBeenCalled();
  });

  it('puts a moved bar back when the reallocation dialog is dismissed', async () => {
    const { child, raise, emittedAs } = await mountCalendar();
    await raise(child('igl-cal-body'), 'showDialog', { reason: 'reallocate', pool: 'pool-1', toRoomId: 102 });

    await raise(child('igl-reallocation-dialog'), 'dialogClose');

    expect(emittedAs('revertBooking')).toEqual(['pool-1']);
    expect(child('igl-reallocation-dialog').data).toBeUndefined();
  });

  it('leaves a moved bar where it is once the reallocation went through', async () => {
    const { child, raise, emittedAs } = await mountCalendar();
    await raise(child('igl-cal-body'), 'showDialog', { reason: 'reallocate', pool: 'pool-1', toRoomId: 102 });

    await raise(child('igl-reallocation-dialog'), 'resetModalState');

    expect(emittedAs('revertBooking')).toEqual([]);
    expect(child('igl-reallocation-dialog').data).toBeUndefined();
  });

  it('asks for confirmation before a stretched stay is repriced, then opens the rate drawer for it', async () => {
    const stretch = { reason: 'stretch', pool: 'pool-1', bookingNumber: '100', identifier: 'room-1', from_date: '2026-09-12', to_date: '2026-09-16' };
    const { child, raise, emittedAs } = await mountCalendar();

    await raise(child('igl-cal-body'), 'showDialog', stretch);
    expect(child('ir-modal').openModal).toHaveBeenCalledTimes(1);
    expect(isOpen(child('igl-rate-extender-drawer'))).toBe(false);

    await raise(child('ir-modal'), 'confirmModal');
    const nights = { pool: 'pool-1', bookingNumber: '100', identifier: 'room-1', from_date: '2026-09-12', to_date: '2026-09-16' };
    expect(emittedAs('showRoomNightsDialog')).toEqual([nights]);
    const drawer = child('igl-rate-extender-drawer');
    expect(isOpen(drawer)).toBe(true);
    expect(prop(drawer, 'bookingNumber')).toBe('100');
    expect(prop(drawer, 'toDate')).toBe('2026-09-16');
  });

  it('puts a stretched bar back when the confirmation is cancelled', async () => {
    const { child, raise, emittedAs } = await mountCalendar();
    await raise(child('igl-cal-body'), 'showDialog', { reason: 'stretch', pool: 'pool-1', bookingNumber: '100' });

    await raise(child('ir-modal'), 'cancelModal');

    expect(emittedAs('revertBooking')).toEqual(['pool-1']);
    expect(emittedAs('showRoomNightsDialog')).toEqual([]);
  });

  it('opens the rate drawer directly when a bar asks for it', async () => {
    const { child, raise } = await mountCalendar();

    await raise(child('igl-cal-body'), 'showRoomNightsDialog', { pool: 'pool-1', bookingNumber: '100', identifier: 'room-1', from_date: '2026-09-12', to_date: '2026-09-16' });

    expect(isOpen(child('igl-rate-extender-drawer'))).toBe(true);
    expect(prop(child('igl-rate-extender-drawer'), 'pool')).toBe('pool-1');
  });

  it('puts the bar back when the rate drawer is cancelled, and leaves it when the new nights are saved', async () => {
    const nights = { pool: 'pool-1', bookingNumber: '100', identifier: 'room-1', from_date: '2026-09-12', to_date: '2026-09-16' };
    const { child, raise, emittedAs } = await mountCalendar();

    await raise(child('igl-cal-body'), 'showRoomNightsDialog', nights);
    await raise(child('igl-rate-extender-drawer'), 'closeRoomNightsDialog', { type: 'confirm', pool: 'pool-1' });
    expect(isOpen(child('igl-rate-extender-drawer'))).toBe(false);
    expect(emittedAs('revertBooking')).toEqual([]);

    await raise(child('igl-cal-body'), 'showRoomNightsDialog', nights);
    await raise(child('igl-rate-extender-drawer'), 'closeRoomNightsDialog', { type: 'cancel', pool: 'pool-1' });
    expect(isOpen(child('igl-rate-extender-drawer'))).toBe(false);
    expect(emittedAs('revertBooking')).toEqual(['pool-1']);
  });

  it('deletes the block a bar asks to delete', async () => {
    const { child, raise } = await mountCalendar();

    await raise(child('igl-cal-body'), 'deleteButton', 'block-1');

    expect(mockEventsService.deleteEvent).toHaveBeenCalledWith('block-1');
  });

  it('redraws a bar with the data it reports after being moved or stretched', async () => {
    const { child, raise, bookingById, bookings } = await mountCalendar();

    await raise(child('igl-cal-body'), 'updateBookingEvent', booking({ PR_ID: 102, FROM_DATE: '2026-09-13', TO_DATE: '2026-09-15' }));

    expect(bookings()).toHaveLength(1);
    expect(bookingById('pool-1')).toMatchObject({ PR_ID: 102, FROM_DATE: '2026-09-13', TO_DATE: '2026-09-15' });
  });

  it('swaps the placeholder bar for the pending bookings made from the booking form', async () => {
    mockBookingService.getCalendarData.mockResolvedValue(calendarResponse({ myBookings: [booking(), booking({ ID: 'NEW_TEMP_EVENT', POOL: null })] }));
    const { child, raise, bookings } = await mountCalendar();

    await raise(child('igl-cal-body'), 'addBookingDatasEvent', [
      booking({ ID: 'pool-7', STATUS: 'PENDING-CONFIRMATION', BASE_STATUS_CODE: '001' }),
      booking({ ID: 'pool-8', STATUS: 'CONFIRMED' }),
    ]);

    expect(bookings().map(b => b.ID)).toEqual(['pool-1', 'pool-7']);
  });
});

describe('dragging a booking bar', () => {
  /*
   * A hand-built grid in the units the bar reports its position in: day columns 58px wide starting
   * 170px in (after the unit column), unit rows 30px tall. 2026-09-03 spans x 286..344; unit 102
   * spans y 30..60.
   */
  function layOutGrid(page: SpecPage, dates = ['2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04', '2026-09-05']) {
    const grid = page.doc.createElement('div');
    grid.innerHTML = `<div class="headersContainer"></div><div class="bodyContainer"></div>`;
    page.body.appendChild(grid);
    mounted.push(grid);
    const box = (el: HTMLElement, left: number, width: number) =>
      ((el as any).getBoundingClientRect = () => ({ left, width, right: left + width, top: 0, bottom: 0, height: 0, x: left, y: 0 }));
    const body = grid.querySelector('.bodyContainer') as HTMLElement;
    box(body, 0, 2000);
    const addDay = (date: string, index: number) => {
      const day = page.doc.createElement('div');
      day.className = 'headerCell';
      day.setAttribute('data-date', date);
      box(day, 170 + index * 58, 58);
      grid.querySelector('.headersContainer').appendChild(day);
    };
    dates.forEach(addDay);
    [101, 102].forEach((unit, index) => {
      const row = page.doc.createElement('div');
      row.className = 'roomRow';
      row.innerHTML = `<div class="roomTitle" data-room="${unit}"></div>`;
      Object.defineProperties(row.firstElementChild, { offsetTop: { value: index * 30 }, offsetHeight: { value: 30 } });
      body.appendChild(row);
    });
    return { addDay };
  }

  const bar = (overrides: Record<string, any> = {}) => ({ id: 'pool-1', pool: 'pool-1', fromRoomId: 101, nbOfDays: 2, x: 300, y: 40, ...overrides });

  it('highlights the cell under the bar’s check-in edge while it is dragged', async () => {
    const { page, child, raise, emittedAs } = await mountCalendar();
    layOutGrid(page);

    await raise(child('igl-cal-body'), 'dragOverEventData', { id: 'CALCULATE_DRAG_OVER_BOUNDS', data: bar() });
    await raise(child('igl-cal-body'), 'dragOverEventData', { id: 'DRAG_OVER', data: bar({ x: 240, y: 10 }) });

    expect(emittedAs('dragOverHighlightElement')).toEqual([{ dragOverElement: '102_2026-09-03' }, { dragOverElement: '101_2026-09-02' }]);
    expect(emittedAs('moveBookingTo')).toEqual([]);
  });

  it('moves the booking to the unit and night it is dropped on, keeping its length', async () => {
    const { page, child, raise, emittedAs } = await mountCalendar();
    layOutGrid(page);
    await raise(child('igl-cal-body'), 'dragOverEventData', { id: 'CALCULATE_DRAG_OVER_BOUNDS', data: bar() });

    await raise(child('igl-cal-body'), 'dragOverEventData', { id: 'DRAG_OVER_END', data: bar() });

    expect(emittedAs('moveBookingTo')).toEqual([
      { bookingId: 'pool-1', fromRoomId: 101, toRoomId: '102', moveToDay: '2026-09-03', pool: 'pool-1', from_date: '2026-09-03', to_date: '2026-09-05' },
    ]);
    expect(emittedAs('dragOverHighlightElement').pop()).toEqual({ dragOverElement: '' });
  });

  it('resolves a stretch the same way when it ends', async () => {
    const { page, child, raise, emittedAs } = await mountCalendar();
    layOutGrid(page);
    await raise(child('igl-cal-body'), 'dragOverEventData', { id: 'CALCULATE_DRAG_OVER_BOUNDS', data: bar() });

    await raise(child('igl-cal-body'), 'dragOverEventData', { id: 'STRETCH_OVER_END', data: bar({ nbOfDays: 3 }) });

    expect(emittedAs('moveBookingTo')).toEqual([expect.objectContaining({ toRoomId: '102', from_date: '2026-09-03', to_date: '2026-09-06' })]);
  });

  it('tells the bar to go back when it is dropped outside the grid', async () => {
    const { page, child, raise, emittedAs } = await mountCalendar();
    layOutGrid(page);
    await raise(child('igl-cal-body'), 'dragOverEventData', { id: 'CALCULATE_DRAG_OVER_BOUNDS', data: bar() });

    await raise(child('igl-cal-body'), 'dragOverEventData', { id: 'DRAG_OVER_END', data: bar({ x: 5000, y: 5000 }) });

    expect(emittedAs('moveBookingTo')).toEqual([expect.objectContaining({ bookingId: 'pool-1', toRoomId: 'revert', moveToDay: 'revert' })]);
  });

  it('only clears the highlight when a drag is cancelled, moving nothing', async () => {
    const { page, child, raise, emittedAs } = await mountCalendar();
    layOutGrid(page);
    await raise(child('igl-cal-body'), 'dragOverEventData', { id: 'CALCULATE_DRAG_OVER_BOUNDS', data: bar() });

    await raise(child('igl-cal-body'), 'dragOverEventData', { id: 'DRAG_CANCEL', data: bar() });

    expect(emittedAs('dragOverHighlightElement').pop()).toEqual({ dragOverElement: '' });
    expect(emittedAs('moveBookingTo')).toEqual([]);
  });

  it('reads the check-in day from the bar’s right edge in a right-to-left calendar', async () => {
    mockLocaleService.getExposedLanguage.mockResolvedValue({ entries: {}, direction: 'rtl', fallbackKeys: [] });
    const { page, child, raise, emittedAs } = await mountCalendar();
    layOutGrid(page);

    // Left edge at 190 is over 2026-09-01; the right edge, 116px further, is over 2026-09-03.
    await raise(child('igl-cal-body'), 'dragOverEventData', { id: 'CALCULATE_DRAG_OVER_BOUNDS', data: bar({ x: 190, width: 116 }) });

    expect(emittedAs('dragOverHighlightElement')).toEqual([{ dragOverElement: '102_2026-09-03' }]);
  });

  it('can drop on days that were loaded while the bar was being dragged', async () => {
    const { page, child, raise, emittedAs } = await mountCalendar();
    const grid = layOutGrid(page);
    await raise(child('igl-cal-body'), 'dragOverEventData', { id: 'CALCULATE_DRAG_OVER_BOUNDS', data: bar() });

    // Auto-scroll reaches the end of the range mid-drag and more days are loaded and drawn.
    mockBookingService.getCalendarData.mockResolvedValue({ days: [{ value: '2026-10-01', rate: [] }], months: [{ monthName: 'Oct 2026', daysCount: 1 }], myBookings: [] });
    await raise(child('igl-cal-header'), 'optionEvent', { key: 'calendar', data: { start: moment('2026-10-01', 'YYYY-MM-DD'), end: moment('2026-10-01', 'YYYY-MM-DD') } });
    grid.addDay('2026-10-01', 5);
    await raise(child('igl-cal-body'), 'dragOverEventData', { id: 'DRAG_OVER_END', data: bar({ x: 170 + 5 * 58 + 10 }) });

    expect(emittedAs('moveBookingTo')).toEqual([expect.objectContaining({ toRoomId: '102', moveToDay: '2026-10-01' })]);
  });
});
