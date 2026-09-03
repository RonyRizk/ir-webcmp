import { Booking } from '@/models/booking.dto';
import { Component, Event, EventEmitter, Host, Listen, Prop, State, Watch, h } from '@stencil/core';
import { BlockedDatePayload, BookedByGuestSchema, BookingEditorMode, BookingStep, DayUseHoursSchema, RoomsGuestsSchema } from './types';
import { RoomService } from '@/services/room.service';
import { BookingService } from '@/services/booking-service/booking.service';
import locales from '@/stores/locales.store';
import booking_store, {
  BookingDraft,
  fillMissingReservedGuestNames,
  getReservedRooms,
  resetBookingStore,
  setBookingDraft,
  setBookingSelectOptions,
  setDayUseSelection,
  updateBookedByGuest,
} from '@/stores/booking.store';
import { BookingSource } from '@/models/igl-book-property';
import calendar_data, { getExtraServiceDefaultPrice } from '@/stores/calendar-data';
import { BookingDetails, ISetupEntries } from '@/models/IBooking';
import { DayData } from '@/models/DayType';
import { PhysicalRoom, RoomType } from '@/models/property';
import { DoDayUseParams } from '@/services/booking-service/types';
import { PropertyService } from '@/services/property.service';
import { showToast } from '@/utils/utils';
import moment from 'moment';
import { IRBookingEditorService } from './ir-booking-editor.service';
import { ExtraService } from '@/models/booking.dto';
import { SvcCategory } from '@/types/enums';

/** bookingStatus['002'] in @/utils/booking — CONFIRMED. */
const CONFIRMED_STATUS_CODE = '002';

@Component({
  tag: 'ir-booking-editor',
  styleUrl: 'ir-booking-editor.css',
  scoped: true,
})
export class IrBookingEditor {
  @Prop() propertyId: string | number;
  @Prop() language: string = 'en';
  @Prop() roomTypeIds: (string | number)[] = [];
  @Prop() identifier: string;
  @Prop({ mutable: true }) booking: Booking;
  @Prop() mode: BookingEditorMode = 'PLUS_BOOKING';
  @Prop() checkIn: string;
  @Prop() checkOut: string;
  @Prop() step: BookingStep;
  @Prop() blockedUnit: BlockedDatePayload;
  @Prop() unitId: string;
  /** The day-use extra service being edited (`mode="EDIT_DAY_USE"`) — its unit is excluded from the "already booked" filter, highlighted in the unit list, and updated in place via `doBookingExtraService` on submission. */
  @Prop() extraService: ExtraService;

  @State() isLoading: boolean = true;
  @State() isFetchingAvailability = false;
  @State() hasCheckedAvailability = false;
  @State() unavailableRatePlanIds: Set<number> = new Set();
  @State() dayUseBookedUnitIds: Set<number> = new Set();
  @State() dayUseRoomTypes: RoomType[] = [];
  @State() resolvingDayUseUnitId: number | null = null;
  /** Net (tax-exclusive) version of `dayUsePrice`, resolved once via `calculateNetAmount` — shown as the default value in the price input so an untouched default reads the same way a typed custom (net) amount does. */
  @State() dayUseNetPrice: number | null = null;

  @Event({ composed: true, bubbles: true }) resetBookingEvt: EventEmitter<Booking | null>;
  @Event() loadingChanged: EventEmitter<{ cause: string | null }>;
  @Event() adjustBlockedUnit: EventEmitter<any>;
  @Event() bookingStepChange: EventEmitter<{ direction: 'next' | 'prev' }>;
  @Event() preventPageLoad: EventEmitter<string>;

  private roomService = new RoomService();
  private bookingService = new BookingService();
  private propertyService = new PropertyService();
  private bookingEditorService = new IRBookingEditorService(this.mode);

  private room: Booking['rooms'][0];

  private get dayUsePrice(): number {
    return Number(getExtraServiceDefaultPrice(SvcCategory.DayUse));
  }

