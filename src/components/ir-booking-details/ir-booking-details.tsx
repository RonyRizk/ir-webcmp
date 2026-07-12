import { Component, Listen, h, Prop, Watch, State, Event, EventEmitter, Element, Fragment, Host } from '@stencil/core';
import { Booking, ExtraService, Guest, IPmsLog, SharedPerson } from '@/models/booking.dto';
import axios from 'axios';
import { BookingService } from '@/services/booking-service/booking.service';
import { IglBookPropertyPayloadAddRoom, TIglBookPropertyPayload } from '@/models/igl-book-property';
import { RoomService } from '@/services/room.service';
import locales from '@/stores/locales.store';
import { ICountry, IEntries } from '@/models/IBooking';
import { IPaymentAction, PaymentService } from '@/services/payment.service';
import Token from '@/models/Token';
import { BookingDetailsSidebarEvents, OpenSidebarEvent, PaymentEntries, PrintScreenOptions } from './types';
import calendar_data from '@/stores/calendar-data';
import { isRequestPending } from '@/stores/ir-interceptor.store';
import { buildSplitIndex, SplitIndex } from '@/utils/booking';
import { AgentsService } from '@/services/agents/agents.service';
import { Agent } from '@/services/agents/type';
import { CityLedgerService, type ClTx } from '@/services/city-ledger';
import { mapClTxToFolioRow, FolioRow } from '@/components/ir-city-ledger/ir-city-ledger-folio/types';
import { isAgentMode } from './functions';
import { realtimeService, type RealtimeMessage } from '@/services/realtime/realtime.service';

@Component({
  tag: 'ir-booking-details',
  styleUrls: ['ir-booking-details.css'],
  scoped: true,
})
export class IrBookingDetails {
  private bookingService = new BookingService();
  private roomService = new RoomService();
  private paymentService = new PaymentService();
  private agentService = new AgentsService();
  private cityLedgerService = new CityLedgerService();
  private unsubscribeRealtime: (() => void) | null = null;
  private clLockingPending = new Map<number, boolean>();
  private clLockingTimer: ReturnType<typeof setTimeout> | null = null;

  private token = new Token();
  private arrivalTime: IEntries[];
  private svcCategories: IEntries[];

  private printingBaseUrl = 'https://gateway.igloorooms.com/PrintBooking/%1/printing/fd?id=%2';
  // private printingBaseUrl = 'http://localhost:5863/%1/printing?id=%2';
  private modalRef: HTMLIrDialogElement;
  private paymentFolioRef: HTMLIrPaymentFolioElement;

  @Element() element: HTMLElement;

  @State() bedPreference: IEntries[];
  @State() booking: Booking;
  @State() bookingItem: TIglBookPropertyPayload | null = null;
  @State() calendarData: any = {};
  @State() countries: ICountry[];
  @State() departureTime: IEntries[];
  @State() guestData: Guest = null;
  @State() isPMSLogLoading: boolean = false;
  @State() isUpdateClicked = false;
  @State() modalState: { type: 'email' | (string & {}); message: string; loading: boolean } = null;
  @State() paymentActions: IPaymentAction[];
  @State() paymentEntries: PaymentEntries;
  @State() pms_status: IPmsLog;
  @State() property_id: number;
  @State() rerenderFlag = false;
  @State() roomGuest: any;
  @State() selectedService: ExtraService;
  @State() showPaymentDetails: any;
  @State() sidebarPayload: any;
  @State() sidebarState: BookingDetailsSidebarEvents | null = null;
  @State() splitIndex: SplitIndex;
  @State() statusData = [];
  @State() agent: Agent;
  @State() isLoading: boolean = true;
  @State() folioRows: FolioRow[] = [];
  @State() rawTransactions: ClTx[] = [];
  @State() clLoading: boolean = false;
  @State() clError: string | null = null;
  @State() agents: Agent[] = [];

  /**
   * Booking number used to fetch booking details.
   */
  @Prop() bookingNumber: string = '';

  /**
   * Enables the check-in action in room components.
   */
  @Prop() hasCheckIn: boolean = false;

  /**
   * Enables the check-out action in room components.
   */
  @Prop() hasCheckOut: boolean = false;

  /**
   * Displays the close button in the booking header.
   */
  @Prop() hasCloseButton = false;

