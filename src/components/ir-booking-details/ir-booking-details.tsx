import { Component, Listen, h, Prop, Watch, State, Event, EventEmitter, Element, Fragment } from '@stencil/core';
import { Booking, ExtraService, Guest, IPmsLog, Room } from '@/models/booking.dto';
import axios from 'axios';
import { BookingService } from '@/services/booking.service';
import { IglBookPropertyPayloadAddRoom, TIglBookPropertyPayload } from '@/models/igl-book-property';
import { RoomService } from '@/services/room.service';
import locales from '@/stores/locales.store';
import { IToast } from '../ir-toast/toast';
import { ICountry, IEntries } from '@/models/IBooking';
import { IPaymentAction, PaymentService } from '@/services/payment.service';
import Token from '@/models/Token';
import { BookingDetailsSidebarEvents, OpenSidebarEvent } from './types';

@Component({
  tag: 'ir-booking-details',
  styleUrl: 'ir-booking-details.css',
  scoped: true,
})
export class IrBookingDetails {
  @Element() element: HTMLElement;
  // Setup Data
  @Prop() language: string = '';
  @Prop() ticket: string = '';
  @Prop() bookingNumber: string = '';
  @Prop() propertyid: number;
  @Prop() is_from_front_desk = false;
  @Prop() p: string;
  // Booleans Conditions
  @Prop() hasPrint: boolean = false;
  @Prop() hasReceipt: boolean = false;
  @Prop() hasDelete: boolean = false;
  @Prop() hasMenu: boolean = false;

  // Room Booleans
  @Prop() hasRoomEdit: boolean = false;
  @Prop() hasRoomDelete: boolean = false;
  @Prop() hasRoomAdd: boolean = false;
  @Prop() hasCheckIn: boolean = false;
  @Prop() hasCheckOut: boolean = false;
  @Prop() hasCloseButton = false;

  @State() bookingItem: TIglBookPropertyPayload | null = null;
  @State() statusData = [];

  @State() showPaymentDetails: any;
  @State() booking: Booking;
  @State() countryNodeList: ICountry[];
  @State() calendarData: any = {};
  // Guest Data
  @State() guestData: Guest = null;
  // Rerender Flag
  @State() rerenderFlag = false;
  @State() sidebarState: BookingDetailsSidebarEvents | null = null;
  @State() isUpdateClicked = false;

  @State() pms_status: IPmsLog;
  @State() isPMSLogLoading: boolean = false;
  @State() paymentActions: IPaymentAction[];
  @State() property_id: number;
  @State() selectedService: ExtraService;
  @State() bedPreference: IEntries[];
  // Payment Event
  @Event() toast: EventEmitter<IToast>;
  @Event() bookingChanged: EventEmitter<Booking>;
  @Event() closeSidebar: EventEmitter<null>;

  private bookingService = new BookingService();
  private roomService = new RoomService();
  private paymentService = new PaymentService();
  private token = new Token();

  private printingBaseUrl = 'https://gateway.igloorooms.com/PrintBooking/%1/printing?id=%2';

  componentWillLoad() {
    if (this.ticket !== '') {
      this.token.setToken(this.ticket);
      this.initializeApp();
    }
  }

  @Watch('ticket')
  ticketChanged(newValue: string, oldValue: string) {
    if (newValue === oldValue) {
      return;
    }
    this.token.setToken(this.ticket);
    this.initializeApp();
  }

  @Listen('openSidebar')
  handleSideBarEvents(e: CustomEvent<OpenSidebarEvent>) {
    this.sidebarState = e.detail.type;
  }

