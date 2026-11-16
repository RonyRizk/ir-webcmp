import { Component, Host, h, Prop, Event, EventEmitter, State, Element, Fragment, Watch, Listen } from '@stencil/core';
import { canCheckIn, findCountry, formatAmount } from '@/utils/utils';
import { ICountry } from '@/models/IBooking';
import { EventsService } from '@/services/events.service';
import moment from 'moment';
import { todayISO } from '@/utils/calendar-dates';
import locales from '@/stores/locales.store';
import calendar_data from '@/stores/calendar-data';
import { CalendarModalEvent } from '@/models/property-types';
import { compareTime, createDateWithOffsetAndHour } from '@/utils/booking';
import { BookingColor, IOtaNotes, Room } from '@/models/booking.dto';
import { PropertyService } from '@/services/property.service';
import { CalendarSidebarState } from '../igloo-calendar';
import { HbPreference } from '@/types/enums';
import { isRtlDirection } from '@/utils/calendar-grid';
import { formatBookingNumber } from '@/utils/number';
import { t } from '@/services/locale/t';
//import { transformNewBLockedRooms } from '../../../utils/booking';

@Component({
  tag: 'igl-booking-event-hover',
  styleUrl: 'igl-booking-event-hover.css',
  scoped: true,
})
export class IglBookingEventHover {
  @Element() element: HTMLIglBookingEventHoverElement;

  @Prop({ mutable: true }) bookingEvent: { [key: string]: any };
  @Prop() countries: ICountry[];
  @Prop() is_vacation_rental: boolean = false;
  /** The panel sits in a dialog, which frames it and sets its width, rather than floating over the calendar. */
  @Prop() inDialog: boolean = false;

  @State() isLoading: string;
  @State() shouldHideUnassignUnit = false;
  @State() canCheckInOrCheckout: boolean;
  @State() bookingColor: BookingColor | null = null;

  @Event() showBookingPopup: EventEmitter;
  @Event({ bubbles: true, composed: true }) hideBubbleInfo: EventEmitter;
  @Event({ bubbles: true, composed: true }) deleteButton: EventEmitter<string>;
  @Event() bookingCreated: EventEmitter<{ pool?: string; data: any[] }>;
  @Event() showDialog: EventEmitter<CalendarModalEvent>;
  @Event() openCalendarSidebar: EventEmitter<CalendarSidebarState>;

  private eventService = new EventsService();
  private hideButtons = false;
  private propertyService = new PropertyService();
  private baseColor: string;

  componentWillLoad() {
    let selectedRt = this.bookingEvent.roomsInfo.find(r => r.id === this.bookingEvent.RATE_TYPE);
    if (selectedRt) {
      this.shouldHideUnassignUnit = selectedRt.physicalrooms.length === 1;
    }
    // TO_DATE's midnight is already behind "now" once the departure day arrives.
    if (this.bookingEvent.TO_DATE <= todayISO()) {
      this.hideButtons = true;
    }
    this.baseColor = this.getEventLegend().color;
    this.bookingColor = this.bookingEvent.ROOM_INFO?.calendar_extra ? this.bookingEvent.ROOM_INFO?.calendar_extra?.booking_color : null;
    this.canCheckInOrCheckout = this.isStayingToday();
  }

  /** Today falls on one of the booked nights (`FROM_DATE` ≤ today < `TO_DATE`). */
  private isStayingToday() {
    const today = todayISO();
    return today >= this.bookingEvent.FROM_DATE && today < this.bookingEvent.TO_DATE;
  }

  @Watch('bookingEvent')
  handleBookingEventChange(newValue, oldValue) {
    if (newValue !== oldValue) this.canCheckInOrCheckout = this.isStayingToday();
  }

