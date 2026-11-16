import { Component, Element, Event, EventEmitter, Host, Listen, Prop, State, Watch, h } from '@stencil/core';
import { BookingService } from '@/services/booking-service/booking.service';
import { buildSplitIndex, calculateDaysBetweenDates, getSplitRole, SplitRole, transformNewBooking } from '@/utils/booking';
import { checkMealPlan, formatAmount, isBlockUnit, SelectOption, showToast } from '@/utils/utils';
import { IRoomNightsData, CalendarModalEvent } from '@/models/property-types';
import moment from 'moment';
import { EMPTY, exhaustMap, from, merge, Subject, Subscription, throttleTime } from 'rxjs';
import { addDaysISO } from '@/utils/calendar-dates';
import { EventsService } from '@/services/events.service';
import locales from '@/stores/locales.store';
import { ICountry } from '@/models/IBooking';
import calendar_dates from '@/stores/calendar-dates.store';
import calendar_data from '@/stores/calendar-data';
import { t } from '@/services/locale/t';
import {
  CELL_WIDTH,
  computeEventHorizontalGeometry,
  EVENT_HEIGHT,
  EVENT_SPACE,
  getEventTopWithinRow,
  getTotalGridWidth,
  isRtlDirection,
  ROOM_HEADER_WIDTH,
  snapEventLeft,
  toPhysicalLeft,
} from '@/utils/calendar-grid';
import { DragAutoScroller } from '@/utils/drag-autoscroll';
import { formatBookingNumber } from '@/utils/number';
import { LocaleController } from '@/services/locale/locale.controller';
import { getHandleReach, nightsFromWidth, resolveResize, ResizeSide } from './booking-drag';
import { LabelledBar, refreshLabel, trackLabel, untrackLabel } from './bar-label';
import { clientBox, createBarAnchor, Edges, insetsWithin, isCompactViewport, measureGridView } from './bar-popup';
import { claimInfoBubble, closeOpenInfoBubble, RegisteredBar, registerBar, releaseInfoBubble, unregisterBar } from './bar-registry';

/**
 * Taps on the bar closer together than this count once: a double-click, or an impatient re-click,
 * must not toggle the bubble twice.
 */
const TAP_BURST_MS = 300;

/** Statuses whose info bubble needs the full booking fetched before it can open. */
const FETCHED_STATUSES = ['IN-HOUSE', 'CONFIRMED', 'PENDING-CONFIRMATION', 'CHECKED-OUT'];

type BarGeometry = { top: number; left: number; width: number };

/** One press on the bar, from `pointerdown` until it is released or cancelled. */
interface Gesture {
  kind: 'move' | 'stretch';
  /** The physical handle being pulled, for a stretch. */
  side?: ResizeSide;
  pointerId: number;
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
  /** False until the pointer travels past `DRAG_THRESHOLD`; a gesture released before that is a tap. */
  started: boolean;
  /** Where the booking's data puts the bar, and where the gesture currently has it. */
  origin: BarGeometry;
  current: BarGeometry;
  shrinking: boolean;
  /** Last offsets written, so a repeated apply for the same pointer state is skipped. */
  applied: { x: number; y: number } | null;
}

@Component({
  tag: 'igl-booking-event',
  styleUrl: 'igl-booking-event.css',
  scoped: true,
})
export class IglBookingEvent {
  @Element() private element: HTMLElement;

  @Prop() currency;
  @Prop() is_vacation_rental: boolean = false;
  @Prop() language: string;
  @Prop({ mutable: true }) bookingEvent: { [key: string]: any };
  /**
   * Every booking on the calendar, read only when a drop has to be checked for overlaps.
   * A getter rather than the array itself, so that updating one booking does not hand every bar a
   * new prop value and re-render them all.
   */
  @Prop() getAllBookingEvents: () => { [key: string]: any }[];
  @Prop() countries: ICountry[];
  @Prop() roomTop: number;

  @Event() dragOverEventData: EventEmitter;
  @Event() showRoomNightsDialog: EventEmitter<IRoomNightsData>;
  @Event() showDialog: EventEmitter<CalendarModalEvent>;
  @Event() updateBookingEvent: EventEmitter<{ [key: string]: any }>;

  @State() showInfoPopup: boolean = false;
  /**
   * The bubble is shown in a dialog, not a popup. Chosen as it opens, so turning the phone doesn't
   * swap the panel out from under the user, and kept until the dialog has finished animating closed.
   */
  @State() infoInDialog: boolean = false;

  private eventSpace: number = EVENT_SPACE;

  private eventsService = new EventsService();
  private bookingService = new BookingService();

  private gesture: Gesture | null = null;

  /** Taps and Enter/Space presses asking to toggle the info bubble; see `connectedCallback`. */
  private tapToggles$ = new Subject<void>();
  private keyToggles$ = new Subject<void>();
  private toggleSubscription: Subscription | null = null;
  /** The drag that produced the drop the calendar is about to answer with `moveBookingTo`. */
  private lastGesture: { kind: 'move' | 'stretch'; shrinking: boolean } | null = null;
  private autoOpenTimer: ReturnType<typeof setTimeout> | null = null;

  /* Auto-scroll: keeps the calendar moving while a drag or stretch is held near its edge. */
  private autoScroller: DragAutoScroller | null = null;
  private scrollHost: HTMLElement | null = null;
  /**
   * Room row extents captured when a move drag starts, in the same `.bodyContainer` grid space the
   * bar positions itself in, and used to settle it on release.
   */
  private dragRowBands: { top: number; height: number }[] = [];

  /** When the stay itself changes, put the bar where the new data says it belongs. */
  @Watch('bookingEvent')
  handleBookingEventChange(newValue: { [key: string]: any }, oldValue: { [key: string]: any }) {
    if (!oldValue || this.isNewEvent() || this.gesture) {
      return;
    }
    const geometryChanged = ['FROM_DATE', 'TO_DATE', 'NO_OF_DAYS', 'PR_ID'].some(key => newValue[key] !== oldValue[key]);
    if (geometryChanged) {
      this.lastGesture = null;
      this.resetToDataPosition();
    }
  }

