import { Component, Host, Listen, Prop, State, h, Event, EventEmitter, Watch, Fragment } from '@stencil/core';

import moment from 'moment';

import { compareTime, createDateWithOffsetAndHour } from '@/utils/booking';

import calendar_dates from '@/stores/calendar-dates.store';
import locales from '@/stores/locales.store';
import calendar_data from '@/stores/calendar-data';

import { PhysicalRoom, RoomType } from '@/models/booking.dto';
import { ICountry } from '@/models/IBooking';

export type RoomCategory = RoomType & { expanded: boolean };

@Component({
  tag: 'igl-cal-body',
  styleUrl: 'igl-cal-body.css',
  scoped: true,
})
export class IglCalBody {
  @Prop() isScrollViewDragging: boolean;
  @Prop() propertyId: number;
  @Prop() calendarData: { [key: string]: any };
  @Prop() today: String;
  @Prop() currency;
  @Prop() language: string;
  @Prop() countries: ICountry[];
  @Prop() highlightedDate: string;

  @State() dragOverElement: string = '';
  @State() renderAgain: boolean = false;
  @State() selectedRoom: PhysicalRoom = null;
  @State() selectedRooms: { [key: string]: any } = {};

  @Event() addBookingDatasEvent: EventEmitter<any[]>;
  @Event() showBookingPopup: EventEmitter;
  @Event({ bubbles: true, composed: true }) scrollPageToRoom: EventEmitter;

  private fromRoomId: number = -1;
  private newEvent: { [key: string]: any };
  private currentDate = new Date();
  private bookingMap = new Map<string | number, string | number>();
  private interactiveTitle: HTMLIrInteractiveTitleElement[] = [];
  private dayRateMap = new Map<string, (typeof calendar_dates.days)[0]['rate']>();
  private roomsWithTodayCheckinStatus = new Set<number>();
  private categoriesWithTodayCheckinStatus = new Set<number>();
  // private disabledCellsCache = new Map<string, boolean>();

  componentWillLoad() {
    this.currentDate.setHours(0, 0, 0, 0);
    this.bookingMap = this.getBookingMap(this.getBookingData());
    this.updateTodayCheckinStatus();
    calendar_dates.days.forEach(day => {
      this.dayRateMap.set(day.day, day.rate);
    });
    this.updateDisabledCellsCache();
  }

  @Watch('calendarData')
  handleCalendarDataChange() {
    this.bookingMap = this.getBookingMap(this.getBookingData());
    this.updateTodayCheckinStatus();
    this.updateDisabledCellsCache();
  }

  @Watch('today')
  handleTodayChange() {
    this.updateTodayCheckinStatus();
  }

  @Listen('dragOverHighlightElement', { target: 'window' })
  dragOverHighlightElementHandler(event: CustomEvent) {
    this.dragOverElement = event.detail.dragOverElement;
  }

  @Listen('gotoRoomEvent', { target: 'window' })
  gotoRoom(event: CustomEvent) {
    let roomId = event.detail.roomId;
    let category = this.getRoomCategoryByRoomId(roomId);
    if (!category.expanded) {
      this.toggleCategory(category);
      setTimeout(() => {
        this.scrollToRoom(roomId);
      }, 10);
    } else {
      this.scrollToRoom(roomId);
    }
  }

  @Listen('addToBeAssignedEvent', { target: 'window' })
  addToBeAssignedEvents(event: CustomEvent) {
    // let roomId = event.detail.roomId;
    this.addBookingDatas(event.detail.data);
    this.renderElement();
  }

  @Listen('closeBookingWindow', { target: 'window' })
  closeWindow() {
    let ind = this.getBookingData().findIndex(ev => ev.ID === 'NEW_TEMP_EVENT');
    if (ind !== -1) {
      this.getBookingData().splice(ind, 1);
      console.log('removed item..');
      this.renderElement();
    }
  }

  private scrollToRoom(roomId: number) {
    this.scrollPageToRoom.emit({
      key: 'scrollPageToRoom',
      id: roomId,
      refClass: 'room_' + roomId,
    });
  }

  private getRoomCategoryByRoomId(roomId) {
    return this.calendarData.roomsInfo.find(roomCategory => {
      return this.getRoomtypeUnits(roomCategory).find(room => this.getRoomId(room) === roomId);
    });
  }