  /**
   * Resolves the gross day-use price for the selected unit and advances to step 2.
   *
   * - Hotel default price (untouched): the input shows the default price converted to its **net**
   *   value (`dayUseNetPrice`, resolved once by `resolveDayUseNetPrice`) so an untouched default
   *   reads the same way a typed custom amount does. Since it wasn't actually customized, we discard
   *   that net display value here and show/save the original **gross** default instead.
   * - Custom price (front-desk typed a value): that value is the **net** amount, mirroring how a
   *   manually-modified rate-plan rate is treated (`getRatePlanDisplayAmount` in booking.store.ts) —
   *   `calculateExclusiveTax` derives the tax off the net amount and gross = net + tax.
   *
   * Resolved once here so step 2's summary and the final `doDayUse` submission always agree.
   */
  private async handleDayUseUnitSelected(e: CustomEvent<{ unit: PhysicalRoom; roomType: RoomType; price: number; isCustomPrice: boolean }>) {
    e.stopImmediatePropagation();
    e.stopPropagation();
    const { unit, roomType, price, isCustomPrice } = e.detail;
    this.resolvingDayUseUnitId = unit.id;
    try {
      let netAmount: number;
      let taxAmount: number;
      let grossAmount: number;
      if (isCustomPrice) {
        netAmount = price;
        taxAmount = this.isAccommodationVatExclusive()
          ? await this.bookingService.calculateExclusiveTax({ property_id: Number(this.propertyId), amount: netAmount, taxes_to_include: ['VAT'] })
          : 0;
        grossAmount = netAmount + taxAmount;
      } else {
        grossAmount = this.dayUsePrice;
        netAmount = this.dayUseNetPrice ?? grossAmount;
        taxAmount = grossAmount - netAmount;
      }
      setDayUseSelection({ unit, roomType, price: grossAmount, netAmount, taxAmount, isCustomPrice });
      this.bookingStepChange.emit({ direction: 'next' });
    } finally {
      this.resolvingDayUseUnitId = null;
    }
  }
  /** Resolves taxation policy on accommodation level. */
  private isAccommodationVatExclusive = () => {
    const accTax = calendar_data.property.taxes?.find(t => t.name === 'V.A.T');
    return accTax?.is_exlusive;
  };
  /** Resolves `dayUsePrice` (gross) to its net equivalent once, up front, so it's ready before the day-use unit list renders. */
  private async resolveDayUseNetPrice() {
    const grossAmount = this.dayUsePrice;
    if (!grossAmount) {
      this.dayUseNetPrice = 0;
      return;
    }
    try {
      this.dayUseNetPrice = this.isAccommodationVatExclusive()
        ? await this.propertyService.calculateNetAmount({ property_id: Number(this.propertyId), amount: grossAmount, taxes_to_include: ['VAT'] })
        : this.dayUsePrice;
    } catch (error) {
      console.error('Error resolving day-use net price:', error);
    }
  }

  private get adjustedCheckout() {
    if (this.bookingEditorService.isEventType('PLUS_BOOKING') && !this.blockedUnit) {
      return undefined;
    }
    return this.checkOut;
  }

  componentWillLoad() {
    this.initializeApp();
  }

  @Watch('mode')
  handleModeChange(newMode: BookingEditorMode, oldMode: BookingEditorMode) {
    if (newMode !== oldMode) {
      this.bookingEditorService.setMode(newMode);
    }
  }

  @Listen('guestSelected')
  handleGuestSelected(e: CustomEvent) {
    this.booking = { ...e.detail };
    updateBookedByGuest({
      firstName: this.booking.guest.first_name,
      lastName: this.booking.guest.last_name,
    });
    const source = booking_store.selects.sources.find(s => s.code === this.booking.source.code);
    setBookingDraft({
      source,
    });
  }

  private async initializeApp() {
    try {
      this.isLoading = true;
      this.bookingEditorService.setMode(this.mode);
      const [languageTexts, countriesList] = await Promise.all([
        this.roomService.fetchLanguage(this.language),
        this.bookingService.getCountries(this.language),
        this.roomService.getExposedProperty({
          id: Number(this.propertyId),
          language: this.language,
          is_backend: true,
          include_units_hk_status: true,
          include_sales_rate_plans: true,
        }),
      ]);
      if (!locales.entries) {
        locales.entries = languageTexts.entries;
        locales.direction = languageTexts.direction;
      }
      await Promise.all([this.fetchSetupEntriesAndInitialize(), this.resolveDayUseNetPrice()]);
      setBookingSelectOptions({
        countries: countriesList,
      });
      this.initializeDraftFromBooking();
      if (this.bookingEditorService.isEventType(['EDIT_BOOKING', 'EDIT_DAY_USE'])) {
        await this.checkBookingAvailability();
      }
    } catch (error) {
      console.error('Error initializing app:', error);
    } finally {
      this.isLoading = false;
    }
  }