  @Listen('clickHandler')
  handleIconClick(e: CustomEvent) {
    const target = e.target as HTMLIrButtonElement;
    switch (target.id) {
      case 'pickup':
        this.sidebarState = 'pickup';
        return;
      case 'close':
        this.closeSidebar.emit(null);
        return;
      case 'print':
        this.openPrintingScreen();
        return;
      case 'receipt':
        this.openPrintingScreen('invoice');
        return;
      case 'book-delete':
        return;
      case 'menu':
        window.location.href = 'https://x.igloorooms.com/manage/acbookinglist.aspx';
        return;
      case 'room-add':
        (this.bookingItem as IglBookPropertyPayloadAddRoom) = {
          ID: '',
          NAME: this.booking.guest.last_name,
          EMAIL: this.booking.guest.email,
          PHONE: this.booking.guest.mobile,
          REFERENCE_TYPE: '',
          FROM_DATE: this.booking.from_date,
          ARRIVAL: this.booking.arrival,
          TO_DATE: this.booking.to_date,
          TITLE: `${locales.entries.Lcz_AddingUnitToBooking}# ${this.booking.booking_nbr}`,
          defaultDateRange: {
            fromDate: new Date(this.booking.from_date),
            fromDateStr: '',
            toDate: new Date(this.booking.to_date),
            toDateStr: '',
            dateDifference: 0,
            message: '',
          },
          event_type: 'ADD_ROOM',
          booking: this.booking,
          BOOKING_NUMBER: this.booking.booking_nbr,
          ADD_ROOM_TO_BOOKING: this.booking.booking_nbr,
          GUEST: this.booking.guest,
          message: this.booking.remark,
          SOURCE: this.booking.source,
          ROOMS: this.booking.rooms,
        };
        return;
      case 'extra_service_btn':
        this.sidebarState = 'extra_service';
        return;
      case 'add-payment':
        return;
    }
  }

  @Listen('resetExposedCancelationDueAmount')
  async handleResetExposedCancellationDueAmount(e: CustomEvent) {
    e.stopImmediatePropagation();
    e.stopPropagation();
    //TODO: Payment action
    const paymentActions = await this.paymentService.GetExposedCancellationDueAmount({ booking_nbr: this.booking.booking_nbr, currency_id: this.booking.currency.id });
    this.paymentActions = [...paymentActions];
  }
  @Listen('editInitiated')
  handleEditInitiated(e: CustomEvent<TIglBookPropertyPayload>) {
    this.bookingItem = e.detail;
  }

  @Listen('resetBookingEvt')
  async handleResetBooking(e: CustomEvent<Booking | null>) {
    e.stopPropagation();
    e.stopImmediatePropagation();
    if (e.detail) {
      return (this.booking = e.detail);
    }
    await this.resetBooking();
  }
  @Listen('editExtraService')
  handleEditExtraService(e: CustomEvent) {
    this.selectedService = e.detail;
    this.sidebarState = 'extra_service';
  }

  private setRoomsData(roomServiceResp) {
    let roomsData: { [key: string]: any }[] = new Array();
    if (roomServiceResp.My_Result?.roomtypes?.length) {
      roomsData = roomServiceResp.My_Result.roomtypes;
      roomServiceResp.My_Result.roomtypes.forEach(roomCategory => {
        roomCategory.expanded = true;
      });
    }
    this.calendarData.roomsInfo = roomsData;
  }
  private async initializeApp() {
    try {
      const [roomResponse, languageTexts, countriesList, bookingDetails, bedPreference] = await Promise.all([
        this.roomService.getExposedProperty({ id: this.propertyid || 0, language: this.language, aname: this.p }),
        this.roomService.fetchLanguage(this.language),
        this.bookingService.getCountries(this.language),
        this.bookingService.getExposedBooking(this.bookingNumber, this.language),
        this.bookingService.getBedPreferences(),
      ]);
      this.property_id = roomResponse?.My_Result?.id;
      this.bedPreference = bedPreference;
      if (bookingDetails?.booking_nbr && bookingDetails?.currency?.id && bookingDetails.is_direct) {
        this.paymentService
          .GetExposedCancellationDueAmount({
            booking_nbr: bookingDetails.booking_nbr,
            currency_id: bookingDetails.currency.id,
          })
          .then(res => {
            this.paymentActions = res;
          });
      }
      if (!locales?.entries) {
        locales.entries = languageTexts.entries;
        locales.direction = languageTexts.direction;
      }
      this.countryNodeList = countriesList;
      const myResult = roomResponse?.My_Result;
      if (myResult) {
        const { allowed_payment_methods: paymentMethods, currency, allowed_booking_sources, adult_child_constraints, calendar_legends, aname } = myResult;
        this.printingBaseUrl = this.printingBaseUrl.replace('%1', aname).replace('%2', this.bookingNumber);
        this.calendarData = {
          currency,
          allowed_booking_sources,
          adult_child_constraints,
          legendData: calendar_legends,
        };
        this.setRoomsData(roomResponse);
        const paymentCodesToShow = ['001', '004'];
        this.showPaymentDetails = paymentMethods?.some(method => paymentCodesToShow.includes(method.code));
      } else {
        console.warn("Room response is missing 'My_Result'.");
      }

      // Set guest and booking data
      this.guestData = bookingDetails.guest;
      this.booking = bookingDetails;
    } catch (error) {
      console.error('Error initializing app:', error);
    }
  }

