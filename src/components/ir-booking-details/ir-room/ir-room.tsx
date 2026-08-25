import { Component, h, Prop, EventEmitter, Event, Listen, State, Element, Host, Watch } from '@stencil/core';
import { Booking, ExtraService, IUnit, Room, SharedPerson } from '@/models/booking.dto';
import { Agent } from '@/services/agents/type';
import { TIglBookPropertyPayload } from '@/models/igl-book-property';
import { formatName } from '@/utils/booking';
import locales from '@/stores/locales.store';
import { IEntries } from '@/models/IBooking';
import { BookingService } from '@/services/booking-service/booking.service';
import { OpenSidebarEvent, RoomGuestsPayload } from '../types';
import { IToast } from '@/components/ui/ir-toast/toast';
import { ClTx } from '@/services/city-ledger/types';
import { IrRoomHeaderAction } from './ir-room-header/ir-room-header';
export type RoomModalReason = 'delete' | 'checkin' | 'checkout' | null;

@Component({
  tag: 'ir-room',
  styleUrl: 'ir-room.css',
  scoped: true,
})
export class IrRoom {
  @Element() element: HTMLIrRoomElement;
  // Room Data
  @Prop() booking: Booking;
  @Prop() bookingIndex: number;
  @Prop() isEditable: boolean;
  @Prop() room: Room;
  @Prop() property_id: number;
  @Prop() includeDepartureTime: boolean;
  // Meal Code names
  @Prop() mealCodeName: string;
  @Prop() myRoomTypeFoodCat: string;
  // Currency
  @Prop() currency: string = 'USD';
  @Prop() language: string = 'en';
  @Prop() legendData;
  @Prop() roomsInfo;
  @Prop() bedPreferences: IEntries[];
  @Prop() departureTime: IEntries[];
  @Prop() arrivalTime: IEntries[];
  // Booleans Conditions
  @Prop() hasRoomEdit: boolean = false;
  @Prop() hasRoomDelete: boolean = false;
  @Prop() hasRoomAdd: boolean = false;
  @Prop() hasCheckIn: boolean = false;
  @Prop() hasCheckOut: boolean = false;
  @Prop() agent: Agent;

  @Prop() clTransactions: ClTx[] = [];

  /** `_SVC_CATEGORY` setup entries, used to label extra services in the room's extra-services section. */
  @Prop() svcCategories: IEntries[] = [];

  @State() collapsed: boolean = true;
  @State() isLoading: boolean = false;
  @State() isToggling: boolean = false;
  @State() modalReason: RoomModalReason = null;
  @State() mainGuest: SharedPerson;
  @State() isModelOpen: boolean = false;
  @State() isOpen: boolean = false;
  @State() isPricingDrawerOpen: boolean = false;
  @State() isHbDialogOpen: boolean = false;
  @State() isDepartureDialogOpen: boolean = false;
  @State() isArrivalDialogOpen: boolean = false;

  // Event Emitters
  @Event({ bubbles: true, composed: true }) deleteFinished: EventEmitter<string>;
  @Event({ bubbles: true, composed: true }) toast: EventEmitter<IToast>;
  @Event({ bubbles: true, composed: true }) pressCheckIn: EventEmitter;
  @Event({ bubbles: true, composed: true }) pressCheckOut: EventEmitter;
  @Event({ bubbles: true, composed: true }) editInitiated: EventEmitter<TIglBookPropertyPayload>;
  @Event() resetBookingEvt: EventEmitter<null>;
  @Event() openSidebar: EventEmitter<OpenSidebarEvent<RoomGuestsPayload>>;
  @Event({ bubbles: true, composed: true }) addExtraServiceToUnit: EventEmitter<{ pr_id: number }>;

  private modal: HTMLIrDialogElement;
  private toggleDialogRef: HTMLIrAssignmentToggleDialogElement;
  private bookingService = new BookingService();
  dialogRef: HTMLIrDialogElement;

  componentWillLoad() {
    this.mainGuest = this.getMainGuest();
  }
  // In your class