  disconnectedCallback() {
    resetBookingStore(true);
  }

  @Listen('checkAvailability')
  handleCheckAvailability(e: CustomEvent) {
    e.stopImmediatePropagation();
    e.stopPropagation();
    this.checkBookingAvailability(true);
  }
  /**
   * Initializes booking draft and guest data
   * based on the current editor mode.
   *
   * Throws if required booking data is missing.
   */
  private initializeDraftFromBooking() {
    const isEdit = this.bookingEditorService.isEventType('EDIT_BOOKING');
    const isEditOrAdd = this.bookingEditorService.isEventType(['EDIT_BOOKING', 'ADD_ROOM', 'EDIT_DAY_USE']);

    if (isEditOrAdd && (!this.booking || (!this.identifier && isEdit))) {
      throw new Error('Missing booking or identifier');
    }

    if (isEdit) {
      this.room = this.bookingEditorService.getRoom(this.booking, this.identifier);
    }

    const dates = isEdit
      ? {
          checkIn: moment(this.room.from_date, 'YYYY-MM-DD'),
          checkOut: moment(this.room.to_date, 'YYYY-MM-DD'),
        }
      : {
          checkIn: this.checkIn ? moment(this.checkIn, 'YYYY-MM-DD') : moment(),
          checkOut: this.checkOut ? moment(this.checkOut, 'YYYY-MM-DD') : moment().add(1, 'day'),
        };

    const draft: Partial<BookingDraft> = {
      dates,
      ...(isEditOrAdd && { source: this.resolveSourceOption(booking_store.selects.sources, booking_store.selects.sources) }),
      ...(isEdit && {
        occupancy: {
          adults: calendar_data.property.adult_child_constraints.adult_max_nbr,
          children: calendar_data.property.adult_child_constraints.child_max_nbr,
        },
        defaultOccupancy: {
          adults: this.room.occupancy.adult_nbr,
          children: this.room.occupancy.children_nbr + this.room.occupancy.infant_nbr,
        },
      }),
    };

    if (isEditOrAdd) {
      updateBookedByGuest({
        firstName: this.booking.guest.first_name,
        lastName: this.booking.guest.last_name,
        ...(this.bookingEditorService.isEventType('EDIT_DAY_USE') && {
          email: this.booking.guest.email ?? '',
          mobile: this.booking.guest.mobile_without_prefix ?? this.booking.guest.mobile ?? '',
        }),
      });
    }

    setBookingDraft(draft);
  }

  private async checkBookingAvailability(checkBe = false) {
    this.isFetchingAvailability = true;
    // resetBookingStore(false);
    const { source, occupancy, dates, dayUse } = booking_store.bookingDraft;
    const from_date = dates.checkIn.format('YYYY-MM-DD');
    const to_date = dates.checkOut.format('YYYY-MM-DD');
    const is_in_agent_mode = source?.type === 'TRAVEL_AGENCY';
    try {
      this.dayUseRoomTypes = [];
      if (dayUse) {
        await Promise.all([this.checkDayUseAvailability(from_date), this.fetchDayUseBookedUnits(dayUse, from_date)]);
      } else {
        const room_type_ids_to_update = this.bookingEditorService.isEventType('EDIT_BOOKING') ? [this.room.roomtype?.id] : [];
        const room_type_ids = this.bookingEditorService.isEventType(['BAR_BOOKING', 'SPLIT_BOOKING']) ? this.roomTypeIds.map(r => Number(r)) : [];
        const params = {
          from_date,
          to_date,
          propertyid: calendar_data.property.id,
          adultChildCount: {
            adult: occupancy.adults,
            child: occupancy.children,
          },
          language: this.language,
          room_type_ids,
          currency: calendar_data.property.currency,
          agent_id: is_in_agent_mode ? source?.tag : null,
          is_in_agent_mode,
          room_type_ids_to_update,
        };
        await Promise.all([this.bookingService.getBookingAvailability(params), this.fetchDayUseBookedUnits(dayUse, from_date)]);
        if (checkBe) {
          const beResults = await this.bookingService.getBookingAvailability({ ...params, is_backend: false, skip_store: true });
          this.compareResults(beResults);
        }
      }
      if (this.mode !== 'EDIT_BOOKING') {
        await this.assignCountryCode();
      }
      if (this.bookingEditorService.isEventType('EDIT_BOOKING')) {
        this.bookingEditorService.updateBooking(this.room);
      }
      this.isFetchingAvailability = false;
      this.hasCheckedAvailability = true;
    } catch (error) {
      console.error('Error initializing booking availability:', error);
    }
  }

