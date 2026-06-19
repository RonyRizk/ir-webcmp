import { Booking, Room } from '@/models/booking.dto';
import { PropertyRoomType } from '@/models/IBooking';
import { BookingService } from '@/services/booking-service/booking.service';
import { resetBookingStore } from '@/stores/booking.store';
import calendar_data from '@/stores/calendar-data';
import { isRequestPending } from '@/stores/ir-interceptor.store';
import locales from '@/stores/locales.store';
import { checkMealPlan, SelectOption } from '@/utils/utils';
import { Event, EventEmitter, Fragment, Prop, State } from '@stencil/core';
import moment from 'moment';
import { ZodError } from 'zod';
import { RoomDates, SelectedUnit, SelectedUnitSchema } from '../../igl-split-booking/types';
import { Component, h } from '@stencil/core';

@Component({
  tag: 'igl-spilt-booking-form',
  styleUrl: 'igl-spilt-booking-form.css',
  scoped: true,
})
export class IglSpiltBookingForm {
  @Prop() booking: Booking;
  @Prop() identifier: Room['identifier'];

  @State() selectedDates: RoomDates;
  @State() room: Room;
  @State() roomTypes: PropertyRoomType[] = [];
  @State() selectedUnit: Partial<SelectedUnit> = {};
  @State() isLoading: boolean;
  @State() errors: Record<string, boolean> | null;
  @State() mealPlanOptions: SelectOption[] | null = null;

  @Event() closeModal: EventEmitter<null>;

  private defaultDates: RoomDates;
  private bookingService = new BookingService();