  /**
   * Enables the delete booking action.
   */
  @Prop() hasDelete: boolean = false;

  /**
   * Displays the navigation menu button.
   */
  @Prop() hasMenu: boolean = false;

  /**
   * Enables the print booking option.
   */
  @Prop() hasPrint: boolean = false;

  /**
   * Enables the receipt action in the booking header.
   */
  @Prop() hasReceipt: boolean = false;

  /**
   * Allows adding new rooms to the booking.
   */
  @Prop() hasRoomAdd: boolean = false;

  /**
   * Allows deleting rooms from the booking.
   */
  @Prop() hasRoomDelete: boolean = false;

  /**
   * Allows editing existing rooms in the booking.
   */
  @Prop() hasRoomEdit: boolean = false;

  /**
   * Indicates whether the component is rendered from the front desk context.
   * Disables interceptor and toast rendering when true.
   */
  @Prop() is_from_front_desk = false;

  /**
   * Active language code used for translations and API requests.
   * Defaults to 'en'.
   */
  @Prop() language: string = 'en';

  /**
   * Property alias or account name used when fetching exposed property data.
   */
  @Prop() p: string;

  /**
   * Property ID used to retrieve property-specific configuration.
   */
  @Prop() propertyid: number;

  /**
   * Authentication token used to initialize the component.
   * Triggers re-initialization when changed.
   */
  @Prop() ticket: string = '';

  @Watch('ticket')
  ticketChanged(newValue: string, oldValue: string) {
    if (newValue === oldValue) {
      return;
    }
    this.token.setToken(this.ticket);
    this.initializeApp();
  }

  /**
   * Emitted whenever the booking object is updated.
   * Used to notify parent components about booking state changes.
   */
  @Event() bookingChanged: EventEmitter<Booking>;

  /**
   * Emitted when the sidebar should be closed.
   * Typically triggered by header actions (e.g., close button).
   */
  @Event() closeSidebar: EventEmitter<null>;

  componentWillLoad() {
    if (this.ticket !== '') {
      this.token.setToken(this.ticket);
      this.initializeApp();
    }
  }

  disconnectedCallback() {
    this.unsubscribeRealtime?.();
    this.unsubscribeRealtime = null;
    if (this.clLockingTimer !== null) {
      clearTimeout(this.clLockingTimer);
      this.clLockingTimer = null;
    }
  }