  /**
   * Day-use branch of availability checking: skips `Check_Availability` entirely and derives
   * per-unit availability from `Get_Exposed_Calendar` (`getCalendarData`) for the single target date.
   */
  private async checkDayUseAvailability(date: string) {
    this.preventPageLoad.emit('/Get_Exposed_Calendar');
    const results = await this.bookingService.getCalendarData(Number(calendar_data.property.id), date, date);
    const day = results?.days?.[0] as DayData | undefined;
    this.dayUseRoomTypes = day?.rate ?? [];
  }

  /**
   * Units already booked for day use on the target date don't reduce a room type's normal
   * `inventory`/availability, so they must be filtered out separately from the units list.
   *
   * When editing an existing day-use extra service (`EDIT_DAY_USE`), its own unit is excluded from
   * this "already booked" set — it's the booking being edited, not a conflict — and its hours seed
   * `dayUseHours` so step 2 shows the time window that's actually in effect.
   */
  private async fetchDayUseBookedUnits(dayUse: boolean, date: string) {
    if (!dayUse) {
      this.dayUseBookedUnitIds = new Set();
      return;
    }
    const bookings = await this.propertyService.getDayUseBookingsForCalendar({
      property_id: Number(calendar_data.property.id),
      from_date: date,
      to_date: date,
    });
    const editingUnitId = this.bookingEditorService.isEventType('EDIT_DAY_USE') ? this.extraService?.pr_id : undefined;
    this.dayUseBookedUnitIds = new Set(bookings.filter(b => b.unit_id !== editingUnitId).map(b => b.unit_id));
    if (editingUnitId != null && !booking_store.bookingDraft.dayUseHours?.from) {
      const current = bookings.find(b => b.unit_id === editingUnitId);
      if (current) {
        setBookingDraft({ dayUseHours: { from: current.from_time, to: current.to_time } });
      }
    }
  }

  private compareResults(beResults: BookingDetails) {
    const beRoomTypes = Array.isArray(beResults) ? beResults : (beResults?.roomtypes ?? []);
    const unavailableRatePlanIds = new Set<number>();
    const beRoomTypeMap = new Map<number, any>(beRoomTypes.map(roomType => [roomType.id, roomType]) as any);

    for (const roomType of booking_store.roomTypes ?? []) {
      const beRoomType = beRoomTypeMap.get(roomType.id);
      const beRatePlanMap = new Map<number, any>(beRoomType?.rateplans?.map(ratePlan => [ratePlan.id, ratePlan]) ?? []);

      for (const ratePlan of roomType.rateplans ?? []) {
        if (!ratePlan?.is_available_to_book) continue;
        const beRatePlan = beRatePlanMap.get(ratePlan.id);
        if (!beRatePlan || !beRatePlan.is_available_to_book) {
          unavailableRatePlanIds.add(ratePlan.id);
        }
      }
    }
    this.unavailableRatePlanIds = unavailableRatePlanIds;
  }

  private async doReservation(source: string) {
    try {
      this.loadingChanged.emit({ cause: source as any });
      if (booking_store.bookingDraft.dayUse) {
        await this.doDayUseReservation(source === 'book&block');
        return;
      }
      fillMissingReservedGuestNames();
      const reservedRooms = getReservedRooms();
      RoomsGuestsSchema.parse(reservedRooms.map(r => ({ ...r.guest, requires_bed_preference: r.ratePlanSelection.roomtype.is_bed_configuration_enabled })));
      BookedByGuestSchema.parse(booking_store.bookedByGuest);
      const body = await this.bookingEditorService.prepareBookUserServiceParams({
        check_in: source === 'book-checkin',
        booking: this.booking,
        room: this.room,
        unitId: this.unitId?.toString(),
      });
      console.log({ DoReservationPayload: body });
      await this.bookingService.doReservation(body);
      this.adjustBlockedUnit.emit(body);

      this.resetBookingEvt.emit(null);
    } catch (error) {
      console.log(error);
    } finally {
      this.loadingChanged.emit({ cause: null });
    }
    // alert('do reservation');
  }

