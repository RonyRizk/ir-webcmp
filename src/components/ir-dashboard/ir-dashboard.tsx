import type { Payment, PaymentEntries } from '@/components/ir-booking-details/types';
import type { Booking } from '@/models/booking.dto';
import type { ICountry } from '@/models/IBooking';
import Token from '@/models/Token';
import { BookingService } from '@/services/booking-service/booking.service';
import { BookingListingService } from '@/services/booking_listing.service';
import { DashboardService, type DashboardPerformance, type DashboardUnits } from '@/services/dashboard';
import { realtimeService, type RealtimeEventMap, type RealtimeMessage } from '@/services/realtime/realtime.service';
import { RoomService } from '@/services/room.service';
import { arrivalsStore, setArrivalsPageSize, setArrivalsSortByTime } from '@/stores/arrivals.store';
import calendar_data from '@/stores/calendar-data';
import { departuresStore, setDeparturesPageSize, setDeparturesSortByTime } from '@/stores/departures.store';
import locales from '@/stores/locales.store';
import { BatchingQueue } from '@/utils/Queue/batch-queue';
import { todayISO, type ISODate } from '@/utils/calendar-dates';
import { Component, Element, Host, Listen, Prop, State, Watch, h } from '@stencil/core';
import moment from 'moment';
import { Subject, debounceTime, filter, type Subscription } from 'rxjs';
import { DASHBOARD_PAGE_SIZE, loadArrivals, loadDepartures } from './dashboard.data';
import {
  countArrivingUnits,
  countDepartingUnits,
  countOverdueArrivals,
  countOverdueDepartures,
  countRooms,
  countUnassignedArrivals,
  DATE_CHANGE_DEBOUNCE_MS,
  formatCount,
  isCancellationOn,
  sumOccupancy,
} from './dashboard.helpers';
import { CountSkeleton, TableSkeleton, type CellShape } from './dashboard-skeletons';
import type { CheckoutRedirectEvent, DashboardCounts, DashboardTab, RailDensity } from './types';

const TABS: DashboardTab[] = ['arrivals', 'departures', 'inHouse', 'bookings', 'cancellations'];

/** Shape of each tab's last table column in its skeleton: the check-in / check-out button or the status; in-house has none. */
const SKELETON_EXTRA_COLUMN: Partial<Record<DashboardTab, CellShape>> = {
  arrivals: 'action',
  departures: 'action',
  bookings: 'pill',
  cancellations: 'pill',
};

/** Icon in each summary card's tile. */
const TAB_ICONS: Record<DashboardTab, string> = {
  arrivals: 'plane-arrival',
  departures: 'plane-departure',
  inHouse: 'house',
  bookings: 'calendar-days',
  cancellations: 'ban',
};

/**
 * Endpoints that show ir-page's full-page loader: the interceptor's defaults minus the calendar and
 * bookings reads, which the dashboard covers with skeletons instead.
 */
const OVERLAY_ENDPOINTS = ['/ReAllocate_Exposed_Room', '/UnBlock_Exposed_Unit'];

/** Desktop breakpoint where the rail sits beside the table and shares its height (matches ir-dashboard.css). */
const DESKTOP_QUERY = '(min-width: 992px)';
/** Rail heights (px) where each density still leaves the ring room (11rem spacious, 9rem regular, 7.5rem compact); tight lets it shrink. */
const RAIL_SPACIOUS_MIN_HEIGHT = 720;
const RAIL_REGULAR_MIN_HEIGHT = 650;
const RAIL_COMPACT_MIN_HEIGHT = 570;

/**
 * PMS landing dashboard: a day picker in the page header (two days either side of today), the day's stats in the
 * left rail, and a wa-tab-group, styled as summary cards, that switches between arrivals, departures, in-house,
 * new bookings and cancellations. Properties without front desk (`is_frontdesk_enabled` false) get no in-house tab,
 * arrivals / departures without check-in / check-out, and a reduced stats rail.
 *
 * Loads in order of importance, each part showing a skeleton until its data lands:
 * 1. property, locale tables, bookings criteria, countries / payment entries and arrivals;
 * 2. the visible tab plus the day's stats (Get_Monthly_Stats, Get_Exposed_Calendar with the front desk only, and
 *    pending bookings when the property's criteria list the pending status);
 * 3. every remaining tab, in the background, so each card's count fills in.
 *
 * Realtime notifications are batched every 3s: UPDATE_CALENDAR_AVAILABILITY reloads the whole day, ROOM_STATUS_CHANGED
 * reloads the stats plus the affected arrivals / departures tab and in-house, and CHANGE_IN_BOOK_STATUS cancelling (003) a
 * booking whose stay covers the selected day reloads the stats plus cancellations.
 */