  /** How the shared registry reaches this bar; see bar-registry.ts. */
  private registration: RegisteredBar = {
    element: null,
    bookingId: () => this.getBookingId(),
    pool: () => this.bookingEvent?.POOL,
    closeInfo: () => this.showEventInfo(false),
    onMoveBookingTo: event => this.handleMoveBookingTo(event),
    onRevertBooking: () => {
      this.lastGesture = null;
      this.resetToDataPosition();
    },
  };

  /** How the label tracker reads where this bar is drawn; see bar-label.ts. */
  private titleElement: HTMLElement | null = null;
  /**
   * Where the bar is currently drawn, cached so the label tracker can read 1,000 bars per scroll
   * frame without touching the DOM. Refreshed whenever the bar's position is written.
   */
  private displayed: BarGeometry = { top: 0, left: 0, width: 0 };

  private syncDisplayed() {
    const style = this.element.style;
    this.displayed = { top: parseFloat(style.top) || 0, left: parseFloat(style.left) || 0, width: parseFloat(style.width) || 0 };
    refreshLabel(this.label);
  }

  private label: LabelledBar = {
    element: null,
    labelElement: () => this.titleElement,
    displayedGeometry: () => (this.gesture ? null : this.displayed),
  };

  /**
   * The info popup's anchor: this bar, measured as its visible part (see bar-popup.ts). Created
   * once, so the popup never re-anchors on a re-render.
   */
  private popupAnchor: ReturnType<typeof createBarAnchor> | null = null;

  private getScroller(): HTMLElement | null {
    return this.element.closest('.calendarScrollContainer');
  }

  private popupElement: (HTMLElement & { reposition(): void }) | null = null;
  /** The scroll container the open popup is following; see `BarAnchor` for why the bar does this. */
  private followedScroller: HTMLElement | null = null;

  private repositionPopup = () => this.popupElement?.reposition?.();

  /**
   * How far the popup must keep from each edge of the scroll container: the sticky header, footer and
   * room-name column, so it stays over the visible grid. Measured when it opens (they don't move).
   */
  private popupPadding: Edges | number = 8;

  private measureGridView(scroller: HTMLElement) {
    return measureGridView(scroller, ROOM_HEADER_WIDTH, isRtlDirection(locales.direction));
  }

  private followScroll(follow: boolean) {
    this.followedScroller?.removeEventListener('scroll', this.repositionPopup);
    this.followedScroller = follow ? this.getScroller() : null;
    this.followedScroller?.addEventListener('scroll', this.repositionPopup, { passive: true });
  }

  /** The popup moved (the calendar scrolled or resized): once its bar is entirely out of view, close it. */
  private handlePopupReposition = (event: Event) => {
    // wa-reposition bubbles and is composed, so the selects, dropdowns and tooltips inside the bubble
    // (each built on its own wa-popup) report here too. Only this popup's own moves count.
    if (event.target !== event.currentTarget) {
      return;
    }
    if (this.showInfoPopup && this.popupAnchor && !this.popupAnchor.isVisible()) {
      this.showEventInfo(false);
    }
  };

  connectedCallback() {
    // One pipeline for every request to toggle the bubble:
    //  - throttleTime: the first tap of a burst acts at once; the rest of the burst is ignored.
    //    (Keys skip it - their auto-repeat is filtered at the source.)
    //  - exhaustMap: while a toggle is still opening (fetching the booking), further toggles are
    //    dropped, so a bar never has more than one getExposedBooking request in flight.
    this.toggleSubscription?.unsubscribe();
    this.toggleSubscription = merge(this.tapToggles$.pipe(throttleTime(TAP_BURST_MS)), this.keyToggles$)
      .pipe(exhaustMap(() => this.toggleInfo()))
      .subscribe();
    (this.registration as { element: HTMLElement }).element = this.element;
    (this.label as { element: HTMLElement }).element = this.element;
    this.popupAnchor ??= createBarAnchor(this.element, () => {
      const scroller = this.getScroller();
      return scroller ? this.measureGridView(scroller) : null;
    });
    registerBar(this.registration);
    trackLabel(this.label, ROOM_HEADER_WIDTH, () => isRtlDirection(locales.direction));
  }

  componentDidRender() {
    this.syncDisplayed();
  }

  componentDidLoad() {
    if (this.isNewEvent() && !this.bookingEvent.hideBubble) {
      // Opened on the next task, so the click that created the bar has finished propagating first.
      this.autoOpenTimer = setTimeout(() => {
        this.autoOpenTimer = null;
        this.openInfo();
      }, 1);
    }
  }

  disconnectedCallback() {
    if (this.autoOpenTimer) {
      clearTimeout(this.autoOpenTimer);
      this.autoOpenTimer = null;
    }
    this.endGesture();
    this.toggleSubscription?.unsubscribe();
    this.toggleSubscription = null;
    this.followScroll(false);
    unregisterBar(this.registration);
    untrackLabel(this.label);
  }

  /** The bubble inside this bar asked to be closed (it bubbles up from igl-booking-event-hover). */
  @Listen('hideBubbleInfo')
  handleHideBubbleInfo(event: CustomEvent) {
    if (event.detail?.key === 'hidebubble') {
      this.showEventInfo(false);
    }
  }

