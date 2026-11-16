import type { PaginationChangeEvent } from '@/components/ir-pagination/ir-pagination';
import { Booking } from '@/models/booking.dto';
import ApiClient from '@/models/ApiClient';
import { BookingService } from '@/services/booking-service/booking.service';
import { SetupService } from '@/services/setup';
import { RoomService } from '@/services/room.service';
import { Component, Host, Listen, Prop, State, Watch, h } from '@stencil/core';
import { Payment, PaymentEntries, RoomGuestsPayload } from '../ir-booking-details/types';
import { arrivalsStore, initializeArrivalsStore, onArrivalsStoreChange, setArrivalsPage, setArrivalsPageSize, setArrivalsTotal } from '@/stores/arrivals.store';
import { ICountry } from '@/models/IBooking';
import calendar_data from '@/stores/calendar-data';
import { LocaleController } from '@/services/locale/locale.controller';
import { LanguageSync } from '@/services/locale/language-sync';
import { SCREEN_TABLES } from '@/services/locale/screen-tables';
import { t } from '@/services/locale/t';

@Component({
  tag: 'ir-arrivals',
  styleUrls: ['ir-arrivals.css'],
  scoped: true,
})
export class IrArrivals {
  /**
   * Authentication ApiClient issued by the PMS backend.
   * Required for initializing the component and making API calls.
   */
  @Prop() ticket: string;

  /**
   * ID of the property (hotel) for which arrivals should be displayed.
   * Used in API calls related to rooms, bookings, and check-ins.
   */
  @Prop() propertyid: number;

  /**
   * Two-letter language code (ISO) used for translations and API locale.
   * Defaults to `'en'`.
   */
  @Prop() language: string = 'en';

  /**
   * Property alias or short identifier used by backend endpoints (aname).
   * Passed to `getExposedProperty` when initializing the component.
   */
  @Prop() p: string;

  /**
   * Number of arrivals to load per page in the arrivals table.
   * Used to configure pagination via Arrivals Store.
   * Defaults to `20`.
   */
  @Prop() pageSize: number = 20;

  @State() bookingNumber: number;
  @State() booking: Booking;
  @State() paymentEntries: PaymentEntries;
  @State() isPageLoading: boolean;
  @State() payment: Payment;
  @State() roomGuestState: RoomGuestsPayload = null;
  @State() countries: ICountry[];

  private apiClientService = new ApiClient();
  private roomService = new RoomService();
  private bookingService = new BookingService();
  private setupService = new SetupService();

  private paymentFolioRef: HTMLIrPaymentFolioElement;

  /** Re-runs init when the language changes so server-localized data follows. */
  private languageSync = new LanguageSync(SCREEN_TABLES.arrivals, () => this.init());

