// jsdom has no ResizeObserver; the dashboard uses one to fit the page, which these tests don't exercise.
(globalThis as any).ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
import { newSpecPage, type SpecPage } from '@stencil/core/testing';
import type { Booking, Room } from '@/models/booking.dto';

// Every service reaches axios (ESM), which this jest setup can't parse, so each one is replaced by a shared mock.
const mockToken = { setBaseUrl: jest.fn(), setToken: jest.fn() };
const mockRoomService = { getExposedProperty: jest.fn(), fetchLanguage: jest.fn() };
const mockBookingService = { getCountries: jest.fn(), getSetupEntriesByTableNameMulti: jest.fn(), groupEntryTablesResult: jest.fn() };
const mockListingService = { getExposedBookingsCriteria: jest.fn() };
const mockDashboardService = {
  getDayPerformance: jest.fn(),
  getUnitsSummary: jest.fn(),
  getPendingUnits: jest.fn(),
  getInHouse: jest.fn(),
  getNewBookings: jest.fn(),
  getCancellations: jest.fn(),
};
const mockLoaders = { loadArrivals: jest.fn(), loadDepartures: jest.fn() };
const mockRealtime: { subscribe: jest.Mock; unsubscribe: jest.Mock; handler: (msg: unknown) => void } = { subscribe: jest.fn(), unsubscribe: jest.fn(), handler: null };
/** Stand-ins for each BatchingQueue the component creates; tests flush them by hand instead of waiting 3s. */
const mockQueues: { processor: (items: unknown[]) => Promise<void>; options: Record<string, unknown>; items: unknown[]; clear: jest.Mock }[] = [];

jest.mock('../../../models/Token', () => ({ __esModule: true, default: jest.fn(() => mockToken) }));
jest.mock('../../../services/room.service', () => ({ RoomService: jest.fn(() => mockRoomService) }));
jest.mock('../../../services/booking-service/booking.service', () => ({ BookingService: jest.fn(() => mockBookingService) }));
jest.mock('../../../services/booking_listing.service', () => ({ BookingListingService: jest.fn(() => mockListingService) }));
jest.mock('../../../services/dashboard', () => ({ DashboardService: jest.fn(() => mockDashboardService) }));
jest.mock('../../../services/realtime/realtime.service', () => ({ realtimeService: { subscribe: (...args: unknown[]) => mockRealtime.subscribe(...args) } }));
jest.mock('../../../utils/Queue/batch-queue', () => ({
  BatchingQueue: jest.fn((processor, options) => {
    const queue = {
      processor,
      options,
      items: [] as unknown[],
      offer: (item: unknown) => queue.items.push(item) > 0,
      clear: jest.fn(() => (queue.items = [])),
    };
    mockQueues.push(queue);
    return queue;
  }),
}));
jest.mock('../dashboard.data', () => ({
  DASHBOARD_PAGE_SIZE: 100,
  loadArrivals: (...args: unknown[]) => mockLoaders.loadArrivals(...args),
  loadDepartures: (...args: unknown[]) => mockLoaders.loadDepartures(...args),
}));

import { arrivalsStore, initializeArrivalsStore, setArrivalsPageSize, setArrivalsTotal } from '../../../stores/arrivals.store';
import calendar_data from '../../../stores/calendar-data';
import { departuresStore, initializeDeparturesStore, setDepartureTotal, setDeparturesPageSize } from '../../../stores/departures.store';
import locales from '../../../stores/locales.store';
import { addDaysISO, todayISO } from '../../../utils/calendar-dates';
import { IrDashboard } from '../ir-dashboard';
import { DATE_CHANGE_DEBOUNCE_MS } from '../dashboard.helpers';

const TODAY = todayISO();
const TOMORROW = addDaysISO(TODAY, 1);
const YESTERDAY = addDaysISO(TODAY, -1);

const IDLE = { code: '000', description: '' };
const CHECKED_IN = { code: '001', description: '' };

const booking = (booking_nbr: string, rooms: Partial<Room>[] = [{}]) => ({ booking_nbr, rooms }) as unknown as Booking;
/** Enough of a property for the arrivals / departures store pipelines (canCheckIn reads these flags). */
const property = (id: number) => ({ id, is_automatic_check_in_out: false, is_frontdesk_enabled: true }) as any;

const SETUP_ENTRIES = [{ TBL_NAME: '_PAY_TYPE' }];
const PAY_TYPES = [{ CODE_NAME: 'PT1', CODE_VALUE_EN: 'Cash', NOTES: 'CR' }];
const PAY_GROUPS = [{ CODE_NAME: 'G1' }];
const PAY_METHODS = [{ CODE_NAME: 'M1' }];
const COUNTRIES = [{ id: 1, name: 'Lebanon' }];
const PERFORMANCE = { revenue: 1200, adr: 80, occupancy: 60 };
const UNITS = { available: 4, outOfService: 1, blocked: 0, total: 20 };

/** What the mocked backend returns for the day; tests override pieces of it. */
let backend: {
  arrivals: Booking[];
  arrivalsTotal: number;
  departures: Booking[];
  inHouse: Booking[];
  newBookings: Booking[];
  cancellations: Booking[];
};

function defaultBackend(): typeof backend {
  return {
    arrivals: [
      booking('A1', [
        // Overdue and unassigned.
        { from_date: YESTERDAY, to_date: TOMORROW, unit: null, in_out: IDLE as any },
        { from_date: TODAY, to_date: TOMORROW, unit: { id: 1, name: '101' } as any, in_out: IDLE as any },
      ]),
      // Unassigned.
      booking('A2', [{ from_date: TODAY, to_date: TOMORROW, unit: null, in_out: IDLE as any }]),
    ],
    arrivalsTotal: 5,
    departures: [
      booking('D1', [
        { from_date: YESTERDAY, to_date: TODAY, in_out: CHECKED_IN as any },
        { from_date: YESTERDAY, to_date: TODAY, in_out: CHECKED_IN as any },
      ]),
      // Still checked in after its departure day.
      booking('D2', [{ from_date: addDaysISO(TODAY, -3), to_date: YESTERDAY, in_out: CHECKED_IN as any }]),
    ],
    inHouse: [booking('H1', [{}, {}]), booking('H2')],
    newBookings: [booking('N1'), booking('N2')],
    cancellations: [booking('C1')],
  };
}