  /** The calendar has resolved where this bar's drop landed; confirm it, or put the bar back. */
  private async handleMoveBookingTo(event: CustomEvent) {
    const detail = event.detail;
    const gesture = this.lastGesture;
    this.lastGesture = null;
    try {
      if (!gesture || detail.moveToDay === 'revert' || detail.toRoomId === 'revert') {
        this.resetToDataPosition();
        return;
      }
      const { pool, to_date, from_date, toRoomId } = detail;
      if (gesture.kind === 'move' && String(toRoomId) === String(this.bookingEvent.PR_ID) && from_date === this.bookingEvent.FROM_DATE) {
        // Released back on its own cell: nothing changed, so there is nothing to confirm.
        this.resetToDataPosition();
        return;
      }
      if (this.checkIfSlotOccupied(toRoomId, from_date, to_date)) {
        this.resetToDataPosition();
        throw new Error(t('Lcz_OverlappingDates', { fallback: 'Overlapping Dates' }));
      }
      if (!pool) {
        return;
      }
      if (isBlockUnit(this.bookingEvent.STATUS_CODE)) {
        await this.eventsService.reallocateEvent(pool, toRoomId, from_date, to_date).catch(() => this.resetToDataPosition());
        return;
      }
      if (gesture.kind === 'move' || gesture.shrinking) {
        this.showDialog.emit({ reason: 'reallocate', ...detail, ...this.getReallocationDialog(toRoomId, from_date, to_date, gesture.shrinking) });
        return;
      }
      const payload: IRoomNightsData = {
        booking: this.bookingEvent,
        bookingNumber: this.bookingEvent.BOOKING_NUMBER,
        identifier: this.bookingEvent.IDENTIFIER,
        to_date,
        pool,
        from_date,
        defaultDates: this.bookingEvent.defaultDates,
      };
      if (!this.bookingEvent.is_direct) {
        this.showDialog.emit({ reason: 'stretch', ...payload });
      } else {
        this.showRoomNightsDialog.emit(payload);
      }
    } catch (error) {
      showToast({ title: error.message, description: '', type: 'error' });
    }
  }

  /** Dialog fields for a move, or a shrink, that the user has to confirm. */
  private getReallocationDialog(toRoomId: number, from_date: string, to_date: string, shrinking: boolean) {
    const { description, status, newRatePlans, matchedRatePlan } = this.getModalDescription(toRoomId, from_date, to_date, shrinking);
    const oldFromDate = this.bookingEvent.defaultDates.from_date;
    const oldToDate = this.bookingEvent.defaultDates.to_date;
    const diffDays = calculateDaysBetweenDates(oldFromDate, oldToDate);

    let fromDate = oldFromDate;
    let toDate = oldToDate;
    if (shrinking) {
      if (from_date > oldFromDate && to_date < oldToDate) {
        toDate = to_date;
      } else if (from_date > oldFromDate) {
        fromDate = from_date;
      } else if (to_date < oldToDate) {
        toDate = to_date;
      }
    } else if (from_date < oldFromDate) {
      fromDate = from_date;
      const newToDate = addDaysISO(from_date, diffDays);
      toDate = newToDate < to_date ? to_date : newToDate;
    } else if (to_date > oldToDate) {
      toDate = to_date;
      fromDate = addDaysISO(to_date, -diffDays);
    }
    return {
      description,
      title: '',
      rateplans: newRatePlans,
      matchedRatePlan,
      hideConfirmButton: status === '400',
      from_date: fromDate,
      to_date: toDate,
    };
  }

  private async fetchAndAssignBookingData() {
    try {
      if (!FETCHED_STATUSES.includes(this.bookingEvent.STATUS)) {
        return;
      }
      const data = await this.bookingService.getExposedBooking({ booking_nbr: this.bookingEvent.BOOKING_NUMBER, language: LocaleController.language });
      const base_booking = { ...data };
      const filteredRooms = data.rooms.filter(room => room['assigned_units_pool'] === this.bookingEvent.ID);
      if (filteredRooms.length === 0) {
        throw new Error(`booking#${this.bookingEvent.BOOKING_NUMBER} has an empty array`);
      }
      if (filteredRooms.some(room => room['assigned_units_pool'] === null)) {
        throw new Error(`booking#${this.bookingEvent.BOOKING_NUMBER} has an empty pool`);
      }
      data.rooms = filteredRooms;

      const transformedBooking = transformNewBooking(data)[0];
      const {
        ID,
        TO_DATE,
        FROM_DATE,
        NO_OF_DAYS,
        STATUS,
        NAME,
        IDENTIFIER,
        origin,
        TOTAL_PRICE,
        PR_ID,
        POOL,
        BOOKING_NUMBER,
        NOTES,
        is_direct,
        BALANCE,
        channel_booking_nbr,
        ...otherBookingData
      } = transformedBooking;
      this.bookingEvent = {
        ...otherBookingData,
        ...this.bookingEvent,
        channel_booking_nbr,
        booking: data,
        base_booking,
        DEPARTURE_TIME: otherBookingData.DEPARTURE_TIME,
        PHONE: otherBookingData.PHONE,
        PHONE_PREFIX: otherBookingData.PHONE_PREFIX,
        PRIVATE_NOTE: otherBookingData.PRIVATE_NOTE,
        origin,
        BALANCE,
        TOTAL_PRICE,
        ROOM_INFO: { ...this.bookingEvent.ROOM_INFO, sharing_persons: otherBookingData.ROOM_INFO.sharing_persons },
      };
      this.updateBookingEvent.emit(this.bookingEvent);
      this.showEventInfo(true);
    } catch (error) {
      console.error(error.message);
    }
  }

  private findRoomType(roomId: number) {
    return this.bookingEvent.roomsInfo?.find(room => room.physicalrooms.some(r => r.id === +roomId))?.id ?? null;
  }

