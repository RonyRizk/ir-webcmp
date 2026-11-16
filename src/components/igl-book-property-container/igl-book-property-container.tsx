import { IglBookPropertyPayloadPlusBooking } from '@/models/igl-book-property';
import ApiClient from '@/models/ApiClient';
import { BookingService } from '@/services/booking-service/booking.service';
import { RoomService } from '@/services/room.service';
import { Component, Host, State, h, Prop, Watch, Event, EventEmitter, Fragment } from '@stencil/core';
import { ICountry } from '@/models/IBooking';
import { LocaleController } from '@/services/locale/locale.controller';
import { LanguageSync } from '@/services/locale/language-sync';
import { SCREEN_TABLES } from '@/services/locale/screen-tables';
import { t } from '@/services/locale/t';
import { addDaysISO, todayISO } from '@/utils/calendar-dates';
@Component({
  tag: 'igl-book-property-container',
  styleUrl: 'igl-book-property-container.css',
  scoped: true,
})
export class IglBookPropertyContainer {
  @Prop() language: string = '';
  @Prop() ticket: string = '';
  @Prop() p: string;
  @Prop() propertyid: number;
  @Prop() from_date: string;
  @Prop() to_date: string;
  @Prop() withIrToastAndInterceptor: boolean = true;

  @State() bookingItem: IglBookPropertyPayloadPlusBooking | null;
  @State() showPaymentDetails: any;
  @State() countries: ICountry[];
  @State() calendarData: any = {};

  @Event() resetBookingData: EventEmitter<null>;

  private bookingService = new BookingService();
  private roomService = new RoomService();
  private ApiClient = new ApiClient();

  setRoomsData(roomServiceResp) {
    let roomsData: { [key: string]: any }[] = new Array();
    if (roomServiceResp.My_Result?.roomtypes?.length) {
      roomsData = roomServiceResp.My_Result.roomtypes;
      roomServiceResp.My_Result.roomtypes.forEach(roomCategory => {
        roomCategory.expanded = true;
      });
    }
    this.calendarData.roomsInfo = roomsData;
  }
  async initializeApp() {
    try {
      // Started first: it seeds `LocaleController.language` from the host prop synchronously,
      // so the requests below are built with the right language on first mount.
      const localeReady = LocaleController.load({ language: this.language, tables: SCREEN_TABLES.bookProperty });
      if (!this.propertyid && !this.p) {
        throw new Error('Property ID or username is required');
      }
      const [roomResponse, , countriesList] = await Promise.all([
        this.roomService.getExposedProperty({ id: this.propertyid, language: LocaleController.language, aname: this.p }),
        localeReady,
        this.bookingService.getCountries(LocaleController.language),
      ]);
      this.countries = countriesList;

      const { allowed_payment_methods: paymentMethods, currency, allowed_booking_sources, adult_child_constraints, calendar_legends } = roomResponse['My_Result'];
      this.calendarData = { currency, allowed_booking_sources, adult_child_constraints, legendData: calendar_legends };
      this.setRoomsData(roomResponse);
      const paymentCodesToShow = ['001', '004'];
      this.showPaymentDetails = paymentMethods.some(method => paymentCodesToShow.includes(method.code));
    } catch (error) {
      console.error('Error initializing app:', error);
    }
  }
  /** Re-runs init when the language changes so server-localized data follows. */
  private languageSync = new LanguageSync(SCREEN_TABLES.bookProperty, () => this.initializeApp());

  componentWillLoad() {
    if (this.ticket !== '') {
      this.ApiClient.setApiClient(this.ticket);
      this.initializeApp();
    }
  }

  componentDidLoad() {
    this.languageSync.connect();
  }

  disconnectedCallback() {
    this.languageSync.disconnect();
  }

  @Watch('language')
  languageChanged(next: string, previous: string) {
    this.languageSync.propChanged(next, previous);
  }
  @Watch('ticket')
  ticketChanged(newValue: string, oldValue: string) {
    if (newValue === oldValue) {
      return;
    }
    this.ApiClient.setApiClient(this.ticket);
    this.initializeApp();
  }
  handleCloseBookingWindow() {
    this.bookingItem = null;
  }
  handleTriggerClicked() {
    const today = todayISO();
    (this.bookingItem as IglBookPropertyPayloadPlusBooking) = {
      FROM_DATE: this.from_date,
      defaultDateRange: {
        fromDate: today,
        toDate: addDaysISO(today, 1),
        dateDifference: 0,
        message: '',
      },
      TO_DATE: this.to_date,
      EMAIL: '',
      event_type: 'PLUS_BOOKING',
      ID: '',
      NAME: '',
      PHONE: '',
      REFERENCE_TYPE: '',
      TITLE: t('Lcz_NewBooking', { fallback: 'New Booking' }),
    };
  }
  render() {
    return (
      <Host>
        {this.withIrToastAndInterceptor && (
          <Fragment>
            <ir-toast></ir-toast>
            <ir-interceptor></ir-interceptor>
          </Fragment>
        )}

        <div class="book-container" onClick={this.handleTriggerClicked.bind(this)}>
          <slot name="trigger"></slot>
        </div>
        {this.bookingItem && (
          <igl-book-property
            allowedBookingSources={this.calendarData.allowed_booking_sources}
            adultChildConstraints={this.calendarData.adult_child_constraints}
            showPaymentDetails={this.showPaymentDetails}
            countries={this.countries}
            currency={this.calendarData.currency}
            language={this.language}
            propertyid={this.propertyid}
            bookingData={this.bookingItem}
            onResetBookingEvt={(e: CustomEvent) => {
              e.stopImmediatePropagation();
              e.stopPropagation();
              this.resetBookingData.emit(null);
            }}
            onCloseBookingWindow={() => this.handleCloseBookingWindow()}
          ></igl-book-property>
        )}
      </Host>
    );
  }
}