@Component({
  tag: 'ir-dashboard',
  styleUrl: 'ir-dashboard.css',
  scoped: true,
})
export class IrDashboard {
  @Element() el: HTMLElement;

  /** Authentication token issued by the PMS backend. */
  @Prop() ticket: string;
  /** ID of the property (hotel). */
  @Prop() propertyid: number;
  /** Two-letter language code used for translations and API locale. */
  @Prop() language: string = 'en';
  /** Property alias (aname), used when `propertyid` is missing. */
  @Prop() p: string;
  /** API base URL override. */
  @Prop() baseurl: string;

  @State() isPageLoading = true;
  @State() isPerformanceLoading = false;
  @State() isUnitsLoading = false;
  @State() isPendingLoading = false;
  @State() selectedDate: ISODate = todayISO();
  @State() activeTab: DashboardTab = 'arrivals';
  /** How tightly the rail's cards are drawn, so they fit the height the host page leaves on desktop. */
  @State() railDensity: RailDensity = 'regular';
  @State() asOf: string;

  @State() performance: DashboardPerformance;
  @State() units: DashboardUnits;
  @State() pendingUnits: number = null;
  /** Whether the property's booking criteria include the pending status (001); without it there's nothing to fetch and Pending shows 0. */
  @State() hasPendingStatus = true;
  @State() inHouse: Booking[] = [];
  @State() newBookings: Booking[] = [];
  @State() cancellations: Booking[] = [];

  /** Day each tab's data was loaded for. A tab whose entry isn't `selectedDate` shows a spinner instead of its panel and count. */
  @State() tabDates: Partial<Record<DashboardTab, ISODate>> = {};
  /** Tabs with a fetch in flight for the current `loadSeq`. A tab still loading its day's data is disabled. */
  @State() loadingTabs: Partial<Record<DashboardTab, boolean>> = {};

  @State() countries: ICountry[];
  @State() paymentEntries: PaymentEntries;
  @State() bookingNumber: number;
  @State() checkoutRoomIdentifier: string = null;
  @State() booking: Booking;
  @State() payment: Payment;

  private tokenService = new Token();
  private roomService = new RoomService();
  private bookingService = new BookingService();
  private bookingListingService = new BookingListingService();
  private dashboardService = new DashboardService();

  private paymentFolioRef: HTMLIrPaymentFolioElement;
  /** Guards against out-of-order responses when the day changes quickly. */
  private loadSeq = 0;
  /** `loadSeq` each tab was last fetched under, so a tab is fetched at most once per load (background prefetch or show). */
  private tabSeqs: Partial<Record<DashboardTab, number>> = {};
  /** Settles once `calendar_data.property` is loaded; the arrivals / departures stores wait on it. */
  private propertyReady: Promise<unknown> = Promise.resolve();
  private tabGroupRef: HTMLElementTagNameMap['wa-tab-group'];
  /** Set when a new day's arrivals land; the next render selects the arrivals tab in the tab group. */
  private selectArrivalsAfterRender = false;
  private unsubscribeRealtime: (() => void) | null = null;
  /** Day changes, debounced into a single day load. */
  private dayChange$ = new Subject<void>();
  private dayChangeSubscription: Subscription | null = null;
  /** Set while a day change's debounced load is waiting; clearing it drops that load. */
  private isDayLoadPending = false;
  /** Collects realtime notifications so a burst triggers one refresh, at most every 3s. */
  private realtimeQueue = new BatchingQueue<RealtimeMessage>(messages => this.processRealtimeBatch(messages), {
    batchSize: 1000,
    flushInterval: 3000,
    onError: e => console.error('Dashboard realtime refresh error:', e),
  });
  /** Watches the host page so a header or footer that resizes or mounts late re-fits the dashboard. */
  private pageResizeObserver: ResizeObserver | null = null;
  private fitFrame: number | null = null;
  /** Last height (px) the host page renders above and below the dashboard. */
  private reservedBlockSize: number | null = null;
  private asideRef: HTMLElement;

  async componentDidRender() {
    if (!this.selectArrivalsAfterRender || !this.tabGroupRef) {
      return;
    }
    this.selectArrivalsAfterRender = false;
    // wa-tab-group refuses to select a disabled tab, and the arrivals tab is disabled until its data lands. Its `active`
    // may already read "arrivals" (first load), so re-run the selection now that the tab is enabled.
    await this.tabGroupRef.updateComplete;
    this.tabGroupRef.updateActiveTab();
  }