  componentWillLoad() {
    if (this.ticket) {
      this.apiClientService.setApiClient(this.ticket);
      this.init();
    }
    setArrivalsPageSize(this.pageSize);
    onArrivalsStoreChange('today', _ => {
      this.getBookings();
    });
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

  @Watch('pageSize')
  handlePageSizeChange(newValue: number, oldValue: number) {
    if (newValue !== oldValue) setArrivalsPageSize(newValue);
  }

  @Watch('ticket')
  handleTicketChange(newValue: string, oldValue: string) {
    if (newValue !== oldValue && newValue) {
      this.apiClientService.setApiClient(this.ticket);
      this.init();
    }
  }

  @Listen('payBookingBalance')
  handleBookingPayment(e: CustomEvent) {
    e.stopImmediatePropagation();
    e.stopPropagation();
    const { booking_nbr, payment } = e.detail;
    this.booking = arrivalsStore.bookings.find(b => b.booking_nbr === booking_nbr);
    const paymentType = this.paymentEntries.types.find(p => p.CODE_NAME === payment.payment_type.code);
    this.payment = {
      ...payment,
      payment_type: {
        code: paymentType.CODE_NAME,
        description: paymentType.CODE_VALUE_EN,
        operation: paymentType.NOTES,
      },
    };
    this.paymentFolioRef.openFolio();
  }

  @Listen('openBookingDetails')
  handleOpen(e: CustomEvent) {
    this.bookingNumber = e.detail;
  }
  @Listen('resetExposedCancellationDueAmount')
  async handleResetExposedCancellationDueAmount(e: CustomEvent) {
    e.stopImmediatePropagation();
    e.stopPropagation();
    await this.getBookings();
  }
  private async init() {
    try {
      this.isPageLoading = true;
      // Started first: it seeds `LocaleController.language` from the host prop synchronously,
      // so the requests below are built with the right language on first mount.
      const localeReady = LocaleController.load({ language: this.language, tables: SCREEN_TABLES.arrivals });

      if (!this.propertyid && !this.p) {
        throw new Error('Missing credentials');
      }
      let propertyId = this.propertyid;

      if (!propertyId) {
        await this.roomService.getExposedProperty({
          id: 0,
          aname: this.p,
          language: LocaleController.language,
          is_backend: true,
        });
      }

      const [_, __, countries, paymentEntries] = await Promise.all([
        calendar_data?.property ? Promise.resolve(null) : this.roomService.getExposedProperty({ id: this.propertyid || 0, language: LocaleController.language, aname: this.p }),
        localeReady,
        this.bookingService.getCountries(LocaleController.language),
        this.setupService.getPaymentEntries(),
        this.getBookings(),
      ]);
      this.countries = countries;
      this.paymentEntries = paymentEntries;
      this.countries = countries;
      // Fetch bookings only after the property/calendar data is loaded — the arrivals
      // pipeline (canCheckIn) reads `calendar_data.property`, which is null until the
      // getExposedProperty calls above resolve.
      await this.getBookings();
    } catch (error) {
    } finally {
      this.isPageLoading = false;
    }
  }

  private async getBookings() {
    const { bookings, total_count } = await this.bookingService.getRoomsToCheckIn({
      property_id: calendar_data.property?.id?.toString() || this.propertyid?.toString(),
      check_in_date: arrivalsStore.today,
      page_index: arrivalsStore.pagination.currentPage,
      page_size: arrivalsStore.pagination.pageSize,
      language: LocaleController.language,
    });
    setArrivalsTotal(total_count ?? 0);
    initializeArrivalsStore(bookings);
  }

  private async handlePaginationChange(event: CustomEvent<PaginationChangeEvent>) {
    event.stopImmediatePropagation();
    event.stopPropagation();
    const nextPage = event.detail?.currentPage ?? 1;
    if (nextPage === arrivalsStore.pagination.currentPage) {
      return;
    }
    setArrivalsPage(nextPage);
    await this.getBookings();
  }

  private async handlePaginationPageSizeChange(event: CustomEvent<PaginationChangeEvent>) {
    event.stopImmediatePropagation();
    event.stopPropagation();
    const nextPageSize = event.detail?.pageSize;
    if (!Number.isFinite(nextPageSize)) {
      return;
    }
    const normalizedPageSize = Math.floor(Number(nextPageSize));
    if (normalizedPageSize === arrivalsStore.pagination.pageSize) {
      return;
    }
    setArrivalsPageSize(normalizedPageSize);
    await this.getBookings();
  }
  private handleCheckingRoom(event: CustomEvent<RoomGuestsPayload>): void {
    event.stopImmediatePropagation();
    event.stopPropagation();
    this.roomGuestState = event.detail;
  }

  @Listen('updateRoomGuests')
  handleResetBooking(e: CustomEvent) {
    e.stopImmediatePropagation();
    e.stopPropagation();
    this.getBookings();
  }
  // @Listen("resetBookingEvt")
  // handleResetBookings(e:CustomEvent){
  //   e.stopImmediatePropagation();
  //   e.stopPropagation();
  //   this.
  // }
  render() {
    if (this.isPageLoading) {
      return <ir-loading-screen></ir-loading-screen>;
    }
    return (
      <Host>
        <ir-toast></ir-toast>
        <ir-interceptor handledEndpoints={['/Get_Rooms_To_Check_in']}></ir-interceptor>
        <div class="ir-page__container">
          <h3 class="page-title">{t('Lcz_CheckIns', { fallback: 'Check-ins' })}</h3>
          {/* <ir-arrivals-filters></ir-arrivals-filters> */}
          <ir-arrivals-table
            onCheckInRoom={event => this.handleCheckingRoom(event as CustomEvent<RoomGuestsPayload>)}
            onRequestPageChange={event => this.handlePaginationChange(event as CustomEvent<PaginationChangeEvent>)}
            onRequestPageSizeChange={event => this.handlePaginationPageSizeChange(event as CustomEvent<PaginationChangeEvent>)}
          ></ir-arrivals-table>
          <ir-booking-details-drawer
            open={!!this.bookingNumber}
            propertyId={this.propertyid as any}
            bookingNumber={this.bookingNumber?.toString()}
            ticket={this.ticket}
            language={this.language}
            onBookingDetailsDrawerClosed={() => (this.bookingNumber = null)}
          ></ir-booking-details-drawer>
          <ir-payment-folio
            booking={this.booking}
            style={{ height: 'auto' }}
            bookingNumber={this.booking?.booking_nbr}
            paymentEntries={this.paymentEntries}
            payment={this.payment}
            mode={'payment-action'}
            ref={el => (this.paymentFolioRef = el)}
            onCloseModal={() => {
              this.booking = null;
              this.payment = null;
            }}
          ></ir-payment-folio>
          <ir-room-guests
            open={this.roomGuestState !== null}
            countries={this.countries}
            language={this.language}
            identifier={this.roomGuestState?.identifier}
            bookingNumber={this.roomGuestState?.booking_nbr?.toString()}
            roomName={this.roomGuestState?.roomName}
            totalGuests={this.roomGuestState?.totalGuests}
            sharedPersons={this.roomGuestState?.sharing_persons}
            checkIn={this.roomGuestState?.checkin}
            onCloseModal={() => (this.roomGuestState = null)}
          ></ir-room-guests>
        </div>
      </Host>
    );
  }
}
