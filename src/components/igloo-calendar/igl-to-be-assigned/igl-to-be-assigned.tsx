import { Component, Host, h, Prop, Event, EventEmitter, State, Listen, Watch } from '@stencil/core';
import { ToBeAssignedService } from '@/services/toBeAssigned.service';
import { dateToFormattedString } from '@/utils/utils';
import moment from 'moment';
import locales from '@/stores/locales.store';
import { getUnassignedDates } from '@/stores/unassigned_dates.store';
//import { updateCategories } from '@/utils/events.utils';

@Component({
  tag: 'igl-to-be-assigned',
  styleUrl: 'igl-to-be-assigned.css',
  scoped: true,
})
export class IglToBeAssigned {
  @Prop() unassignedDatesProp: any;
  @Prop() propertyid: number;
  @Prop() from_date: string;
  @Prop() to_date: string;
  @Prop({ mutable: true }) calendarData: { [key: string]: any };

  @State() loadingMessage: string;
  @State() showDatesList: boolean = false;
  @State() renderAgain: boolean = false;
  @State() orderedDatesList: any[] = [];
  @State() noScroll = false;
  @State() selectedDateDisplay: string = '';

  @Event() optionEvent: EventEmitter<{ [key: string]: any }>;
  @Event({ bubbles: true, composed: true })
  reduceAvailableUnitEvent: EventEmitter<{ [key: string]: any }>;
  @Event() showBookingPopup: EventEmitter;
  @Event({ bubbles: true, composed: true }) addToBeAssignedEvent: EventEmitter;
  @Event({ bubbles: true, composed: true })
  highlightToBeAssignedBookingEvent: EventEmitter;

  private isGotoToBeAssignedDate: boolean = false;
  private isLoading: boolean = true;
  private selectedDate = null;
  private data: { [key: string]: any } = {};
  private today = new Date();
  private categoriesData: { [key: string]: any } = {};
  private toBeAssignedService: ToBeAssignedService = new ToBeAssignedService();
  private unassignedDates: any;

  componentWillLoad() {
    this.reArrangeData();
    this.loadingMessage = locales.entries.Lcz_FetchingUnAssignedUnits;
  }

  @Watch('unassignedDatesProp')
  handleUnassignedDatesToBeAssignedChange(newValue: any) {
    const { fromDate, toDate, data } = newValue;
    let dt = new Date(fromDate);
    dt.setHours(0);
    dt.setMinutes(0);
    dt.setSeconds(0);
    let endDate = dt.getTime();
    while (endDate <= new Date(toDate).getTime()) {
      if (data && !data[endDate] && this.unassignedDates.hasOwnProperty(endDate)) {
        delete this.unassignedDates[endDate];
      } else if (data && data[endDate]) {
        this.unassignedDates[endDate] = data[endDate];
      }
      endDate = moment(endDate).add(1, 'days').toDate().getTime();
    }
    this.data = { ...this.unassignedDates };
    this.orderedDatesList = Object.keys(this.data).sort((a, b) => parseInt(a) - parseInt(b));

    if (this.orderedDatesList.length) {
      if (this.selectedDate === null) {
        this.selectedDate = this.orderedDatesList[0];
      }
      if (this.selectedDate && this.data[this.selectedDate]) {
        this.selectedDateDisplay = this.data[this.selectedDate]?.dateStr || this.selectedDateDisplay;
        this.showForDate(this.selectedDate, false);
      } else {
        this.isLoading = false;
        this.renderView();
      }
    } else {
      this.selectedDate = null;
      this.selectedDateDisplay = '';
      this.isLoading = false;
      this.renderView();
    }
  }
  handleAssignUnit(event: CustomEvent<{ [key: string]: any }>) {
    const opt: { [key: string]: any } = event.detail;
    const data = opt.data;
    event.stopImmediatePropagation();
    event.stopPropagation();

    if (opt?.key === 'assignUnit' && this.data) {
      // Verify data.selectedDate exists in this.data
      if (data?.selectedDate && this.data[data.selectedDate]) {
        // Check if categories exist and there's only one category
        if (this.data[data.selectedDate]?.categories && Object.keys(this.data[data.selectedDate]?.categories || {})?.length === 1) {
          this.isLoading = true;
          this.noScroll = true;
        }

        // Make sure all required properties exist before filtering
        if (
          data?.RT_ID &&
          this.data[data.selectedDate]?.categories &&
          this.data[data.selectedDate].categories[data.RT_ID] &&
          Array.isArray(this.data[data.selectedDate].categories[data.RT_ID]) &&
          data?.assignEvent?.ID
        ) {
          this.data[data.selectedDate].categories[data.RT_ID] = this.data[data.selectedDate].categories[data.RT_ID].filter(
            eventData => eventData && eventData.ID !== data.assignEvent.ID,
          );
        }

        // Only update calendarData if it exists in the data
        if (data?.calendarData) {
          this.calendarData = data.calendarData;
        }

        this.renderView();
      }
    }
  }

