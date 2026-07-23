import booking_store, {
  bookedByGuestBaseData,
  calculateTotalRooms,
  getBookingTotalPrice,
  IRatePlanSelection,
  setBookingDraft,
  syncFirstRoomGuestName,
  updateBookedByGuest,
} from '@/stores/booking.store';
import calendar_data from '@/stores/calendar-data';
import locales from '@/stores/locales.store';
import { formatAmount } from '@/utils/utils';
import { Component, Event, EventEmitter, Fragment, h, Listen, Prop, State } from '@stencil/core';
import { BookingEditorMode } from '../types';
import { calculateDaysBetweenDates } from '@/utils/booking';
import { Room, Booking } from '@/models/booking.dto';
import { AgentsService } from '@/services/agents/agents.service';
import { Agent } from '@/services/agents/type';
import { BookingService } from '@/services/booking-service/booking.service';
import { ExposedGuests } from '@/services/booking-service/types';
import { isRequestPending } from '@/stores/ir-interceptor.store';
import { isAgentMode } from '@/components/ir-booking-details/functions';
import { IRBookingEditorService } from '../ir-booking-editor.service';

@Component({
  tag: 'ir-booking-editor-form',
  styleUrl: 'ir-booking-editor-form.css',
  scoped: true,
})
export class IrBookingEditorForm {
  @Prop() mode: BookingEditorMode = 'PLUS_BOOKING';
  @Prop() room: Room;
  @Prop() booking: Booking;
  @Prop() agent: Agent;

  @State() guests: ExposedGuests;
  @State() totalCost = 0;
  @State() assignee: 'agent' | 'guest' = 'guest';
  @State() resolvedAgent: Agent;
  @Event() doReservation: EventEmitter<string>;

  private bookingService = new BookingService();
  private agentsService = new AgentsService();
  private bookingEditorService: IRBookingEditorService;
  private totalRooms = 0;
  pickerEl: HTMLIrPickerElement;

  async componentWillLoad() {
    this.totalRooms = calculateTotalRooms();
    this.totalCost = this.totalRooms > 1 ? await getBookingTotalPrice() : 0;
    this.bookingEditorService = new IRBookingEditorService(this.mode);
    if (this.agent) {
      this.resolvedAgent = this.agent;
    } else if (this.booking?.agent) {
      this.resolvedAgent = await this.agentsService.getExposedAgent({ id: this.booking.agent.id });
    }
    if (this.bookingEditorService.isEventType(['ADD_ROOM', 'SPLIT_BOOKING']) && isAgentMode(this.resolvedAgent)) {
      this.assignee = 'agent';
      setBookingDraft({ roomAssignee: 'agent' });
    }
  }
  @Listen('recalculateTotalCost')
  async handleRecalculation(e: CustomEvent) {
    e.stopImmediatePropagation();
    e.stopPropagation();
    this.totalCost = this.totalRooms > 1 ? await getBookingTotalPrice() : 0;
  }
  private async fetchGuests(email: string) {
    try {
      if (!email) {
        return;
      }
      this.guests = await this.bookingService.fetchExposedGuest(email, calendar_data.property.id);
    } catch (error) {
      console.log(error);
    }
  }