  @Listen('openSidebar')
  handleSideBarEvents(e: CustomEvent<OpenSidebarEvent<unknown>>) {
    this.sidebarState = e.detail.type;
    this.sidebarPayload = e.detail.payload;
    if (this.sidebarState === 'payment-folio') {
      this.paymentFolioRef.openFolio();
    }
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
      case 'email':
        this.modalState = {
          type: 'email',
          message: locales.entries.Lcz_EmailBookingto.replace('%1', this.booking.guest.email),
          loading: isRequestPending('/Send_Booking_Confirmation_Email'),
        };
        this.modalRef.openModal();
        return;
      case 'print':
        this.openPrintingScreen({ mode: 'printing' });
        return;
      case 'invoice':
        // this.openPrintingScreen({ mode: 'invoice' });
        this.sidebarState = 'invoice';
        return;
      case 'book-delete':
        return;
      case 'menu':
        window.history.back();
        // window.location.href = 'https://x.igloorooms.com/manage/acbookinglist.aspx';
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

  @Listen('resetExposedCancellationDueAmount')
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
  @Listen('updateRoomGuests')
  handleRoomGuestsUpdate(e: CustomEvent<{ identifier: string; guests: SharedPerson[] }>) {
    const { identifier, guests } = e.detail;
    const rooms = [...this.booking.rooms];
    let currentRoomIndex = rooms.findIndex(r => r.identifier === identifier);
    if (currentRoomIndex === -1) {
      return;
    }
    const currentRoom = rooms[currentRoomIndex];
    const updatedRoom = { ...currentRoom, sharing_persons: guests };
    rooms[currentRoomIndex] = updatedRoom;
    this.booking = { ...this.booking, rooms: [...rooms] };
    this.splitIndex = buildSplitIndex(this.booking.rooms);
  }

  @Listen('resetBookingEvt')
  async handleResetBooking(e: CustomEvent<Booking | null>) {
    if (e.detail) {
      this.booking = e.detail;
      this.splitIndex = buildSplitIndex(this.booking.rooms);
      await this.loadAgentAndFolio(e.detail);
      return;
    }
    await this.resetBooking();
  }
  @Listen('editExtraService')
  handleEditExtraService(e: CustomEvent) {
    this.selectedService = e.detail;
    this.sidebarState = 'extra_service';
  }
  @Listen('openPrintScreen')
  handleOpenPrintScreen(e: CustomEvent<PrintScreenOptions>) {
    this.openPrintingScreen(e.detail);
  }

  private async fetchCityLedger(booking: Booking = this.booking) {
    if (!booking?.agent) return;
    this.clLoading = true;
    this.clError = null;
    try {
      const result = await this.cityLedgerService.fetchCL({
        AGENCY_ID: booking.agent.id,
        START_DATE: booking.from_date,
        END_DATE: booking.to_date,
        START_ROW: 0,
        END_ROW: 200,
        SEARCH_QUERY: booking.booking_nbr,
      });
      let runningBalance = 0;
      this.folioRows = result.My_Cl_tx.map((tx, i) => {
        runningBalance = runningBalance + tx.DEBIT - tx.CREDIT;
        return { _rowId: String(i), ...mapClTxToFolioRow(tx), balance: runningBalance };
      });
      this.rawTransactions = result.My_Cl_tx;
    } catch (err) {
      console.error('[ir-booking-details] fetchCL failed:', err);
      this.clError = 'Failed to load city ledger.';
    } finally {
      this.clLoading = false;
    }
  }

  private async loadAgentAndFolio(booking: Booking, propertyId?: number): Promise<void> {
    this.unsubscribeRealtime?.();
    this.unsubscribeRealtime = null;

    const pid = propertyId ?? this.property_id;
    this.agent = this.agents?.find(a => a.id === booking?.agent?.id) ?? null;

    if (!this.agent) {
      this.folioRows = [];
      this.rawTransactions = [];
      return;
    }
    if (isAgentMode(this.agent)) {
      await this.fetchCityLedger(booking);
      if (pid) {
        this.unsubscribeRealtime = realtimeService.subscribe(pid, msg => {
          this.handleClSocketMessage(msg);
        });
      }
    }
  }

  private handleClSocketMessage(msg: RealtimeMessage): void {
    if (msg.reason === 'CL_TX_LOCKING') {
      const tx = msg.payload;
      if (tx.TRAVEL_AGENCY_ID !== this.agent?.id) return;
      // Accumulate — later arrivals for the same ID overwrite earlier ones
      this.clLockingPending.set(tx.CL_TX_ID, tx.IS_LOCKED);
      if (this.clLockingTimer !== null) clearTimeout(this.clLockingTimer);
      this.clLockingTimer = setTimeout(() => {
        this.clLockingTimer = null;
        this.applyClLockingUpdates();
      }, 150);
    } else if (msg.reason === 'CL_TX_HOLD_TOGGLED') {
      const { cl_tx_id, agency_id, is_hold } = msg.payload;
      if (agency_id !== this.agent?.id) return;
      this.rawTransactions = this.rawTransactions.map(tx => (tx.CL_TX_ID === cl_tx_id ? { ...tx, IS_HOLD: is_hold } : tx));
      this.folioRows = this.folioRows.map(r =>
        r._raw.CL_TX_ID === cl_tx_id ? { ...mapClTxToFolioRow({ ...r._raw, IS_HOLD: is_hold }), _rowId: r._rowId, balance: r.balance } : r,
      );
    } else if (msg.reason === 'CL_TX_CREATED') {
      this.fetchCityLedger();
    }
  }

  private applyClLockingUpdates(): void {
    const pending = this.clLockingPending;
    this.clLockingPending = new Map();
    this.rawTransactions = this.rawTransactions.map(tx => {
      const isLocked = pending.get(tx.CL_TX_ID);
      return isLocked !== undefined ? { ...tx, IS_LOCKED: isLocked } : tx;
    });
    this.folioRows = this.folioRows.map(r => {
      const isLocked = pending.get(r._raw.CL_TX_ID);
      if (isLocked === undefined) return r;
      return { ...mapClTxToFolioRow({ ...r._raw, IS_LOCKED: isLocked }), _rowId: r._rowId, balance: r.balance };
    });
  }

  @Listen('clRefreshNeeded')
  async handleClRefresh() {
    await this.fetchCityLedger();
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
      this.isLoading = true;
      const [roomResponse, languageTexts, countriesList, bookingDetails, setupEntries, agents] = await Promise.all([
        this.roomService.getExposedProperty({ id: this.propertyid || 0, language: this.language, aname: this.p }),
        this.roomService.fetchLanguage(this.language),
        this.bookingService.getCountries(this.language),
        this.bookingService.getExposedBooking({ booking_nbr: this.bookingNumber, language: this.language, include_dp_pricing: true }),
        this.bookingService.getSetupEntriesByTableNameMulti([
          '_BED_PREFERENCE_TYPE',
          '_DEPARTURE_TIME',
          '_PAY_TYPE',
          '_PAY_TYPE_GROUP',
          '_PAY_METHOD',
          '_ARRIVAL_TIME',
          '_SVC_CATEGORY',
        ]),
        this.agentService.getExposedAgents({ property_id: this.propertyid || 0 }),
      ]);
      this.agents = agents;
      const resolvedPropertyId = roomResponse?.My_Result?.id;
      await this.loadAgentAndFolio(bookingDetails, resolvedPropertyId);
      this.property_id = resolvedPropertyId;
      const { bed_preference_type, svc_category, departure_time, pay_type, pay_type_group, pay_method, arrival_time } = this.bookingService.groupEntryTablesResult(setupEntries);
      this.bedPreference = bed_preference_type;
      this.svcCategories = svc_category;
      this.departureTime = departure_time;
      this.paymentEntries = { types: pay_type, groups: pay_type_group, methods: pay_method };
      this.arrivalTime = arrival_time;
      if (!locales?.entries) {
        locales.entries = languageTexts.entries;
        locales.direction = languageTexts.direction;
      }
      this.countries = countriesList;
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
      this.splitIndex = buildSplitIndex(this.booking.rooms);
    } catch (error) {
      console.error('Error initializing app:', error);
    } finally {
      this.isLoading = false;
    }
  }