  async updateCategories(key, calendarData) {
    try {
      //console.log("called")
      let categorisedRooms = {};
      const result = await this.toBeAssignedService.getUnassignedRooms(
        { from_date: calendarData.from_date, to_date: calendarData.to_date },
        this.propertyid,
        dateToFormattedString(new Date(+key)),
        calendarData.roomsInfo,
        calendarData.formattedLegendData,
      );
      result.forEach(room => {
        if (!categorisedRooms.hasOwnProperty(room.RT_ID)) {
          categorisedRooms[room.RT_ID] = [room];
        } else {
          categorisedRooms[room.RT_ID].push(room);
        }
      });
      this.unassignedDates[key].categories = categorisedRooms;
    } catch (error) {
      //  toastr.error(error);
    }
  }

  async reArrangeData() {
    try {
      this.today.setHours(0, 0, 0, 0);
      this.calendarData.roomsInfo.forEach(category => {
        this.categoriesData[category.id] = {
          name: category.name,
          roomsList: category.physicalrooms,
          roomIds: category.physicalrooms.map(room => {
            return room.id;
          }),
        };
      });

      this.selectedDate = null;
      //this.unassignedDates = await this.toBeAssignedService.getUnassignedDates(this.propertyid, dateToFormattedString(new Date()), this.to_date);
      this.unassignedDates = getUnassignedDates();
      console.log(this.unassignedDates);

      this.data = this.unassignedDates;
      this.orderedDatesList = Object.keys(this.data).sort((a, b) => parseInt(a) - parseInt(b));

      if (!this.selectedDate && this.orderedDatesList.length) {
        this.selectedDate = this.orderedDatesList[0];
        this.selectedDateDisplay = this.data[this.selectedDate]?.dateStr || '';
      } else if (!this.orderedDatesList.length) {
        this.selectedDateDisplay = '';
      }
    } catch (error) {
      console.error('Error fetching unassigned dates:', error);
      //  toastr.error(error);
    }
  }
  async componentDidLoad() {
    setTimeout(() => {
      if (!this.isGotoToBeAssignedDate && Object.keys(this.unassignedDates).length > 0) {
        //console.log(this.isGotoToBeAssignedDate);
        const firstKey = Object.keys(this.unassignedDates)[0];

        this.showForDate(firstKey);
      }
    }, 100);
  }
  @Listen('gotoToBeAssignedDate', { target: 'window' })
  async gotoDate(event: CustomEvent) {
    this.isGotoToBeAssignedDate = true;
    this.showForDate(event.detail.data);
    this.showDatesList = false;
    this.renderView();
  }
  @Listen('highlightToBeAssignedBookingEvent')
  handleToBeAssignedDate(e: CustomEvent) {
    this.showBookingPopup.emit({
      key: 'calendar',
      data: new Date(e.detail.data.fromDate).getTime() - 86400000,
      noScroll: false,
    });
  }
  async showForDate(dateStamp, withLoading = true) {
    try {
      if (withLoading) {
        this.isLoading = true;
        // Reflect the picked date immediately and flush a render so the spinner
        // is visible while updateCategories() is fetching.
        this.selectedDate = dateStamp;
        this.renderView();
      }
      if (this.showDatesList) {
        this.showUnassignedDate();
      }
      await this.updateCategories(dateStamp, this.calendarData);
      this.addToBeAssignedEvent.emit({ key: 'tobeAssignedEvents', data: [] });
      this.showBookingPopup.emit({
        key: 'calendar',
        data: parseInt(dateStamp) - 86400000,
        noScroll: this.noScroll,
      });
      if (this.isGotoToBeAssignedDate) {
        this.isGotoToBeAssignedDate = false;
      }
      this.isLoading = false;
      this.selectedDate = dateStamp;
      this.selectedDateDisplay = this.data[dateStamp]?.dateStr || this.selectedDateDisplay;
      this.renderView();
    } catch (error) {
      // toastr.error(error);
    }
  }