  private async doDayUseReservation(block: boolean) {
    const { dayUseSelection } = booking_store;
    if (!dayUseSelection) {
      console.warn('[doDayUseReservation] No unit selected');
      return;
    }
    const { dates, dayUseHours, source, defaultOccupancy } = booking_store.bookingDraft;
    const { bookedByGuest } = booking_store;
    BookedByGuestSchema.parse(bookedByGuest);
    DayUseHoursSchema.parse(dayUseHours);

    // Gross/net/tax were already resolved when the unit was selected (handleDayUseUnitSelected) —
    // reused as-is so the amount shown on step 2 matches exactly what gets saved.
    const { price: grossAmount, netAmount, taxAmount } = dayUseSelection;
    const date = dates.checkIn.format('YYYY-MM-DD');

    const isEditing = this.bookingEditorService.isEventType('EDIT_DAY_USE') && this.extraService;
    if (isEditing) {
      // Do_Booking_Extra_Service now updates the existing Day use extra service in place (keyed off its
      // `system_id`) — unit/price/hours change, but the booking it belongs to doesn't, so no more
      // delete-then-recreate-as-a-new-booking round trip.
      const service = {
        ...this.extraService,
        pr_id: dayUseSelection.unit.id,
        category: { code: SvcCategory.DayUse },
        start_date: date,
        end_date: date,
        from_time: dayUseHours.from,
        to_time: dayUseHours.to,
        net_amount: netAmount,
        tax_amount: taxAmount,
        gross_amount: grossAmount,
        price: grossAmount,
        currency_id: calendar_data.property.currency.id,
      };
      await this.bookingService.doBookingExtraService({
        service,
        is_remove: false,
        booking_nbr: this.booking?.booking_nbr,
      });
      showToast({ title: 'Day Use Booking Updated', type: 'success' });
      this.resetBookingEvt.emit(null);
      return;
    }

    const payload: DoDayUseParams = {
      language: this.language,
      is_to_block: block,
      booking: {
        property: { id: Number(this.propertyId) },
        currency: { id: calendar_data.property.currency.id },
        source,
        guest: {
          first_name: bookedByGuest.firstName,
          last_name: bookedByGuest.lastName,
          email: bookedByGuest.email ?? '',
          mobile: bookedByGuest.mobile ?? '',
        },
        occupancy: {
          adult_nbr: defaultOccupancy?.adults ?? 0,
          children_nbr: defaultOccupancy?.children ?? 0,
          infant_nbr: null,
        },
        from_date: date,
        to_date: date,
        status: { code: CONFIRMED_STATUS_CODE },
        remark: bookedByGuest.note,
      },
      extra_service: {
        pr_id: dayUseSelection.unit.id,
        category: { code: SvcCategory.DayUse },
        description: '',
        start_date: date,
        end_date: date,
        from_time: dayUseHours.from,
        to_time: dayUseHours.to,
        net_amount: netAmount,
        tax_amount: taxAmount,
        gross_amount: grossAmount,
        price: grossAmount,
        currency_id: calendar_data.property.currency.id,
      },
    };

    await this.bookingService.doDayUse(payload);
    showToast({ title: 'Day Use Booking Created', type: 'success' });
    this.resetBookingEvt.emit(null);
  }

  private async assignCountryCode() {
    const country = await this.bookingService.getUserDefaultCountry();
    const countryId = country['COUNTRY_ID'];
    const _c = booking_store.selects.countries.find(c => c.id?.toString() === countryId?.toString());
    updateBookedByGuest({
      countryId: countryId,
      phone_prefix: _c?.phone_prefix,
    });
  }

  private async fetchSetupEntriesAndInitialize() {
    try {
      const setupEntries = await this.fetchSetupEntries();
      this.setSourceOptions(calendar_data.property.allowed_booking_sources);
      this.setOtherProperties(setupEntries);
    } catch (error) {
      console.error('Error fetching setup entries:', error);
    }
  }

  private setOtherProperties(setupEntries: ISetupEntries) {
    setBookingSelectOptions({
      arrivalTime: setupEntries.arrivalTime,
      bedPreferences: setupEntries.bedPreferenceType,
      ratePricingMode: setupEntries.ratePricingMode,
    });
  }

  private resolveSourceOption(bookingSource: BookingSource[], filteredSourceOptions: BookingSource[]): BookingSource {
    if (this.bookingEditorService.isEventType(['EDIT_BOOKING', 'EDIT_DAY_USE']) && this.booking) {
      if (this.booking.agent) {
        return bookingSource.find(option => this.booking.agent?.id?.toString() === option.tag?.toString());
      } else {
        return bookingSource.find(option => this.booking.source?.code === option.code);
      }
    }
    return filteredSourceOptions.find(o => o.type !== 'LABEL');
  }