  private handleComboboxSelect(e: CustomEvent) {
    const guest = this.guests?.find(guest => guest.id?.toString() === e.detail.item.value);
    if (!guest) {
      console.warn(`guest not found with id ${e.detail.item.value}`);
      return;
    }
    updateBookedByGuest({
      id: guest.id,
      email: guest.email,
      firstName: guest.first_name,
      lastName: guest.last_name,
      mobile: guest.mobile_without_prefix,
      countryId: guest.country_id?.toString(),
      phone_prefix: guest['country_phone_prefix'],
    });
    syncFirstRoomGuestName('first_name', guest.first_name);
    syncFirstRoomGuestName('last_name', guest.last_name);
  }
  render() {
    const { dates } = booking_store.bookingDraft;
    let hasBookedByGuestController = false;

    return (
      <form
        class="booking-editor__guest-form"
        id="new_booking_form"
        autoComplete="off"
        onSubmit={e => {
          e.preventDefault();
          const submitter = (e as SubmitEvent).submitter as any | null;
          this.doReservation.emit(submitter?.value);
        }}
      >
        <div class="booking-editor__header">
          <ir-date-view
            class="booking-editor__dates mr-1 flex-fill font-weight-bold font-medium-1"
            from_date={dates.checkIn}
            to_date={dates.checkOut}
            dateOption="DD MMM YYYY"
          ></ir-date-view>

          {this.totalRooms > 1 && (
            <div class="booking-editor__total mt-1 mt-md-0 text-right">
              <span class="booking-editor__total-label">{locales.entries.Lcz_TotalPrice}</span>{' '}
              <span class="booking-editor__total-amount font-weight-bold font-medium-1">{formatAmount(calendar_data.property.currency.symbol, this.totalCost)}</span>
            </div>
          )}
        </div>
        {Object.values(booking_store.ratePlanSelections).map(val =>
          Object.values(val).map(ratePlan => {
            const rp = ratePlan as IRatePlanSelection;
            if (rp.reserved === 0) {
              return null;
            }

            return [...new Array(rp.reserved)].map((_, i) => {
              const shouldAutoFillGuest =
                ['BAR_BOOKING', 'PLUS_BOOKING'].includes(this.mode) &&
                booking_store.bookedByGuest.id === -1 &&
                !hasBookedByGuestController &&
                !booking_store.bookedByGuestManuallyEdited;
              if (shouldAutoFillGuest) {
                hasBookedByGuestController = true;
              }
              return (
                <igl-application-info
                  autoFillGuest={shouldAutoFillGuest}
                  totalNights={calculateDaysBetweenDates(dates.checkIn.format('YYYY-MM-DD'), dates.checkOut.format('YYYY-MM-DD'))}
                  bedPreferenceType={booking_store.selects.bedPreferences}
                  currency={calendar_data.property.currency}
                  guestInfo={rp.guest ? rp.guest[i] : null}
                  bookingType={this.mode}
                  rateplanSelection={rp}
                  key={`${rp.ratePlan.id}_${i}`}
                  roomIndex={i}
                  baseData={
                    this.mode === 'EDIT_BOOKING'
                      ? {
                          roomtypeId: this.room.roomtype.id,
                          unit: this.room.unit as any,
                        }
                      : undefined
                  }
                ></igl-application-info>
              );
            });
          }),
        )}
        {this.bookingEditorService.isEventType(['BAR_BOOKING', 'PLUS_BOOKING']) && (
          <section class={'mt-2'}>
            <div class="booking-editor__booked-by booking-editor__booked-by-header">
              <h4 class="booking-editor__heading booking-editor__booked-by-title">Booked by</h4>
              {booking_store.bookingDraft?.agent ? (
                <span>{booking_store.bookingDraft?.agent.name}</span>
              ) : (
                <Fragment>
                  <ir-picker
                    class="booking-editor__booked-by-picker"
                    appearance="filled"
                    // placeholder="Search customer by email, name or company name"
                    placeholder="Search customer by email or name"
                    withClear
                    onText-change={event => this.fetchGuests(event.detail)}
                    debounce={500}
                    loading={isRequestPending('/Fetch_Exposed_Guests')}
                    mode="select-async"
                    ref={el => (this.pickerEl = el)}
                    onCombobox-select={this.handleComboboxSelect.bind(this)}
                  >
                    {this.guests?.map(guest => {
                      const label = `${guest.email} - ${guest.first_name} ${guest.last_name}`;
                      return (
                        <ir-picker-item label={label} value={guest.id?.toString()} key={guest.id}>
                          {label}
                        </ir-picker-item>
                      );
                    })}
                  </ir-picker>
                  {booking_store.bookedByGuest.id !== -1 && (
                    <ir-custom-button
                      onClickHandler={() => {
                        updateBookedByGuest(bookedByGuestBaseData);
                        this.pickerEl.clearInput();
                      }}
                      variant="brand"
                    >
                      Clear user
                    </ir-custom-button>
                  )}
                </Fragment>
              )}
            </div>
            <ir-booking-editor-guest-form></ir-booking-editor-guest-form>
          </section>
        )}
        {this.bookingEditorService.isEventType(['SPLIT_BOOKING', 'ADD_ROOM']) && isAgentMode(this.resolvedAgent) && (
          <ir-service-assignee-select
            style={{ maxWidth: '500px' }}
            agent={this.booking.agent}
            assigneeType={this.assignee}
            onAssignmentChange={e => {
              e.stopImmediatePropagation();
              e.stopPropagation();
              this.assignee = e.detail;
              setBookingDraft({ roomAssignee: e.detail });
            }}
          ></ir-service-assignee-select>
        )}
      </form>
    );
  }
}