  @Listen('keydown', { target: 'body' })
  handleListenKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.stopPropagation();
      this.hideBubble();
    } else return;
  }

  private getEventLegend() {
    let status = this.bookingEvent?.legendData.statusId[this.bookingEvent.STATUS];
    return {
      ...this.bookingEvent?.legendData[status.id],
      ...status,
    };
  }

  private getBookingId() {
    return this.bookingEvent.ID;
  }

  private hideBubble() {
    this.hideBubbleInfo.emit({
      key: 'hidebubble',
      currentInfoBubbleId: this.getBookingId(),
    });
  }

  private getTotalOccupants() {
    const { CHILDREN_COUNT, ADULTS_COUNT } = this.bookingEvent;
    if (CHILDREN_COUNT === 0) {
      return `${ADULTS_COUNT} ${ADULTS_COUNT > 1 ? t('Lcz_Adults', { fallback: 'adults' }) : t('Lcz_Single_Adult')?.toLowerCase()}`;
    }
    return `${ADULTS_COUNT} ${ADULTS_COUNT > 1 ? t('Lcz_Adults', { fallback: 'adults' }) : t('Lcz_Single_Adult')?.toLowerCase()}, ${CHILDREN_COUNT} ${
      CHILDREN_COUNT > 1 ? t('Lcz_ChildCaption', { fallback: 'Child.' }).toLowerCase() : t('Lcz_Child', { fallback: 'Child' })?.toLowerCase()
    }`;
  }

  private getPhoneNumber() {
    return this.bookingEvent.PHONE;
  }

  private getCountry() {
    return findCountry(this.bookingEvent.COUNTRY, this.countries).name;
  }

  private getPhoneCode() {
    if (this.bookingEvent.PHONE_PREFIX) {
      return this.bookingEvent.PHONE_PREFIX;
    }
    return findCountry(this.bookingEvent.COUNTRY, this.countries).phone_prefix;
  }

  private renderPhone() {
    return this.bookingEvent.COUNTRY ? `${this.bookingEvent.is_direct ? this.getPhoneCode() + '-' : ''}${this.getPhoneNumber()} - ${this.getCountry()}` : this.getPhoneNumber();
  }

  private getInternalNote() {
    return this.bookingEvent.INTERNAL_NOTE;
  }

  private getTotalPrice() {
    return this.bookingEvent.TOTAL_PRICE;
  }

  private getArrivalTime() {
    return this.bookingEvent.ARRIVAL_TIME;
  }
  private get room(): Room {
    const currentRoom = this.bookingEvent?.booking?.rooms?.find(room => room.assigned_units_pool === this.bookingEvent.ID);
    if (!currentRoom) {
      console.warn(`Couldn't find room with pool ${this.bookingEvent.ID}`);
      return null;
    }
    return currentRoom;
  }
  private getRatePlan() {
    if (!this.bookingEvent) {
      return;
    }
    const currentRoom = this.room;
    let str = '';
    str += currentRoom.rateplan['short_name'];
    if (currentRoom.rateplan['is_non_refundable']) {
      str += ` - ${t('Lcz_NonRefundable', { fallback: 'Non-refundable' })}`;
    }
    return str;
  }

  private getEntryDate() {
    return this.bookingEvent.ENTRY_DATE;
  }

  private isNewBooking() {
    return this.getBookingId() === 'NEW_TEMP_EVENT';
  }

  private isCheckedIn() {
    return this.bookingEvent.STATUS === 'IN-HOUSE';
  }

  private isBlockedDateEvent() {
    return this.bookingEvent.STATUS === 'BLOCKED' || this.bookingEvent.STATUS === 'BLOCKED-WITH-DATES';
  }

  private hasSplitBooking() {
    return this.bookingEvent.hasOwnProperty('splitBookingEvents') && this.bookingEvent.splitBookingEvents;
  }

  private canCheckIn() {
    return canCheckIn({
      from_date: this.bookingEvent.FROM_DATE,
      to_date: this.bookingEvent.TO_DATE,
      isCheckedIn: this.isCheckedIn(),
    });
  }

  private canCheckOut() {
    if (!calendar_data.checkin_enabled || calendar_data.is_automatic_check_in_out) {
      return false;
    }
    if (this.isCheckedIn()) {
      return true;
    }
    const now = moment();
    if (
      this.bookingEvent.ROOM_INFO?.in_out?.code === '000' &&
      todayISO() >= this.bookingEvent.TO_DATE &&
      compareTime(now.toDate(), createDateWithOffsetAndHour(calendar_data.checkin_checkout_hours?.offset, calendar_data.checkin_checkout_hours?.hour))
    ) {
      return true;
    }
    return false;
  }

  private handleBlockDateUpdate(event: CustomEvent<{ [key: string]: any }>) {
    event.stopImmediatePropagation();
    event.stopPropagation();
    const opt: { [key: string]: any } = event.detail;
    this.bookingEvent = { ...this.bookingEvent, ...opt.data };
  }

  private handleEditBooking() {
    this.bookingEvent.TITLE = t('Lcz_EditBookingFor');
    this.handleBookingOption('EDIT_BOOKING');
  }

  private handleAddRoom() {
    const { FROM_DATE, TO_DATE } = this.bookingEvent;
    let eventData = {
      ID: '',
      NAME: '',
      BOOKING_NUMBER: this.bookingEvent.BOOKING_NUMBER,
      FROM_DATE,
      TO_DATE,
      roomsInfo: this.bookingEvent.roomsInfo,
      ARRIVAL: this.bookingEvent.ARRIVAL,
      ADD_ROOM_TO_BOOKING: this.bookingEvent.ID,
      TITLE: t('Lcz_AddRoomToBookingHash', { fallback: 'Add Room to #' }) + this.bookingEvent.BOOKING_NUMBER,
      event_type: 'ADD_ROOM',
      ROOMS: this.bookingEvent.ROOMS,
      GUEST: this.bookingEvent.GUEST,
      message: this.bookingEvent.NOTES,
      SOURCE: this.bookingEvent.SOURCE,
      booking: this.bookingEvent?.base_booking,
      defaultDateRange: {
        fromDate: FROM_DATE,
        toDate: TO_DATE,
        dateDifference: 0,
        editabled: true,
        message: t('Lcz_IncludingCityTaxExcludingVatMock', { fallback: 'Including 5.00% City Tax - Excluding 11.00% VAT' }),
      },
    };

    this.handleBookingOption('ADD_ROOM', eventData);
  }

  private handleCustomerCheckIn() {
    const room = this.bookingEvent.booking.rooms.find(r => r.identifier === this.bookingEvent.IDENTIFIER);
    const { adult_nbr, children_nbr, infant_nbr } = this.bookingEvent.ROOM_INFO.occupancy;
    const unitName = room ? room.unit.name : (this.bookingEvent.ROOM_INFO.unit?.name ?? '');
    this.showDialog.emit({
      reason: 'checkin',
      bookingNumber: this.bookingEvent.BOOKING_NUMBER,
      roomIdentifier: this.bookingEvent.IDENTIFIER,
      roomName: unitName,
      roomUnit: '',
      sidebarPayload: {
        identifier: this.bookingEvent.IDENTIFIER,
        bookingNumber: this.bookingEvent.BOOKING_NUMBER,
        checkin: false,
        roomName: unitName,
        sharing_persons: this.bookingEvent.ROOM_INFO.sharing_persons,
        totalGuests: adult_nbr + children_nbr + infant_nbr,
      },
    });
  }

  private handleCustomerCheckOut() {
    this.showDialog.emit({
      reason: 'checkout',
      booking: this.bookingEvent.base_booking,
      bookingNumber: this.bookingEvent.BOOKING_NUMBER,
      roomIdentifier: this.bookingEvent.IDENTIFIER,
      roomName: '',
      roomUnit: '',
    });
  }

  private handleDeleteEvent() {
    this.hideBubble();
    this.deleteButton.emit(this.bookingEvent.POOL);
  }

  private async handleUpdateBlockedDates() {
    try {
      this.isLoading = 'update';
      setTimeout(() => {
        this.hideBubble();
      }, 50);
      await this.eventService.updateBlockedEvent(this.bookingEvent);
      this.isLoading = '';
    } catch (error) {
      //   toastr.error(error);
    }
  }

  private handleConvertBlockedDateToBooking() {
    this.handleBookingOption('BAR_BOOKING');
  }

  private getRoomInfo() {
    const roomIdToFind = +this.bookingEvent.PR_ID;
    let selectedRoom: any = {};

    for (const room of this.bookingEvent.roomsInfo) {
      for (const physicalRoom of room.physicalrooms) {
        if (roomIdToFind === physicalRoom.id) {
          selectedRoom.CATEGORY = room.name;
          selectedRoom.ROOM_NAME = physicalRoom.name;
          selectedRoom.ROOMS_INFO = room;
          return selectedRoom;
        }
      }
    }

    return selectedRoom;
  }

  private renderTitle(eventType, roomInfo) {
    switch (eventType) {
      case 'EDIT_BOOKING':
        return `${t('Lcz_EditBookingFor')} ${roomInfo.CATEGORY} ${roomInfo.ROOM_NAME}`;
      case 'ADD_ROOM':
        return `${t('Lcz_AddingUnitToBooking')}# ${formatBookingNumber(this.bookingEvent.BOOKING_NUMBER)}`;
      case 'SPLIT_BOOKING':
        return t('Lcz_Adding') + ` ${roomInfo.CATEGORY} ${roomInfo.ROOM_NAME}`;
      default:
        return `${t('Lcz_NewBookingFor')} ${roomInfo.CATEGORY} ${roomInfo.ROOM_NAME}`;
    }
  }

  private handleBookingOption(eventType, roomData = null) {
    const roomInfo = this.getRoomInfo();
    let data = roomData ? roomData : this.bookingEvent;
    data.event_type = eventType;
    data.TITLE = this.renderTitle(eventType, roomInfo);
    data.IDENTIFIER = this.bookingEvent.IDENTIFIER;

    if (['003', '002', '004'].includes(this.bookingEvent.STATUS_CODE)) {
      data.roomsInfo = [roomInfo.ROOMS_INFO];
    }
    if (eventType === 'BAR_BOOKING' && this.bookingEvent.STATUS !== 'TEMP-EVENT') {
      const { FROM_DATE, TO_DATE, PR_ID, RELEASE_AFTER_HOURS, ENTRY_DATE, OPTIONAL_REASON, ENTRY_MINUTE, ENTRY_HOUR, STATUS_CODE } = this.bookingEvent;
      data.block_exposed_unit_props = {
        from_date: FROM_DATE,
        to_date: TO_DATE,
        NOTES: OPTIONAL_REASON,
        pr_id: PR_ID,
        STAY_STATUS_CODE: STATUS_CODE,
        DESCRIPTION: RELEASE_AFTER_HOURS,
        BLOCKED_TILL_DATE: ENTRY_DATE,
        BLOCKED_TILL_HOUR: ENTRY_HOUR,
        BLOCKED_TILL_MINUTE: ENTRY_MINUTE,
      };
      this.handleDeleteEvent();
    }
    this.showBookingPopup.emit({
      key: 'add',
      data: {
        ...data,
        //roomsInfo: [roomInfo.ROOMS_INFO],
      },
    });
    this.hideBubbleInfo.emit({
      key: 'hidebubble',
      currentInfoBubbleId: this.getBookingId(),
    });
  }

  private getOTANotes(maxVisible: number = 3) {
    if (!this.bookingEvent.ota_notes || this.bookingEvent.ota_notes?.length === 0) {
      return null;
    }
    const channel_notes: IOtaNotes[] = [...this.bookingEvent.ota_notes];
    const separator = '<br>- ';
    if (channel_notes.length > maxVisible) {
      channel_notes[maxVisible - 1] = { statement: `${channel_notes[maxVisible - 1].statement} <span>${t('Lcz_More', { fallback: 'more...' })}</span>` };
    }
    return channel_notes
      .slice(0, maxVisible)
      .map(o => `${separator}${o.statement}`)
      .join('');
  }
  /**
   * Determines whether the current booking is eligible to be split.
   *
   * Rules enforced:
   *  1) Minimum stay — there must be at least 2 nights between `from_date` (check-in) and `to_date` (check-out).
   *     (Checkout is treated as exclusive; nights = `to_date - from_date` in whole days.)
   *  2) Proximity to checkout — disallow splitting when checkout is tomorrow or earlier
   *     (i.e., `to_date - today < 1 day` when all are normalized to start of day).
   *
   * @returns {boolean} `true` if the booking can be split under the rules above; otherwise `false`.
   *
   * @example
   * // Given defaultDates: { from_date: '2025-10-10', to_date: '2025-10-13' }
   * // nights = 3, and if checkout is more than a day away, returns true.
   * const canSplit = this.canSplitBooking(); // -> true
   */
  private canSplitBooking(): boolean {
    const fromStr = this.bookingEvent?.defaultDates?.from_date;
    const toStr = this.bookingEvent?.defaultDates?.to_date;

    const MFromDate = moment(fromStr, 'YYYY-MM-DD', true).startOf('day');
    const MToDate = moment(toStr, 'YYYY-MM-DD', true).startOf('day');

    if (!MFromDate.isValid() || !MToDate.isValid()) return false;

    // Nights between (checkout is exclusive)
    const nights = MToDate.diff(MFromDate, 'days');

    // Must be at least 2 nights to make a meaningful split
    if (nights < 2) return false;

    // Don’t allow split if checkout is  tomorrow (< 1 day away)
    const today = moment().startOf('day');
    if (MToDate.diff(today, 'days') < 1) return false;

    return true;
  }
  /** In a dialog the actions are tapped with a finger, not clicked in a small floating panel. */
  private get actionSize(): 'm' | 'xs' {
    return this.inDialog ? 'm' : 'xs';
  }
  private get isHalfBoard() {
    return this.room?.rateplan?.meal_plan?.code === '003' && calendar_data.property.is_frontdesk_enabled;
  }
  private renderColorPicker() {
    if (this.bookingEvent?.STATUS === 'PENDING-CONFIRMATION') {
      return null;
    }
    return (
      <wa-dropdown
        class="event-hover__color-dropdown"
        onwa-show={e => {
          e.stopImmediatePropagation();
          e.stopPropagation();
        }}
        onwa-hide={e => {
          e.stopImmediatePropagation();
          e.stopPropagation();
        }}
        onwa-select={async e => {
          const value = (e.detail as any).item.value as string;
          const newBookingColor = value === 'none' ? null : calendar_data.property.calendar_extra?.booking_colors.find(c => c.color === value);
          await this.propertyService.setRoomCalendarExtra({
            property_id: calendar_data.property.id,
            room_identifier: this.bookingEvent.IDENTIFIER,
            value: JSON.stringify({
              booking_color: newBookingColor,
            }),
          });
          this.bookingColor = newBookingColor;
        }}
      >
        <button type="button" class="event-hover__color-trigger" slot="trigger" aria-label={t('Lcz_BookingColor', { fallback: 'Booking color' })}>
          {this.bookingColor ? (
            <span class="event-hover__swatch" style={{ background: this.bookingColor?.color }}></span>
          ) : (
            <wa-icon class="event-hover__swatch --none" style={{ fontSize: '0.75rem', background: this.baseColor }} name="ban"></wa-icon>
          )}
        </button>
        <wa-dropdown-item value="none">
          <wa-icon style={{ fontSize: '0.875rem' }} name="ban"></wa-icon>
        </wa-dropdown-item>
        {calendar_data.property.calendar_extra?.booking_colors.map(s => (
          <wa-dropdown-item value={s.color}>
            <span class="event-hover__swatch" style={{ background: s.color }}></span>
          </wa-dropdown-item>
        ))}
      </wa-dropdown>
    );
  }

  private getInfoElement() {
    return (
      <div class={{ iglPopOver: true, infoBubble: true, inDialog: this.inDialog }}>
        <div class="event-hover__header">
          <div class="event-hover__identity">
            <img src={this.bookingEvent?.origin?.Icon} alt={this.bookingEvent?.origin?.Label} class="event-hover__channel-icon" />
            <span class="event-hover__booking-no">
              {!this.bookingEvent.is_direct ? this.bookingEvent.channel_booking_nbr : formatBookingNumber(this.bookingEvent.BOOKING_NUMBER)}
            </span>
          </div>
          <div class="event-hover__price">
            {this.renderColorPicker()}
            <span>{formatAmount(calendar_data.currency.symbol, this.getTotalPrice())}</span>
          </div>
        </div>
        <div class="event-hover__origin-row">
          <span class="event-hover__origin-label">
            {this.bookingEvent.booking?.agent ? (
              <span>
                {t('Lcz_Agent', { fallback: 'Agent' })}
                {': '}
                <span class="event-hover__agent">
                  {this.bookingEvent?.booking?.agent?.name} {this.bookingEvent?.booking?.agent?.reference}
                </span>
              </span>
            ) : (
              this.bookingEvent.origin.Label
            )}
          </span>
          {this.bookingEvent.BALANCE > 1 && (
            <span class="event-hover__balance">
              {t('Lcz_Balance')}: {formatAmount(calendar_data.currency.symbol, this.bookingEvent.BALANCE)}
            </span>
          )}
        </div>
        <ir-date-view
          class="event-hover__dates"
          format={'weekday-medium'}
          from_date={this.bookingEvent.defaultDates.from_date}
          to_date={this.bookingEvent.defaultDates.to_date}
          showDateDifference={false}
        ></ir-date-view>
        <div class="event-hover__details">
          {this.bookingEvent.NAME && (
            <ir-label class="label--capitalize" labelText={`${t('Lcz_GuestName', { fallback: 'Guest name' })}:`} content={this.bookingEvent.NAME}></ir-label>
          )}
          {this.getArrivalTime() && <ir-label labelText={`${t('Lcz_ArrivalTime', { fallback: 'Arrival time' })}:`} content={this.getArrivalTime()}></ir-label>}
          {this.getTotalOccupants() && <ir-label labelText={`${t('Lcz_Occupancy')}:`} content={this.getTotalOccupants()}></ir-label>}
          {this.getPhoneNumber() && <ir-label labelText={`${t('Lcz_Phone', { fallback: 'Phone' })}:`} content={this.renderPhone()}></ir-label>}
          {this.getRatePlan() && (
            <ir-label labelText={`${t('Lcz_RatePlan', { fallback: 'Rate plan' })}:`} content={this.getRatePlan()}>
              {this.isHalfBoard && (
                <wa-badge appearance="filled" variant={this.room?.hb_preference ? 'brand' : 'warning'}>
                  {this.room?.hb_preference === HbPreference.Lunch
                    ? t('Lcz_WithLunch', { fallback: 'With lunch' })
                    : this.room?.hb_preference === HbPreference.Dinner
                      ? t('Lcz_WithDinner', { fallback: 'With dinner' })
                      : t('Lcz_ChooseLunchOrDinner', { fallback: 'Choose lunch or dinner' })}
                </wa-badge>
              )}
            </ir-label>
          )}
          {this.bookingEvent.DEPARTURE_TIME?.code !== '000' && (
            <ir-label labelText={`${t('Lcz_DepartureTime', { fallback: 'Departure time:' })}`} content={this.bookingEvent.DEPARTURE_TIME?.description}></ir-label>
          )}
          {this.bookingEvent.PRIVATE_NOTE && <ir-label labelText={`${t('Lcz_BookingPrivateNote')}:`} display="inline" content={this.bookingEvent.PRIVATE_NOTE}></ir-label>}
          {this.bookingEvent.is_direct && <ir-label labelText={`${t('Lcz_GuestRemark')}:`} display="inline" content={this.bookingEvent.NOTES}></ir-label>}
          <ir-label labelText={`${t('Lcz_ChannelNotes')}:`} display="inline" content={this.getOTANotes()} renderContentAsHtml></ir-label>
          {this.getInternalNote() && <ir-label labelText={`${t('Lcz_InternalRemark')}:`} content={this.getInternalNote()}></ir-label>}
        </div>
        <div class="event-hover__actions" style={{ paddingTop: '1.5rem' }} role="group">
          <ir-custom-button size={this.actionSize} variant="brand" onClickHandler={() => this.handleEditBooking()}>
            {t('Lcz_Edit', { fallback: 'Edit' })}
          </ir-custom-button>
          <ir-custom-button size={this.actionSize} variant="brand" appearance="outlined" onClickHandler={() => this.handleReallocationBooking()}>
            {t('Lcz_Reassign', { fallback: 'Reassign' })}
          </ir-custom-button>
          {this.bookingEvent.is_direct && this.bookingEvent.IS_EDITABLE && !this.hideButtons && (
            <ir-custom-button size={this.actionSize} variant="brand" appearance="outlined" onClickHandler={() => this.handleAddRoom()}>
              {t('Lcz_AddUnit', { fallback: 'Add unit' })}
            </ir-custom-button>
          )}
          {this.canSplitBooking() && (
            <ir-custom-button size={this.actionSize} variant="brand" appearance="outlined" onClickHandler={() => this.handleSplitBooking()}>
              {t('Lcz_Split', { fallback: 'Split' })}
            </ir-custom-button>
          )}
          {this.canCheckIn() && (
            <ir-custom-button size={this.actionSize} onClickHandler={() => this.handleCustomerCheckIn()} variant="brand" appearance="outlined">
              {t('Lcz_CheckIn', { fallback: 'Check in' })}
            </ir-custom-button>
          )}
          {this.canCheckOut() && (
            <ir-custom-button size={this.actionSize} variant="brand" appearance="outlined" onClickHandler={() => this.handleCustomerCheckOut()}>
              {t('Lcz_CheckOut', { fallback: 'Check out' })}
            </ir-custom-button>
          )}
          {this.hideButtons
            ? null
            : !this.shouldHideUnassignUnit && (
                <ir-custom-button
                  class="event-hover__destructive"
                  size={this.actionSize}
                  variant="danger"
                  appearance="outlined"
                  onClickHandler={_ => {
                    this.handleDeleteEvent();
                  }}
                >
                  {t('Lcz_Unassign')}
                </ir-custom-button>
              )}
        </div>
      </div>
    );
  }
  private handleReallocationBooking(): void {
    this.hideBubble();
    this.openCalendarSidebar.emit({
      type: 'reallocate-drawer',
      payload: { booking: this.bookingEvent.base_booking, pool: this.bookingEvent.POOL, identifier: this.bookingEvent.IDENTIFIER },
    });
  }
  private handleSplitBooking(): void {
    this.hideBubble();
    this.openCalendarSidebar.emit({ type: 'split', payload: { booking: this.bookingEvent.base_booking, identifier: this.bookingEvent.IDENTIFIER } });
  }
  private getNewBookingOptions() {
    const shouldDisplayButtons = this.bookingEvent.roomsInfo[0].rateplans.some(rate => rate.is_active);
    return (
      <div class="iglPopOver newBookingOptions">
        <div class="event-hover__actions" role="group">
          {shouldDisplayButtons ? (
            <Fragment>
              <ir-custom-button
                size="xs"
                variant="brand"
                appearance="accent"
                data-testid="bar_booking_btn"
                onClickHandler={_ => {
                  this.handleBookingOption('BAR_BOOKING');
                }}
              >
                <wa-icon slot="start" name="calendar-plus"></wa-icon>
                {t('Lcz_CreateNewBooking')}
              </ir-custom-button>
              {this.hasSplitBooking() && (
                <ir-custom-button
                  size="xs"
                  variant="neutral"
                  appearance="accent"
                  onClickHandler={_ => {
                    this.handleBookingOption('SPLIT_BOOKING');
                  }}
                >
                  <wa-icon slot="start" name="link"></wa-icon>
                  {t('Lcz_AssignUnitToExistingBooking')}
                </ir-custom-button>
              )}
            </Fragment>
          ) : (
            <p class="event-hover__error">{t('Lcz_NoRatePlanDefined')}</p>
          )}
          <ir-custom-button
            size="xs"
            appearance="accent"
            variant="danger"
            onClickHandler={_ => {
              this.handleBookingOption('BLOCK_DATES');
            }}
          >
            <wa-icon slot="start" name="ban"></wa-icon>
            {t('Lcz_Blockdates', { fallback: 'Block dates' })}
          </ir-custom-button>
        </div>
      </div>
    );
  }

  private getBlockedView() {
    return (
      <div class={{ iglPopOver: true, blockedView: true, inDialog: this.inDialog }}>
        <igl-block-dates-view
          style={{ marginBottom: '1.5rem' }}
          isEventHover={true}
          entryHour={this.bookingEvent.ENTRY_HOUR}
          entryMinute={this.bookingEvent.ENTRY_MINUTE}
          defaultData={this.bookingEvent}
          fromDate={this.bookingEvent.defaultDates.from_date}
          toDate={this.bookingEvent.defaultDates.to_date}
          entryDate={this.getEntryDate()}
          onDataUpdateEvent={event => this.handleBlockDateUpdate(event)}
        ></igl-block-dates-view>
        <div class="event-hover__actions" role="group">
          <ir-custom-button
            size={this.actionSize}
            disabled={this.isLoading === 'update'}
            onClickHandler={_ => {
              this.handleUpdateBlockedDates();
            }}
            variant="brand"
            loading={this.isLoading === 'update'}
          >
            {t('Lcz_Update')}
          </ir-custom-button>
          <ir-custom-button
            size={this.actionSize}
            variant="brand"
            appearance="outlined"
            onClickHandler={() => {
              this.handleConvertBlockedDateToBooking();
            }}
          >
            {t('Lcz_ConvertSplitBooking')}
          </ir-custom-button>
          <ir-custom-button
            class="event-hover__destructive"
            variant="danger"
            size={this.actionSize}
            appearance="outlined"
            onClickHandler={_ => {
              this.handleDeleteEvent();
            }}
          >
            {t('Lcz_Delete', { fallback: 'Delete' })}
          </ir-custom-button>
        </div>
      </div>
    );
  }

  render() {
    return (
      <Host dir={isRtlDirection(locales.direction) ? 'rtl' : 'ltr'}>
        {this.isBlockedDateEvent() ? this.getBlockedView() : null}
        {this.isNewBooking() ? this.getNewBookingOptions() : null}
        {!this.isBlockedDateEvent() && !this.isNewBooking() ? this.getInfoElement() : null}
      </Host>
    );
  }
}