  @Listen('clickHandler')
  handleClick(e) {
    let target = e.target;
    if (target.id == 'checkin') {
      this.pressCheckIn.emit(this.room);
    } else if (target.id == 'checkout') {
      this.pressCheckOut.emit(this.room);
    }
  }

  /**
   * Early-check-in / late-checkout are managed exclusively through the arrival/departure time
   * dialogs (price + time are set together there) — intercept edits on those categories and open
   * the matching dialog instead of letting the generic extra-service edit panel handle them.
   */
  @Listen('editExtraService')
  handleEditExtraService(e: CustomEvent<ExtraService>) {
    const code = e.detail?.category?.code;
    if (code === 'ECI') {
      e.stopImmediatePropagation();
      e.stopPropagation();
      this.isArrivalDialogOpen = true;
    } else if (code === 'LCO') {
      e.stopImmediatePropagation();
      e.stopPropagation();
      this.isDepartureDialogOpen = true;
    }
  }
  @Watch('room')
  handleRoomDataChange() {
    this.mainGuest = this.getMainGuest();
  }

  private getDateStr(date, locale = 'default') {
    return date.getDate() + ' ' + date.toLocaleString(locale, { month: 'short' }) + ' ' + date.getFullYear();
  }
  private handleEditClick() {
    this.editInitiated.emit({
      event_type: 'EDIT_BOOKING',
      ID: this.room['assigned_units_pool'],
      NAME: formatName(this.mainGuest?.first_name, this.mainGuest?.last_name),
      EMAIL: this.booking.guest.email,
      PHONE: this.booking.guest.mobile,
      REFERENCE_TYPE: '',
      FROM_DATE: this.booking.from_date,
      TO_DATE: this.booking.to_date,
      TITLE: `${locales.entries.Lcz_EditBookingFor} ${this.room?.roomtype?.name} ${(this.room?.unit as IUnit)?.name || ''}`,
      defaultDateRange: {
        dateDifference: this.room.days.length,
        fromDate: new Date(this.room.from_date + 'T00:00:00'),
        fromDateStr: this.getDateStr(new Date(this.room.from_date + 'T00:00:00')),
        toDate: new Date(this.room.to_date + 'T00:00:00'),
        toDateStr: this.getDateStr(new Date(this.room.to_date + 'T00:00:00')),
        message: '',
      },
      bed_preference: this.room.bed_preference,
      adult_child_offering: this.room.rateplan.selected_variation.adult_child_offering,
      ADULTS_COUNT: this.room.rateplan.selected_variation.adult_nbr,
      ARRIVAL: this.booking.arrival,
      ARRIVAL_TIME: this.booking.arrival.description,
      BOOKING_NUMBER: this.booking.booking_nbr,
      cancelation: this.room.rateplan.cancelation,
      channel_booking_nbr: this.booking.channel_booking_nbr,
      CHILDREN_COUNT: this.room.rateplan.selected_variation.child_nbr,
      COUNTRY: this.booking.guest.country_id,
      ENTRY_DATE: this.booking.from_date,
      FROM_DATE_STR: this.booking.format.from_date,
      guarantee: this.room.rateplan.guarantee,
      GUEST: this.mainGuest,
      IDENTIFIER: this.room.identifier,
      is_direct: this.booking.is_direct,
      IS_EDITABLE: this.booking.is_editable,
      NO_OF_DAYS: this.room.days.length,
      NOTES: this.booking.remark,
      origin: this.booking.origin,
      POOL: this.room['assigned_units_pool'],
      PR_ID: (this.room.unit as IUnit)?.id,
      RATE: this.room.total,
      RATE_PLAN: this.room.rateplan.name,
      RATE_PLAN_ID: this.room.rateplan.id,
      RATE_TYPE: this.room.roomtype.id,
      ROOMS: this.booking.rooms,
      SOURCE: this.booking.source,
      SPLIT_BOOKING: false,
      STATUS: 'IN-HOUSE',
      TO_DATE_STR: this.booking.format.to_date,
      TOTAL_PRICE: this.booking.total,
      legendData: this.legendData,
      roomsInfo: this.roomsInfo,
      roomName: (this.room.unit as IUnit)?.name || '',
      PICKUP_INFO: this.booking.pickup_info,
      booking: this.booking,
      currentRoomType: this.room,
    });
  }
  private openModal(reason: RoomModalReason) {
    if (!reason) {
      return;
    }
    this.modalReason = reason;
    this.modal.openModal();
  }
  private async handleModalConfirmation(e: CustomEvent) {
    try {
      e.stopImmediatePropagation();
      e.stopPropagation();
      if (!this.modalReason) {
        return;
      }
      this.isLoading = true;
      switch (this.modalReason) {
        case 'delete':
          await this.deleteRoom();
          break;
        case 'checkin':
        case 'checkout':
          await this.bookingService.handleExposedRoomInOut({
            booking_nbr: this.booking.booking_nbr,
            room_identifier: this.room.identifier,
            status: this.modalReason === 'checkin' ? '001' : '002',
          });
          this.resetBookingEvt.emit();
          break;
        default:
          break;
      }
    } catch (error) {
      console.log(error);
    } finally {
      this.isLoading = false;
      this.modalReason = null;
      this.modal.closeModal();
    }
  }
  private async deleteRoom() {
    let oldRooms = [...this.booking.rooms];
    oldRooms = oldRooms.filter(room => room.identifier !== this.room.identifier);

    const body = {
      assign_units: true,
      check_in: true,
      is_pms: true,
      is_direct: true,
      agent: this.booking.agent,
      booking: {
        booking_nbr: this.booking.booking_nbr,
        from_date: this.booking.from_date,
        to_date: this.booking.to_date,
        remark: this.booking.remark,
        property: this.booking.property,
        source: this.booking.source,
        currency: this.booking.currency,
        arrival: this.booking.arrival,
        guest: this.booking.guest,
        rooms: oldRooms,
      },
      extras: this.booking.extras,
      pickup_info: this.booking.pickup_info,
    };
    await this.bookingService.doReservation(body);
    this.deleteFinished.emit(this.room.identifier);
  }
  private async toggleRoomAgent() {
    try {
      this.isToggling = true;
      const updatedRooms = this.booking.rooms.map(r => (r.identifier === this.room.identifier ? { ...r, agent: r.agent ? null : this.booking.agent } : r));
      const body = {
        assign_units: true,
        check_in: true,
        is_pms: true,
        is_direct: true,
        agent: this.booking.agent,
        booking: {
          booking_nbr: this.booking.booking_nbr,
          from_date: this.booking.from_date,
          to_date: this.booking.to_date,
          remark: this.booking.remark,
          property: this.booking.property,
          source: this.booking.source,
          currency: this.booking.currency,
          arrival: this.booking.arrival,
          guest: this.booking.guest,
          rooms: updatedRooms,
        },
        extras: this.booking.extras,
        pickup_info: this.booking.pickup_info,
      };
      await this.bookingService.doReservation(body);
      this.resetBookingEvt.emit(null);
      this.toggleDialogRef.closeModal();
    } catch (error) {
      console.log(error);
    } finally {
      this.isToggling = false;
    }
  }