  connectedCallback() {
    this.dayChangeSubscription = this.dayChange$
      .pipe(
        debounceTime(DATE_CHANGE_DEBOUNCE_MS),
        // A direct `loadDay` while the debounce was running already loaded the day.
        filter(() => this.isDayLoadPending),
      )
      .subscribe(() => this.loadDay());
  }

  componentWillLoad() {
    if (this.baseurl) {
      this.tokenService.setBaseUrl(this.baseurl);
    }
    setArrivalsPageSize(DASHBOARD_PAGE_SIZE);
    setDeparturesPageSize(DASHBOARD_PAGE_SIZE);
    setArrivalsSortByTime(true);
    setDeparturesSortByTime(true);
    if (this.ticket) {
      this.tokenService.setToken(this.ticket);
      this.init();
    }
  }

  componentDidLoad() {
    this.fitToPage();
    window.addEventListener('resize', this.scheduleFitToPage);
    this.pageResizeObserver = new ResizeObserver(this.scheduleFitToPage);
    this.pageResizeObserver.observe(document.body);
    this.pageResizeObserver.observe(this.asideRef);
  }

  disconnectedCallback() {
    window.removeEventListener('resize', this.scheduleFitToPage);
    this.pageResizeObserver?.disconnect();
    this.pageResizeObserver = null;
    if (this.fitFrame !== null) {
      cancelAnimationFrame(this.fitFrame);
      this.fitFrame = null;
    }
    this.unsubscribeRealtime?.();
    this.unsubscribeRealtime = null;
    this.realtimeQueue.clear();
    this.dayChangeSubscription?.unsubscribe();
    this.dayChangeSubscription = null;
    this.isDayLoadPending = false;
  }

  @Watch('ticket')
  handleTicketChange(newValue: string, oldValue: string) {
    if (newValue && newValue !== oldValue) {
      this.tokenService.setToken(newValue);
      this.init();
    }
  }

  @Listen('openBookingDetails')
  handleOpenBookingDetails(e: CustomEvent) {
    this.bookingNumber = e.detail;
  }

  @Listen('payBookingBalance')
  handlePayBookingBalance(e: CustomEvent) {
    e.stopImmediatePropagation();
    e.stopPropagation();
    const { booking_nbr, payment } = e.detail;
    this.booking = this.findBooking(booking_nbr);
    const paymentType = this.paymentEntries?.types.find(p => p.CODE_NAME === payment.payment_type.code);
    this.payment = {
      ...payment,
      payment_type: {
        code: paymentType?.CODE_NAME,
        description: paymentType?.CODE_VALUE_EN,
        operation: paymentType?.NOTES,
      },
    };
    this.paymentFolioRef?.openFolio();
  }

  @Listen('resetExposedCancellationDueAmount')
  handleResetCancellationDueAmount(e: CustomEvent) {
    this.reloadAfterChange(e);
  }

  @Listen('updateRoomGuests')
  handleUpdateRoomGuests(e: CustomEvent) {
    this.reloadAfterChange(e);
  }

  private reloadAfterChange(e: CustomEvent) {
    e.stopImmediatePropagation();
    e.stopPropagation();
    this.loadDay();
  }

  private scheduleFitToPage = () => {
    if (this.fitFrame !== null) {
      return;
    }
    this.fitFrame = requestAnimationFrame(() => {
      this.fitFrame = null;
      this.fitToPage();
    });
  };

  private fitToPage() {
    this.measureReserved();
    this.updateRailDensity();
  }

  /**
   * Height of what the page renders under the dashboard: every in-flow element after it (or after one of its ancestors)
   * that sits below it, plus the ancestors' bottom padding and borders and the body's bottom margin. Summing those
   * rather than reading the document's height keeps the dashboard's own overflow (a short screen under the tables'
   * height floor) from counting as footer and shrinking the dashboard further.
   */
  private measureBelow(): number {
    let below = 0;
    let node: Element = this.el;
    while (node.parentElement && node !== document.body) {
      const bottom = node.getBoundingClientRect().bottom;
      for (let sibling = node.nextElementSibling; sibling; sibling = sibling.nextElementSibling) {
        const style = getComputedStyle(sibling);
        const rect = sibling.getBoundingClientRect();
        // Skips hidden and out-of-flow elements, and ones beside the dashboard rather than under it.
        if (style.display === 'none' || style.position === 'absolute' || style.position === 'fixed' || rect.top < bottom - 1) {
          continue;
        }
        below += rect.height + parseFloat(style.marginBlockStart) + parseFloat(style.marginBlockEnd);
      }
      const parent = node.parentElement;
      const parentStyle = getComputedStyle(parent);
      below += parseFloat(parentStyle.paddingBlockEnd) + parseFloat(parentStyle.borderBlockEndWidth);
      if (parent === document.body) {
        below += parseFloat(parentStyle.marginBlockEnd);
      }
      node = parent;
    }
    return below;
  }