  private getCategoryName(roomCategory) {
    return roomCategory.name;
  }

  private getCategoryId(roomCategory) {
    return roomCategory.id;
  }

  private getTotalPhysicalRooms(roomCategory) {
    return this.getRoomtypeUnits(roomCategory).length;
  }

  private getRoomtypeUnits(roomCategory: RoomCategory) {
    return (roomCategory && roomCategory.physicalrooms) || [];
  }

  private getRoomName(roomInfo) {
    return roomInfo.name;
  }

  private getRoomId(roomInfo) {
    return roomInfo.id;
  }

  private getRoomById(physicalRooms, roomId) {
    return physicalRooms.find(physical_room => this.getRoomId(physical_room) === roomId);
  }

  private getBookingData() {
    return this.calendarData.bookingEvents ?? [];
  }

  private addBookingDatas(aData) {
    this.addBookingDatasEvent.emit(aData);
  }

  private getSelectedCellRefName(roomId, selectedDay) {
    return 'room_' + roomId + '_' + selectedDay.currentDate;
  }

  // getSplitBookingEvents(newEvent) {
  //   return this.getBookingData().some(bookingEvent => !['003', '002', '004'].includes(bookingEvent.STATUS_CODE) && newEvent.FROM_DATE === bookingEvent.FROM_DATE);
  // }
  private getSplitBookingEvents(newEvent) {
    console.log(newEvent.FROM_DATE);
    return this.getBookingData().some(bookingEvent => {
      if (!['003', '002', '004'].includes(bookingEvent.STATUS_CODE)) {
        if (
          new Date(newEvent.FROM_DATE).getTime() >= new Date(bookingEvent.FROM_DATE).getTime() &&
          new Date(newEvent.FROM_DATE).getTime() <= new Date(bookingEvent.TO_DATE).getTime()
        ) {
          return bookingEvent;
        }
      }
    });
  }

  private addNewEvent(roomCategory) {
    let keys = Object.keys(this.selectedRooms);
    let startDate: Date, endDate: Date;

    if (this.selectedRooms[keys[0]].currentDate < this.selectedRooms[keys[1]].currentDate) {
      startDate = new Date(this.selectedRooms[keys[0]].currentDate);
      endDate = new Date(this.selectedRooms[keys[1]].currentDate);
    } else {
      startDate = new Date(this.selectedRooms[keys[1]].currentDate);
      endDate = new Date(this.selectedRooms[keys[0]].currentDate);
    }

    const dateDifference = Math.round(Math.abs((endDate.getTime() - startDate.getTime()) / 86_400_000));
    this.newEvent = {
      ID: 'NEW_TEMP_EVENT',
      NAME: <span>&nbsp;</span>,
      EMAIL: '',
      PHONE: '',
      convertBooking: false,
      REFERENCE_TYPE: 'PHONE',
      FROM_DATE: startDate.getFullYear() + '-' + this.getTwoDigitNumStr(startDate.getMonth() + 1) + '-' + this.getTwoDigitNumStr(startDate.getDate()),
      TO_DATE: endDate.getFullYear() + '-' + this.getTwoDigitNumStr(endDate.getMonth() + 1) + '-' + this.getTwoDigitNumStr(endDate.getDate()),
      BALANCE: '',
      NOTES: '',
      RELEASE_AFTER_HOURS: 0,
      PR_ID: this.selectedRooms[keys[0]].roomId,
      ENTRY_DATE: '',
      NO_OF_DAYS: dateDifference,
      ADULTS_COUNT: 1,
      COUNTRY: '',
      INTERNAL_NOTE: '',
      RATE: '',
      TOTAL_PRICE: '',
      RATE_PLAN: '',
      ARRIVAL_TIME: '',
      TITLE: locales.entries.Lcz_NewBookingFor,
      roomsInfo: [roomCategory],
      CATEGORY: roomCategory.name,
      event_type: 'BAR_BOOKING',
      STATUS: 'TEMP-EVENT',
      defaultDateRange: {
        fromDate: null,
        fromDateStr: '',
        toDate: null,
        toDateStr: '',
        dateDifference,
        editable: false,
        message: 'Including 5.00% City Tax - Excluding 11.00% VAT',
      },
    };

    let popupTitle = roomCategory.name + ' ' + this.getRoomName(this.getRoomById(this.getRoomtypeUnits(roomCategory), this.selectedRooms[keys[0]].roomId));
    this.newEvent.BLOCK_DATES_TITLE = `${locales.entries.Lcz_BlockDatesFor} ${popupTitle}`;
    this.newEvent.TITLE += popupTitle;
    this.newEvent.defaultDateRange.toDate = new Date(this.newEvent.TO_DATE + 'T00:00:00');
    this.newEvent.defaultDateRange.fromDate = new Date(this.newEvent.FROM_DATE + 'T00:00:00');
    this.newEvent.defaultDateRange.fromDateStr = this.getDateStr(this.newEvent.defaultDateRange.fromDate);
    this.newEvent.defaultDateRange.toDateStr = this.getDateStr(this.newEvent.defaultDateRange.toDate);
    this.newEvent.ENTRY_DATE = new Date().toISOString();
    this.newEvent.legendData = this.calendarData.formattedLegendData;

    let splitBookingEvents = this.getSplitBookingEvents(this.newEvent);
    if (splitBookingEvents) {
      this.newEvent.splitBookingEvents = splitBookingEvents;
    }

    this.getBookingData().push(this.newEvent);
    return this.newEvent;
  }