  private getModalDescription(
    toRoomId: number,
    from_date: string,
    to_date: string,
    shrinking: boolean,
  ): { status: '200' | '400'; description: string; newRatePlans?: SelectOption[]; matchedRatePlan?: SelectOption | null } {
    const ratePlansFor = (targetRT: number) => {
      const mealPlans = checkMealPlan({
        rateplan_id: this.bookingEvent.RATE_PLAN_ID,
        roomTypeId: targetRT,
        roomTypes: calendar_data?.property?.roomtypes,
      });
      return { newRatePlans: Array.isArray(mealPlans) ? mealPlans : undefined, matchedRatePlan: Array.isArray(mealPlans) ? null : mealPlans };
    };
    if (!this.bookingEvent.is_direct) {
      if (shrinking) {
        return { description: t('Lcz_OTA_Modification_Alter'), status: '200' };
      }
      if (from_date === this.bookingEvent.FROM_DATE && to_date === this.bookingEvent.TO_DATE) {
        const targetRT = this.findRoomType(toRoomId);
        if (this.findRoomType(this.bookingEvent.PR_ID) === targetRT) {
          return { description: `${t('Lcz_AreYouSureWantToMoveAnotherUnit')}?`, status: '200' };
        }
        return { description: t('Lcz_OTA_Modification_Alter'), status: '200', ...ratePlansFor(targetRT) };
      }
      return { description: t('Lcz_CannotChangeCHBookings') + '.', status: '400' };
    }
    if (shrinking) {
      return { description: t('Lcz_ConfrmModiication') + '.', status: '200' };
    }
    const targetRT = this.findRoomType(Number(toRoomId));
    if (this.findRoomType(Number(this.bookingEvent.PR_ID)) !== targetRT) {
      return { description: t('Lcz_SameRatesWillBeKept'), status: '200', ...ratePlansFor(targetRT) };
    }
    if (this.bookingEvent.PR_ID.toString() === toRoomId.toString()) {
      return { description: t('Lcz_ConfrmModiication') + '.', status: '200' };
    }
    return { description: `${t('Lcz_AreYouSureWantToMoveAnotherUnit')}?`, status: '200' };
  }

  /** Puts the bar back exactly where its booking data says it belongs. */
  private resetToDataPosition() {
    const { top, left, width } = this.getPosition();
    const style = this.element.style;
    style.transform = '';
    style.top = top;
    style.left = left;
    style.width = width;
    this.syncDisplayed();
  }

  private checkIfSlotOccupied(toRoomId, from_date: string, to_date: string) {
    const all = this.getAllBookingEvents?.() ?? [];
    return all.some(
      event =>
        event.ID !== 'NEW_TEMP_EVENT' &&
        event.POOL !== this.bookingEvent.POOL &&
        event.PR_ID === +toRoomId &&
        to_date >= addDaysISO(event.FROM_DATE, 1) &&
        from_date < event.TO_DATE,
    );
  }

  private isNewEvent() {
    return this.getBookingId() === 'NEW_TEMP_EVENT';
  }

  private isHighlightEventType() {
    return this.bookingEvent.event_type === 'HIGH_LIGHT';
  }

  private getBookingId() {
    return this.bookingEvent.ID;
  }

  private getBookedRoomId() {
    return this.bookingEvent.PR_ID;
  }

  /**
   * The bar continues in from before the loaded window: its stay began before FROM_DATE (clamped to the window).
   * Drives both the skewed/continuation visual and the half-cell position adjustment.
   * Dates are `YYYY-MM-DD`, so string order is date order.
   */
  private isSkewedStart() {
    return !this.isNewEvent() && !!this.bookingEvent.defaultDates && this.bookingEvent.defaultDates.from_date < this.bookingEvent.FROM_DATE;
  }

  /** The bar continues past the loaded window: its stay ends after TO_DATE (clamped to the window). */
  private isSkewedEnd() {
    return !this.isNewEvent() && !!this.bookingEvent.defaultDates && this.bookingEvent.defaultDates.to_date > this.bookingEvent.TO_DATE;
  }

  private getLegendOfStatus(statusKey: string) {
    const legendData = this.bookingEvent?.legendData;
    const status = legendData?.statusId?.[statusKey];
    if (!status) {
      return { color: undefined, clsName: '' };
    }
    return { ...legendData[status.id], ...status };
  }

  private getEventLegend() {
    const legend = this.getLegendOfStatus(this.bookingEvent.STATUS);
    return this.isNewEvent() ? { ...legend, color: '#f9f9c9' } : legend;
  }

  private getPosition() {
    const pos = { top: '0px', left: '0px', width: '0px', height: `${EVENT_HEIGHT}px` };
    if (typeof this.roomTop !== 'number') {
      return pos;
    }
    pos.top = `${this.roomTop + getEventTopWithinRow()}px`;

    const days = calendar_dates.days;
    const { left: logicalLeft, width } = computeEventHorizontalGeometry({
      days,
      fromDate: this.bookingEvent.FROM_DATE,
      stayDays: this.bookingEvent.NO_OF_DAYS,
      startsAfterWindowOpen: this.isSkewedStart(),
      eventSpace: this.eventSpace,
    });
    const totalGridWidth = getTotalGridWidth(days.length);
    pos.left = `${toPhysicalLeft(logicalLeft, width, isRtlDirection(locales.direction), totalGridWidth)}px`;
    pos.width = `${width}px`;
    return pos;
  }

  /** Physical geometry the booking's data puts the bar at, in `.bodyContainer` grid pixels. */
  private getGeometry() {
    const pos = this.getPosition();
    return { top: parseFloat(pos.top), left: parseFloat(pos.left), width: parseFloat(pos.width) };
  }

  /**
   * Pointer travel, in px, before a press becomes a drag. Below it the press is a tap - which also
   * absorbs the few pixels a finger or a trackpad click wobbles by.
   */
  private static readonly DRAG_THRESHOLD = 5;

  private onPointerDown = (event: PointerEvent) => {
    if (this.gesture || this.isNewEvent() || this.isHighlightEventType()) {
      return;
    }
    // Only the primary button drags. Ctrl+click is the macOS secondary click, so it opens a context menu too.
    if (event.button !== 0 || (event.pointerType === 'mouse' && event.ctrlKey)) {
      return;
    }
    // The info bubble renders inside the bar; presses in it belong to its own inputs and buttons, and
    // a press on the dialog's backdrop or close button reaches the bar retargeted to ir-dialog.
    if ((event.target as Element)?.closest?.('igl-booking-event-hover, ir-dialog')) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const handle = (event.target as Element)?.closest?.('[data-handle]');
    const side = handle?.getAttribute('data-handle') as ResizeSide | undefined;
    this.gesture = {
      kind: side ? 'stretch' : 'move',
      side,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
      started: false,
      origin: this.getGeometry(),
      current: this.getGeometry(),
      shrinking: false,
      applied: null,
    };
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
    window.addEventListener('pointercancel', this.onPointerCancel);
    window.addEventListener('keydown', this.onGestureKeyDown, true);
  };