  private async openPrintingScreen(mode: 'invoice' | 'print' = 'print', version: 'old' | 'new' = 'new') {
    if (version === 'old') {
      if (mode === 'invoice') {
        return window.open(`https://x.igloorooms.com/manage/AcBookingEdit.aspx?IRID=${this.booking.system_id}&&PM=I&TK=${this.ticket}`);
      }
      return window.open(`https://x.igloorooms.com/manage/AcBookingEdit.aspx?IRID=${this.booking.system_id}&&PM=B&TK=${this.ticket}`);
    }
    let url = this.printingBaseUrl;
    if (mode === 'invoice') {
      url = url + '&mode=invoice';
    }
    const { data } = await axios.post(`Get_ShortLiving_Token`);
    if (!data.ExceptionMsg) {
      url = url + `&token=${data.My_Result}`;
    }
    window.open(url);
  }

  private handleCloseBookingWindow() {
    this.bookingItem = null;
  }

  private handleDeleteFinish(e: CustomEvent) {
    this.booking = { ...this.booking, rooms: this.booking.rooms.filter(room => room.identifier !== e.detail) };
  }

  private async resetBooking() {
    try {
      const booking = await this.bookingService.getExposedBooking(this.bookingNumber, this.language);
      this.booking = { ...booking };
      this.bookingChanged.emit(this.booking);
    } catch (error) {
      console.log(error);
    }
  }