  private getTwoDigitNumStr(num) {
    return num <= 9 ? '0' + num : num;
  }

  private getDateStr(date, locale = 'default') {
    return date.getDate() + ' ' + date.toLocaleString(locale, { month: 'short' }) + ' ' + date.getFullYear();
  }

  private removeNewEvent() {
    this.calendarData.bookingEvents = this.calendarData.bookingEvents.filter(events => events.ID !== 'NEW_TEMP_EVENT');
    this.newEvent = null;
  }

  private clickCell(roomId: number, selectedDay: any, roomCategory: RoomCategory) {
    if (!this.isScrollViewDragging && selectedDay.currentDate >= this.currentDate.getTime()) {
      let refKey = this.getSelectedCellRefName(roomId, selectedDay);
      if (this.selectedRooms.hasOwnProperty(refKey)) {
        this.removeNewEvent();
        delete this.selectedRooms[refKey];
        this.renderElement();
        return;
      } else if (Object.keys(this.selectedRooms).length != 1 || this.fromRoomId != roomId) {
        this.removeNewEvent();
        this.selectedRooms = {};
        this.selectedRooms[refKey] = { ...selectedDay, roomId };
        this.fromRoomId = roomId;
        this.renderElement();
      } else {
        // const keys = Object.keys(this.selectedRooms);
        // const startDate = moment(this.selectedRooms[keys[0]].value, 'YYYY-MM-DD');
        // const endDate = moment(selectedDay.value, 'YYYY-MM-DD');
        // let cursor = startDate.clone().add(1, 'days');
        // let disabledCount = 0;

        // while (cursor.isBefore(endDate, 'day')) {
        //   const dateKey = cursor.format('YYYY-MM-DD');
        //   if (this.isCellDisabled(roomId, dateKey)) {
        //     disabledCount++;
        //   }
        //   cursor.add(1, 'days');
        // }
        // if (disabledCount >= 1) {
        //   this.selectedRooms = {};
        //   this.fromRoomId = roomId;
        //   this.renderElement();
        //   return;
        // }

        this.selectedRooms[refKey] = { ...selectedDay, roomId };
        this.addNewEvent(roomCategory);
        this.selectedRooms = {};
        this.renderElement();
        this.showNewBookingPopup(this.newEvent);
      }
    }
  }
  private showNewBookingPopup(data) {
    console.log(data);
    // this.showBookingPopup.emit({key: "add", data});
  }