  private async openPrintingScreen(options: PrintScreenOptions, version: 'old' | 'new' = 'new') {
    const { mode } = options;

    if (version === 'old') {
      if (mode === 'invoice') {
        return window.open(`https://x.igloorooms.com/manage/AcBookingEdit.aspx?IRID=${encodeURIComponent(this.booking.system_id)}&&PM=I&TK=${encodeURIComponent(this.ticket)}`);
      }
      return window.open(`https://x.igloorooms.com/manage/AcBookingEdit.aspx?IRID=${encodeURIComponent(this.booking.system_id)}&&PM=B&TK=${encodeURIComponent(this.ticket)}`);
    }

    // Start with base URL
    let url = this.printingBaseUrl;

    // Add mode safely
    url += `&mode=${encodeURIComponent(mode)}`;

    // Add ANY payload safely
    if ('payload' in options && options.payload) {
      const payload = options.payload;

      const safeParams = Object.entries(payload)
        .map(([key, value]) => {
          const safeKey = encodeURIComponent(key);
          const safeValue = encodeURIComponent(String(value));
          return `${safeKey}=${safeValue}`;
        })
        .join('&');

      url += `&${safeParams}`;
    }

    // Add token safely
    const { data } = await axios.post(`Get_ShortLiving_Token`);
    if (!data.ExceptionMsg) {
      url += `&token=${encodeURIComponent(data.My_Result)}`;
    }

    // Final: fully safe URL
    window.open(url);
  }

  private handleCloseBookingWindow() {
    this.bookingItem = null;
  }

  private handleDeleteFinish = (e: CustomEvent) => {
    this.booking = { ...this.booking, rooms: this.booking.rooms.filter(room => room.identifier !== e.detail) };
    this.splitIndex = buildSplitIndex(this.booking.rooms);
  };