  private renderSidebarContent() {
    const handleClose = () => {
      this.sidebarState = null;
    };
    switch (this.sidebarState) {
      case 'guest':
        return (
          <ir-guest-info
            headerShown
            slot="sidebar-body"
            booking_nbr={this.bookingNumber}
            email={this.booking?.guest.email}
            language={this.language}
            onCloseSideBar={handleClose}
          ></ir-guest-info>
        );
      case 'pickup':
        return (
          <ir-pickup
            slot="sidebar-body"
            defaultPickupData={this.booking.pickup_info}
            bookingNumber={this.booking.booking_nbr}
            numberOfPersons={this.booking.occupancy.adult_nbr + this.booking.occupancy.children_nbr}
            onCloseModal={handleClose}
          ></ir-pickup>
        );
      case 'extra_note':
        return <ir-booking-extra-note slot="sidebar-body" booking={this.booking} onCloseModal={() => (this.sidebarState = null)}></ir-booking-extra-note>;
      case 'extra_service':
        return (
          <ir-extra-service-config
            service={this.selectedService}
            booking={{ from_date: this.booking.from_date, to_date: this.booking.to_date, booking_nbr: this.booking.booking_nbr, currency: this.booking.currency }}
            slot="sidebar-body"
            onCloseModal={() => {
              handleClose();
              if (this.selectedService) {
                this.selectedService = null;
              }
            }}
          ></ir-extra-service-config>
        );
      default:
        return null;
    }
  }
  render() {
    if (!this.booking) {
      return (
        <div class={'loading-container'}>
          <ir-spinner></ir-spinner>
        </div>
      );
    }
    return [
      <Fragment>
        {!this.is_from_front_desk && (
          <Fragment>
            <ir-toast></ir-toast>
            <ir-interceptor></ir-interceptor>
          </Fragment>
        )}
      </Fragment>,
      <ir-booking-header
        booking={this.booking}
        hasCloseButton={this.hasCloseButton}
        hasDelete={this.hasDelete}
        hasMenu={this.hasMenu}
        hasPrint={this.hasPrint}
        hasReceipt={this.hasReceipt}
      ></ir-booking-header>,
      <div class="fluid-container p-1 text-left mx-0">
        <div class="row m-0">
          <div class="col-12 p-0 mx-0 pr-lg-1 col-lg-6">
            <ir-reservation-information countries={this.countryNodeList} booking={this.booking}></ir-reservation-information>
            <div class="font-size-large d-flex justify-content-between align-items-center mb-1">
              <ir-date-view from_date={this.booking.from_date} to_date={this.booking.to_date}></ir-date-view>
              {this.hasRoomAdd && this.booking.is_direct && this.booking.is_editable && (
                <ir-button id="room-add" icon_name="square_plus" variant="icon" style={{ '--icon-size': '1.5rem' }}></ir-button>
              )}
            </div>
            <div class="card p-0 mx-0">
              {this.booking.rooms.map((room: Room, index: number) => {
                return [
                  <ir-room
                    language={this.language}
                    bedPreferences={this.bedPreference}
                    isEditable={this.booking.is_editable}
                    legendData={this.calendarData.legendData}
                    roomsInfo={this.calendarData.roomsInfo}
                    myRoomTypeFoodCat={room.roomtype.name}
                    mealCodeName={room.rateplan.short_name}
                    currency={this.booking.currency.symbol}
                    hasRoomEdit={this.hasRoomEdit && this.booking.status.code !== '003' && this.booking.is_direct}
                    hasRoomDelete={this.hasRoomDelete && this.booking.status.code !== '003' && this.booking.is_direct}
                    hasCheckIn={this.hasCheckIn}
                    hasCheckOut={this.hasCheckOut}
                    bookingEvent={this.booking}
                    bookingIndex={index}
                    onDeleteFinished={this.handleDeleteFinish.bind(this)}
                  />,
                  index !== this.booking.rooms.length - 1 && <hr class="mr-2 ml-2 my-0 p-0" />,
                ];
              })}
            </div>
            <ir-pickup-view booking={this.booking}></ir-pickup-view>
            <section>
              <div class="font-size-large d-flex justify-content-between align-items-center mb-1">
                <p class={'font-size-large p-0 m-0 '}>{locales.entries.Lcz_ExtraServices}</p>
                <ir-button id="extra_service_btn" icon_name="square_plus" variant="icon" style={{ '--icon-size': '1.5rem' }}></ir-button>
              </div>
              <ir-extra-services
                booking={{ booking_nbr: this.booking.booking_nbr, currency: this.booking.currency, extra_services: this.booking.extra_services }}
              ></ir-extra-services>
            </section>
          </div>
          <div class="col-12 p-0 m-0 pl-lg-1 col-lg-6">
            <ir-payment-details paymentActions={this.paymentActions} bookingDetails={this.booking}></ir-payment-details>
          </div>
        </div>
      </div>,
      <ir-sidebar
        open={this.sidebarState !== null}
        side={'right'}
        id="editGuestInfo"
        onIrSidebarToggle={e => {
          e.stopImmediatePropagation();
          e.stopPropagation();
          this.sidebarState = null;
        }}
        showCloseButton={false}
      >
        {this.renderSidebarContent()}
      </ir-sidebar>,
      <Fragment>
        {this.bookingItem && (
          <igl-book-property
            allowedBookingSources={this.calendarData.allowed_booking_sources}
            adultChildConstraints={this.calendarData.adult_child_constraints}
            showPaymentDetails={this.showPaymentDetails}
            countryNodeList={this.countryNodeList}
            currency={this.calendarData.currency}
            language={this.language}
            propertyid={this.property_id}
            bookingData={this.bookingItem}
            onCloseBookingWindow={() => this.handleCloseBookingWindow()}
          ></igl-book-property>
        )}
      </Fragment>,
    ];
  }
}
