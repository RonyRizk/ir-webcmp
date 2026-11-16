import { Booking, Room } from '@/models/booking.dto';
import { PropertyRoomType } from '@/models/IBooking';
import { RoomDates, SelectedUnit, SelectedUnitSchema } from '@/models/room-selection';
import { BookingService } from '@/services/booking-service/booking.service';
import { resetBookingStore } from '@/stores/booking.store';
import calendar_data from '@/stores/calendar-data';
import { checkMealPlan, rateplanOptionLabel, SelectOption } from '@/utils/utils';
import { Component, Event, EventEmitter, Fragment, Prop, State, h } from '@stencil/core';
import moment from 'moment';
import { ZodError } from 'zod';
import { LocaleController } from '@/services/locale/locale.controller';

import { t } from '@/services/locale/t';
@Component({
  tag: 'igl-split-booking-form',
  styleUrl: 'igl-split-booking-form.css',
  scoped: true,
})
export class IglSplitBookingForm {
  @Prop() booking: Booking;
  @Prop() identifier: Room['identifier'];
  @Prop() formId: string;

  @State() selectedDates: RoomDates;
  @State() room: Room;
  @State() roomTypes: PropertyRoomType[] = [];
  @State() hasSearched = false;
  @State() isSearching = false;
  @State() selectedUnit: Partial<SelectedUnit> = {};
  @State() isLoading: boolean;
  @State() errors: Record<string, boolean> | null;
  @State() mealPlanOptions: SelectOption[] | null = null;

  @Event({ bubbles: true, composed: true }) closeModal: EventEmitter<null>;

  private defaultDates: RoomDates;
  private bookingService = new BookingService();

  componentWillLoad() {
    this.room = this.getRoom();
    this.defaultDates = { ...this.generateDates(this.room) };
    this.selectedDates = { ...this.defaultDates };
  }

  private getRoom() {
    if (!this.booking) {
      throw new Error('Missing booking');
    }
    if (!this.identifier) {
      throw new Error('Missing Identifier');
    }
    const room = this.booking.rooms.find(r => r.identifier === this.identifier);
    if (!room) {
      throw new Error(`Couldn't find room with identifier ${this.identifier}`);
    }
    return room;
  }

  private generateDates(room: Room): RoomDates {
    let MFromDate = moment(room.from_date, 'YYYY-MM-DD');
    const MToDate = moment(room.to_date, 'YYYY-MM-DD').add(-1, 'days');
    const today = moment();
    if (MFromDate.isBefore(today)) {
      MFromDate = today.clone();
    }
    if (MFromDate.isSame(today)) {
      return { from_date: MFromDate, to_date: MToDate };
    }
    if (MFromDate.isSameOrAfter(today)) {
      return { from_date: MFromDate.clone().add(1, 'days'), to_date: MToDate };
    }
    return { from_date: today.clone().add(1, 'days'), to_date: MToDate };
  }

  private async checkBookingAvailability() {
    this.isSearching = true;
    resetBookingStore(false);
    const from_date = this.selectedDates.from_date.format('YYYY-MM-DD');
    const to_date = this.selectedDates.to_date.format('YYYY-MM-DD');

    const is_in_agent_mode = this.booking.agent !== null;
    try {
      const data = await this.bookingService.getBookingAvailability({
        from_date,
        to_date,
        propertyid: this.booking.property.id,
        adultChildCount: {
          adult: 1,
          child: 0,
        },
        language: LocaleController.language,
        room_type_ids: [],
        currency: this.booking.currency,
        agent_id: is_in_agent_mode ? this.booking.agent.id : null,
        is_in_agent_mode,
        room_type_ids_to_update: [],
      });
      this.roomTypes = data as any as PropertyRoomType[];
    } catch (error) {
      console.error('Error initializing booking availability:', error);
    } finally {
      this.hasSearched = true;
      this.isSearching = false;
    }
  }

