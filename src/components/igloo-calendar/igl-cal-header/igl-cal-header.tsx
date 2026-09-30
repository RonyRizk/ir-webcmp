import { Component, Event, EventEmitter, Host, Prop, h, State } from '@stencil/core';
import { addDaysISO, todayISO } from '@/utils/calendar-dates';
import moment from 'moment';
import locales from '@/stores/locales.store';
import { getUnassignedUnitsCountForDate, isUnassignedUnitsDateLoading } from '@/stores/unassigned-units.store';
import { DayUseBookings } from '@/components';
import { RoomListItem } from './types';

@Component({
  tag: 'igl-cal-header',
  styleUrl: 'igl-cal-header.css',
  scoped: true,
})
export class IglCalHeader {
  @Event() optionEvent: EventEmitter<{ [key: string]: any }>;
  @Event({ bubbles: true, composed: true }) gotoRoomEvent: EventEmitter<{
    [key: string]: any;
  }>;
  @Event({ bubbles: true, composed: true }) gotoToBeAssignedDate: EventEmitter<{
    [key: string]: any;
  }>;
  @Prop() calendarData: { [key: string]: any };
  /** `YYYY-MM-DD` */
  @Prop() today: string;
  @Prop() propertyid: number;
  @Prop() to_date: string;
  @Prop() highlightedDate: string;
  @Prop() dayUseBookings: DayUseBookings[] = [];

  @State() renderAgain: boolean = false;
  private roomsList: RoomListItem[] = [];

  componentWillLoad() {
    try {
      this.initializeRoomsList();
    } catch (error) {
      console.error('Error in componentWillLoad:', error);
    }
  }
  private initializeRoomsList() {
    this.roomsList = [];
    this.calendarData.roomsInfo.forEach(category => {
      this.roomsList = this.roomsList.concat(...category.physicalrooms);
    });
  }

  /** Reads the unassigned-units store live (auto-subscribes on render), keyed by `dayInfo.value` (`YYYY-MM-DD`). */
  private getUnassignedRoomsNumberMap(): { [key: string]: number } {
    const map: { [key: string]: number } = {};
    (this.calendarData.days ?? []).forEach((dayInfo: { value: string }) => {
      const count = getUnassignedUnitsCountForDate(dayInfo.value);
      if (count > 0) {
        map[dayInfo.value] = count;
      }
    });
    return map;
  }

  /** Days (`YYYY-MM-DD`) whose unassigned-units fetch is still in flight — same store subscription as the count map. */
  private getUnassignedLoadingDaysMap(): { [key: string]: boolean } {
    const map: { [key: string]: boolean } = {};
    (this.calendarData.days ?? []).forEach((dayInfo: { value: string }) => {
      if (isUnassignedUnitsDateLoading(dayInfo.value)) {
        map[dayInfo.value] = true;
      }
    });
    return map;
  }

  handleOptionEvent(key, data: any = '') {
    this.optionEvent.emit({ key, data });
  }

  getNewBookingModel() {
    const from_date = todayISO();
    const to_date = addDaysISO(from_date, 1);
    return {
      ID: '',
      NAME: '',
      EMAIL: '',
      PHONE: '',
      REFERENCE_TYPE: 'PHONE',
      FROM_DATE: from_date,
      TO_DATE: to_date,
      roomsInfo: this.calendarData.roomsInfo,
      TITLE: locales.entries.Lcz_NewBooking,
      event_type: 'PLUS_BOOKING',
      legendData: this.calendarData.formattedLegendData,
      defaultDateRange: {
        fromDate: from_date,
        toDate: to_date,
        dateDifference: 0,
        editabled: true,
        message: '',
      },
    };
  }

  renderView() {
    this.renderAgain = !this.renderAgain;
  }

  private handleToolbarAction = (e: CustomEvent<{ key: string; data?: any }>) => {
    const { key, data } = e.detail;
    if (key === 'bulk') {
      this.handleOptionEvent('bulk', this.getNewBookingModel());
    } else {
      this.handleOptionEvent(key, data);
    }
  };

  private handleRoomSelected = (e: CustomEvent<{ roomId: number }>) => {
    this.gotoRoomEvent.emit({ key: 'gotoRoom', roomId: e.detail.roomId });
  };

  private handleDayBadgeClicked = (e: CustomEvent<{ date: string }>) => {
    this.handleOptionEvent('showAssigned');
    setTimeout(() => {
      this.gotoToBeAssignedDate.emit({
        key: 'gotoToBeAssignedDate',
        data: e.detail.date,
      });
    }, 100);
  };

  render() {
    return (
      <Host>
        <igl-cal-header-toolbar
          isVacationRental={this.calendarData.is_vacation_rental}
          showDayUseButton={!this.calendarData.is_vacation_rental && this.dayUseBookings?.length > 0}
          minDate={moment().add(-2, 'months').startOf('month').format('YYYY-MM-DD')}
          roomsList={this.roomsList}
          onActionSelected={this.handleToolbarAction}
          onRoomSelected={this.handleRoomSelected}
        ></igl-cal-header-toolbar>
        <igl-cal-header-days
          isVacationRental={this.calendarData.is_vacation_rental}
          today={this.today}
          highlightedDate={this.highlightedDate}
          monthsInfo={this.calendarData.monthsInfo}
          days={this.calendarData.days}
          unassignedRoomsNumber={this.getUnassignedRoomsNumberMap()}
          loadingDays={this.getUnassignedLoadingDaysMap()}
          onDayBadgeClicked={this.handleDayBadgeClicked}
        ></igl-cal-header-days>
      </Host>
    );
  }
}