  private async resetBooking() {
    try {
      this.isLoading = true;
      const booking = await this.bookingService.getExposedBooking({ booking_nbr: this.bookingNumber, language: this.language, include_dp_pricing: true });
      this.splitIndex = buildSplitIndex(booking.rooms);
      await this.loadAgentAndFolio(booking);
      this.booking = { ...booking };
      this.bookingChanged.emit(this.booking);
    } catch (error) {
      console.log(error);
    } finally {
      this.isLoading = false;
    }
  }
  private async handleModalConfirm() {
    switch (this.modalState.type) {
      case 'email':
        await this.bookingService.sendBookingConfirmationEmail(this.booking.booking_nbr, this.language);
        break;
    }
    this.modalState = null;
    this.modalRef.closeModal();
  }
  private isAllServicesAgentOwned() {
    const allRoomsHaveAgent = this.booking.rooms.every(r => r.agent !== null);
    const pickupHasAgent = !this.booking.pickup_info || this.booking.pickup_info.agent !== null;
    const allExtrasHaveAgent = (this.booking.extra_services ?? []).every(s => s.agent !== null);
    return allRoomsHaveAgent && pickupHasAgent && allExtrasHaveAgent;
  }
  render() {
    if (this.isLoading) {
      return (
        <div class={'loading-container'}>
          <ir-spinner></ir-spinner>
        </div>
      );
    }
    const isAllServicesAgentOwned = this.isAllServicesAgentOwned();
    return (
      <Host>
        {!this.is_from_front_desk && (
          <Fragment>
            <ir-toast style={{ height: '0' }}></ir-toast>
            <ir-interceptor style={{ height: '0' }}></ir-interceptor>
          </Fragment>
        )}

        <ir-booking-header
          agents={this.agents}
          booking={this.booking}
          hasCloseButton={this.hasCloseButton}
          hasDelete={this.hasDelete}
          hasMenu={this.hasMenu}
          hasPrint={this.hasPrint}
          agent={this.agent}
          folioRows={this.folioRows}
          hasReceipt={calendar_data.property.is_frontdesk_enabled}
          hasEmail={['001', '002'].includes(this.booking?.status?.code)}
        ></ir-booking-header>
        <div class="booking-details__booking-info">
          <div class="booking-details__info-column">
            <ir-reservation-information arrivalTime={this.arrivalTime} countries={this.countries} booking={this.booking}></ir-reservation-information>
            <ir-booking-rooms
              booking={this.booking}
              agent={this.agent}
              propertyId={this.property_id}
              language={this.language}
              departureTime={this.departureTime}
              bedPreference={this.bedPreference}
              legendData={this.calendarData.legendData}
              roomsInfo={this.calendarData.roomsInfo}
              hasRoomAdd={this.hasRoomAdd}
              hasRoomEdit={this.hasRoomEdit}
              hasRoomDelete={this.hasRoomDelete}
              splitIndex={this.splitIndex}
              clTransactions={this.rawTransactions}
              onRoomDeleteFinished={this.handleDeleteFinish}
            ></ir-booking-rooms>
            {/* <ir-ota-services services={this.booking.ota_services}></ir-ota-services> */}
            <section>
              <ir-extra-services
                language={this.language}
                svcCategories={this.svcCategories}
                booking={this.booking}
                agent={this.agent}
                clTransactions={this.rawTransactions}
              ></ir-extra-services>
            </section>
            <ir-pickup-view booking={this.booking} agent={this.agent} clTransactions={this.rawTransactions}></ir-pickup-view>
          </div>

          <ir-payment-details
            clTransactions={this.rawTransactions}
            class="booking-details__info-column"
            propertyId={this.property_id}
            paymentEntries={this.paymentEntries}
            paymentActions={this.paymentActions}
            booking={this.booking}
            agent={this.agent}
            svcCategories={this.svcCategories}
            isAllServicesAgentOwned={isAllServicesAgentOwned}
            folioRows={this.folioRows}
            clLoading={this.clLoading}
            clError={this.clError}
          ></ir-payment-details>
        </div>
        <ir-dialog
          label="Send Email"
          onIrDialogHide={e => {
            e.stopImmediatePropagation();
            e.stopPropagation();
            this.modalRef.closeModal();
            this.modalState = null;
          }}
          ref={el => (this.modalRef = el)}
        >
          <p>{this.modalState?.message}</p>
          <div slot="footer" class="ir-dialog__footer">
            <ir-custom-button data-dialog="close" size="m" appearance="filled" variant="neutral">
              {locales.entries.Lcz_Cancel}
            </ir-custom-button>
            <ir-custom-button
              loading={isRequestPending('/Send_Booking_Confirmation_Email')}
              onClickHandler={e => {
                e.stopImmediatePropagation();
                e.stopPropagation();
                this.handleModalConfirm();
              }}
              size="m"
              variant="brand"
            >
              {locales.entries.Lcz_Confirm}
            </ir-custom-button>
          </div>
        </ir-dialog>
        <ir-room-guests
          open={this.sidebarState === 'room-guest'}
          countries={this.countries}
          language={this.language}
          identifier={this.sidebarPayload?.identifier}
          bookingNumber={this.booking.booking_nbr}
          roomName={this.sidebarPayload?.roomName}
          totalGuests={this.sidebarPayload?.totalGuests}
          sharedPersons={this.sidebarPayload?.sharing_persons}
          slot="sidebar-body"
          checkIn={this.sidebarPayload?.checkin}
          onCloseModal={() => (this.sidebarState = null)}
        ></ir-room-guests>
        <ir-extra-service-config
          open={this.sidebarState === 'extra_service'}
          service={this.selectedService}
          svcCategories={this.svcCategories}
          language={this.language}
          booking={this.booking}
          agent={this.agent}
          slot="sidebar-body"
          onCloseModal={e => {
            e.stopImmediatePropagation();
            e.stopPropagation();
            this.sidebarState = null;
            if (this.selectedService) {
              this.selectedService = null;
            }
          }}
        ></ir-extra-service-config>

        <ir-pickup
          booking={this.booking}
          agent={this.agent}
          open={this.sidebarState === 'pickup'}
          bookingDates={{ from: this.booking.from_date, to: this.booking.to_date }}
          defaultPickupData={this.booking.pickup_info}
          bookingNumber={this.booking.booking_nbr}
          numberOfPersons={this.booking.occupancy.adult_nbr + this.booking.occupancy.children_nbr}
          onCloseModal={() => {
            this.sidebarState = null;
          }}
        ></ir-pickup>

        <ir-billing-drawer
          open={this.sidebarState === 'invoice'}
          onBillingClose={e => {
            e.stopImmediatePropagation();
            e.stopPropagation();
            this.sidebarState = null;
          }}
          isAllServicesAgentOwned={isAllServicesAgentOwned}
          booking={this.booking}
          agent={this.agent}
        ></ir-billing-drawer>

        <ir-guest-info-drawer
          onGuestInfoDrawerClosed={() => {
            this.sidebarState = null;
          }}
          booking_nbr={this.bookingNumber}
          email={this.booking?.guest.email}
          language={this.language}
          open={this.sidebarState === 'guest'}
        ></ir-guest-info-drawer>

        <ir-payment-folio
          booking={this.booking}
          style={{ height: 'auto' }}
          bookingNumber={this.booking.booking_nbr}
          paymentEntries={this.paymentEntries}
          payment={this.sidebarPayload?.payment}
          mode={this.sidebarPayload?.mode}
          ref={el => (this.paymentFolioRef = el)}
          onCloseModal={() => (this.sidebarState = null)}
        ></ir-payment-folio>

        <ir-booking-editor-drawer
          roomTypeIds={(this.bookingItem as any)?.roomsInfo?.map(r => r.id)}
          onBookingEditorClosed={this.handleCloseBookingWindow.bind(this)}
          unitId={(this.bookingItem as any)?.PR_ID}
          mode={this.bookingItem?.event_type as any}
          label={this.bookingItem?.TITLE}
          booking={this.booking}
          ticket={this.ticket}
          open={this.bookingItem !== null}
          roomIdentifier={(this.bookingItem as any)?.IDENTIFIER}
          language={this.language}
          propertyid={this.propertyid as any}
          checkIn={this.bookingItem?.FROM_DATE}
          checkOut={this.bookingItem?.TO_DATE}
        ></ir-booking-editor-drawer>

        {/* Shared fiscal-document preview for the whole booking. `mode="all"` mounts
            both the agent (city-ledger) and guest preview listeners, so any
            `clFiscalDocumentPreview` / `guestDocumentPreview` event raised anywhere in
            the booking (guest folio, agent billing, city ledger) opens here. */}
        <ir-fiscal-document-preview
          mode="all"
          ticket={this.ticket}
          propertyId={calendar_data?.property.id}
          onDocumentConverted={() => this.fetchCityLedger()}
        ></ir-fiscal-document-preview>
      </Host>
    );
  }
}
