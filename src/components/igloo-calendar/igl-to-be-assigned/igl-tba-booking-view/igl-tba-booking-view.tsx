import { Component, Host, Prop, h, Event, EventEmitter, Listen, State } from '@stencil/core';
import { ToBeAssignedService } from '@/services/toBeAssigned.service';
import { v4 } from 'uuid';
import locales from '@/stores/locales.store';
import { CalendarSidebarState } from '@/components/igloo-calendar/igloo-calendar';
import { canCheckIn } from '@/utils/utils';
import { IUnit, Occupancy } from '@/models/booking.dto';

@Component({
  tag: 'igl-tba-booking-view',
  styleUrl: 'igl-tba-booking-view.css',
  scoped: true,
})
export class IglTbaBookingView {
  @Prop() calendarData: { [key: string]: any };
  @Prop() selectedDate;
  @Prop() eventData: { [key: string]: any } = {};
  @Prop() categoriesData: { [key: string]: any } = {};
  @Prop() categoryId;
  @Prop() categoryIndex;
  @Prop() eventIndex;

  @State() renderAgain: boolean = false;
  @State() selectedRoom: number = -1;
  @State() isLoading: 'default' | 'checkin' | null = null;

  private highlightSection: boolean = false;
  private allRoomsList: { [key: string]: any }[] = [];
  private toBeAssignedService = new ToBeAssignedService();

  @Event({ bubbles: true, composed: true })
  highlightToBeAssignedBookingEvent: EventEmitter;
  @Event({ bubbles: true, composed: true }) openCalendarSidebar: EventEmitter<CalendarSidebarState>;
  @Event({ bubbles: true, composed: true }) addToBeAssignedEvent: EventEmitter;
  @Event({ bubbles: true, composed: true }) scrollPageToRoom: EventEmitter;
  @Event() assignRoomEvent: EventEmitter<{ [key: string]: any }>;

  componentShouldUpdate(newValue: string, oldValue: string, propName: string): boolean {
    if (propName === 'selectedDate' && newValue !== oldValue) {
      this.highlightSection = false;
      this.selectedRoom = -1;
      return true;
    } else if (propName === 'eventData' && newValue !== oldValue) {
      this.selectedRoom = -1;
      return true;
    }
    return true;
  }

  componentWillLoad() {
    if (this.categoryIndex === 0 && this.eventIndex === 0) {
      setTimeout(() => {
        this.handleHighlightAvailability();
      }, 100);
    }
  }

  @Listen('highlightToBeAssignedBookingEvent', { target: 'window' })
  highlightBookingEvent(event: CustomEvent) {
    let data = event.detail.data;
    if (data.bookingId != this.eventData.ID) {
      this.highlightSection = false;
      this.selectedRoom = -1;
      this.renderView();
    } else {
      this.highlightSection = true;
      this.renderView();
    }
  }

  private onSelectRoom(evt) {
    if (evt.stopImmediatePropagation) {
      evt.stopImmediatePropagation();
      evt.stopPropagation();
    }
    this.selectedRoom = parseInt(evt.target.value);
  }

  private async handleAssignUnit(event: Event, check_in: boolean = false) {
    try {
      event.stopImmediatePropagation();
      event.stopPropagation();
      if (this.selectedRoom) {
        this.isLoading = check_in ? 'checkin' : 'default';
        const booking = await this.toBeAssignedService.assignUnit({
          booking_nbr: this.eventData.BOOKING_NUMBER,
          identifier: this.eventData.ID,
          pr_id: this.selectedRoom,
          check_in,
        });
        const room = booking.rooms.find(r => r.identifier === this.eventData.identifier);
        console.log('room=>', room);
        if (room && check_in) {
          // TODO:enable this when applying the check in module
          const { adult_nbr, children_nbr, infant_nbr } = room.occupancy;
          window.dispatchEvent(
            new CustomEvent('openCalendarSidebar', {
              detail: {
                type: 'room-guests',
                payload: {
                  identifier: this.eventData.ID,
                  bookingNumber: this.eventData.BOOKING_NUMBER,
                  checkin: false,
                  roomName: (room.unit as IUnit)?.name ?? '',
                  sharing_persons: room.sharing_persons,
                  totalGuests: adult_nbr + children_nbr + infant_nbr,
                },
              },
              bubbles: true,
              composed: true,
            }),
          );
          console.log('event emitted directly to window 🔥');
        }
        let assignEvent = { ...this.eventData, PR_ID: this.selectedRoom };
        this.addToBeAssignedEvent.emit({
          key: 'tobeAssignedEvents',
          data: [assignEvent],
        });
        this.assignRoomEvent.emit({ key: 'assignRoom', data: assignEvent });
      }
    } catch (error) {
      console.log(error);
    } finally {
      this.isLoading = null;
    }
  }