  /**
   * Picks the rail density from the rail's height, which the layout sets (not its content), so a density change never
   * re-triggers itself. Below the desktop breakpoint the rail is content-sized and stays regular.
   */
  private updateRailDensity() {
    const height = this.asideRef?.clientHeight ?? 0;
    let density: RailDensity = 'regular';
    if (window.matchMedia(DESKTOP_QUERY).matches && height > 0) {
      if (height >= RAIL_SPACIOUS_MIN_HEIGHT) {
        density = 'spacious';
      } else if (height >= RAIL_REGULAR_MIN_HEIGHT) {
        density = 'regular';
      } else {
        density = height >= RAIL_COMPACT_MIN_HEIGHT ? 'compact' : 'tight';
      }
    }
    if (density !== this.railDensity) {
      this.railDensity = density;
    }
  }

  /**
   * Measures what the host page renders above (header, body padding) and below (footer) the dashboard, so the desktop
   * layout's height is the viewport minus that and the page never scrolls. Writing only on change keeps the body
   * observer from looping: our own resize re-measures to the same value.
   */
  private measureReserved() {
    const above = this.el.getBoundingClientRect().top + window.scrollY;
    const reserved = Math.max(0, Math.round(above + this.measureBelow()));
    if (reserved === this.reservedBlockSize) {
      return;
    }
    this.reservedBlockSize = reserved;
    this.el.style.setProperty('--dashboard-reserved-block-size', `${reserved}px`);
  }

  private get propertyId(): number {
    return calendar_data.property?.id ?? this.propertyid;
  }

  /** Whether the property uses the front desk (check-in / check-out). Until the property loads, assume it does. */
  private get isPms(): boolean {
    return calendar_data.property ? !!calendar_data.property.is_frontdesk_enabled : true;
  }

  /** Tabs the property gets: no in-house without the front desk, since nobody is checked in. */
  private get tabs(): DashboardTab[] {
    return this.isPms ? TABS : TABS.filter(tab => tab !== 'inHouse');
  }

  private async init() {
    try {
      this.isPageLoading = true;
      if (!this.propertyid && !this.p) {
        throw new Error('Missing credentials');
      }
      ++this.loadSeq;
      const propertyReady = calendar_data?.property
        ? Promise.resolve(null)
        : this.roomService.getExposedProperty({ id: this.propertyid || 0, aname: this.p, language: this.language, is_backend: true });
      this.propertyReady = propertyReady;
      // With a known id these go out alongside the property; with only an alias they need its id first.
      const withPropertyId = <T,>(fn: () => Promise<T>) => (this.propertyId ? fn() : propertyReady.then(fn));
      const [, , criteria, countries, setupEntries] = await Promise.all([
        propertyReady,
        this.roomService.fetchLanguage(this.language),
        withPropertyId(() => this.bookingListingService.getExposedBookingsCriteria(this.propertyId)),
        this.bookingService.getCountries(this.language),
        this.bookingService.getSetupEntriesByTableNameMulti(['_BED_PREFERENCE_TYPE', '_DEPARTURE_TIME', '_PAY_TYPE', '_PAY_TYPE_GROUP', '_PAY_METHOD']),
        withPropertyId(() => this.loadTab('arrivals')),
      ]);
      this.hasPendingStatus = !!criteria?.statuses?.some(status => status.code === '001');
      this.countries = countries;
      const { pay_type, pay_type_group, pay_method } = this.bookingService.groupEntryTablesResult(setupEntries);
      this.paymentEntries = { types: pay_type, groups: pay_type_group, methods: pay_method };
      this.subscribeRealtime();
    } catch (error) {
      console.error(error);
      return;
    } finally {
      this.isPageLoading = false;
    }
    this.loadRest();
  }

  private subscribeRealtime() {
    this.unsubscribeRealtime?.();
    this.unsubscribeRealtime = realtimeService.subscribe(this.propertyId, msg => {
      if (msg.reason === 'UPDATE_CALENDAR_AVAILABILITY' || msg.reason === 'ROOM_STATUS_CHANGED' || msg.reason === 'CHANGE_IN_BOOK_STATUS') {
        this.realtimeQueue.offer(msg);
      }
    });
  }

