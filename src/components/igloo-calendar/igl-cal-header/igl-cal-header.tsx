import { Component, Event, EventEmitter, Host, Prop, h, State, Listen, Watch } from '@stencil/core';
import { ToBeAssignedService } from '@/services/toBeAssigned.service';
import { dateToFormattedString } from '@/utils/utils';
import moment from 'moment';
import locales from '@/stores/locales.store';
import { handleUnAssignedDatesChange } from '@/stores/unassigned_dates.store';
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
  @Prop() today: String;
  @Prop() propertyid: number;
  @Prop() unassignedDates;
  @Prop() to_date: string;
  @Prop() highlightedDate: string;
  @Prop() dayUseBookings: DayUseBookings[] = [];

  @State() renderAgain: boolean = false;
  @State() unassignedRoomsNumber: any = {};
  private roomsList: RoomListItem[] = [];
  private toBeAssignedService = new ToBeAssignedService();

  componentWillLoad() {
    try {
      this.initializeRoomsList();

      if (!this.calendarData.is_vacation_rental) {
        handleUnAssignedDatesChange('unassigned_dates', newValue => {
          if (Object.keys(newValue).length > 0) {
            this.fetchAndAssignUnassignedRooms();
          }
        });
      }
    } catch (error) {
      console.error('Error in componentWillLoad:', error);
    }
  }
  @Watch('unassignedDates')
  handleCalendarDataChanged() {
    this.fetchAndAssignUnassignedRooms();
  }
  private initializeRoomsList() {
    this.roomsList = [];
    this.calendarData.roomsInfo.forEach(category => {
      this.roomsList = this.roomsList.concat(...category.physicalrooms);
    });
  }

  private async fetchAndAssignUnassignedRooms() {
    await this.assignRoomsToDate();
  }

  private async assignRoomsToDate() {
    try {
      const { fromDate, toDate, data } = this.unassignedDates;
      let dt = new Date(fromDate);
      dt.setHours(0, 0, 0, 0);
      let endDate = dt.getTime();
      while (endDate <= new Date(toDate).getTime()) {
        const selectedDate = moment(endDate).format('D_M_YYYY');
        if (data[endDate]) {
          const result = await this.toBeAssignedService.getUnassignedRooms(
            { from_date: this.calendarData.from_date, to_date: this.calendarData.to_date },
            this.propertyid,
            dateToFormattedString(new Date(endDate)),
            this.calendarData.roomsInfo,
            this.calendarData.formattedLegendData,
          );
          this.unassignedRoomsNumber[selectedDate] = result.length;
        } else if (this.unassignedRoomsNumber[selectedDate]) {
          const res = this.unassignedRoomsNumber[selectedDate] - 1;
          this.unassignedRoomsNumber[selectedDate] = res < 0 ? 0 : res;
        }
        const newEndDate = moment(endDate).add(1, 'days').toDate();
        newEndDate.setHours(0, 0, 0, 0);
        endDate = newEndDate.getTime();
        this.renderView();
      }
    } catch (error) {
      console.error(error);
    }
  }

  @Listen('reduceAvailableUnitEvent', { target: 'window' })
  handleReduceAvailableUnitEvent(event: CustomEvent<{ fromDate: string; toDate: string }>) {
    event.stopImmediatePropagation();
    event.stopPropagation();
    const { fromDate, toDate } = event.detail;
    let endDate = new Date(fromDate).getTime();
    while (endDate < new Date(toDate).getTime()) {
      const selectedDate = moment(endDate).format('D_M_YYYY');
      this.unassignedRoomsNumber[selectedDate] = this.unassignedRoomsNumber[selectedDate] - 1;
      endDate = moment(endDate).add(1, 'days').toDate().getTime();
    }
    this.renderView();
  }

  handleOptionEvent(key, data: any = '') {
    this.optionEvent.emit({ key, data });
  }

  getStringDateFormat(dt) {
    return dt.getFullYear() + '-' + (dt.getMonth() < 9 ? '0' : '') + (dt.getMonth() + 1) + '-' + (dt.getDate() <= 9 ? '0' : '') + dt.getDate();
  }

  getNewBookingModel() {
    let today = new Date();
    today.setHours(0, 0, 0, 0);
    let from_date = this.getStringDateFormat(today);
    today.setDate(today.getDate() + 1);
    today.setHours(0, 0, 0, 0);
    let to_date = this.getStringDateFormat(today);
    return {
      ID: '',
      NAME: '',
      EMAIL: '',
      PHONE: '',
      REFERENCE_TYPE: 'PHONE',
      FROM_DATE: from_date, // "2023-07-09",
      TO_DATE: to_date, // "2023-07-11",
      roomsInfo: this.calendarData.roomsInfo,
      TITLE: locales.entries.Lcz_NewBooking,
      event_type: 'PLUS_BOOKING',
      legendData: this.calendarData.formattedLegendData,
      defaultDateRange: {
        fromDate: new Date(from_date), //new Date("2023-09-10"),
        fromDateStr: '', //"10 Sep 2023",
        toDate: new Date(to_date), //new Date("2023-09-15"),
        toDateStr: '', // "15 Sep 2023",
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

  private handleDayBadgeClicked = (e: CustomEvent<{ day: string; currentDate: any }>) => {
    this.handleOptionEvent('showAssigned');
    setTimeout(() => {
      this.gotoToBeAssignedDate.emit({
        key: 'gotoToBeAssignedDate',
        data: e.detail.currentDate,
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
          unassignedRoomsNumber={{ ...this.unassignedRoomsNumber }}
          onDayBadgeClicked={this.handleDayBadgeClicked}
        ></igl-cal-header-days>
      </Host>
    );
  }
}