  private renderModalMessage() {
    switch (this.modalReason) {
      case 'delete':
        return `${locales.entries['Lcz_AreYouSureDoYouWantToRemove ']} ${this.room.roomtype.name} ${this.room.unit ? (this.room.unit as IUnit).name : ''} ${
          locales.entries.Lcz_FromThisBooking
        }`;
      case 'checkin':
        return `Are you sure you want to Check In this unit?
`;
      case 'checkout':
        return `Are you sure you want to Check Out this unit?`;
      default:
        return '';
    }
  }
  private handleCheckIn() {
    const { adult_nbr, children_nbr, infant_nbr } = this.room.occupancy;
    if (this.room.sharing_persons.length < adult_nbr + children_nbr + infant_nbr) {
      return this.showGuestModal();
    }
    return this.renderModalMessage();
  }
  private getMainGuest() {
    return this.room.sharing_persons?.find(p => p.is_main);
  }
  private showGuestModal(): void {
    const { adult_nbr, children_nbr, infant_nbr } = this.room.occupancy;
    this.openSidebar.emit({
      type: 'room-guest',
      payload: {
        roomName: (this.room.unit as IUnit)?.name,
        sharing_persons: this.room.sharing_persons,
        totalGuests: adult_nbr + children_nbr + infant_nbr,
        checkin: this.hasCheckIn,
        identifier: this.room.identifier,
      },
    });
  }
  private get unitId(): number | null {
    return (this.room.unit as IUnit)?.id ?? null;
  }