  /** Runs one refresh for every notification queued in the last 3s. */
  private async processRealtimeBatch(messages: RealtimeMessage[]) {
    // Init is already loading fresh data.
    if (this.isPageLoading) {
      return;
    }
    if (messages.some(msg => msg.reason === 'UPDATE_CALENDAR_AVAILABILITY')) {
      await this.loadDay();
      return;
    }
    const tabs = new Set<DashboardTab>();
    for (const msg of messages) {
      if (msg.reason === 'ROOM_STATUS_CHANGED') {
        // Checking a guest in or out also changes who's in-house.
        if (this.isPms) {
          tabs.add('inHouse');
        }
        tabs.add(this.tabForRoomStatus(msg.payload));
      } else if (msg.reason === 'CHANGE_IN_BOOK_STATUS' && isCancellationOn(msg.payload, this.selectedDate)) {
        tabs.add('cancellations');
      }
    }
    // The batch held only status changes outside the selected day.
    if (!tabs.size) {
      return;
    }
    const seq = this.loadSeq;
    await Promise.all([...this.loadStats(), ...[...tabs].map(tab => this.reloadTab(tab))]);
    if (seq === this.loadSeq) {
      this.asOf = moment().format('HH:mm');
    }
  }

  /** The tab a room's status change belongs to: the one already listing the room, else the one its new status points to. */
  private tabForRoomStatus({ room_identifier, status }: RealtimeEventMap['ROOM_STATUS_CHANGED']): DashboardTab {
    const listsRoom = (bookings: Booking[]) => bookings?.some(b => b.rooms?.some(r => r.identifier === room_identifier));
    if (listsRoom(departuresStore.bookings)) {
      return 'departures';
    }
    if (listsRoom(arrivalsStore.bookings)) {
      return 'arrivals';
    }
    return status === '002' ? 'departures' : 'arrivals';
  }

  /** Re-fetches one tab for the current day without marking the other tabs stale. */
  private reloadTab(tab: DashboardTab) {
    delete this.tabSeqs[tab];
    return this.loadTab(tab);
  }

  /**
   * (Re)loads the selected day. Bumping `loadSeq` drops in-flight responses for the previous day
   * and marks every tab stale.
   */
  private loadDay() {
    this.isDayLoadPending = false;
    ++this.loadSeq;
    return this.loadRest();
  }

  /** Phases 2 and 3: the visible tab and the stats first, then the other tabs in the background. */
  private async loadRest() {
    const seq = this.loadSeq;
    await Promise.all([this.loadTab(this.activeTab), ...this.loadStats()]);
    // A newer day took over and runs its own background pass.
    if (seq !== this.loadSeq) {
      return;
    }
    this.asOf = moment().format('HH:mm');
    await Promise.all(this.tabs.map(tab => this.loadTab(tab)));
  }

  private loadStats(): Promise<void>[] {
    const params = { property_id: this.propertyId, date: this.selectedDate };
    const loads = [
      this.loadStat(
        () => this.dashboardService.getDayPerformance(params),
        performance => (this.performance = performance),
        loading => (this.isPerformanceLoading = loading),
      ),
    ];
    // The calendar only feeds the front-desk figures (available, out of service, blocked), which properties without it don't show.
    if (this.isPms) {
      loads.push(
        this.loadStat(
          () => this.dashboardService.getUnitsSummary(params),
          units => (this.units = units),
          loading => (this.isUnitsLoading = loading),
        ),
      );
    }
    if (this.hasPendingStatus) {
      loads.push(
        this.loadStat(
          () => this.dashboardService.getPendingUnits(params),
          pendingUnits => (this.pendingUnits = pendingUnits),
          loading => (this.isPendingLoading = loading),
        ),
      );
    } else {
      this.pendingUnits = 0;
    }
    return loads;
  }

  /** Fetches one stats source for the current day, dropping the result if a newer day was requested meanwhile. */
  private async loadStat<T>(fetch: () => Promise<T>, apply: (value: T) => void, setLoading: (loading: boolean) => void) {
    const seq = this.loadSeq;
    setLoading(true);
    try {
      const value = await fetch();
      if (seq === this.loadSeq) {
        apply(value);
      }
    } catch (error) {
      console.error(error);
    } finally {
      if (seq === this.loadSeq) {
        setLoading(false);
      }
    }
  }

