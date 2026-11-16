import { Component, h, Prop, Event, EventEmitter, Fragment } from '@stencil/core';
import { Booking, IUnit, Occupancy, Room, SharedPerson } from '@/models/booking.dto';
import calendar_data, { isSingleUnit } from '@/stores/calendar-data';
import { SetupEntries } from '@/models/IBooking';

import { t } from '@/services/locale/t';
import { getSetupEntryLabel } from '@/services/setup';
import { formatCount } from '@/utils/number';
@Component({
  tag: 'ir-room-details',
  styleUrl: 'ir-room-details.css',
  scoped: true,
})
export class IrRoomDetails {
  @Prop() room: Room;
  @Prop() booking: Booking;
  @Prop() mainGuest: SharedPerson;
  @Prop() bedPreferences: SetupEntries[];
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

    const adultLabel = adultCount > 1 ? t('Lcz_Adults', { fallback: 'adults' }).toLowerCase() : t('Lcz_Adult', { fallback: 'adult' }).toLowerCase();
    const childLabel = childCount > 1 ? t('Lcz_Children', { fallback: 'Children' }).toLowerCase() : t('Lcz_Child', { fallback: 'Child' }).toLowerCase();
    const infantLabel = infantCount > 1 ? t('Lcz_Infants').toLowerCase() : t('Lcz_Infant').toLowerCase();

    const parts = [];
    if (adultCount > 0) {
      parts.push(`${formatCount(adultCount)} ${adultLabel}`);
    }
    if (childCount > 0) {
      parts.push(`${formatCount(childCount)} ${childLabel}`);
    }
    if (infantCount > 0) {
      parts.push(`${formatCount(infantCount)} ${infantLabel}`);
    }

    return parts.join('&nbsp&nbsp&nbsp&nbsp');
  }

  private getBedName() {
    if (this.booking.is_direct) {
      const bed = this.bedPreferences.find(p => p.CODE_NAME === this.room?.bed_preference?.toString());
      if (!bed) {
        return;
      }
      return getSetupEntryLabel(bed, this.language);
    }
    return this.room.ota_meta?.bed_preferences;
  }

  render() {
    const bed = this.getBedName();
    return (
      <Fragment>
        <div class="booking-room__dates-row">
          <ir-date-view
            format={'weekday-medium'}
            class="booking-room__date-view"
            from_date={this.room.from_date}
            to_date={this.room.to_date}
            showDateDifference={false}
          ></ir-date-view>
          {!isSingleUnit(this.room.roomtype.id) && calendar_data.is_frontdesk_enabled && this.room.unit && <ir-unit-tag unit={(this.room.unit as IUnit).name}></ir-unit-tag>}
          {this.hasCheckIn && (
            <ir-custom-button onClickHandler={() => this.checkIn.emit()} id="checkin" appearance="outlined" variant="brand">
              {t('Lcz_CheckIn', { fallback: 'Check in' })}
            </ir-custom-button>
          )}
          {this.hasCheckOut && (
            <ir-custom-button appearance="outlined" variant="brand" onClickHandler={() => this.checkOut.emit()} id="checkout">
              {t('Lcz_CheckOut', { fallback: 'Check out' })}
            </ir-custom-button>
          )}
        </div>
        <div class="booking-room__guest-row">
          <p class="booking-room__text-reset booking-room__guest-name">{`${this.mainGuest.first_name || ''} ${this.mainGuest.last_name || ''}`}</p>
          {this.room.rateplan.selected_variation.adult_nbr > 0 && (
            <Fragment>
              <wa-tooltip for={`view-guest-btn-${this.room.identifier}`}>{t('Lcz_ViewGuests', { fallback: 'View guests' })}</wa-tooltip>
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
              <span class="booking-room__departure-label">{t('Lcz_ExpectedArrivalTime', { fallback: 'Expected Arrival Time' })}:</span>
              <ir-custom-button link appearance="plain" variant="brand" onClickHandler={() => this.openArrivalDialog.emit()}>
                {this.room.arrival_time?.description || t('Lcz_NotProvided', { fallback: 'Not provided' })}
              </ir-custom-button>
            </div>
            {/* )} */}
            {this.includeDepartureTime && (
              <div class="booking-room__time-item">
                <span class="booking-room__departure-label">{t('Lcz_DepartureTime', { fallback: 'Departure time:' })}</span>
                <ir-custom-button link appearance="plain" variant="brand" onClickHandler={() => this.openDepartureDialog.emit()}>
                  {this.room.departure_time?.description || t('Lcz_NotProvided', { fallback: 'Not provided' })}
                </ir-custom-button>
              </div>
            )}
          </div>
        )}
      </Fragment>
    );
  }
}