  private handleAddExtraServiceToUnit() {
    const pr_id = this.unitId;
    if (!pr_id) {
      return;
    }
    this.addExtraServiceToUnit.emit({ pr_id });
  }

  private handleHeaderAction(action: IrRoomHeaderAction) {
    switch (action) {
      case 'edit':
        this.handleEditClick();
        break;
      case 'edit-rates':
        this.isPricingDrawerOpen = true;
        break;
      case 'delete':
        this.openModal('delete');
        break;
      case 'toggle':
        this.toggleDialogRef.openModal();
        break;
      case 'add-extra-service':
        this.handleAddExtraServiceToUnit();
        break;
    }
  }

  render() {
    return (
      <Host>
        <div class="booking-room__header-row">
          <button data-state={this.collapsed ? 'closed' : 'opened'} class="booking-room__collapse-btn" onClick={() => (this.collapsed = !this.collapsed)}>
            <wa-icon name="chevron-right"></wa-icon>
          </button>
          <div style={{ width: '100%', cursor: 'default' }}>
            <div
              // slot="summary"
              class="booking-room_summary"
              style={{ width: '100%', cursor: 'default' }}
            >
              <ir-room-header
                room={this.room}
                myRoomTypeFoodCat={this.myRoomTypeFoodCat}
                mealCodeName={this.mealCodeName}
                currency={this.currency}
                isEditable={this.isEditable}
                hasRoomEdit={this.hasRoomEdit}
                hasRoomDelete={this.hasRoomDelete}
                agent={this.agent}
                onAction={e => this.handleHeaderAction(e.detail)}
                onOpenHbDialog={() => (this.isHbDialogOpen = true)}
              ></ir-room-header>
              <ir-room-details
                room={this.room}
                booking={this.booking}
                mainGuest={this.mainGuest}
                bedPreferences={this.bedPreferences}
                language={this.language}
                includeDepartureTime={this.includeDepartureTime}
                hasCheckIn={this.hasCheckIn}
                hasCheckOut={this.hasCheckOut}
                onCheckIn={() => this.handleCheckIn()}
                onCheckOut={() => (this.modalReason = 'checkout')}
                onViewGuests={() => this.showGuestModal()}
                onOpenArrivalDialog={() => (this.isArrivalDialogOpen = true)}
                onOpenDepartureDialog={() => (this.isDepartureDialogOpen = true)}
              ></ir-room-details>
            </div>

            {!this.collapsed && <ir-room-breakdown room={this.room} booking={this.booking} currency={this.currency} clTransactions={this.clTransactions}></ir-room-breakdown>}
          </div>
        </div>
        <ir-room-extra-services
          room={this.room}
          booking={this.booking}
          isEditable={this.isEditable}
          agent={this.agent}
          currency={this.currency}
          language={this.language}
          svcCategories={this.svcCategories}
          clTransactions={this.clTransactions}
          onRequestAddExtraService={() => this.handleAddExtraServiceToUnit()}
        ></ir-room-extra-services>
        <ir-assignment-toggle-dialog ref={el => (this.toggleDialogRef = el)} loading={this.isToggling} onConfirmToggle={() => this.toggleRoomAgent()}>
          <span slot="message">
            Move {this.room.roomtype.name} {this.room.rateplan.short_name} {(this.room.unit as IUnit)?.name} to{' '}
            <b>{this.room.agent ? 'guest' : (this.booking?.agent?.name ?? 'agent')} folio</b>.
          </span>
        </ir-assignment-toggle-dialog>
        <ir-dialog
          label={this.modalReason === 'delete' ? 'Alert' : locales.entries.Lcz_Confirmation}
          ref={el => (this.modal = el)}
          onIrDialogHide={e => {
            e.stopImmediatePropagation();
            e.stopPropagation();
          }}
          onIrDialogAfterHide={e => {
            e.stopImmediatePropagation();
            e.stopPropagation();
            this.modalReason = null;
          }}
          lightDismiss={this.modalReason === 'checkin'}
        >
          <p>{this.renderModalMessage()}</p>
          <div slot="footer" class="ir-dialog__footer">
            <ir-custom-button size="m" data-dialog="close" appearance="filled" variant="neutral">
              {locales.entries.Lcz_Cancel}
            </ir-custom-button>
            <ir-custom-button size="m" loading={this.isLoading} onClickHandler={e => this.handleModalConfirmation(e)} variant={this.modalReason === 'delete' ? 'danger' : 'brand'}>
              {this.modalReason === 'delete' ? locales.entries.Lcz_Delete : locales.entries.Lcz_Confirm}
            </ir-custom-button>
          </div>
        </ir-dialog>
        <ir-checkout-dialog
          onCheckoutDialogClosed={e => {
            e.stopImmediatePropagation();
            e.stopPropagation();
            this.modalReason = null;
            if (e.detail.reason === 'openInvoice') {
              this.isOpen = true;
            } else if (e.detail.reason === 'checkout') {
              this.resetBookingEvt.emit();
            }
          }}
          identifier={this.room.identifier}
          open={this.modalReason === 'checkout'}
          booking={this.booking}
        ></ir-checkout-dialog>
        <ir-invoice
          onInvoiceClose={e => {
            e.stopImmediatePropagation();
            e.stopPropagation();
            this.isOpen = false;
          }}
          open={this.isOpen}
          booking={this.booking}
          roomIdentifier={this.room.identifier}
        ></ir-invoice>
        <ir-booking-pricing-drawer
          open={this.isPricingDrawerOpen}
          booking={this.booking}
          room={this.room}
          agent={this.agent}
          folioEntries={this.clTransactions}
          currencySymbol={this.booking?.currency?.symbol ?? ''}
          onCloseDrawer={() => (this.isPricingDrawerOpen = false)}
          onPricingSaved={() => {
            this.isPricingDrawerOpen = false;
            this.resetBookingEvt.emit(null);
          }}
        ></ir-booking-pricing-drawer>
        <ir-hb-preference-dialog
          room={this.room}
          open={this.isHbDialogOpen}
          onHbPreferenceClose={(e: CustomEvent<{ saved: boolean }>) => {
            e.stopImmediatePropagation();
            e.stopPropagation();
            this.isHbDialogOpen = false;
            if (e.detail.saved) {
              this.resetBookingEvt.emit(null);
            }
          }}
        ></ir-hb-preference-dialog>
        <ir-departure-time-dialog
          room={this.room}
          booking={this.booking}
          open={this.isDepartureDialogOpen}
          property_id={this.property_id}
          departureTime={this.departureTime}
          language={this.language}
          booking_nbr={this.booking.booking_nbr}
          currency_id={this.booking.currency.id}
          currencySymbol={this.currency}
          onDepartureTimeClose={(e: CustomEvent<{ saved: boolean }>) => {
            e.stopImmediatePropagation();
            e.stopPropagation();
            this.isDepartureDialogOpen = false;
            if (e.detail.saved) {
              this.resetBookingEvt.emit(null);
            }
          }}
        ></ir-departure-time-dialog>
        <ir-arrival-time-dialog
          room={this.room}
          booking={this.booking}
          open={this.isArrivalDialogOpen}
          property_id={this.property_id}
          arrivalTime={this.arrivalTime}
          language={this.language}
          booking_nbr={this.booking.booking_nbr}
          currency_id={this.booking.currency.id}
          currencySymbol={this.currency}
          onArrivalTimeClose={(e: CustomEvent<{ saved: boolean }>) => {
            e.stopImmediatePropagation();
            e.stopPropagation();
            this.isArrivalDialogOpen = false;
            if (e.detail.saved) {
              this.resetBookingEvt.emit(null);
            }
          }}
        ></ir-arrival-time-dialog>
      </Host>
    );
  }
}