  private renderElement() {
    this.renderAgain = !this.renderAgain;
  }
  private getBookingMap(bookings: any[]): Map<string | number, string | number> {
    const bookingMap = new Map<string | number, string | number>();
    const today = moment().startOf('day');

    for (const booking of bookings) {
      const fromDate = moment(booking.FROM_DATE, 'YYYY-MM-DD').startOf('day');
      const toDate = moment(booking.TO_DATE, 'YYYY-MM-DD').startOf('day');

      // Check if today is between fromDate and toDate, inclusive.
      if (today.isSameOrAfter(fromDate) && today.isSameOrBefore(toDate)) {
        if (!bookingMap.has(booking.PR_ID)) {
          bookingMap.set(booking.PR_ID, booking.BOOKING_NUMBER);
        } else {
          if (compareTime(moment().toDate(), createDateWithOffsetAndHour(calendar_data.checkin_checkout_hours?.offset, calendar_data.checkin_checkout_hours?.hour))) {
            bookingMap.set(booking.PR_ID, booking.BOOKING_NUMBER);
          }
        }
      }
    }

    return bookingMap;
  }
  private getRoomtypeDayInventoryCells(addClass: string, isCategory: boolean = false, index: number) {
    return calendar_dates.days.map(dayInfo => {
      // const isActive = true;
      return (
        <div
          class={`cellData  font-weight-bold categoryPriceColumn ${addClass + '_' + dayInfo.day} ${
            dayInfo.day === this.today || dayInfo.day === this.highlightedDate ? 'currentDay' : ''
          }`}
        >
          {isCategory ? (
            <Fragment>
              <span class={'categoryName'}>
                {dayInfo.rate[index].exposed_inventory.rts}
                {/* <button class={'triangle-button'} style={{ '--in-toggle-color': isActive ? 'green' : '#ff4961' }}></button> */}
                {/* <br />
              {dayInfo.rate[index].exposed_inventory.offline} */}
              </span>
            </Fragment>
          ) : (
            ''
          )}
        </div>
      );
    });
  }

  private getGeneralUnitsDayCells(roomId: string, roomCategory: RoomCategory, roomName: string) {
    return this.calendarData.days.map(dayInfo => {
      const isCellDisabled = this.isCellDisabled(Number(roomId), dayInfo.value);
      const prevDate = moment(dayInfo.value, 'YYYY-MM-DD').add(-1, 'days').format('YYYY-MM-DD');
      const isDisabled = (isCellDisabled && Object.keys(this.selectedRooms).length === 0) || (isCellDisabled && this.isCellDisabled(Number(roomId), prevDate));
      const isSelected = this.selectedRooms.hasOwnProperty(this.getSelectedCellRefName(roomId, dayInfo));
      const isCurrentDate = dayInfo.day === this.today || dayInfo.day === this.highlightedDate;
      const cleaningDates = calendar_dates.cleaningTasks.has(+roomId) ? calendar_dates.cleaningTasks.get(+roomId) : null;
      const shouldBeCleaned = ['001', '003'].includes(calendar_data.cleaning_frequency?.code) ? false : cleaningDates?.has(dayInfo.value);
      return (
        <div
          class={`cellData position-relative roomCell ${isCellDisabled ? 'disabled' : ''} ${'room_' + roomId + '_' + dayInfo.day} ${isCurrentDate ? 'currentDay' : ''} ${
            this.dragOverElement === roomId + '_' + dayInfo.day ? 'dragOverHighlight' : ''
          } ${isSelected ? 'selectedDay' : ''}`}
          // style={!isDisabled && { '--cell-cursor': 'default' }}
          style={{ '--cell-cursor': 'default' }}
          onClick={() => {
            // if (isDisabled) {
            //   return;
            // }
            this.clickCell(Number(roomId), dayInfo, roomCategory);
          }}
          aria-label={roomName}
          role="gridcell"
          data-room-id={roomId}
          data-date={dayInfo.value}
          aria-current={isCurrentDate ? 'date' : undefined}
          data-room-name={roomName}
          data-dirty-room={String(shouldBeCleaned)}
          aria-disabled={String(isDisabled)}
          aria-selected={Boolean(isSelected)}
          // tabIndex={-1}
        >
          {/* <button class={'triangle-button'} style={{ '--in-toggle-color': isDisabled ? 'green' : '#ff4961' }}></button> */}
        </div>
      );
    });
  }

  private toggleCategory(roomCategory: RoomCategory) {
    roomCategory.expanded = !roomCategory.expanded;
    this.renderElement();
  }