  /** Fetches a tab's data unless it was already fetched (or is in flight) for the current `loadSeq`. */
  private async loadTab(tab: DashboardTab) {
    if (this.tabSeqs[tab] === this.loadSeq) {
      return;
    }
    const seq = this.loadSeq;
    const date = this.selectedDate;
    this.tabSeqs[tab] = seq;
    // A same-day refresh (after an action in a drawer or dialog) keeps the user on their tab.
    const isNewDay = this.tabDates[tab] !== date;
    this.loadingTabs = { ...this.loadingTabs, [tab]: true };
    try {
      await this.fetchTab(tab, date, seq);
      if (seq === this.loadSeq) {
        this.tabDates = { ...this.tabDates, [tab]: date };
        // Every new day's arrivals open the arrivals tab.
        if (tab === 'arrivals' && isNewDay) {
          this.activeTab = 'arrivals';
          this.selectArrivalsAfterRender = true;
        }
      }
    } catch (error) {
      console.error(error);
      // Let the next show retry.
      if (this.tabSeqs[tab] === seq) {
        delete this.tabSeqs[tab];
      }
    } finally {
      // A stale load leaves the flag to the current day's load of this tab, which always follows.
      if (seq === this.loadSeq) {
        this.loadingTabs = { ...this.loadingTabs, [tab]: false };
      }
    }
  }

  private async fetchTab(tab: DashboardTab, date: ISODate, seq: number) {
    const params = { property_id: this.propertyId, date };
    switch (tab) {
      case 'arrivals':
        return loadArrivals(this.propertyId, date, this.propertyReady);
      case 'departures':
        return loadDepartures(this.propertyId, date, this.propertyReady);
      case 'inHouse': {
        const inHouse = await this.dashboardService.getInHouse(params);
        if (seq === this.loadSeq) {
          this.inHouse = inHouse;
        }
        return;
      }
      case 'bookings': {
        const newBookings = await this.dashboardService.getNewBookings(params);
        if (seq === this.loadSeq) {
          this.newBookings = newBookings;
        }
        return;
      }
      case 'cancellations': {
        const cancellations = await this.dashboardService.getCancellations(params);
        if (seq === this.loadSeq) {
          this.cancellations = cancellations;
        }
        return;
      }
    }
  }

  private isTabLoaded(tab: DashboardTab) {
    return this.tabDates[tab] === this.selectedDate;
  }

  private findBooking(bookingNumber: string): Booking | undefined {
    const pools = [arrivalsStore.bookings, departuresStore.bookings, this.inHouse, this.newBookings, this.cancellations];
    for (const pool of pools) {
      const match = pool?.find(b => b.booking_nbr === bookingNumber);
      if (match) {
        return match;
      }
    }
    return undefined;
  }

  private handleDateChange(e: CustomEvent<ISODate>) {
    e.stopPropagation();
    this.selectedDate = e.detail;
    // Drop the previous day's in-flight responses now, rather than when the debounced load starts.
    ++this.loadSeq;
    // While init is running the day isn't loadable yet (no property): init's `loadRest` loads `selectedDate` once it finishes.
    if (this.isPageLoading) {
      return;
    }
    // Dim the previous day's figures straight away; the debounced load clears the flags when the new day's land.
    this.isPerformanceLoading = true;
    this.isUnitsLoading = this.isPms;
    this.isPendingLoading = this.hasPendingStatus;
    this.isDayLoadPending = true;
    this.dayChange$.next();
  }

  private handleTabShow(e: CustomEvent<{ name: string }>) {
    // Ignore wa-tab-show bubbling up from tab groups nested inside the panels.
    if (e.target !== e.currentTarget) {
      return;
    }
    this.activeTab = e.detail.name as DashboardTab;
    // During init the property may not be loaded yet, and during a day change's debounce the day isn't settled;
    // either way the coming `loadRest` loads the active tab first.
    if (this.isPageLoading || this.isDayLoadPending) {
      return;
    }
    this.loadTab(this.activeTab);
  }

  private handleCheckoutRedirect(e: CustomEvent<CheckoutRedirectEvent>) {
    e.stopPropagation();
    this.checkoutRoomIdentifier = e.detail.identifier;
    this.bookingNumber = e.detail.bookingNumber;
  }

