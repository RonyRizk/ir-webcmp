import { Component, Event, EventEmitter, Host, Listen, Prop, State, Watch, h } from '@stencil/core';
import { UnassignedUnitsService } from '@/services/unassigned-units';
import { CalendarAssignedEvent, CalendarEventContext, CalendarUnitPreviewEvent, UnassignedRoomEntry } from '@/services/unassigned-units/types';
import { clampToLoadedRange, guestName, toCalendarAssignedEvent, toCalendarPreviewEvents } from '@/services/unassigned-units/utils';
import locales from '@/stores/locales.store';
import { CalendarSidebarState } from '@/components/igloo-calendar/igloo-calendar';
import { canCheckIn } from '@/utils/utils';
import { Booking, Occupancy } from '@/models/booking.dto';

type PendingAction = 'assign' | 'checkin';

function formatOccupancy({ adult_nbr, children_nbr, infant_nbr }: Occupancy): string {
  const parts: [number, string][] = [
    [adult_nbr, 'A'],
    [children_nbr, 'C'],
    [infant_nbr, 'I'],
  ];
  return parts
    .filter(([count]) => count > 0)
    .map(([count, label]) => `${count}${label}`)
    .join('-');
}

@Component({
  tag: 'igl-tba-booking-view',
  styleUrl: 'igl-tba-booking-view.css',
  scoped: true,
})
export class IglTbaBookingView {
  @Prop() calendarData: { [key: string]: any };
  @Prop() room: UnassignedRoomEntry;
  @Prop() roomTypeId: number;
  @Prop() roomTypeName: string;
  @Prop() selectedDate: string;
  @Prop() categoryIndex: number;
  @Prop() eventIndex: number;

  @State() isHighlighted = false;
  @State() selectedUnitId: number | null = null;
  @State() pendingAction: PendingAction | null = null;

  @Event({ bubbles: true, composed: true }) highlightToBeAssignedBookingEvent: EventEmitter<{ key: 'highlightBookingId'; data: { bookingId: string; fromDate?: string } }>;
  @Event({ bubbles: true, composed: true }) openCalendarSidebar: EventEmitter<CalendarSidebarState>;
  @Event({ bubbles: true, composed: true }) addToBeAssignedEvent: EventEmitter<{ key: 'tobeAssignedEvents'; data: (CalendarUnitPreviewEvent | CalendarAssignedEvent)[] }>;
  @Event({ bubbles: true, composed: true }) scrollPageToRoom: EventEmitter<{ key: 'scrollPageToRoom'; id: number | null; refClass: string }>;
  @Event() assignRoomEvent: EventEmitter<CalendarAssignedEvent>;

  private readonly unassignedUnitsService = new UnassignedUnitsService();

  componentDidLoad() {
    // The first card opens highlighted so its unit previews are on the calendar as soon as the panel appears.
    if (this.categoryIndex === 0 && this.eventIndex === 0) {
      setTimeout(() => this.highlight(), 100);
    }
  }

  @Watch('selectedDate')
  handleSelectedDateChange() {
    this.isHighlighted = false;
    this.selectedUnitId = null;
  }

  /** Keep the picked unit only while this card still shows the same room, and while that room still offers the unit. */
  @Watch('room')
  handleRoomChange(next: UnassignedRoomEntry, prev: UnassignedRoomEntry | undefined) {
    if (next.room_identifier !== prev?.room_identifier) {
      this.selectedUnitId = null;
      return;
    }
    if (this.selectedUnitId !== null && !(next.assignable_units ?? []).some(unit => unit.pr_id === this.selectedUnitId)) {
      this.selectedUnitId = null;
    }
  }

  @Listen('highlightToBeAssignedBookingEvent', { target: 'window' })
  handleHighlightChange(event: CustomEvent<{ data: { bookingId: string } }>) {
    const isThisCard = event.detail.data.bookingId === this.room.room_identifier;
    if (!isThisCard) {
      this.selectedUnitId = null;
    }
    this.isHighlighted = isThisCard;
  }

  private get eventContext(): CalendarEventContext {
    return {
      roomsInfo: this.calendarData.roomsInfo,
      legendData: this.calendarData.formattedLegendData,
      roomTypeId: this.roomTypeId,
      roomTypeName: this.roomTypeName,
    };
  }

  private highlight = () => {
    this.highlightToBeAssignedBookingEvent.emit({
      key: 'highlightBookingId',
      // Scroll to the first drawn night, which may be later than the stay's start if that is before the loaded range.
      data: { bookingId: this.room.room_identifier, fromDate: clampToLoadedRange(this.room.from_date, this.room.to_date).from },
    });
    if (!this.selectedDate) {
      return;
    }
    this.addToBeAssignedEvent.emit({ key: 'tobeAssignedEvents', data: toCalendarPreviewEvents(this.room, this.eventContext) });
    this.scrollPageToRoom.emit({ key: 'scrollPageToRoom', id: this.roomTypeId, refClass: `category_${this.roomTypeId}` });
  };