  private getRoomtypeRow(roomType: RoomCategory, index: number) {
    if (this.getTotalPhysicalRooms(roomType) <= 1 || !roomType.is_active) {
      return null;
    }
    const hasRoomWithTodayCheckin = this.categoryHasRoomWithTodayCheckin(roomType);
    return (
      <div class="roomRow" data-has-today-checkin={String(hasRoomWithTodayCheckin)}>
        <div
          class={`cellData text-left align-items-center roomHeaderCell categoryTitle ${'category_' + this.getCategoryId(roomType)}`}
          onClick={() => this.toggleCategory(roomType)}
          data-has-today-checkin={String(hasRoomWithTodayCheckin)}
        >
          <div class={'categoryName'}>
            <ir-interactive-title popoverTitle={this.getCategoryName(roomType)}></ir-interactive-title>
            {/* <ir-popover popoverTitle={this.getCategoryName(roomCategory)}></ir-popover> */}
          </div>
          {roomType.expanded ? <wa-icon name="angle-down"></wa-icon> : <wa-icon name="angle-right"></wa-icon>}
        </div>
        {this.getRoomtypeDayInventoryCells('category_' + this.getCategoryId(roomType), true, index)}
      </div>
    );
  }

  /**
   * Renders a list of active rooms for an expanded room category. Returns an array of JSX elements, including headers and day columns, or an empty array if the category is collapsed or contains no active rooms.
   *
   * @param {RoomCategory} roomType - The category containing room details.
   */
  private getUnitsByRoomtype(roomType: RoomCategory) {
    const hasRoomWithTodayCheckin = this.categoryHasRoomWithTodayCheckin(roomType);
    // Check accordion is expanded.
    if (!roomType.expanded) {
      return null;
    }
    return this.getRoomtypeUnits(roomType)?.map(room => {
      if (!room.is_active) {
        return null;
      }
      const haveSingleRooms = this.getTotalPhysicalRooms(roomType) <= 1;
      const name = haveSingleRooms ? this.getCategoryName(roomType) : this.getRoomName(room);
      const roomId = this.getRoomId(room);
      const roomHasTodayCheckin = this.roomHasTodayCheckin(roomId);
      return (
        <div class="roomRow" data-room-has-today-checkin={String(roomHasTodayCheckin)}>
          <div
            class={`cellData room text-left align-items-center roomHeaderCell  roomTitle ${this.getTotalPhysicalRooms(roomType) <= 1 ? 'pl10' : ''} ${'room_' + roomId}`}
            data-room-name={name}
            data-hk-enabled={String(calendar_data.housekeeping_enabled)}
            data-room={roomId}
            data-room-has-today-checkin={String(roomHasTodayCheckin)}
            data-category-has-today-checkin={String(hasRoomWithTodayCheckin)}
            onClick={() => {
              if (!calendar_data.housekeeping_enabled) {
                return;
              }
              this.selectedRoom = room;
            }}
            onMouseEnter={() => {
              this.interactiveTitle[room.id]?.style?.setProperty(
                '--ir-interactive-hk-bg',
                roomHasTodayCheckin ? 'var(--wa-color-brand-fill-quiet)' : 'var(--wa-color-neutral-fill-quiet)',
              );
            }}
            onMouseLeave={() => {
              this.interactiveTitle[room.id]?.style?.removeProperty('--ir-interactive-hk-bg');
            }}
          >
            <ir-interactive-title
              ref={el => {
                if (el) this.interactiveTitle[room.id] = el;
              }}
              style={room.hk_status === '003' && { '--dot-color': 'var(--wa-color-neutral-fill-quiet)' }}
              hkStatus={calendar_data.housekeeping_enabled && room.hk_status !== '001'}
              popoverTitle={name}
            >
              {room.hk_status !== '001' && (
                <div slot="end" class="d-flex align-items-center" style={{ gap: '0.5rem' }}>
                  {room.hk_status !== '003' && <wa-tooltip for={`${room.id}_hk_status_icon`}>{room.hk_status === '002' ? 'This unit is dirty' : 'Inspected'}</wa-tooltip>}
                  <wa-icon
                    id={`${room.id}_hk_status_icon`}
                    name={room.hk_status === '004' ? 'check' : 'broom'}
                    style={room.hk_status === '004' && { color: 'var(--wa-color-success-fill-loud)' }}
                  ></wa-icon>
                </div>
              )}
            </ir-interactive-title>
          </div>
          {this.getGeneralUnitsDayCells(this.getRoomId(room), roomType, name)}
        </div>
      );
    });
  }