  private get counts(): DashboardCounts {
    const today = todayISO();
    return {
      // Arrivals and departures count the rows their table renders (one per room), overdue ones included: the overdue
      // note only flags them. Without the front desk the tables list only the rooms arriving / departing that day.
      arrivals: this.isPms
        ? countRooms([...arrivalsStore.futureBookings, ...arrivalsStore.needsCheckInBookings, ...arrivalsStore.inHouseBookings])
        : countArrivingUnits(arrivalsStore.filteredBookings, this.selectedDate),
      unassignedArrivals: countUnassignedArrivals(arrivalsStore.bookings, this.selectedDate),
      overdueArrivals: countOverdueArrivals(arrivalsStore.bookings, today),
      departures: this.isPms
        ? countRooms([...departuresStore.futureRooms, ...departuresStore.needsCheckOutBookings, ...departuresStore.outBookings])
        : countDepartingUnits(departuresStore.filteredBookings, this.selectedDate),
      overdueDepartures: countOverdueDepartures(departuresStore.bookings, today),
      inHouse: countRooms(this.inHouse),
      inHouseGuests: sumOccupancy(this.inHouse),
      bookings: this.newBookings.length,
      cancellations: this.cancellations.length,
    };
  }

  private renderTab(
    tab: DashboardTab,
    label: string,
    count: number,
    { overdueNote, unassigned, guests }: { overdueNote?: string; unassigned?: number; guests?: DashboardCounts['inHouseGuests'] } = {},
  ) {
    // Counts come from the tab's own data, so they're unknown until the tab has been opened for this day.
    const loaded = this.isTabLoaded(tab);
    // Disabled only while its data is on the way (or the page itself is loading); a failed load stays clickable so showing it retries.
    // Same-day refreshes keep the loaded data on screen, so the tab stays enabled.
    const disabled = !loaded && (this.isPageLoading || !!this.loadingTabs[tab]);
    return (
      <wa-tab slot="nav" panel={tab} class="dashboard-tab" data-tab={tab} disabled={disabled}>
        <span class="dashboard-tab__icon" aria-hidden="true">
          <wa-icon name={TAB_ICONS[tab]}></wa-icon>
        </span>
        <span class="dashboard-tab__label">{label}</span>
        <span class="dashboard-tab__count">{loaded ? formatCount(count) : <CountSkeleton />}</span>
        {/* Wraps instead of truncating, so a note's number always shows however narrow the card is. */}
        <span class="dashboard-tab__notes">
          {loaded && unassigned > 0 && <span class="dashboard-tab__note dashboard-tab__note--unassigned">{`${formatCount(unassigned)} unassigned`}</span>}
          {loaded && overdueNote && <span class="dashboard-tab__note dashboard-tab__note--overdue">{overdueNote}</span>}
          {loaded && guests && this.renderGuests(guests)}
        </span>
      </wa-tab>
    );
  }

  /** In-house guests as three chips (adults, children, infants), each with its own icon and value. */
  private renderGuests({ adults, children, infants }: DashboardCounts['inHouseGuests']) {
    const kinds = [
      { icon: 'user', value: adults, label: locales.entries?.Lcz_Adults ?? 'Adults' },
      { icon: 'child', value: children, label: locales.entries?.Lcz_Children ?? 'Children' },
      { icon: 'baby', value: infants, label: locales.entries?.Lcz_Infants ?? 'Infants' },
    ];
    return (
      <span class="dashboard-tab__guests" role="list" aria-label="Guests in-house">
        {kinds.map(({ icon, value, label }) => (
          <span class={{ 'dashboard-tab__guest': true, 'dashboard-tab__guest--none': value === 0 }} role="listitem" title={`${label}: ${formatCount(value)}`}>
            <wa-icon class="dashboard-tab__guest-icon" name={icon} aria-hidden="true"></wa-icon>
            <span class="dashboard-tab__guest-value">{formatCount(value)}</span>
            <span class="dashboard-tab__guest-label">{label}</span>
          </span>
        ))}
      </span>
    );
  }

  private renderPanel(tab: DashboardTab) {
    // Only the visible panel is mounted, so hidden panels don't keep their dialogs and tables alive.
    if (tab !== this.activeTab) {
      return null;
    }
    // Skeleton only while the tab has no data for this day yet; same-day refreshes keep the panel (and its open dialogs) mounted.
    if (!this.isTabLoaded(tab)) {
      return <TableSkeleton extraColumn={SKELETON_EXTRA_COLUMN[tab]} withoutBalance={tab === 'inHouse'} />;
    }
    switch (tab) {
      case 'arrivals':
        return <ir-dashboard-arrivals language={this.language} countries={this.countries} pmsDisabled={!this.isPms}></ir-dashboard-arrivals>;
      case 'departures':
        return (
          <ir-dashboard-departures
            propertyId={this.propertyId}
            date={this.selectedDate}
            pmsDisabled={!this.isPms}
            onCheckoutRedirect={e => this.handleCheckoutRedirect(e as CustomEvent<CheckoutRedirectEvent>)}
          ></ir-dashboard-departures>
        );
      case 'inHouse':
        return <ir-dashboard-bookings-table variant="inHouse" bookings={this.inHouse} emptyMessage="No guests in-house."></ir-dashboard-bookings-table>;
      case 'bookings':
        return <ir-dashboard-bookings-table variant="newBookings" bookings={this.newBookings} emptyMessage="No bookings made on this day."></ir-dashboard-bookings-table>;
      case 'cancellations':
        return <ir-dashboard-bookings-table variant="cancellations" bookings={this.cancellations} emptyMessage="No cancellations on this day."></ir-dashboard-bookings-table>;
    }
  }

