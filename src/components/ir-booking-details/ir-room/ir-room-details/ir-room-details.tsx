import { Component, h, Prop, Event, EventEmitter, Fragment } from '@stencil/core';
import { Booking, IUnit, Occupancy, Room, SharedPerson } from '@/models/booking.dto';
import locales from '@/stores/locales.store';
import calendar_data, { isSingleUnit } from '@/stores/calendar-data';
import { IEntries } from '@/models/IBooking';

@Component({
  tag: 'ir-room-details',
  styleUrl: 'ir-room-details.css',
  scoped: true,
})
export class IrRoomDetails {
  @Prop() room: Room;
  @Prop() booking: Booking;
  @Prop() mainGuest: SharedPerson;
  @Prop() bedPreferences: IEntries[];
  @Prop() language: string = 'en';
  @Prop() includeDepartureTime: boolean;
  @Prop() hasCheckIn: boolean = false;
  @Prop() hasCheckOut: boolean = false;

  @Event() checkIn: EventEmitter<void>;
  @Event() checkOut: EventEmitter<void>;
  @Event() viewGuests: EventEmitter<void>;
  @Event() openArrivalDialog: EventEmitter<void>;
  @Event() openDepartureDialog: EventEmitter<void>;

  private formatVariation({ infant_nbr, adult_nbr, children_nbr }: Occupancy) {
    const adultCount = adult_nbr > 0 ? adult_nbr : 0;
    const childCount = children_nbr > 0 ? children_nbr : 0;
    const infantCount = infant_nbr > 0 ? infant_nbr : 0;

    const adultLabel = adultCount > 1 ? locales.entries.Lcz_Adults.toLowerCase() : locales.entries.Lcz_Adult.toLowerCase();
    const childLabel = childCount > 1 ? locales.entries.Lcz_Children.toLowerCase() : locales.entries.Lcz_Child.toLowerCase();
    const infantLabel = infantCount > 1 ? locales.entries.Lcz_Infants.toLowerCase() : locales.entries.Lcz_Infant.toLowerCase();

    const parts = [];
    if (adultCount > 0) {
      parts.push(`${adultCount} ${adultLabel}`);
    }
    if (childCount > 0) {
      parts.push(`${childCount} ${childLabel}`);
    }
    if (infantCount > 0) {
      parts.push(`${infantCount} ${infantLabel}`);
    }

    return parts.join('&nbsp&nbsp&nbsp&nbsp');
  }

  private getBedName() {
    if (this.booking.is_direct) {
      const bed = this.bedPreferences.find(p => p.CODE_NAME === this.room?.bed_preference?.toString());
      if (!bed) {
        return;
      }
      return bed[`CODE_VALUE_${this.language}`] ?? bed.CODE_VALUE_EN;
    }
    return this.room.ota_meta?.bed_preferences;
  }

  render() {
    const bed = this.getBedName();
    return (
      <Fragment>
        <div class="booking-room__dates-row">
          <ir-date-view
            format={'ddd, MMM DD, YYYY'}
            class="booking-room__date-view"
            from_date={this.room.from_date}
            to_date={this.room.to_date}
            showDateDifference={false}
          ></ir-date-view>
          {!isSingleUnit(this.room.roomtype.id) && calendar_data.is_frontdesk_enabled && this.room.unit && <ir-unit-tag unit={(this.room.unit as IUnit).name}></ir-unit-tag>}
          {this.hasCheckIn && (
            <ir-custom-button onClickHandler={() => this.checkIn.emit()} id="checkin" appearance="outlined" variant="brand">
              {locales.entries.Lcz_CheckIn}
            </ir-custom-button>
          )}
          {this.hasCheckOut && (
            <ir-custom-button appearance="outlined" variant="brand" onClickHandler={() => this.checkOut.emit()} id="checkout">
              {locales.entries.Lcz_CheckOut}
            </ir-custom-button>
          )}
        </div>
        <div class="booking-room__guest-row">
          <p class="booking-room__text-reset booking-room__guest-name">{`${this.mainGuest.first_name || ''} ${this.mainGuest.last_name || ''}`}</p>
          {this.room.rateplan.selected_variation.adult_nbr > 0 && (
            <Fragment>
              <wa-tooltip for={`view-guest-btn-${this.room.identifier}`}>View guests</wa-tooltip>
              <ir-custom-button link onClickHandler={() => this.viewGuests.emit()} id={`view-guest-btn-${this.room.identifier}`} variant="brand" appearance="plain">
                <span innerHTML={this.formatVariation(this.room.occupancy)}></span>
              </ir-custom-button>
            </Fragment>
          )}
          {bed && <p class="booking-room__text-reset booking-room__bed-info">({bed})</p>}
        </div>
        {(this.includeDepartureTime || this.booking.is_direct) && (
          <div class="booking-room__departure-row">
            {/* {this.booking.is_direct && ( */}
            <div class="booking-room__time-item">
              <span class="booking-room__departure-label">Expected arrival time:</span>
              <ir-custom-button link appearance="plain" variant="brand" onClickHandler={() => this.openArrivalDialog.emit()}>
                {this.room.arrival_time?.description || 'Not provided'}
              </ir-custom-button>
            </div>
            {/* )} */}
            {this.includeDepartureTime && (
              <div class="booking-room__time-item">
                <span class="booking-room__departure-label">Departure time:</span>
                <ir-custom-button link appearance="plain" variant="brand" onClickHandler={() => this.openDepartureDialog.emit()}>
                  {this.room.departure_time?.description || 'Not provided'}
                </ir-custom-button>
              </div>
            )}
          </div>
        )}
      </Fragment>
    );
  }
}