  private async doReservation() {
    try {
      this.isLoading = true;
      this.errors = null;
      const selectedUnit = SelectedUnitSchema.parse(this.selectedUnit);
      const canCheckIn = this.room.in_out?.code === '001' ? (moment().isBefore(this.selectedDates.from_date) ? false : true) : false;
      let rooms: any = [...this.booking.rooms];
      let currIndex = rooms.findIndex(room => room.identifier === this.room.identifier);
      if (currIndex === -1) {
        throw new Error(`Didn't find room identifier ${this.room.identifier}`);
      }
      rooms[currIndex] = {
        ...this.room,
        from_date: this.room.from_date,
        to_date: this.selectedDates.from_date.format('YYYY-MM-DD'),
        days: this.room.days.filter(r => moment(r.date, 'YYYY-MM-DD').isBefore(this.selectedDates.from_date, 'dates')),
        departure_time: null,
      };
      rooms.push({
        ...this.room,
        identifier: null,
        in_out: canCheckIn
          ? this.room.in_out
          : {
              code: '000',
            },
        check_in: canCheckIn,
        assigned_units_pool: null,
        parent_room_identifier: this.room.identifier,
        is_split: true,
        roomtype: {
          id: selectedUnit.roomtype_id,
        },
        rateplan: {
          id: selectedUnit.rateplan_id || this.room.rateplan.id,
        },
        departure_time: this.room.departure_time,
        unit: { id: selectedUnit.unit_id },
        from_date: this.selectedDates.from_date.format('YYYY-MM-DD'),
        days: this.room.days.filter(r => moment(r.date, 'YYYY-MM-DD').isSameOrAfter(this.selectedDates.from_date, 'dates')),
      });
      const booking = {
        assign_units: true,
        is_pms: true,
        is_direct: this.booking.is_direct,
        is_backend: true,
        is_in_loyalty_mode: this.booking.is_in_loyalty_mode,
        promo_key: this.booking.promo_key,
        extras: this.booking.extras,
        agent: this.booking.agent,
        // target_room_identifier: this.room.identifier,
        booking: {
          from_date: this.booking.from_date,
          to_date: this.booking.to_date,
          remark: this.booking.remark,
          booking_nbr: this.booking.booking_nbr,
          property: this.booking.property,
          booked_on: this.booking.booked_on,
          source: this.booking.source,
          rooms,
          currency: this.booking.currency,
          arrival: this.booking.arrival,
          guest: this.booking.guest,
        },
        pickup_info: this.booking.pickup_info,
      };
      await this.bookingService.doReservation(booking);
      this.closeModal.emit(null);
    } catch (error) {
      const err: Record<string, boolean> = {};
      if (error instanceof ZodError) {
        console.error(error);
        error.issues.forEach(i => {
          err[i.path[0]] = true;
        });
        this.errors = { ...err };
      }
    } finally {
      this.isLoading = false;
    }
  }

  private updateSelectedUnit(params: Partial<SelectedUnit>) {
    const merged: Partial<SelectedUnit> = { ...this.selectedUnit, ...params };
    const roomTypesSource = calendar_data?.property?.roomtypes;
    const mealPlanResult = checkMealPlan({
      rateplan_id: this.room.rateplan.id.toString(),
      roomTypeId: merged?.roomtype_id,
      roomTypes: roomTypesSource,
    });

    const hasExplicitRateplanUpdate = Object.prototype.hasOwnProperty.call(params, 'rateplan_id');

    if (Array.isArray(mealPlanResult)) {
      this.mealPlanOptions = mealPlanResult;
      if (!hasExplicitRateplanUpdate) {
        delete merged.rateplan_id;
      }
    } else {
      this.mealPlanOptions = null;
      if (!hasExplicitRateplanUpdate) {
        if (mealPlanResult) {
          merged.rateplan_id = Number(mealPlanResult.value);
        } else {
          delete merged.rateplan_id;
        }
      }
    }

    this.selectedUnit = merged;
  }

  /** Bookable room types, each reduced to its de-duplicated set of fully-available physical units. */
  private get eligibleRoomTypes() {
    return (this.roomTypes ?? [])
      .filter(roomType => roomType.is_available_to_book)
      .map(roomType => {
        const unitMap = new Map<number, string>();
        for (const rateplan of roomType.rateplans ?? []) {
          for (const unit of rateplan.assignable_units ?? []) {
            if (unit.Is_Fully_Available) {
              unitMap.set(unit.pr_id, unit.name);
            }
          }
        }
        return { roomType, units: Array.from(unitMap, ([id, name]) => ({ id, name })) };
      })
      .filter(entry => entry.units.length > 0);
  }