  private getRoomRows() {
    return this.calendarData.roomsInfo?.map((roomCategory, index) => {
      if (roomCategory.is_active) {
        return (
          <Fragment>
            {this.getRoomtypeRow(roomCategory, index)}
            {roomCategory.expanded && this.getUnitsByRoomtype(roomCategory)}
          </Fragment>
        );
      } else {
        return null;
      }
    });
  }

  private getTodayCheckinRoomsAndCategories() {
    // const todayISO = this.getTodayISODate();
    const today = moment();
    const rooms = new Set<number>();
    const categories = new Set<number>();

    this.getBookingData().forEach(booking => {
      const roomInfo = booking?.ROOM_INFO;

      // Must be a check-in
      if (roomInfo?.in_out?.code !== '001') {
        return;
      }

      // Must match today (from OR to)
      if (moment(booking.FROM_DATE, 'YYYY-MM-DD').isAfter(today, 'dates') && moment(booking.TO_DATE, 'YYYY-MM-DD').isBefore(today, 'dates')) {
        return;
      }

      const roomId = Number(booking.PR_ID);
      if (!Number.isNaN(roomId)) {
        rooms.add(roomId);
      }

      const categoryId = Number(booking.RATE_TYPE);
      if (!Number.isNaN(categoryId)) {
        categories.add(categoryId);
      }
    });

    return { rooms, categories };
  }
  private updateTodayCheckinStatus() {
    const { categories, rooms } = this.getTodayCheckinRoomsAndCategories();
    this.roomsWithTodayCheckinStatus = rooms;
    this.categoriesWithTodayCheckinStatus = categories;
  }

  private roomHasTodayCheckin(roomId: number) {
    // console.log(this.roomsWithTodayCheckinStatus);
    return this.roomsWithTodayCheckinStatus?.has(roomId);
  }

  private categoryHasRoomWithTodayCheckin(roomCategory: RoomCategory) {
    return this.categoriesWithTodayCheckinStatus.has(this.getCategoryId(roomCategory));
  }

  private updateDisabledCellsCache() {
    calendar_dates.disabled_cells.clear();
    this.calendarData.roomsInfo?.forEach((roomCategory, categoryIndex) => {
      if (roomCategory.is_active) {
        this.getRoomtypeUnits(roomCategory)?.forEach(room => {
          if (room.is_active) {
            this.calendarData.days.forEach(dayInfo => {
              const cellKey = this.getCellKey(room.id, dayInfo.value);
              calendar_dates.disabled_cells.set(cellKey, {
                disabled: !dayInfo.rate[categoryIndex].is_available_to_book,
                reason: 'stop_sale',
              });
            });
          }
        });
      }
    });
  }

  private getCellKey(roomId: number, day: string): string {
    return `${roomId}_${day}`;
  }

  private isCellDisabled(roomId: number, day: string): boolean {
    const key = this.getCellKey(roomId, day);
    if (!calendar_dates.disabled_cells.has(key)) {
      return false;
    }
    const { disabled } = calendar_dates.disabled_cells.get(key);
    return disabled;
  }
  render() {
    return (
      <Host>
        <div class="bodyContainer">
          {this.getRoomRows()}
          <div class="bookingEventsContainer preventPageScroll">
            {this.getBookingData()?.map(bookingEvent => {
              return (
                <igl-booking-event
                  data-testid={`booking_${bookingEvent.BOOKING_NUMBER}`}
                  data-room-name={bookingEvent.roomsInfo?.find(r => r.id === bookingEvent.RATE_TYPE)?.physicalrooms.find(r => r.id === bookingEvent.PR_ID)?.name}
                  language={this.language}
                  is_vacation_rental={this.calendarData.is_vacation_rental}
                  countries={this.countries}
                  currency={this.currency}
                  data-component-id={bookingEvent.ID}
                  bookingEvent={bookingEvent}
                  allBookingEvents={this.getBookingData()}
                ></igl-booking-event>
              );
            })}
          </div>
        </div>
        <igl-housekeeping-dialog
          onIrAfterClose={e => {
            e.stopImmediatePropagation();
            e.stopPropagation();
            this.selectedRoom = null;
          }}
          bookingNumber={this.selectedRoom ? (this.bookingMap.get(this.selectedRoom?.id) as any) : undefined}
          selectedRoom={this.selectedRoom}
          open={this.selectedRoom !== null}
        ></igl-housekeeping-dialog>
      </Host>
    );
  }
}