  /** Escape abandons a drag wherever focus happens to be. */
  private onGestureKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && this.gesture) {
      event.preventDefault();
      event.stopPropagation();
      this.cancelGesture();
    }
  };

  /** The browser took the pointer away (a system gesture, the window losing focus): undo, don't drop. */
  private onPointerCancel = (event: PointerEvent) => {
    if (this.gesture && event.pointerId === this.gesture.pointerId) {
      this.cancelGesture();
    }
  };

  /** Abandons the current gesture: the bar goes back to where its data puts it and nothing is dropped. */
  private cancelGesture() {
    const wasDragging = this.gesture?.started;
    this.endGesture();
    if (wasDragging) {
      this.resetToDataPosition();
      this.dragOverEventData.emit({ id: 'DRAG_CANCEL', data: null });
    }
  }

  private onPointerMove = (event: PointerEvent) => {
    const g = this.gesture;
    if (!g || event.pointerId !== g.pointerId) {
      return;
    }
    g.lastX = event.clientX;
    g.lastY = event.clientY;
    if (!g.started) {
      if (Math.abs(g.lastX - g.startX) <= IglBookingEvent.DRAG_THRESHOLD && Math.abs(g.lastY - g.startY) <= IglBookingEvent.DRAG_THRESHOLD) {
        return;
      }
      this.beginDrag();
    }
    this.autoScroller?.update(g.lastX, g.lastY);
    this.applyDragPosition();
  };

  private onPointerUp = (event: PointerEvent) => {
    const g = this.gesture;
    if (!g || event.pointerId !== g.pointerId) {
      return;
    }
    const isTap = !g.started;
    if (g.started) {
      g.kind === 'move' ? this.dropMove() : this.dropStretch();
    }
    this.endGesture();
    if (isTap) {
      this.tapToggles$.next();
    }
  };

  /**
   * Closes the bubble if it is open - no request - otherwise opens it. Returns what is still pending,
   * which is what `exhaustMap` waits on before it lets another toggle through.
   */
  private toggleInfo() {
    if (this.showInfoPopup) {
      this.showEventInfo(false);
      return EMPTY;
    }
    return from(this.openInfo());
  }

  /** Enter/Space opens the bubble, the way a tap does; Escape closes it from anywhere inside the bar. */
  private onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      if (this.showInfoPopup) {
        event.stopPropagation();
        this.showEventInfo(false);
        this.element.focus?.();
      }
      return;
    }
    // Only the bar itself: Enter on a button inside the open bubble belongs to that button.
    if ((event.key === 'Enter' || event.key === ' ') && event.target === this.element && !this.isHighlightEventType()) {
      event.preventDefault();
      if (!event.repeat) {
        this.keyToggles$.next();
      }
    }
  };

  /** Opens the info bubble, fetching the full booking first when its status needs it. Settles once open (or failed). */
  private async openInfo(): Promise<void> {
    if (!isBlockUnit(this.bookingEvent.STATUS_CODE) && FETCHED_STATUSES.includes(this.bookingEvent.STATUS)) {
      await this.fetchAndAssignBookingData();
    } else {
      this.showEventInfo(true);
    }
  }

  /** The press has travelled far enough to be a drag: lift the bar and tell the calendar. */
  private beginDrag() {
    const g = this.gesture;
    g.started = true;
    // Keeps the pointer's events coming to this bar even over an iframe or outside the window, so the
    // release is never lost. Taken only once dragging, so a tap's click still lands where it was aimed.
    try {
      this.element.setPointerCapture?.(g.pointerId);
    } catch {
      // The pointer is already gone; pointercancel/pointerup will end the gesture.
    }
    closeOpenInfoBubble(this.registration);
    this.element.classList.add('is-dragging');
    if (g.kind === 'move') {
      this.captureRowBands();
    }
    const { top, left, width } = g.origin;
    this.dragOverEventData.emit({
      id: 'CALCULATE_DRAG_OVER_BOUNDS',
      data: { id: this.getBookingId(), fromRoomId: this.getBookedRoomId(), top, left, x: left, y: top, width },
    });
    this.beginAutoScroll(g.kind, g.startX, g.startY);
  }

  /** Releases everything a gesture holds. Safe to call when no gesture is active. */
  private endGesture() {
    if (this.gesture && this.element.hasPointerCapture?.(this.gesture.pointerId)) {
      this.element.releasePointerCapture(this.gesture.pointerId);
    }
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('pointercancel', this.onPointerCancel);
    window.removeEventListener('keydown', this.onGestureKeyDown, true);
    this.endAutoScroll();
    this.element.classList.remove('is-dragging');
    this.gesture = null;
    this.syncDisplayed();
  }

  /**
   * Arms edge auto-scrolling for the drag that just started.
   *
   * A `move` drag can travel on both axes, so it scrolls on both. A stretch only ever changes the
   * bar's width, so vertical scrolling there would move the grid for no reason - horizontal only.
   *
   * The `scroll` listener covers scrolling this component didn't cause (a mouse wheel, a trackpad
   * swipe): the bar's position is derived from viewport-space pointer deltas, so it has to be
   * re-applied whenever the content underneath it moves, not only when the pointer moves.
   */
  private beginAutoScroll(kind: 'move' | 'stretch', clientX: number, clientY: number) {
    this.scrollHost = this.element.closest('.calendarScrollContainer');
    if (!this.scrollHost) {
      return;
    }
    this.autoScroller = new DragAutoScroller({
      container: this.scrollHost,
      axes: { x: true, y: kind === 'move' },
      // The room-name column is sticky against the inline start edge, which bidi-mirrors to the
      // physical right in RTL. Skip it, so the hot zone starts at the edge of the scrollable grid
      // rather than underneath a column that never moves.
      inlineStartInset: ROOM_HEADER_WIDTH,
      inlineStartEdge: isRtlDirection(locales.direction) ? 'right' : 'left',
      getBounds: () => this.getGridScrollBounds(),
      onScroll: () => this.applyDragPosition(),
    });
    this.autoScroller.start();
    this.autoScroller.update(clientX, clientY);
    this.scrollHost.addEventListener('scroll', this.handleHostScroll, { passive: true });
  }

  /**
   * How far auto-scroll may travel, in the scroll container's own coordinates.
   *
   * Deliberately *not* the container's own `scrollHeight`/`scrollWidth`: this bar is an absolutely
   * positioned descendant of that container, so following the pointer past the last room row
   * extends the container's scrollable overflow by exactly as much as it just scrolled, and the
   * drag would chase its own tail off the end of the grid. The room rows are the real limit - they
   * are also the only thing a booking can be dropped on - and they don't move mid-drag.
   *
   * Positions are expressed as `elementEdge - containerEdge + scrollPosition`, which is invariant
   * under scrolling and therefore direction-agnostic: it yields the usual `0 .. max` range in LTR
   * and the mirrored `-max .. 0` range RTL containers report.
   */
  private getGridScrollBounds() {
    const rows = this.scrollHost?.querySelectorAll('.bodyContainer .roomRow');
    if (!rows?.length) {
      return {};
    }
    const containerRect = this.scrollHost.getBoundingClientRect();
    const { scrollLeft, scrollTop, clientWidth, clientHeight } = this.scrollHost;
    // Every row spans the full grid width (`.roomRow { width: max-content }`), so the first one
    // gives the horizontal extent; the last one gives the vertical extent.
    const firstRow = (rows[0] as HTMLElement).getBoundingClientRect();
    const lastRow = (rows[rows.length - 1] as HTMLElement).getBoundingClientRect();
    return {
      x: [firstRow.left - containerRect.left + scrollLeft, firstRow.right - containerRect.left + scrollLeft - clientWidth] as [number, number],
      y: [0, lastRow.bottom - containerRect.top + scrollTop - clientHeight] as [number, number],
    };
  }

  /**
   * Records where every room row starts and ends, so a move drag can snap onto one.
   *
   * Same selector and same coordinate space as the drop-target bounds `igloo-calendar` measures
   * (`offsetTop` inside `.bodyContainer`), so the row the bar snaps to is by construction the row
   * the drop resolves to.
   */
  private captureRowBands() {
    const rows = document.querySelectorAll('.bodyContainer .roomRow .roomTitle[data-room]');
    this.dragRowBands = Array.from(rows).map(row => ({ top: (row as HTMLElement).offsetTop, height: (row as HTMLElement).offsetHeight }));
  }

  /**
   * Snaps a dropped bar's top onto the centre of the room row it came to rest over.
   *
   * The bar's own middle picks the row, so it belongs to whichever row it is more than half way
   * into - and the nearest row wins outright when that middle is over a category header or past
   * the end of the list, which keeps the bar on a droppable row instead of between two.
   */
  private snapTopToRow(rawTop: number): number {
    if (!this.dragRowBands.length) {
      return rawTop;
    }
    const barMiddle = rawTop + EVENT_HEIGHT / 2;
    let closest = this.dragRowBands[0];
    let closestDistance = Infinity;
    for (const band of this.dragRowBands) {
      const distance = Math.max(band.top - barMiddle, barMiddle - (band.top + band.height), 0);
      if (distance < closestDistance) {
        closestDistance = distance;
        closest = band;
      }
      if (distance === 0) {
        break;
      }
    }
    return closest.top + getEventTopWithinRow(closest.height);
  }

  /** Snaps a dropped bar's physical left onto the day a booking released there would start on. */
  private snapLeftToDay(rawLeft: number, width: number): number {
    return snapEventLeft({
      physicalLeft: rawLeft,
      width,
      isRtl: isRtlDirection(locales.direction),
      totalGridWidth: getTotalGridWidth(calendar_dates.days.length),
      startsAfterWindowOpen: this.isSkewedStart(),
      eventSpace: this.eventSpace,
    });
  }

  /** Disarms auto-scrolling. Safe to call when no drag is in progress. */
  private endAutoScroll() {
    this.autoScroller?.stop();
    this.autoScroller = null;
    this.scrollHost?.removeEventListener('scroll', this.handleHostScroll);
    this.scrollHost = null;
  }

  private handleHostScroll = () => {
    if (this.gesture?.started) {
      this.applyDragPosition();
    }
  };

  /**
   * Positions the bar (and, for a move, reports the drop target) from the last known pointer
   * position. Called both on pointer movement and on every frame the calendar auto-scrolls, since
   * a pointer parked in the edge hot zone keeps the grid moving without firing another move event.
   *
   * A move rides on `transform` so following the pointer never triggers layout; only the drop
   * commits a real `top`/`left`.
   */
  private applyDragPosition() {
    const g = this.gesture;
    if (!g?.started) {
      return;
    }
    // `top`/`left` are grid-space (relative to `.bodyContainer`) while pointer deltas are
    // viewport-space; folding the container's scroll travel back in keeps the two in step.
    const scrollOffset = this.autoScroller?.offset ?? { x: 0, y: 0 };
    const dx = g.lastX - g.startX + scrollOffset.x;
    const dy = g.lastY - g.startY + scrollOffset.y;
    // An auto-scrolled frame arrives twice - from the scroller and from the container's `scroll`.
    if (g.applied?.x === dx && g.applied?.y === dy) {
      return;
    }
    g.applied = { x: dx, y: dy };
    if (g.kind === 'move') {
      g.current = { ...g.origin, top: g.origin.top + dy, left: g.origin.left + dx };
      this.element.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
      const { top, left, width } = g.current;
      this.dragOverEventData.emit({ id: 'DRAG_OVER', data: { id: this.getBookingId(), fromRoomId: this.getBookedRoomId(), top, left, x: left, y: top, width } });
      return;
    }
    const resized = resolveResize({
      side: g.side,
      initialLeft: g.origin.left,
      initialWidth: g.origin.width,
      deltaX: dx,
      isRtl: isRtlDirection(locales.direction),
      canGrow: this.canGrow(),
      splitRole: this.computeSplitRole(),
    });
    if (!resized) {
      return;
    }
    g.current = { ...g.origin, left: resized.left, width: resized.width };
    g.shrinking = resized.shrinking;
    this.element.style.left = `${resized.left}px`;
    this.element.style.width = `${resized.width}px`;
  }

  /** Settles a stretched bar on whole nights and reports the new length, or springs it back if unchanged. */
  private dropStretch() {
    const g = this.gesture;
    const startsAfterWindowOpen = this.isSkewedStart();
    const nights = nightsFromWidth(g.current.width, startsAfterWindowOpen);
    if (nights === this.bookingEvent.NO_OF_DAYS) {
      this.resetToDataPosition();
      return;
    }
    const width = nights * CELL_WIDTH - this.eventSpace + (startsAfterWindowOpen ? CELL_WIDTH / 2 : 0);
    // The handle that was not pulled stays put.
    const left = g.side === 'leftSide' ? g.origin.left + g.origin.width - width : g.origin.left;
    this.element.style.left = `${left}px`;
    this.element.style.width = `${width}px`;
    // Recorded before the emit: igloo-calendar answers with `moveBookingTo` inside this same call.
    this.lastGesture = { kind: 'stretch', shrinking: nights < this.bookingEvent.NO_OF_DAYS };
    this.dragOverEventData.emit({
      id: 'STRETCH_OVER_END',
      data: { id: this.getBookingId(), fromRoomId: +this.getBookedRoomId(), x: left, y: g.origin.top, width, pool: this.bookingEvent.POOL, nbOfDays: nights },
    });
  }

  /** Settles a moved bar onto the grid cell it was released over and reports the drop. */
  private dropMove() {
    const g = this.gesture;
    const top = this.snapTopToRow(g.current.top);
    const left = this.snapLeftToDay(g.current.left, g.origin.width);
    this.element.style.transform = '';
    this.element.style.top = `${top}px`;
    this.element.style.left = `${left}px`;
    // Recorded before the emit: igloo-calendar answers with `moveBookingTo` inside this same call.
    this.lastGesture = { kind: 'move', shrinking: false };
    this.dragOverEventData.emit({
      id: 'DRAG_OVER_END',
      data: {
        id: this.getBookingId(),
        fromRoomId: this.getBookedRoomId(),
        top,
        left,
        x: left,
        y: top,
        width: g.origin.width,
        pool: this.bookingEvent.POOL,
        nbOfDays: this.bookingEvent.NO_OF_DAYS,
      },
    });
  }

  private renderEventBookingNumber() {
    if (this.bookingEvent.STATUS === 'TEMP-EVENT' || this.isNewEvent() || isBlockUnit(this.bookingEvent.STATUS_CODE)) {
      return '';
    }
    return ` - ${formatBookingNumber(this.bookingEvent.is_direct ? this.bookingEvent.BOOKING_NUMBER : this.bookingEvent.channel_booking_nbr)}`;
  }

  /** What a screen reader announces for the bar: who, which booking, and the stay. */
  private getAccessibleName() {
    const { NAME, defaultDates, FROM_DATE, TO_DATE } = this.bookingEvent;
    return `${NAME ?? ''}${this.renderEventBookingNumber()}, ${defaultDates?.from_date ?? FROM_DATE} – ${defaultDates?.to_date ?? TO_DATE}`;
  }

  private showEventInfo(showInfo: boolean) {
    if (this.isHighlightEventType() || this.bookingEvent.hideBubble) {
      return;
    }
    if (showInfo) {
      this.infoInDialog = !this.isNewEvent() && isCompactViewport();
      const scroller = this.getScroller();
      this.popupPadding = scroller ? insetsWithin(clientBox(scroller), this.measureGridView(scroller), 8) : 8;
      claimInfoBubble(this.registration);
    } else {
      releaseInfoBubble(this.registration);
    }
    this.followScroll(showInfo && !this.infoInDialog);
    this.showInfoPopup = showInfo;
  }

  private getInfoDialogLabel(): string {
    return isBlockUnit(this.bookingEvent.STATUS_CODE) ? t('Lcz_Blockdates', { fallback: 'Block dates' }) : this.bookingEvent.NAME;
  }

  private handleInfoDialogClosed = () => {
    // A bar reopened during the closing animation is still using the dialog.
    if (!this.showInfoPopup) {
      this.infoInDialog = false;
    }
  };

  /** True when the guest leaves later than the property's configured check-out time. */
  private isDepartureAfterHotelCheckout(): boolean {
    if (calendar_data.property?.is_automatic_check_in_out) {
      return false;
    }
    const departureTime = this.bookingEvent.DEPARTURE_TIME;
    if (!departureTime?.code) {
      return false;
    }
    const t1 = moment(calendar_data.property.time_constraints.check_out_till, 'HH:mm');
    const t2 = moment(departureTime.description, 'HH:mm');
    return t1.isBefore(t2);
  }

  /** An OTA reservation's dates belong to the channel: it can be shortened here, never lengthened. */
  private canGrow(): boolean {
    return this.bookingEvent.is_direct || isBlockUnit(this.bookingEvent.STATUS_CODE);
  }

  private computeSplitRole(): SplitRole | '' {
    const splitIndex = buildSplitIndex(this.bookingEvent.ROOMS);
    return splitIndex ? (getSplitRole(splitIndex, this.bookingEvent.IDENTIFIER) ?? '') : '';
  }

  render() {
    const legend = this.getEventLegend();
    const noteNode = this.bookingEvent.NOTES || this.bookingEvent.INTERNAL_NOTE || this.bookingEvent.PRIVATE_NOTE ? this.getLegendOfStatus('NOTES') : null;
    const hasBalance = this.bookingEvent.BALANCE !== null && this.bookingEvent.BALANCE >= 1;
    const bookingId = this.getBookingId();
    const barId = `event_${bookingId}`;
    const lateCheckoutId = `event_late_checkout_${bookingId}`;
    const balanceId = `event_balance_${bookingId}`;

    let backgroundColor = this.bookingEvent.ROOM_INFO?.calendar_extra?.booking_color?.color ?? legend.color;
    const { foreground, stripe } = calendar_data.colorsForegrounds?.[backgroundColor] ?? { foreground: '', stripe: '' };
    if (this.bookingEvent.STATUS === 'CHECKED-OUT') {
      backgroundColor = legend.color;
    }
    const isDepartureAfterHotelCheckout = this.isDepartureAfterHotelCheckout();
    const splitRole = this.computeSplitRole();
    const pending = this.bookingEvent.STATUS === 'PENDING-CONFIRMATION' && !this.isNewEvent();
    const startsAfterWindowOpen = this.isSkewedStart();
    const endsBeforeWindowClose = this.isSkewedEnd();
    const isBlock = isBlockUnit(this.bookingEvent.STATUS_CODE);
    const skewClasses = { skewedLeft: startsAfterWindowOpen, skewedRight: endsBeforeWindowClose };
    const reachInput = { isRtl: isRtlDirection(locales.direction), canGrow: this.canGrow(), splitRole };
    const infoPanel = (
      <igl-booking-event-hover
        inDialog={this.infoInDialog}
        is_vacation_rental={this.is_vacation_rental}
        countries={this.countries}
        bookingEvent={this.bookingEvent}
      ></igl-booking-event-hover>
    );
    return (
      <Host
        class={{ bookingEvent: true, newEvent: this.isNewEvent() || this.isHighlightEventType(), [legend.clsName]: !!legend.clsName }}
        style={this.getPosition()}
        id={barId}
        dir={isRtlDirection(locales.direction) ? 'rtl' : 'ltr'}
        tabindex={this.isHighlightEventType() ? undefined : '0'}
        role="button"
        aria-label={this.getAccessibleName()}
        aria-haspopup="dialog"
        aria-expanded={this.showInfoPopup ? 'true' : 'false'}
        onPointerDown={this.onPointerDown}
        onKeyDown={this.onKeyDown}
      >
        <div
          data-identifier={this.bookingEvent.IDENTIFIER}
          data-status={this.bookingEvent.STATUS}
          class={{
            'bookingEventBase': true,
            pending,
            ...skewClasses,
            'striped-bar animated': isBlock && this.bookingEvent.STATUS_CODE === '003',
            'ota-booking-event': !this.bookingEvent.is_direct && !isBlock && this.bookingEvent.STATUS !== 'TEMP-EVENT' && !this.isNewEvent(),
            [splitRole]: !!splitRole,
          }}
          style={{ 'backgroundColor': backgroundColor, '--ir-event-bg': backgroundColor, '--ir-event-bg-stripe-color': stripe }}
        ></div>
        {isDepartureAfterHotelCheckout && (
          <wa-tooltip for={lateCheckoutId}>
            {t('Lcz_DepartureTime', { fallback: 'Departure time:' })} {this.bookingEvent.DEPARTURE_TIME?.description}
          </wa-tooltip>
        )}
        {hasBalance && (
          <wa-tooltip for={balanceId}>
            {t('Lcz_Balance', { fallback: 'Balance' }) + ':'} {formatAmount(calendar_data.property.currency.symbol, this.bookingEvent.BALANCE)}
          </wa-tooltip>
        )}
        {noteNode && <div class="legend_circle noteIcon" style={{ backgroundColor: noteNode.color }}></div>}
        {(hasBalance || isDepartureAfterHotelCheckout) && (
          <div class="balanceIcon">
            {isDepartureAfterHotelCheckout && <div id={lateCheckoutId} class="legend_circle lateCheckoutDot"></div>}
            {hasBalance && <div id={balanceId} class="legend_circle balanceDot"></div>}
          </div>
        )}
        <div class={{ bookingEventTitle: true, pending }} style={pending ? undefined : { color: foreground }} ref={el => (this.titleElement = el)}>
          {this.bookingEvent.NAME}
          {this.renderEventBookingNumber()}
        </div>
        <div data-handle="leftSide" data-reach={getHandleReach({ side: 'leftSide', ...reachInput })} class={{ bookingEventDragHandle: true, leftSide: true, ...skewClasses }}></div>
        <div
          data-handle="rightSide"
          data-reach={getHandleReach({ side: 'rightSide', ...reachInput })}
          class={{ bookingEventDragHandle: true, rightSide: true, ...skewClasses }}
        ></div>
        {this.infoInDialog && (
          <ir-dialog
            class="bookingEventDialog"
            label={this.getInfoDialogLabel()}
            open={this.showInfoPopup}
            onIrDialogHide={() => this.showEventInfo(false)}
            onIrDialogAfterHide={this.handleInfoDialogClosed}
          >
            {infoPanel}
          </ir-dialog>
        )}
        {this.showInfoPopup && !this.infoInDialog && (
          // Rendered in the top layer by wa-popup, but still a DOM child of the bar: outside-click
          // detection and the "presses in the bubble are not drags" guard keep working as before.
          <wa-popup
            class="bookingEventPopup"
            active
            anchor={this.popupAnchor?.anchor}
            placement="bottom"
            distance={10}
            flip
            // wa-popup types these as numbers, but hands them to Floating UI, which takes per-side padding.
            flipPadding={this.popupPadding as number}
            flipBoundary={this.getScroller() ?? undefined}
            shift
            shiftPadding={this.popupPadding as number}
            shiftBoundary={this.getScroller() ?? undefined}
            arrow
            arrowPadding={14}
            onwa-reposition={this.handlePopupReposition}
            ref={el => (this.popupElement = el as any)}
          >
            {infoPanel}
          </wa-popup>
        )}
      </Host>
    );
  }
}