  getDay(dt) {
    const currentDate = new Date(dt);
    const locale = 'default'; //'en-US';
    const dayOfWeek = this.getLocalizedDayOfWeek(currentDate, locale);
    // const monthName = currentDate.toLocaleString("default", { month: 'short' })
    return dayOfWeek + ' ' + currentDate.getDate() + ', ' + currentDate.getFullYear();
  }

  getLocalizedDayOfWeek(date, locale) {
    const options = { weekday: 'short' };
    return date.toLocaleDateString(locale, options);
  }

  handleOptionEvent(key, data = '') {
    this.highlightToBeAssignedBookingEvent.emit({
      key: 'highlightBookingId',
      data: { bookingId: '----' },
    });
    this.addToBeAssignedEvent.emit({ key: 'tobeAssignedEvents', data: [] });
    this.optionEvent.emit({ key, data });
  }

  showUnassignedDate() {
    this.showDatesList = !this.showDatesList;
  }

  getToBeAssignedEntities() {
    // toBeAssignedEvents
  }

  getCategoryView() {
    if (this.orderedDatesList.length && this.selectedDate && this.data[this.selectedDate]) {
      return Object.entries(this.data[this.selectedDate].categories).map(([id, eventDatas], ind) => (
        <igl-tba-category-view
          calendarData={this.calendarData}
          selectedDate={this.selectedDate}
          categoryId={id}
          categoryIndex={ind}
          categoriesData={this.categoriesData}
          eventDatas={eventDatas}
          onAssignUnitEvent={evt => this.handleAssignUnit(evt)}
        ></igl-tba-category-view>
      ));
    } else {
      return null;
    }
  }

  renderView() {
    this.renderAgain = !this.renderAgain;
  }

  render() {
    const selectedDateData = this.selectedDate ? this.data[this.selectedDate] : null;
    const isEmpty = Object.keys(this.data).length === 0;
    const hasDates = this.orderedDatesList.length > 0;

    return (
      <Host>
        <div class="tba-panel">
          <div class="tba-panel__head">
            <header class="tba-panel__header">
              <h2 class="tba-panel__title" id="to-be-assigned-title">
                {locales.entries.Lcz_Assignments}
              </h2>
              <ir-custom-button size="medium" appearance="plain" variant="neutral" onClickHandler={() => this.handleOptionEvent('closeSideMenu')}>
                <wa-icon name="xmark" variant="solid" label="Close" aria-label="Close" role="img"></wa-icon>
              </ir-custom-button>
            </header>

            {hasDates && (
              <div class="tba-panel__toolbar">
                <wa-select
                  size="small"
                  aria-label={locales.entries.Lcz_Assignments}
                  value={this.selectedDate ? this.selectedDate.toString() : ''}
                  defaultValue={this.selectedDate ? this.selectedDate.toString() : ''}
                  onchange={evt => this.showForDate((evt.target as HTMLSelectElement).value)}
                >
                  {this.orderedDatesList.map(ordDate => (
                    <wa-option value={ordDate.toString()}>{this.data[ordDate].dateStr}</wa-option>
                  ))}
                </wa-select>
              </div>
            )}
          </div>

          <div class="tba-panel__body">
            {isEmpty ? (
              <p class="tba-panel__empty">{locales.entries.Lcz_AllBookingsAreAssigned}</p>
            ) : this.isLoading ? (
              <div class="tba-panel__loading">
                <ir-spinner></ir-spinner>
              </div>
            ) : selectedDateData && Object.keys(selectedDateData.categories).length ? (
              this.getCategoryView()
            ) : (
              <p class="tba-panel__empty">{locales.entries.Lcz_AllAssignForThisDay}</p>
            )}
          </div>
        </div>
      </Host>
    );
  }
}