  private setSourceOptions(bookingSource: BookingSource[]) {
    const _sourceOptions = this.bookingEditorService.isEventType('BAR_BOOKING') ? this.getFilteredSourceOptions(bookingSource) : bookingSource;
    setBookingSelectOptions({
      sources: _sourceOptions,
    });
    setBookingDraft({
      source: this.resolveSourceOption(bookingSource, _sourceOptions),
    });
  }

  private getFilteredSourceOptions(sourceOptions: BookingSource[]): BookingSource[] {
    const agentIds = new Set<string>();
    if (!Boolean(this.unitId)) {
      return sourceOptions;
    }
    const room = calendar_data.roomsInfo.find(room => room.physicalrooms.find(r => r.id.toString() === this.unitId?.toString()));
    const hasAgentOnlyRoomType =
      (() => {
        const rps = room?.rateplans ?? [];
        if (rps.length === 0) return false;
        const isForAgentOnly = rps.every((rp: any) => (rp?.agents?.length ?? 0) > 0);
        if (isForAgentOnly) {
          rps.forEach((rp: any) => {
            (rp?.agents ?? []).forEach((ag: any) => agentIds.add(ag?.id?.toString()));
          });
        }
        return isForAgentOnly;
      })() ?? false;

    if (!hasAgentOnlyRoomType) {
      return sourceOptions;
    }
    return sourceOptions.filter((opt: any) => {
      if (opt?.type === 'LABEL') return true;
      const candidate = opt?.tag;
      const matchesId = candidate != null && agentIds.has(candidate);
      return matchesId;
    });
  }

  private async fetchSetupEntries() {
    return await this.bookingService.fetchSetupEntries();
  }

  render() {
    if (this.isLoading) {
      return (
        <div class={'drawer__loader-container'}>
          <ir-spinner></ir-spinner>
        </div>
      );
    }
    return (
      <Host>
        <div>
          <ir-interceptor></ir-interceptor>
          {this.step === 'details' && (
            <div class="booking-editor__step" key="step-details">
              <ir-booking-editor-header
                isLoading={this.isFetchingAvailability}
                isBlockConversion={!!this.blockedUnit?.STATUS_CODE}
                booking={this.booking}
                checkIn={this.checkIn}
                checkOut={this.adjustedCheckout}
                mode={this.mode}
              ></ir-booking-editor-header>
              <div class={'booking-editor__roomtype-container'}>
                {!this.isFetchingAvailability && booking_store.bookingDraft.dayUse ? (
                  <igl-day-use-unit-list
                    mode={this.mode}
                    roomTypes={this.dayUseRoomTypes}
                    price={this.dayUsePrice}
                    netPrice={this.dayUseNetPrice}
                    currency={calendar_data.property.currency}
                    bookedUnitIds={this.dayUseBookedUnitIds}
                    unitId={this.unitId}
                    currentExtraService={this.extraService}
                    resolvingUnitId={this.resolvingDayUseUnitId}
                    hasSearched={this.hasCheckedAvailability}
                    onUnitSelected={e => this.handleDayUseUnitSelected(e)}
                  ></igl-day-use-unit-list>
                ) : (
                  !this.isFetchingAvailability &&
                  booking_store.roomTypes?.map(roomType => (
                    <igl-room-type
                      unavailableRatePlanIds={this.unavailableRatePlanIds}
                      key={`room-type-${roomType.id}`}
                      id={roomType.id.toString()}
                      roomType={roomType}
                      bookingType={this.mode}
                      ratePricingMode={booking_store.selects?.ratePricingMode}
                      roomTypeId={this.room?.roomtype?.id}
                      currency={calendar_data.property.currency}
                    ></igl-room-type>
                  ))
                )}
              </div>
            </div>
          )}

          {this.step === 'confirm' && (
            <ir-booking-editor-form
              class="booking-editor__step"
              key="step-confirm"
              booking={this.booking}
              onDoReservation={e => {
                e.stopImmediatePropagation();
                e.stopPropagation();
                this.doReservation(e.detail);
              }}
              room={this.room}
              mode={this.mode}
            ></ir-booking-editor-form>
          )}
        </div>
      </Host>
    );
  }
}