  render() {
    const eligibleRoomTypes = this.eligibleRoomTypes;
    return (
      <form
        id={this.formId}
        onSubmit={e => {
          e.preventDefault();
          this.doReservation();
        }}
      >
        <div class="split-header">
          <div class="split-header__summary">
            <span class="split-header__room">{this.room.unit?.['name'] ?? this.room.roomtype?.name}</span>
            <span class="split-header__rateplan">
              {this.room.rateplan.short_name}
              {this.room.rateplan.is_non_refundable && (
                <wa-tag size="s" variant="warning">
                  {t('Lcz_NonRefundable', { fallback: 'Non-refundable' })}
                </wa-tag>
              )}
            </span>
          </div>

          <div class="split-search-row">
            <ir-date-select
              // customPicker
              class="split-search__date"
              data-testid="pickup_arrival_date"
              date={this.selectedDates?.from_date?.format('YYYY-MM-DD')}
              maxDate={this.defaultDates?.to_date.format('YYYY-MM-DD')}
              minDate={this.defaultDates?.from_date.format('YYYY-MM-DD')}
              emitEmptyDate={true}
              onDateChanged={evt => {
                this.selectedDates = { ...this.selectedDates, from_date: evt.detail.start };
              }}
            >
              <wa-icon slot="start" name="calendar"></wa-icon>
            </ir-date-select>
            <ir-custom-button
              class="split-search__submit"
              appearance="accent"
              variant="brand"
              size="s"
              loading={this.isSearching}
              onClickHandler={() => this.checkBookingAvailability()}
            >
              {t('Lcz_CheckAvailability', { fallback: 'Check availability' })}
            </ir-custom-button>
          </div>
        </div>

        {this.errors?.roomtype_id && (
          <p class="error-message">
            <wa-icon name="circle-exclamation"></wa-icon>
            {t('Lcz_PleaseSelectARoom', { fallback: 'Please select a room' })}
          </p>
        )}

        {this.isSearching ? (
          <div class="split-loading">
            {/* <wa-spinner></wa-spinner>
            <span>Checking availability…</span> */}
          </div>
        ) : !this.hasSearched ? (
          <div class="split-empty">
            <ir-empty-state message={t('Lcz_PickDateAndSearchForAvailableUnits', { fallback: 'Pick a date and search to see available units' })}></ir-empty-state>
            <ir-custom-button class="split-empty__action" loading={this.isSearching} onClickHandler={() => this.checkBookingAvailability()} variant="brand" size="s">
              {t('Lcz_CheckAvailability', { fallback: 'Check availability' })}
            </ir-custom-button>
          </div>
        ) : eligibleRoomTypes.length === 0 ? (
          <div class="split-empty">
            <ir-empty-state message={t('Lcz_NoAvailableUnitsForTheseDates', { fallback: 'No available units for these dates' })}></ir-empty-state>
          </div>
        ) : (
          <wa-radio-group
            class="room-type-list"
            name="unit"
            onchange={e => {
              const [roomtype_id, unit_id] = (e.target as any).value.split('_');
              this.updateSelectedUnit({
                roomtype_id: Number(roomtype_id),
                unit_id: Number(unit_id),
              });
            }}
          >
            {eligibleRoomTypes.map(({ roomType, units }) => (
              <Fragment>
                <div key={`roomTypeRow-${roomType.id}`} class="room-type-row">
                  <span class="room-type-name">{roomType.name}</span>
                </div>
                {units.map((unit, j) => {
                  const isSelected = this.selectedUnit?.unit_id === unit.id;
                  const showMealPlanSelect = isSelected && Array.isArray(this.mealPlanOptions) && this.mealPlanOptions.length > 0;
                  return (
                    <wa-radio
                      value={`${roomType.id}_${unit.id}`}
                      checked={isSelected}
                      key={`physicalRoom-${unit.id}-${j}`}
                      class={`physical-room${isSelected ? ' physical-room--selected' : ''}`}
                    >
                      <span>{unit.name}</span>
                      {showMealPlanSelect && (
                        <ir-validator value={this.selectedUnit?.rateplan_id} schema={SelectedUnitSchema.shape.rateplan_id}>
                          <wa-select
                            size="s"
                            placeholder={t('Lcz_SelectANewRateplan', { fallback: 'Select a new rateplan...' })}
                            value={this.selectedUnit?.rateplan_id?.toString()}
                            onchange={e => {
                              e.stopImmediatePropagation();
                              e.stopPropagation();
                              this.updateSelectedUnit({
                                rateplan_id: Number((e.target as HTMLSelectElement).value),
                              });
                            }}
                          >
                            {this.mealPlanOptions.map(option => (
                              <wa-option value={option.value?.toString()}>{rateplanOptionLabel(option)}</wa-option>
                            ))}
                          </wa-select>
                        </ir-validator>
                      )}
                    </wa-radio>
                  );
                })}
              </Fragment>
            ))}
          </wa-radio-group>
        )}
      </form>
    );
  }
}