function deferred<T = void>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

async function flush(page: SpecPage) {
  for (let i = 0; i < 5; i++) {
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  await page.waitForChanges();
}

/**
 * Mounts the dashboard without a ticket, stubs the wa-tab-group API the component drives, then hands it the ticket
 * (which starts the load through the `ticket` watcher). Pass `ticket: null` to leave it waiting.
 */
async function mount(attrs: Record<string, string | number> = { propertyid: 1 }, ticket: string | null = 'ticket') {
  const attrString = Object.entries(attrs)
    .map(([name, value]) => `${name}="${value}"`)
    .join(' ');
  const page = await newSpecPage({ components: [IrDashboard], html: `<ir-dashboard ${attrString}></ir-dashboard>` });
  const root = page.root as any;
  const tabGroup = root.querySelector('wa-tab-group') as any;
  tabGroup.updateComplete = Promise.resolve();
  tabGroup.updateActiveTab = jest.fn();
  if (ticket) {
    root.ticket = ticket;
    await flush(page);
  }
  return { page, root, tabGroup };
}

const $ = (page: SpecPage, selector: string) => page.root.querySelector(selector) as any;
const tab = (page: SpecPage, name: string) => $(page, `wa-tab[data-tab="${name}"]`);
const isTabDisabled = (page: SpecPage, name: string) => tab(page, name).hasAttribute('disabled');
/** The card's count, or `null` while it shows a skeleton. */
const tabCount = (page: SpecPage, name: string) => {
  const count = tab(page, name).querySelector('.dashboard-tab__count');
  return count.querySelector('wa-skeleton') ? null : count.textContent.trim();
};
const tabNotes = (page: SpecPage, name: string) => Array.from(tab(page, name).querySelectorAll('.dashboard-tab__note')).map((note: any) => note.textContent.trim());
const panelContent = (page: SpecPage, name: string) => $(page, `wa-tab-panel[name="${name}"]`).firstElementChild as any;
const isPanelSkeleton = (page: SpecPage, name: string) => !!panelContent(page, name)?.classList.contains('dashboard-table-skeleton');
/** Child components aren't registered here, so primitive props land as attributes and objects as properties. */
const prop = (el: any, name: string) => (name in el ? el[name] : el.getAttribute(name));

function emit(target: any, type: string, detail?: unknown) {
  target.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true }));
}

async function showTab(page: SpecPage, name: string) {
  const tabGroup = $(page, 'wa-tab-group');
  tabGroup.dispatchEvent(new CustomEvent('wa-tab-show', { detail: { name }, bubbles: true }));
  await flush(page);
}

/** Picks a day without waiting out the debounce, so nothing is fetched yet. */
async function pickDate(page: SpecPage, date: string) {
  emit($(page, 'ir-dashboard-date-navigator'), 'dateChange', date);
  await flush(page);
}

/** Picks a day and waits out the debounce, so its load has started. */
async function changeDate(page: SpecPage, date: string) {
  await pickDate(page, date);
  await new Promise(resolve => setTimeout(resolve, DATE_CHANGE_DEBOUNCE_MS));
  await flush(page);
}