  render() {
    const counts = this.counts;
    const isPms = this.isPms;
    return (
      <Host>
        <ir-page label="Dashboard" handledEndpoints={OVERLAY_ENDPOINTS}>
          <ir-dashboard-date-navigator
            slot="page-header"
            date={this.selectedDate}
            onDateChange={e => this.handleDateChange(e as CustomEvent<ISODate>)}
          ></ir-dashboard-date-navigator>
          <div class={`dashboard-layout dashboard-layout--${this.railDensity}`}>
            <aside class="dashboard-aside" ref={el => (this.asideRef = el)}>
              <ir-dashboard-stats
                date={this.selectedDate}
                isPms={isPms}
                density={this.railDensity}
                performance={this.performance}
                units={this.units}
                pendingUnits={this.pendingUnits}
                currencySymbol={calendar_data.currency?.symbol}
                performanceLoading={this.isPerformanceLoading}
                unitsLoading={this.isUnitsLoading}
                pendingLoading={this.isPendingLoading}
              ></ir-dashboard-stats>
            </aside>
            <section class="dashboard-main" aria-busy={this.isPageLoading ? 'true' : null}>
              <wa-tab-group
                class="dashboard-tabs"
                ref={el => (this.tabGroupRef = el)}
                activation="manual"
                active={this.activeTab}
                withoutScrollControls
                onwa-tab-show={e => this.handleTabShow(e as CustomEvent<{ name: string }>)}
              >
                {this.renderTab('arrivals', 'Arrivals', counts.arrivals, {
                  // Without the front desk nothing is checked in, so nothing is overdue.
                  overdueNote: isPms && counts.overdueArrivals > 0 ? `${formatCount(counts.overdueArrivals)} overdue check-ins` : undefined,
                  // Units are assigned at check-in, so without the front desk "unassigned" means nothing.
                  unassigned: isPms ? counts.unassignedArrivals : undefined,
                })}
                {this.renderTab('departures', 'Departures', counts.departures, {
                  overdueNote: isPms && counts.overdueDepartures > 0 ? `${formatCount(counts.overdueDepartures)} overdue check-outs` : undefined,
                })}
                {isPms && this.renderTab('inHouse', 'In-house', counts.inHouse, { guests: counts.inHouseGuests })}
                {this.renderTab('bookings', locales.entries?.Lcz_Bookings ?? 'Bookings', counts.bookings)}
                {this.renderTab('cancellations', 'Cancellations', counts.cancellations)}
                {this.tabs.map(tab => (
                  <wa-tab-panel key={tab} name={tab} class="dashboard-tab-panel">
                    {this.renderPanel(tab)}
                  </wa-tab-panel>
                ))}
              </wa-tab-group>
            </section>
          </div>
        </ir-page>
        {/* Mounted only after init, as before the loading shell existed: they rely on the loaded property and setup entries. */}
        {!this.isPageLoading && [
          <ir-booking-details-drawer
            open={!!this.bookingNumber}
            propertyId={this.propertyId as any}
            bookingNumber={this.bookingNumber?.toString()}
            checkoutRoomIdentifier={this.checkoutRoomIdentifier}
            ticket={this.ticket}
            language={this.language}
            onBookingDetailsDrawerClosed={() => {
              this.bookingNumber = null;
              this.checkoutRoomIdentifier = null;
              this.loadDay();
            }}
          ></ir-booking-details-drawer>,
          <ir-payment-folio
            style={{ height: 'auto' }}
            booking={this.booking}
            bookingNumber={this.booking?.booking_nbr}
            paymentEntries={this.paymentEntries}
            payment={this.payment}
            mode={'payment-action'}
            ref={el => (this.paymentFolioRef = el)}
            onCloseModal={() => {
              this.booking = null;
              this.payment = null;
            }}
          ></ir-payment-folio>,
        ]}
      </Host>
    );
  }
}