  private handleClose = (event: MouseEvent) => {
    event.stopPropagation();
    this.selectedUnitId = null;
    this.highlightToBeAssignedBookingEvent.emit({ key: 'highlightBookingId', data: { bookingId: '----' } });
    this.addToBeAssignedEvent.emit({ key: 'tobeAssignedEvents', data: [] });
  };

  private handleUnitChange = (event: Event) => {
    event.stopPropagation();
    const value = (event.target as HTMLSelectElement).value;
    this.selectedUnitId = value ? Number(value) : null;
  };

  private handleAssign = (event: MouseEvent) => this.assign(event, false);
  private handleAssignAndCheckIn = (event: MouseEvent) => this.assign(event, true);

  private async assign(event: MouseEvent, checkIn: boolean) {
    event.stopPropagation();
    if (this.selectedUnitId === null || this.pendingAction) {
      return;
    }
    this.pendingAction = checkIn ? 'checkin' : 'assign';
    try {
      const booking = await this.unassignedUnitsService.assignUnit({
        booking_nbr: this.room.booking_nbr,
        identifier: this.room.room_identifier,
        pr_id: this.selectedUnitId,
        check_in: checkIn,
      });
      if (checkIn) {
        this.openRoomGuests(booking);
      }
      const assigned = toCalendarAssignedEvent(this.room, this.selectedUnitId, this.eventContext);
      this.addToBeAssignedEvent.emit({ key: 'tobeAssignedEvents', data: [assigned] });
      this.assignRoomEvent.emit(assigned);
    } catch (error) {
      console.error('Assigning unit failed:', error);
    } finally {
      this.pendingAction = null;
    }
  }

  private openRoomGuests(booking: Booking) {
    const bookedRoom = booking.rooms.find(r => r.identifier === this.room.room_identifier);
    if (!bookedRoom) {
      return;
    }
    const { adult_nbr, children_nbr, infant_nbr } = bookedRoom.occupancy;
    this.openCalendarSidebar.emit({
      type: 'room-guests',
      payload: {
        identifier: this.room.room_identifier,
        bookingNumber: this.room.booking_nbr,
        checkin: false,
        roomName: typeof bookedRoom.unit === 'object' && bookedRoom.unit ? bookedRoom.unit.name : '',
        sharing_persons: bookedRoom.sharing_persons,
        totalGuests: adult_nbr + children_nbr + infant_nbr,
      },
    });
  }

  render() {
    const { booking_nbr, occupancy, from_date, to_date } = this.room;
    const occupancyLabel = occupancy ? formatOccupancy(occupancy) : '';
    const canCheckInNow = canCheckIn({ from_date: from_date, to_date: to_date });
    const selectedValue = this.selectedUnitId === null ? '' : String(this.selectedUnitId);
    const actionsDisabled = this.selectedUnitId === null || this.pendingAction !== null;

    return (
      <Host>
        <wa-card appearance="filled" class={this.isHighlighted ? 'tba --active' : 'tba'} onClick={this.highlight}>
          <div slot="header" class="tba__header" title={locales.entries.Lcz_AssignUnit}>
            <p class="tba__booking-number">{booking_nbr}</p>
            <span class="tba__separator">-</span>
            <p class="tba__guest-name">{guestName(this.room)}</p>
            {occupancyLabel && (
              <p class="tba__occupancy">
                <span class="tba__occupancy-paren">( </span>
                <span class="tba__occupancy-values">{occupancyLabel}</span>
                <span class="tba__occupancy-paren"> )</span>
              </p>
            )}
          </div>

          <div class="tba__actions">
            <wa-select class="tba__select" size="s" value={selectedValue} defaultValue={selectedValue} onchange={this.handleUnitChange}>
              <wa-option value="">{locales.entries.Lcz_AssignUnit}</wa-option>
              {(this.room.assignable_units ?? []).map(unit => (
                <wa-option key={unit.pr_id} value={String(unit.pr_id)}>
                  {unit.name}
                </wa-option>
              ))}
            </wa-select>
            {this.isHighlighted && (
              <div class="tba__close">
                <wa-button type="button" appearance="plain" size="s" class="tba__close-btn" onClick={this.handleClose}>
                  <wa-icon name="xmark"></wa-icon>
                </wa-button>
              </div>
            )}
          </div>

          <div class="tba__assign">
            <wa-button
              class="tba__assign-btn"
              size="s"
              variant="brand"
              appearance={canCheckInNow ? 'outlined' : 'accent'}
              loading={this.pendingAction === 'assign'}
              disabled={actionsDisabled}
              onClick={this.handleAssign}
            >
              {locales.entries.Lcz_Assign}
            </wa-button>
            {canCheckInNow && (
              <wa-button
                class="tba__assign-btn"
                size="s"
                variant="brand"
                loading={this.pendingAction === 'checkin'}
                disabled={actionsDisabled}
                onClick={this.handleAssignAndCheckIn}
              >
                {locales.entries.Lcz_AssignedAndChecIn}
              </wa-button>
            )}
          </div>
        </wa-card>
      </Host>
    );
  }
}