describe('ir-dashboard', () => {
  let consoleError: jest.SpyInstance;
  let consoleLog: jest.SpyInstance;
  /** Set by tests that exercise a failure; every other test must run without logging an error. */
  let expectErrors: boolean;

  beforeEach(() => {
    expectErrors = false;
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    // The departures store logs every pipeline run.
    consoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.clearAllMocks();
    Object.values({ ...mockRoomService, ...mockBookingService, ...mockListingService, ...mockDashboardService, ...mockLoaders }).forEach(fn => fn.mockReset());

    // Empty the stores first: their setters re-run pipelines that read the property.
    initializeArrivalsStore([]);
    initializeDeparturesStore([]);
    setArrivalsTotal(0);
    setDepartureTotal(0);
    setArrivalsPageSize(20);
    setDeparturesPageSize(20);
    calendar_data.property = null;
    calendar_data.currency = undefined;
    locales.entries = null;

    backend = defaultBackend();

    mockQueues.length = 0;
    mockRealtime.handler = null;
    mockRealtime.unsubscribe.mockReset();
    mockRealtime.subscribe.mockReset().mockImplementation((_propertyId, handler) => {
      mockRealtime.handler = handler;
      return mockRealtime.unsubscribe;
    });

    mockRoomService.getExposedProperty.mockImplementation(async ({ id }) => {
      calendar_data.property = property(id || 42);
    });
    mockListingService.getExposedBookingsCriteria.mockResolvedValue({ statuses: [{ code: '001' }, { code: '002' }] });
    mockBookingService.getCountries.mockResolvedValue(COUNTRIES);
    mockRoomService.fetchLanguage.mockResolvedValue(undefined);
    mockBookingService.getSetupEntriesByTableNameMulti.mockResolvedValue(SETUP_ENTRIES);
    mockBookingService.groupEntryTablesResult.mockReturnValue({ pay_type: PAY_TYPES, pay_type_group: PAY_GROUPS, pay_method: PAY_METHODS });

    mockDashboardService.getDayPerformance.mockResolvedValue(PERFORMANCE);
    mockDashboardService.getUnitsSummary.mockResolvedValue(UNITS);
    mockDashboardService.getPendingUnits.mockResolvedValue(3);
    mockDashboardService.getInHouse.mockImplementation(async () => backend.inHouse);
    mockDashboardService.getNewBookings.mockImplementation(async () => backend.newBookings);
    mockDashboardService.getCancellations.mockImplementation(async () => backend.cancellations);

    // Stand-ins for the real loaders: once the property is ready, they fill the same global stores the panels and card counts read.
    mockLoaders.loadArrivals.mockImplementation(async (_propertyId, _date, ready) => {
      await ready;
      setArrivalsTotal(backend.arrivalsTotal);
      initializeArrivalsStore(backend.arrivals);
    });
    mockLoaders.loadDepartures.mockImplementation(async (_propertyId, _date, ready) => {
      await ready;
      setDepartureTotal(backend.departures.length);
      initializeDeparturesStore(backend.departures);
    });
  });

  afterEach(() => {
    if (!expectErrors) {
      expect(consoleError).not.toHaveBeenCalled();
    }
    consoleError.mockRestore();
    consoleLog.mockRestore();
  });

  describe('startup', () => {
    it('configures the API and page sizes but loads nothing until it has a ticket', async () => {
      const { page } = await mount({ propertyid: 1, baseurl: 'https://api.test' }, null);

      expect(mockToken.setBaseUrl).toHaveBeenCalledWith('https://api.test');
      expect(arrivalsStore.pagination.pageSize).toBe(100);
      expect(departuresStore.pagination.pageSize).toBe(100);
      expect(mockToken.setToken).not.toHaveBeenCalled();
      expect(mockRoomService.getExposedProperty).not.toHaveBeenCalled();
      expect(mockLoaders.loadArrivals).not.toHaveBeenCalled();
      expect($(page, '.dashboard-main').getAttribute('aria-busy')).toBe('true');
      expect($(page, 'ir-booking-details-drawer')).toBeNull();
      expect($(page, 'ir-payment-folio')).toBeNull();
    });

    it('starts loading on mount when the ticket is already set', async () => {
      mockLoaders.loadArrivals.mockReturnValue(new Promise(() => {}));
      await newSpecPage({ components: [IrDashboard], html: `<ir-dashboard ticket="abc" propertyid="1"></ir-dashboard>` });

      expect(mockToken.setToken).toHaveBeenCalledWith('abc');
      expect(mockRoomService.getExposedProperty).toHaveBeenCalled();
    });

    it('reloads when the ticket changes, but not when it is set to the same value', async () => {
      const { page, root } = await mount();
      mockRoomService.fetchLanguage.mockClear();

      root.ticket = 'ticket';
      await flush(page);
      expect(mockRoomService.fetchLanguage).not.toHaveBeenCalled();

      root.ticket = 'renewed';
      await flush(page);
      expect(mockToken.setToken).toHaveBeenLastCalledWith('renewed');
      expect(mockRoomService.fetchLanguage).toHaveBeenCalledTimes(1);
    });

    it('stops without requesting anything when neither a property id nor an alias is given', async () => {
      expectErrors = true;
      const { page } = await mount({});

      expect(consoleError).toHaveBeenCalledWith(new Error('Missing credentials'));
      expect(mockRoomService.getExposedProperty).not.toHaveBeenCalled();
      expect(mockLoaders.loadArrivals).not.toHaveBeenCalled();
      expect(mockDashboardService.getDayPerformance).not.toHaveBeenCalled();
      expect($(page, '.dashboard-main').hasAttribute('aria-busy')).toBe(false);
    });

    it('with a property id, sends the property-scoped requests alongside the property fetch', async () => {
      const propertyLoad = deferred();
      mockRoomService.getExposedProperty.mockReturnValue(propertyLoad.promise);
      await mount({ propertyid: 1, language: 'fr' });

      expect(mockRoomService.getExposedProperty).toHaveBeenCalledWith({ id: 1, aname: undefined, language: 'fr', is_backend: true });
      expect(mockRoomService.fetchLanguage).toHaveBeenCalledWith('fr');
      expect(mockBookingService.getCountries).toHaveBeenCalledWith('fr');
      expect(mockBookingService.getSetupEntriesByTableNameMulti).toHaveBeenCalledWith(['_BED_PREFERENCE_TYPE', '_DEPARTURE_TIME', '_PAY_TYPE', '_PAY_TYPE_GROUP', '_PAY_METHOD']);
      expect(mockListingService.getExposedBookingsCriteria).toHaveBeenCalledWith(1);
      // The arrivals store waits on the property before storing (its initialisers read it).
      expect(mockLoaders.loadArrivals).toHaveBeenCalledWith(1, TODAY, propertyLoad.promise);
    });

    it('with only an alias, waits for the property to learn its id', async () => {
      const propertyLoad = deferred();
      mockRoomService.getExposedProperty.mockReturnValue(propertyLoad.promise);
      const { page } = await mount({ p: 'hotel-x' });

      expect(mockRoomService.getExposedProperty).toHaveBeenCalledWith({ id: 0, aname: 'hotel-x', language: 'en', is_backend: true });
      expect(mockListingService.getExposedBookingsCriteria).not.toHaveBeenCalled();
      expect(mockLoaders.loadArrivals).not.toHaveBeenCalled();

      calendar_data.property = property(42);
      propertyLoad.resolve();
      await flush(page);

      expect(mockListingService.getExposedBookingsCriteria).toHaveBeenCalledWith(42);
      expect(mockLoaders.loadArrivals).toHaveBeenCalledWith(42, TODAY, propertyLoad.promise);
      expect(mockDashboardService.getDayPerformance).toHaveBeenCalledWith({ property_id: 42, date: TODAY });
    });

    it('reuses an already loaded property instead of fetching it again', async () => {
      calendar_data.property = property(7);
      await mount({ propertyid: 1 });

      expect(mockRoomService.getExposedProperty).not.toHaveBeenCalled();
      expect(mockListingService.getExposedBookingsCriteria).toHaveBeenCalledWith(7);
      expect(mockLoaders.loadArrivals).toHaveBeenCalledWith(7, TODAY, expect.any(Promise));
      expect(mockDashboardService.getDayPerformance).toHaveBeenCalledWith({ property_id: 7, date: TODAY });
    });

    it('shows skeletons and disabled tabs until startup lands, then opens the arrivals tab', async () => {
      const arrivals = deferred();
      mockLoaders.loadArrivals.mockReturnValueOnce(arrivals.promise);
      const { page, tabGroup } = await mount();

      for (const name of ['arrivals', 'departures', 'inHouse', 'bookings', 'cancellations']) {
        expect(isTabDisabled(page, name)).toBe(true);
        expect(tabCount(page, name)).toBeNull();
      }
      expect(isPanelSkeleton(page, 'arrivals')).toBe(true);
      expect(panelContent(page, 'arrivals').getAttribute('data-extra-column')).toBe('action');
      expect($(page, '.dashboard-main').getAttribute('aria-busy')).toBe('true');

      setArrivalsTotal(backend.arrivalsTotal);
      initializeArrivalsStore(backend.arrivals);
      arrivals.resolve();
      await flush(page);

      expect(isTabDisabled(page, 'arrivals')).toBe(false);
      expect(tabCount(page, 'arrivals')).toBe('5');
      const panel = panelContent(page, 'arrivals');
      expect(panel.tagName.toLowerCase()).toBe('ir-dashboard-arrivals');
      expect(prop(panel, 'countries')).toEqual(COUNTRIES);
      expect(prop(panel, 'language')).toBe('en');
      expect($(page, '.dashboard-main').hasAttribute('aria-busy')).toBe(false);
      expect($(page, 'ir-booking-details-drawer')).not.toBeNull();
      expect(prop($(page, 'ir-payment-folio'), 'paymentEntries')).toEqual({ types: PAY_TYPES, groups: PAY_GROUPS, methods: PAY_METHODS });
      // The arrivals tab was disabled when wa-tab-group first picked it, so the selection is re-run once it's enabled.
      expect(tabGroup.updateActiveTab).toHaveBeenCalledTimes(1);
    });

    it('stops before loading the day when a startup request fails', async () => {
      expectErrors = true;
      mockBookingService.getCountries.mockRejectedValue(new Error('network'));
      const { page } = await mount();

      expect(consoleError).toHaveBeenCalledWith(new Error('network'));
      expect($(page, '.dashboard-main').hasAttribute('aria-busy')).toBe(false);
      expect(mockDashboardService.getDayPerformance).not.toHaveBeenCalled();
      expect(mockDashboardService.getInHouse).not.toHaveBeenCalled();
    });
  });

  describe('load order', () => {
    it('loads the stats before prefetching the remaining tabs, each tab once', async () => {
      calendar_data.currency = { symbol: '€' } as any;
      const performance = deferred<typeof PERFORMANCE>();
      mockDashboardService.getDayPerformance.mockReturnValueOnce(performance.promise);
      const { page } = await mount();
      const stats = $(page, 'ir-dashboard-stats');

      const params = { property_id: 1, date: TODAY };
      expect(mockDashboardService.getDayPerformance).toHaveBeenCalledWith(params);
      expect(mockDashboardService.getUnitsSummary).toHaveBeenCalledWith(params);
      expect(mockDashboardService.getPendingUnits).toHaveBeenCalledWith(params);
      expect(prop(stats, 'performanceLoading')).toBe('');
      expect(mockDashboardService.getInHouse).not.toHaveBeenCalled();
      expect(mockLoaders.loadDepartures).not.toHaveBeenCalled();

      performance.resolve(PERFORMANCE);
      await flush(page);

      expect(prop(stats, 'performance')).toEqual(PERFORMANCE);
      expect(prop(stats, 'units')).toEqual(UNITS);
      expect(prop(stats, 'pendingUnits')).toBe('3');
      expect(prop(stats, 'currencySymbol')).toBe('€');
      expect(stats.hasAttribute('performanceLoading')).toBe(false);
      expect(stats.hasAttribute('unitsLoading')).toBe(false);
      expect(stats.hasAttribute('pendingLoading')).toBe(false);

      expect(mockLoaders.loadArrivals).toHaveBeenCalledTimes(1);
      expect(mockLoaders.loadDepartures).toHaveBeenCalledTimes(1);
      expect(mockLoaders.loadDepartures).toHaveBeenCalledWith(1, TODAY, expect.any(Promise));
      for (const fetch of [mockDashboardService.getInHouse, mockDashboardService.getNewBookings, mockDashboardService.getCancellations]) {
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(fetch).toHaveBeenCalledWith(params);
      }
    });

    it.each([
      ['lack the pending status', { statuses: [{ code: '002' }] }],
      ['are missing', null],
    ])('skips the pending request and shows 0 when the booking criteria %s', async (_, criteria) => {
      mockListingService.getExposedBookingsCriteria.mockResolvedValue(criteria);
      const { page } = await mount();

      expect(mockDashboardService.getPendingUnits).not.toHaveBeenCalled();
      expect(prop($(page, 'ir-dashboard-stats'), 'pendingUnits')).toBe('0');
    });

    it('stops the spinner of a stat that fails and still prefetches the tabs', async () => {
      expectErrors = true;
      mockDashboardService.getDayPerformance.mockRejectedValue(new Error('stats down'));
      const { page } = await mount();
      const stats = $(page, 'ir-dashboard-stats');

      expect(consoleError).toHaveBeenCalledWith(new Error('stats down'));
      expect(stats.hasAttribute('performanceLoading')).toBe(false);
      expect(prop(stats, 'performance')).toBeNull();
      expect(prop(stats, 'units')).toEqual(UNITS);
      expect(mockDashboardService.getInHouse).toHaveBeenCalledTimes(1);
    });
  });

  describe('tabs', () => {
    it('shows each card count from its own data, with overdue and unassigned notes', async () => {
      const { page } = await mount();

      expect(tabCount(page, 'arrivals')).toBe('5');
      expect(tabNotes(page, 'arrivals')).toEqual(['2 unassigned', '1 overdue check-ins']);
      expect(tabCount(page, 'departures')).toBe('2');
      expect(tabNotes(page, 'departures')).toEqual(['1 overdue check-outs']);
      expect(tabCount(page, 'inHouse')).toBe('3');
      expect(tabCount(page, 'bookings')).toBe('2');
      expect(tabCount(page, 'cancellations')).toBe('1');
      for (const name of ['inHouse', 'bookings', 'cancellations']) {
        expect(tabNotes(page, name)).toEqual([]);
      }
      expect(tab(page, 'bookings').querySelector('.dashboard-tab__label').textContent).toBe('Bookings');
    });

    it("shows the in-house guests' adults, children and infants on the in-house card", async () => {
      const occupancy = (adult_nbr: number, children_nbr: number, infant_nbr: number) => ({ occupancy: { adult_nbr, children_nbr, infant_nbr } });
      backend.inHouse = [booking('H1', [occupancy(2, 1, 0), occupancy(1, 0, 1)])];
      const { page } = await mount();

      const guests = Array.from(tab(page, 'inHouse').querySelectorAll('.dashboard-tab__guest')).map((chip: any) => chip.getAttribute('title'));
      expect(guests).toEqual(['Adults: 3', 'Children: 1', 'Infants: 1']);
    });

    it('drops the in-house tab, overdue and unassigned notes, and check-in / check-out for properties without front desk', async () => {
      mockRoomService.getExposedProperty.mockImplementation(async ({ id }) => {
        calendar_data.property = { ...property(id || 42), is_frontdesk_enabled: false };
      });
      const { page } = await mount();

      expect(tab(page, 'inHouse')).toBeNull();
      expect($(page, 'wa-tab-panel[name="inHouse"]')).toBeNull();
      expect(mockDashboardService.getInHouse).not.toHaveBeenCalled();
      // No calendar figures to show, so Get_Exposed_Calendar isn't called.
      expect(mockDashboardService.getUnitsSummary).not.toHaveBeenCalled();
      expect($(page, 'ir-dashboard-stats').hasAttribute('unitsLoading')).toBe(false);
      // Only the rooms arriving on the day: the overdue room of A1 isn't counted.
      expect(tabCount(page, 'arrivals')).toBe('2');
      // No overdue or unassigned notes without the front desk.
      expect(tabNotes(page, 'arrivals')).toEqual([]);
      expect(tabNotes(page, 'departures')).toEqual([]);
      // An unregistered child gets a true boolean prop as an empty attribute.
      expect(prop(panelContent(page, 'arrivals'), 'pmsDisabled')).not.toBeNull();
    });

    it('counts the loaded arrivals when the API omits the total, and hides notes that are zero', async () => {
      backend.arrivalsTotal = 0;
      backend.arrivals = [booking('A1', [{ from_date: TODAY, unit: { id: 1 } as any, in_out: IDLE as any }]), booking('A2', [{ from_date: TODAY, in_out: CHECKED_IN as any }])];
      const { page } = await mount();

      expect(tabCount(page, 'arrivals')).toBe('2');
      expect(tabNotes(page, 'arrivals')).toEqual([]);
    });

    it('labels the bookings card from the locale when available', async () => {
      locales.entries = { Lcz_Bookings: 'Réservations' } as any;
      const { page } = await mount();

      expect(tab(page, 'bookings').querySelector('.dashboard-tab__label').textContent).toBe('Réservations');
    });

    it.each([
      ['inHouse', 'inHouse', 'inHouse', 'No guests in-house.'],
      ['bookings', 'newBookings', 'newBookings', 'No bookings made on this day.'],
      ['cancellations', 'cancellations', 'cancellations', 'No cancellations on this day.'],
    ] as const)('shows the %s table with its own bookings, without refetching them', async (name, variant, data, emptyMessage) => {
      const { page } = await mount();
      const fetches = { inHouse: mockDashboardService.getInHouse, bookings: mockDashboardService.getNewBookings, cancellations: mockDashboardService.getCancellations };

      await showTab(page, name);

      const table = panelContent(page, name);
      expect(table.tagName.toLowerCase()).toBe('ir-dashboard-bookings-table');
      expect(prop(table, 'variant')).toBe(variant);
      expect(prop(table, 'bookings')).toEqual(backend[data]);
      expect(prop(table, 'emptyMessage')).toBe(emptyMessage);
      // Only the visible panel is mounted.
      expect(panelContent(page, 'arrivals')).toBeNull();
      expect(fetches[name]).toHaveBeenCalledTimes(1);
    });

    it('shows the departures panel for the property and selected day', async () => {
      const { page } = await mount();

      await showTab(page, 'departures');

      const panel = panelContent(page, 'departures');
      expect(panel.tagName.toLowerCase()).toBe('ir-dashboard-departures');
      expect(prop(panel, 'propertyId')).toBe('1');
      expect(prop(panel, 'date')).toBe(TODAY);
      expect(mockLoaders.loadDepartures).toHaveBeenCalledTimes(1);
    });

    it('ignores wa-tab-show events bubbling up from tab groups inside a panel', async () => {
      const { page } = await mount();

      emit(panelContent(page, 'arrivals'), 'wa-tab-show', { name: 'cancellations' });
      await flush(page);

      expect(panelContent(page, 'arrivals')).not.toBeNull();
      expect(panelContent(page, 'cancellations')).toBeNull();
    });

    it('does not fetch a tab shown during startup before the property is known', async () => {
      const arrivals = deferred();
      mockLoaders.loadArrivals.mockReturnValueOnce(arrivals.promise);
      const { page } = await mount();

      await showTab(page, 'departures');

      expect(mockLoaders.loadDepartures).not.toHaveBeenCalled();
      arrivals.resolve();
      await flush(page);
      expect(mockLoaders.loadDepartures).toHaveBeenCalledTimes(1);
    });

    it('disables a tab while its data is on the way and enables it once it lands', async () => {
      const inHouse = deferred<Booking[]>();
      mockDashboardService.getInHouse.mockReturnValueOnce(inHouse.promise);
      const { page } = await mount();

      expect(isTabDisabled(page, 'inHouse')).toBe(true);
      expect(tabCount(page, 'inHouse')).toBeNull();
      expect(isTabDisabled(page, 'departures')).toBe(false);

      inHouse.resolve(backend.inHouse);
      await flush(page);

      expect(isTabDisabled(page, 'inHouse')).toBe(false);
      expect(tabCount(page, 'inHouse')).toBe('3');
    });

    it('keeps a tab whose load failed clickable, and retries it when shown', async () => {
      expectErrors = true;
      mockDashboardService.getInHouse.mockRejectedValueOnce(new Error('in-house down'));
      const retry = deferred<Booking[]>();
      mockDashboardService.getInHouse.mockReturnValueOnce(retry.promise);
      const { page } = await mount();

      expect(consoleError).toHaveBeenCalledWith(new Error('in-house down'));
      expect(isTabDisabled(page, 'inHouse')).toBe(false);
      expect(tabCount(page, 'inHouse')).toBeNull();

      await showTab(page, 'inHouse');

      expect(mockDashboardService.getInHouse).toHaveBeenCalledTimes(2);
      expect(isPanelSkeleton(page, 'inHouse')).toBe(true);
      expect(panelContent(page, 'inHouse').hasAttribute('data-extra-column')).toBe(false);

      retry.resolve(backend.inHouse);
      await flush(page);

      expect(tabCount(page, 'inHouse')).toBe('3');
      expect(panelContent(page, 'inHouse').tagName.toLowerCase()).toBe('ir-dashboard-bookings-table');
    });
  });

  describe('day change', () => {
    it('waits for the user to settle on a day before fetching it', async () => {
      const { page } = await mount();
      mockDashboardService.getDayPerformance.mockClear();
      mockDashboardService.getInHouse.mockClear();
      mockLoaders.loadArrivals.mockClear();
      const inTwoDays = addDaysISO(TODAY, 2);

      await pickDate(page, TOMORROW);
      await pickDate(page, inTwoDays);

      expect(prop($(page, 'ir-dashboard-date-navigator'), 'date')).toBe(inTwoDays);
      expect(mockDashboardService.getDayPerformance).not.toHaveBeenCalled();
      expect(mockLoaders.loadArrivals).not.toHaveBeenCalled();
      // The previous day's figures stay on screen, dimmed, while the user is still choosing.
      expect($(page, 'ir-dashboard-stats').hasAttribute('performanceLoading')).toBe(true);

      await new Promise(resolve => setTimeout(resolve, DATE_CHANGE_DEBOUNCE_MS));
      await flush(page);

      const params = { property_id: 1, date: inTwoDays };
      expect(mockDashboardService.getDayPerformance.mock.calls).toEqual([[params]]);
      expect(mockDashboardService.getInHouse.mock.calls).toEqual([[params]]);
      expect(mockLoaders.loadArrivals.mock.calls).toEqual([[1, inTwoDays, expect.any(Promise)]]);
    });

    it('reloads every part for the new day and returns to the arrivals tab', async () => {
      const { page, tabGroup } = await mount();
      await showTab(page, 'inHouse');
      tabGroup.updateActiveTab.mockClear();
      const inHouse = deferred<Booking[]>();
      mockDashboardService.getInHouse.mockReturnValueOnce(inHouse.promise);

      await changeDate(page, TOMORROW);

      expect(prop($(page, 'ir-dashboard-date-navigator'), 'date')).toBe(TOMORROW);
      // The previous day's data is stale: the visible panel and its count go back to skeletons.
      expect(isPanelSkeleton(page, 'inHouse')).toBe(true);
      expect(tabCount(page, 'inHouse')).toBeNull();
      const params = { property_id: 1, date: TOMORROW };
      expect(mockDashboardService.getInHouse).toHaveBeenLastCalledWith(params);
      expect(mockDashboardService.getDayPerformance).toHaveBeenLastCalledWith(params);
      expect(mockDashboardService.getUnitsSummary).toHaveBeenLastCalledWith(params);
      expect(mockDashboardService.getPendingUnits).toHaveBeenLastCalledWith(params);

      inHouse.resolve(backend.inHouse);
      await flush(page);

      expect(mockLoaders.loadArrivals).toHaveBeenLastCalledWith(1, TOMORROW, expect.any(Promise));
      expect(mockLoaders.loadDepartures).toHaveBeenLastCalledWith(1, TOMORROW, expect.any(Promise));
      expect(mockDashboardService.getNewBookings).toHaveBeenLastCalledWith(params);
      expect(mockDashboardService.getCancellations).toHaveBeenLastCalledWith(params);
      expect(panelContent(page, 'arrivals').tagName.toLowerCase()).toBe('ir-dashboard-arrivals');
      expect(panelContent(page, 'inHouse')).toBeNull();
      expect(tabGroup.updateActiveTab).toHaveBeenCalledTimes(1);
      expect(tabCount(page, 'inHouse')).toBe('3');
    });

    it('drops tab data that arrives for a day the user has already left', async () => {
      const { page } = await mount();
      const tomorrow = deferred<Booking[]>();
      const yesterday = deferred<Booking[]>();
      mockDashboardService.getInHouse.mockReturnValueOnce(tomorrow.promise).mockReturnValueOnce(yesterday.promise);

      await changeDate(page, TOMORROW);
      await changeDate(page, YESTERDAY);
      yesterday.resolve([booking('Y1')]);
      await flush(page);
      tomorrow.resolve([booking('T1', [{}, {}, {}, {}])]);
      await flush(page);

      expect(tabCount(page, 'inHouse')).toBe('1');
      await showTab(page, 'inHouse');
      expect(prop(panelContent(page, 'inHouse'), 'bookings')).toEqual([booking('Y1')]);
    });

    it('drops stats that arrive for a day the user has already left', async () => {
      const { page } = await mount();
      const tomorrow = deferred<typeof PERFORMANCE>();
      const yesterdayPerformance = { revenue: 10, adr: 10, occupancy: 10 };
      mockDashboardService.getDayPerformance.mockReturnValueOnce(tomorrow.promise).mockResolvedValueOnce(yesterdayPerformance);

      await changeDate(page, TOMORROW);
      await changeDate(page, YESTERDAY);
      tomorrow.resolve({ revenue: 999, adr: 999, occupancy: 99 });
      await flush(page);

      const stats = $(page, 'ir-dashboard-stats');
      expect(prop(stats, 'performance')).toEqual(yesterdayPerformance);
      expect(stats.hasAttribute('performanceLoading')).toBe(false);
    });

    it("holds the new day's background prefetch until its own stats land, even when an older day's stats land first", async () => {
      const { page } = await mount();
      const tomorrow = deferred<typeof PERFORMANCE>();
      const yesterday = deferred<typeof PERFORMANCE>();
      mockDashboardService.getDayPerformance.mockReturnValueOnce(tomorrow.promise).mockReturnValueOnce(yesterday.promise);
      mockDashboardService.getInHouse.mockClear();

      await changeDate(page, TOMORROW);
      await changeDate(page, YESTERDAY);
      tomorrow.resolve(PERFORMANCE);
      await flush(page);

      expect(mockDashboardService.getInHouse).not.toHaveBeenCalled();

      yesterday.resolve(PERFORMANCE);
      await flush(page);

      expect(mockDashboardService.getInHouse.mock.calls).toEqual([[{ property_id: 1, date: YESTERDAY }]]);
    });

    it('loads the picked day instead of today when the day changes during startup', async () => {
      const arrivals = deferred();
      mockLoaders.loadArrivals.mockReturnValueOnce(arrivals.promise);
      const { page } = await mount();

      await changeDate(page, TOMORROW);
      expect(mockDashboardService.getDayPerformance).not.toHaveBeenCalled();

      arrivals.resolve();
      await flush(page);

      expect(mockLoaders.loadArrivals).toHaveBeenCalledTimes(2);
      expect(mockLoaders.loadArrivals).toHaveBeenLastCalledWith(1, TOMORROW, expect.any(Promise));
      expect(mockDashboardService.getDayPerformance.mock.calls).toEqual([[{ property_id: 1, date: TOMORROW }]]);
      expect(mockDashboardService.getInHouse.mock.calls).toEqual([[{ property_id: 1, date: TOMORROW }]]);
      expect(tabCount(page, 'arrivals')).toBe('5');
    });
  });

  describe('same-day refresh', () => {
    it('refreshes the day when the booking drawer closes, keeping the current tab and its panel on screen', async () => {
      const { page, tabGroup } = await mount();
      await showTab(page, 'inHouse');
      tabGroup.updateActiveTab.mockClear();

      emit(panelContent(page, 'inHouse'), 'openBookingDetails', 123);
      await flush(page);
      const drawer = $(page, 'ir-booking-details-drawer');
      expect(drawer.hasAttribute('open')).toBe(true);
      expect(prop(drawer, 'bookingNumber')).toBe('123');
      expect(prop(drawer, 'ticket')).toBe('ticket');

      const inHouse = deferred<Booking[]>();
      mockDashboardService.getInHouse.mockReturnValueOnce(inHouse.promise);
      emit(drawer, 'bookingDetailsDrawerClosed');
      await flush(page);

      expect(drawer.hasAttribute('open')).toBe(false);
      expect(mockDashboardService.getDayPerformance).toHaveBeenCalledTimes(2);
      expect(mockDashboardService.getInHouse).toHaveBeenCalledTimes(2);
      // The day's data is still current while it refreshes: no skeletons, no disabled tab.
      expect(panelContent(page, 'inHouse').tagName.toLowerCase()).toBe('ir-dashboard-bookings-table');
      expect(isTabDisabled(page, 'inHouse')).toBe(false);
      expect(tabCount(page, 'inHouse')).toBe('3');

      const refreshed = [booking('H1')];
      inHouse.resolve(refreshed);
      await flush(page);

      expect(mockLoaders.loadArrivals).toHaveBeenCalledTimes(2);
      expect(prop(panelContent(page, 'inHouse'), 'bookings')).toEqual(refreshed);
      expect(tabCount(page, 'inHouse')).toBe('1');
      expect(tabGroup.updateActiveTab).not.toHaveBeenCalled();
    });

    it.each(['resetExposedCancellationDueAmount', 'updateRoomGuests'])('refreshes the day on %s and stops it there', async eventName => {
      const { page } = await mount();
      const outside = jest.fn();
      page.doc.addEventListener(eventName, outside);

      emit(panelContent(page, 'arrivals'), eventName);
      await flush(page);

      expect(outside).not.toHaveBeenCalled();
      expect(mockDashboardService.getDayPerformance).toHaveBeenCalledTimes(2);
      expect(mockLoaders.loadArrivals).toHaveBeenCalledTimes(2);
      expect(mockLoaders.loadArrivals).toHaveBeenLastCalledWith(1, TODAY, expect.any(Promise));
    });
  });

  describe('realtime refresh', () => {
    const roomStatus = (room_identifier: string, status: string) => ({ reason: 'ROOM_STATUS_CHANGED', payload: { room_identifier, status } });
    const availability = { reason: 'UPDATE_CALENDAR_AVAILABILITY', payload: { room_type_id: 1, date: TODAY, availability: 2 } };

    /** Delivers socket messages, then runs the queue's 3s flush. */
    async function deliver(page: SpecPage, ...messages: unknown[]) {
      messages.forEach(msg => mockRealtime.handler(msg));
      const queue = mockQueues[mockQueues.length - 1];
      await queue.processor(queue.items.splice(0));
      await flush(page);
    }

    function clearServiceCalls() {
      Object.values({ ...mockDashboardService, ...mockLoaders }).forEach(fn => fn.mockClear());
    }

    beforeEach(() => {
      backend.arrivals[1].rooms[0].identifier = 'R-ARR';
      backend.departures[0].rooms[0].identifier = 'R-DEP';
    });

    it('subscribes to the property once loaded and batches notifications every 3s', async () => {
      await mount({ p: 'hotel' });

      expect(mockRealtime.subscribe).toHaveBeenCalledTimes(1);
      expect(mockRealtime.subscribe).toHaveBeenCalledWith(42, expect.any(Function));
      expect(mockQueues[mockQueues.length - 1].options).toEqual(expect.objectContaining({ flushInterval: 3000 }));
    });

    it('ignores other notifications', async () => {
      await mount();

      mockRealtime.handler({ reason: 'UNIT_HK_STATUS_CHANGED', payload: {} });
      mockRealtime.handler({ reason: 'DORESERVATION', payload: {} });

      expect(mockQueues[mockQueues.length - 1].items).toEqual([]);
    });

    it('refreshes the stats, in-house and the departures once for a burst of status changes on a departing room', async () => {
      const { page } = await mount();
      clearServiceCalls();

      await deliver(page, roomStatus('R-DEP', '002'), roomStatus('R-DEP', '001'), roomStatus('R-DEP', '002'));

      expect(mockDashboardService.getDayPerformance).toHaveBeenCalledTimes(1);
      expect(mockDashboardService.getUnitsSummary).toHaveBeenCalledTimes(1);
      expect(mockDashboardService.getInHouse).toHaveBeenCalledTimes(1);
      expect(mockLoaders.loadDepartures).toHaveBeenCalledTimes(1);
      expect(mockLoaders.loadDepartures).toHaveBeenLastCalledWith(1, TODAY, expect.any(Promise));
      expect(mockLoaders.loadArrivals).not.toHaveBeenCalled();
      expect(mockDashboardService.getNewBookings).not.toHaveBeenCalled();
      expect(mockDashboardService.getCancellations).not.toHaveBeenCalled();
      expect(mockDashboardService.getPendingUnits).toHaveBeenCalledTimes(1);
    });

    it('refreshes the arrivals for a room listed there, keeping the user on their tab', async () => {
      const { page, tabGroup } = await mount();
      await showTab(page, 'departures');
      tabGroup.updateActiveTab.mockClear();
      clearServiceCalls();

      await deliver(page, roomStatus('R-ARR', '001'));

      expect(mockLoaders.loadArrivals).toHaveBeenCalledTimes(1);
      expect(mockLoaders.loadDepartures).not.toHaveBeenCalled();
      expect(mockDashboardService.getInHouse).toHaveBeenCalledTimes(1);
      expect(prop($(page, 'wa-tab-group'), 'active')).toBe('departures');
      expect(panelContent(page, 'departures').tagName.toLowerCase()).toBe('ir-dashboard-departures');
      expect(tabGroup.updateActiveTab).not.toHaveBeenCalled();
    });

    it.each([
      ['002', 'departures'],
      ['001', 'arrivals'],
      ['000', 'arrivals'],
    ])('falls back to the status for a room on neither list (%s → %s)', async (status, expected) => {
      const { page } = await mount();
      clearServiceCalls();

      await deliver(page, roomStatus('R-OTHER', status));

      expect(mockLoaders.loadDepartures).toHaveBeenCalledTimes(expected === 'departures' ? 1 : 0);
      expect(mockLoaders.loadArrivals).toHaveBeenCalledTimes(expected === 'arrivals' ? 1 : 0);
    });

    it('reloads the whole day on an availability update', async () => {
      const { page } = await mount();
      clearServiceCalls();

      await deliver(page, roomStatus('R-DEP', '002'), availability, availability);

      expect(mockDashboardService.getDayPerformance).toHaveBeenCalledTimes(1);
      expect(mockDashboardService.getUnitsSummary).toHaveBeenCalledTimes(1);
      expect(mockDashboardService.getPendingUnits).toHaveBeenCalledTimes(1);
      expect(mockLoaders.loadArrivals).toHaveBeenCalledTimes(1);
      expect(mockLoaders.loadDepartures).toHaveBeenCalledTimes(1);
      expect(mockDashboardService.getInHouse).toHaveBeenCalledTimes(1);
      expect(mockDashboardService.getNewBookings).toHaveBeenCalledTimes(1);
      expect(mockDashboardService.getCancellations).toHaveBeenCalledTimes(1);
    });

    it('subscribes once per load and unsubscribes when removed', async () => {
      const { page, root } = await mount();
      const queue = mockQueues[mockQueues.length - 1];

      root.ticket = 'renewed';
      await flush(page);
      expect(mockRealtime.subscribe).toHaveBeenCalledTimes(2);
      expect(mockRealtime.unsubscribe).toHaveBeenCalledTimes(1);

      root.remove();
      await page.waitForChanges();
      expect(mockRealtime.unsubscribe).toHaveBeenCalledTimes(2);
      expect(queue.clear).toHaveBeenCalled();
    });
  });

  describe('booking actions', () => {
    it('opens booking details on the room to check out when departures redirects an early check-out', async () => {
      const { page } = await mount();
      await showTab(page, 'departures');
      const outside = jest.fn();
      page.doc.addEventListener('checkoutRedirect', outside);

      emit(panelContent(page, 'departures'), 'checkoutRedirect', { bookingNumber: 55, identifier: 'R-1' });
      await flush(page);

      const drawer = $(page, 'ir-booking-details-drawer');
      expect(outside).not.toHaveBeenCalled();
      expect(drawer.hasAttribute('open')).toBe(true);
      expect(prop(drawer, 'bookingNumber')).toBe('55');
      expect(prop(drawer, 'checkoutRoomIdentifier')).toBe('R-1');

      emit(drawer, 'bookingDetailsDrawerClosed');
      await flush(page);

      expect(drawer.hasAttribute('open')).toBe(false);
      expect(prop(drawer, 'checkoutRoomIdentifier')).toBeNull();
    });

    it.each([
      ['arrivals', 'A2'],
      ['departures', 'D1'],
      ['in-house', 'H2'],
      ['new bookings', 'N1'],
      ['cancellations', 'C1'],
    ])('opens the payment folio for a balance payment on a booking from %s', async (_, bookingNumber) => {
      const { page } = await mount();
      const folio = $(page, 'ir-payment-folio');
      folio.openFolio = jest.fn();
      const outside = jest.fn();
      page.doc.addEventListener('payBookingBalance', outside);
      const all = [...backend.arrivals, ...backend.departures, ...backend.inHouse, ...backend.newBookings, ...backend.cancellations];

      emit(panelContent(page, 'arrivals'), 'payBookingBalance', { booking_nbr: bookingNumber, payment: { amount: 50, currency: 'USD', payment_type: { code: 'PT1' } } });
      await flush(page);

      expect(outside).not.toHaveBeenCalled();
      expect(folio.openFolio).toHaveBeenCalledTimes(1);
      expect(prop(folio, 'booking')).toEqual(all.find(b => b.booking_nbr === bookingNumber));
      expect(prop(folio, 'bookingNumber')).toBe(bookingNumber);
      expect(prop(folio, 'mode')).toBe('payment-action');
      // The payment type is resolved against the setup entries.
      expect(prop(folio, 'payment')).toEqual({ amount: 50, currency: 'USD', payment_type: { code: 'PT1', description: 'Cash', operation: 'CR' } });

      emit(folio, 'closeModal');
      await flush(page);

      expect(prop(folio, 'booking')).toBeNull();
      expect(prop(folio, 'payment')).toBeNull();
    });
  });
});
