import { SelectedUnit, SelectedUnitSchema } from '@/components/igloo-calendar/igl-split-booking/types';
import { Booking, IUnit, Room } from '@/models/booking.dto';
import { PropertyRoomType } from '@/models/IBooking';
import { BookingService } from '@/services/booking-service/booking.service';
import { EventsService } from '@/services/events.service';
import { resetBookingStore } from '@/stores/booking.store';
import calendar_data from '@/stores/calendar-data';
import locales from '@/stores/locales.store';
import { calculateDaysBetweenDates } from '@/utils/booking';
import { checkMealPlan, SelectOption } from '@/utils/utils';
import { Component, Event, EventEmitter, Fragment, Prop, State, h } from '@stencil/core';
import moment, { Moment } from 'moment';
import { ZodError } from 'zod';

@Component({
  tag: 'ir-reallocation-form',
  styleUrl: 'ir-reallocation-form.css',
  scoped: true,
})
export class IrReallocationForm {
  @Prop() booking: Booking;
  @Prop() identifier: string;
  @Prop() pool: string;
  @Prop() formId: string;

  @State() date: Moment;
  @State() isLoading: boolean;
  @State() room: Room;
  @State() roomTypes: PropertyRoomType[] = [];
  @State() selectedUnit: Partial<SelectedUnit> = {};
  @State() errors: Record<string, boolean> | null;
  @State() mealPlanOptions: SelectOption[] | null = null;

  @Event({ bubbles: true, composed: true }) closeModal: EventEmitter<null>;

  private bookingService = new BookingService();
  private eventsService = new EventsService();

  componentWillLoad() {
    this.room = this.getRoom();
    this.date = moment(this.room.from_date, 'YYYY-MM-DD');
    this.checkBookingAvailability();
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

  private async checkBookingAvailability() {
    this.isLoading = true;
    resetBookingStore(false);
    const is_in_agent_mode = this.booking.agent !== null;
    const { from_date, to_date } = this.getDates();
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
      this.roomTypes = (data as any as PropertyRoomType[]).filter(r => r.is_available_to_book);
      this.isLoading = false;
    } catch (error) {
      console.error('Error initializing booking availability:', error);
    }
  }

  private getDates(): { from_date: string; to_date: string } {
    return {
      from_date: this.date.clone().format('YYYY-MM-DD'),
      to_date: this.date.clone().add(calculateDaysBetweenDates(this.room.from_date, this.room.to_date), 'days').format('YYYY-MM-DD'),
    };
  }

  private async reallocateUnit() {
    try {
      this.errors = null;
      const selectedUnit = SelectedUnitSchema.parse(this.selectedUnit);
      const { from_date, to_date } = this.getDates();
      await this.eventsService.reallocateEvent(this.pool, selectedUnit.unit_id, from_date, to_date, selectedUnit.rateplan_id);
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
  // private get minDate() {
  //   if (!this.booking.is_direct) {
  //     return this.booking.from_date;
  //   }
  //   const MFromDate = moment(this.room.from_date, 'YYYY-MM-DD');
  //   const today = moment();
  //   if (MFromDate.isBefore(today)) {
  //     return MFromDate.format('YYYY-MM-DD');
  //   }
  //   return today.format('YYYY-MM-DD');
  // }
  // private get maxDate() {
  //   if (this.booking.is_direct) {
  //     return;
  //   }
  //   return this.booking.from_date;
  // }
  render() {
    if (this.isLoading) {
      return (
        <div class="drawer__loader-container">
          <ir-spinner></ir-spinner>
        </div>
      );
    }
    return (
      <form
        id={this.formId}
        class="reallocation-form"
        onSubmit={e => {
          e.preventDefault();
          this.reallocateUnit();
        }}
      >
        <div class="booking-summary">
          <ir-date-view from_date={this.room.from_date} to_date={this.room.to_date} showDateDifference={false}></ir-date-view>
        </div>
        <div>
          <wa-callout size="small" appearance="filled" variant="neutral">
            <p style={{ padding: '0', margin: '0' }}>
              {/* <span>From: </span> */}
              <span class="rateplan-details">
                {this.room.roomtype.name} {this.room.rateplan.short_name} {this.room.rateplan.is_non_refundable ? locales.entries.Lcz_NonRefundable : ''}{' '}
                <span class="rateplan-details-unit">{(this.room.unit as IUnit).name}</span>
              </span>
            </p>
          </wa-callout>
          {/* <div class="date-picker-row">
          <ir-custom-date-picker
            data-testid="pickup_arrival_date"
            date={this.date?.format('YYYY-MM-DD')}
            // maxDate={this.defaultDates?.to_date.format('YYYY-MM-DD')}
            minDate={this.minDate}
            maxDate={this.maxDate}
            emitEmptyDate={true}
            label="From:"
            onDateChanged={evt => {
              this.date = evt.detail.start;
            }}
          ></ir-custom-date-picker>
          <ir-custom-button variant="brand" loading={isRequestPending('/Check_Availability')} onClickHandler={() => this.checkBookingAvailability()}>
            Check available units
          </ir-custom-button>
        </div> */}
          {this.errors?.roomtype_id && <p class="error-message">Please select a room</p>}
          {this.roomTypes.length === 0 ? (
            <ir-empty-state style={{ marginTop: '20vh' }}></ir-empty-state>
          ) : (
            <Fragment>
              <div class="arrow-container">
                <svg height={30} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                  <path d="M297.4 566.6C309.9 579.1 330.2 579.1 342.7 566.6L502.7 406.6C515.2 394.1 515.2 373.8 502.7 361.3C490.2 348.8 469.9 348.8 457.4 361.3L352 466.7L352 96C352 78.3 337.7 64 320 64C302.3 64 288 78.3 288 96L288 466.7L182.6 361.3C170.1 348.8 149.8 348.8 137.3 361.3C124.8 373.8 124.8 394.1 137.3 406.6L297.3 566.6z" />
                </svg>
              </div>
              <wa-callout size="small" appearance="filled" variant="neutral">
                <wa-radio-group
                  onchange={e => {
                    const [roomtype_id, unit_id] = (e.target as any).value.split('_');
                    this.updateSelectedUnit({
                      roomtype_id: Number(roomtype_id),
                      unit_id: Number(unit_id),
                    });
                  }}
                  name="available-units"
                  class="room-type-list"
                >
                  {/* <p style={{ margin: '0', padding: '0', marginBottom: '0.5rem' }}>To:</p> */}
                  {this.roomTypes?.map(roomType => {
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
                        <div key={`roomTypeRow-${roomType.id}`} class={`room-type-row`}>
                          <div class={'choice-row'}>
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
                                    size="small"
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
                                    {this.mealPlanOptions.map(option => {
                                      return <wa-option value={option.value?.toString()}>{option.text + `${option.custom_text ? ' | ' : ''}${option.custom_text}`}</wa-option>;
                                    })}
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
              </wa-callout>
            </Fragment>
          )}
        </div>
      </form>
    );
  }
}