  private handleHighlightAvailability() {
    this.highlightToBeAssignedBookingEvent.emit({
      key: 'highlightBookingId',
      data: { bookingId: this.eventData.ID, fromDate: this.eventData.FROM_DATE },
    });
    if (!this.selectedDate) {
      return;
    }
    let filteredEvents = [];
    let allRoomsList = [];
    filteredEvents = this.eventData.availableRooms.map(room => {
      allRoomsList.push({
        calendar_cell: null,
        id: room.PR_ID,
        name: room.roomName,
      });
      return {
        ...room,
        defaultDateRange: this.eventData.defaultDateRange,
        identifier: this.eventData.identifier,
      };
    });
    this.allRoomsList = allRoomsList;
    this.addToBeAssignedEvent.emit({
      key: 'tobeAssignedEvents',
      data: filteredEvents,
    });

    this.scrollPageToRoom.emit({
      key: 'scrollPageToRoom',
      id: this.categoryId,
      refClass: 'category_' + this.categoryId,
    });
    this.renderView();
  }

  private handleCloseAssignment(event) {
    event.stopImmediatePropagation();
    event.stopPropagation();
    this.highlightSection = false;
    this.highlightToBeAssignedBookingEvent.emit({
      key: 'highlightBookingId',
      data: { bookingId: '----' },
    });
    this.onSelectRoom({ target: { value: '' } });
    this.selectedRoom = -1;
    this.addToBeAssignedEvent.emit({ key: 'tobeAssignedEvents', data: [] });
    this.renderView();
  }

  private renderView() {
    this.renderAgain = !this.renderAgain;
  }
  private canCheckIn() {
    // if (!calendar_data.checkin_enabled || calendar_data.is_automatic_check_in_out) {
    //   return false;
    // }
    // const now = moment();
    // if (
    //   (moment().isSameOrAfter(new Date(this.eventData.FROM_DATE), 'days') && moment().isBefore(new Date(this.eventData.TO_DATE), 'days')) ||
    //   (moment().isSame(new Date(this.eventData.TO_DATE), 'days') &&
    //     !compareTime(now.toDate(), createDateWithOffsetAndHour(calendar_data.checkin_checkout_hours?.offset, calendar_data.checkin_checkout_hours?.hour)))
    // ) {
    //   return true;
    // }
    // return false;
    return canCheckIn({
      from_date: this.eventData.FROM_DATE,
      to_date: this.eventData.TO_DATE,
    });
  }

  private formatVariation({ infant_nbr, adult_nbr, children_nbr }: Occupancy) {
    const adultCount = adult_nbr > 0 ? adult_nbr : 0;
    const childCount = children_nbr > 0 ? children_nbr : 0;
    const infantCount = infant_nbr > 0 ? infant_nbr : 0;

    const adultLabel = 'A';
    const childLabel = 'C';
    const infantLabel = 'I';

    const parts = [];
    if (adultCount > 0) {
      parts.push(`${adultCount}${adultLabel}`);
    }
    if (childCount > 0) {
      parts.push(`${childCount}${childLabel}`);
    }
    if (infantCount > 0) {
      parts.push(`${infantCount}${infantLabel}`);
    }

    return parts.join('-');
  }

  render() {
    return (
      <Host>
        <wa-card appearance="filled" class={`tba ${this.highlightSection ? '--active' : ''}`} onClick={() => this.handleHighlightAvailability()}>
          <div slot="header" class={`tba__header`} title="Click to assign unit">
            <p class="tba__booking-number">{this.eventData.BOOKING_NUMBER}</p>

            <span class="tba__separator">-</span>

            <p class="tba__guest-name">{this.eventData.NAME}</p>

            {this.eventData.occupancy && (
              <p class="tba__occupancy">
                <span class="tba__occupancy-paren">( </span>
                <span class="tba__occupancy-values" innerHTML={this.formatVariation(this.eventData.occupancy)}></span>
                <span class="tba__occupancy-paren"> )</span>
              </p>
            )}
          </div>
          <div class="tba__actions">
            <wa-select
              defaultValue={this.selectedRoom === -1 ? '' : this.selectedRoom.toString()}
              class="tba__select"
              id={v4()}
              size="s"
              value={this.selectedRoom === -1 ? '' : this.selectedRoom.toString()}
              onchange={evt => this.onSelectRoom(evt)}
            >
              <wa-option value="">{locales.entries.Lcz_AssignUnit}</wa-option>
              {this.allRoomsList.map(room => (
                <wa-option value={room.id.toString()}>{room.name}</wa-option>
              ))}
            </wa-select>
            {this.highlightSection ? (
              <div class="tba__close">
                <wa-button type="button" appearance="plain" size="s" class="tba__close-btn" onClick={evt => this.handleCloseAssignment(evt)}>
                  <wa-icon name="xmark"></wa-icon>
                </wa-button>
              </div>
            ) : null}
          </div>
          <div class="tba__assign">
            <wa-button
              class="tba__assign-btn"
              size="s"
              variant="brand"
              appearance={this.canCheckIn() ? 'outlined' : 'accent'}
              loading={this.isLoading === 'default'}
              disabled={this.selectedRoom === -1}
              onClick={evt => this.handleAssignUnit(evt)}
            >
              {locales.entries.Lcz_Assign}
            </wa-button>
            {this.canCheckIn() && (
              <wa-button
                class="tba__assign-btn"
                size="s"
                variant="brand"
                loading={this.isLoading === 'checkin'}
                disabled={this.selectedRoom === -1}
                onClick={evt => this.handleAssignUnit(evt, true)}
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