  componentWillLoad() {
    this.room = this.getRoom();
    this.defaultDates = { ...this.generateDates(this.room) };
    this.selectedDates = { ...this.defaultDates };
    console.log(this.booking);
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
        language: 'en',
        room_type_ids: [],
        currency: this.booking.currency,
        agent_id: is_in_agent_mode ? this.booking.agent.id : null,
        is_in_agent_mode,
        room_type_ids_to_update: [],
      });
      this.roomTypes = data as any as PropertyRoomType[];
    } catch (error) {
      console.error('Error initializing booking availability:', error);
    }
  }

  private async doReservation() {
    try {
      this.isLoading = true;
      this.errors = null;
      const selectedUnit = SelectedUnitSchema.parse(this.selectedUnit);
      // const oldRooms = this.booking.rooms.filter(r => r.identifier !== this.identifier);
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
        // to_date: this.selectedDates.to_date.format('YYYY-MM-DD'),
        days: this.room.days.filter(r => moment(r.date, 'YYYY-MM-DD').isSameOrAfter(this.selectedDates.from_date, 'dates')),
      });
      // let rooms = [
      //   ...oldRooms,
      //   {
      //     ...this.room,
      //     from_date: this.room.from_date,
      //     to_date: this.selectedDates.from_date.format('YYYY-MM-DD'),
      //     days: this.room.days.filter(r => moment(r.date, 'YYYY-MM-DD').isBefore(this.selectedDates.from_date, 'dates')),
      //     departure_time: null,
      //   },
      //   {
      //     ...this.room,
      //     identifier: null,
      //     in_out: canCheckIn
      //       ? this.room.in_out
      //       : {
      //           code: '000',
      //         },
      //     check_in: canCheckIn,
      //     assigned_units_pool: null,
      //     parent_room_identifier: this.room.identifier,
      //     is_split: true,
      //     roomtype: {
      //       id: selectedUnit.roomtype_id,
      //     },
      //     rateplan: {
      //       id: selectedUnit.rateplan_id || this.room.rateplan.id,
      //     },
      //     departure_time: this.room.departure_time,
      //     unit: { id: selectedUnit.unit_id },
      //     from_date: this.selectedDates.from_date.format('YYYY-MM-DD'),
      //     // to_date: this.selectedDates.to_date.format('YYYY-MM-DD'),
      //     days: this.room.days.filter(r => moment(r.date, 'YYYY-MM-DD').isSameOrAfter(this.selectedDates.from_date, 'dates')),
      //   },
      // ];
      const booking = {
        assign_units: true,
        is_pms: true,
        is_direct: this.booking.is_direct,
        is_backend: true,
        is_in_loyalty_mode: this.booking.is_in_loyalty_mode,
        promo_key: this.booking.promo_key,
        extras: this.booking.extras,
        agent: this.booking.agent,
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
      console.log(booking);
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

  render() {
    return (
      <form
        id="split-booking-form"
        onSubmit={e => {
          e.preventDefault();
          this.doReservation();
        }}
        class="sheet-container"
      >
        <div class="split-header">
          <div class="split-header__summary">
            <ir-date-view from_date={this.room.from_date} to_date={this.room.to_date} showDateDifference={false}></ir-date-view>
            <div class="split-header__tags">
              <wa-tag size="s" variant="neutral">
                {this.room.rateplan.short_name}
              </wa-tag>
              {this.room.rateplan.is_non_refundable && (
                <wa-tag size="s" variant="warning">
                  {locales.entries.Lcz_NonRefundable}
                </wa-tag>
              )}
            </div>
          </div>
          <div class="split-header__controls">
            <label class="split-header__label" htmlFor="split-from-date">
              Split from
            </label>
            <ir-date-picker
              class="split-header__date"
              data-testid="pickup_arrival_date"
              date={this.selectedDates?.from_date?.format('YYYY-MM-DD')}
              maxDate={this.defaultDates?.to_date.format('YYYY-MM-DD')}
              minDate={this.defaultDates?.from_date.format('YYYY-MM-DD')}
              emitEmptyDate={true}
              onDateChanged={evt => {
                this.selectedDates = {
                  ...this.selectedDates,
                  from_date: evt.detail.start,
                };
              }}
            >
              <wa-input
                id="split-from-date"
                slot="trigger"
                size="s"
                readonly
                class="date-trigger"
                value={this.selectedDates.from_date ? this.selectedDates.from_date.format('MMM DD, YYYY') : null}
              >
                <wa-icon slot="start" name="calendar"></wa-icon>
              </wa-input>
            </ir-date-picker>
            <wa-button class="split-header__check" size="s" variant="brand" loading={isRequestPending('/Check_Availability')} onClick={() => this.checkBookingAvailability()}>
              <wa-icon slot="start" name="magnifying-glass"></wa-icon>
              Check
            </wa-button>
          </div>
        </div>
        {this.errors?.roomtype_id && <p class="error-message">Please select a room</p>}
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
          {this.roomTypes?.map(roomType => {
            if (!roomType.is_available_to_book) {
              return null;
            }
            const units = (() => {
              const unitMap = new Map<number, string>();
              for (const rateplan of roomType.rateplans ?? []) {
                for (const unit of rateplan.assignable_units ?? []) {
                  if (unit.Is_Fully_Available) {
                    unitMap.set(unit.pr_id, unit.name);
                  }
                }
              }

              return Array.from(unitMap, ([id, name]) => ({ id, name }));
            })();
            return (
              <Fragment>
                <div key={`roomTypeRow-${roomType.id}`} class="room-type-row">
                  <div class="choice-row">
                    <span class="room-type-name">{roomType.name}</span>
                  </div>
                </div>
                {units.map((room, j) => {
                  const isLastUnit = j === units.length - 1;
                  const showMealPlanSelect = this.selectedUnit?.unit_id === room.id && Array.isArray(this.mealPlanOptions) && this.mealPlanOptions.length > 0;
                  return (
                    <wa-radio
                      value={`${roomType.id}_${room.id}`}
                      checked={this.selectedUnit?.unit_id === room.id}
                      key={`physicalRoom-${room.id}-${j}`}
                      class={`physical-room${isLastUnit ? ' physical-room--last' : ''}`}
                    >
                      <span>{room.name}</span>
                      {showMealPlanSelect && (
                        <ir-validator value={this.selectedUnit?.rateplan_id} schema={SelectedUnitSchema.shape.rateplan_id}>
                          <wa-select
                            size="s"
                            placeholder="Select a new rateplan..."
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
                              <wa-option value={option.value?.toString()}>{option.text + `${option.custom_text ? ' | ' : ''}${option.custom_text}`}</wa-option>
                            ))}
                          </wa-select>
                        </ir-validator>
                      )}
                    </wa-radio>
                  );
                })}
              </Fragment>
            );
          })}
        </wa-radio-group>
      </form>
    );
  }
}
