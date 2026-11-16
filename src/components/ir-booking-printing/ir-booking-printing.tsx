import { Booking, Guest, Room } from '@/models/booking.dto';
import { Component, Fragment, Prop, State, Watch, h } from '@stencil/core';
import moment, { Moment } from 'moment';
import { _formatTime } from '../ir-booking-details/functions';
import { IProperty } from '@/models/property';
import { calculateDaysBetweenDates } from '@/utils/booking';
import BeLogoFooter from '@/assets/be_logo_footer';
import { BookingService } from '@/services/booking-service/booking.service';
import { RoomService } from '@/services/room.service';
import { formatDate } from '@/utils/date';
import { formatAmount, formatBookingNumber, formatCount, formatPercent } from '@/utils/number';
import { LocaleController } from '@/services/locale/locale.controller';
import { LanguageSync } from '@/services/locale/language-sync';
import { SCREEN_TABLES } from '@/services/locale/screen-tables';
import { t } from '@/services/locale/t';

@Component({
  tag: 'ir-booking-printing',
  styleUrl: 'ir-booking-printing.css',
  shadow: true,
})
export class IrBookingPrinting {
  @Prop() ApiClient: string = '';
  @Prop() bookingNumber: string = '';
  @Prop() language: string = 'en';
  @Prop() propertyid: number;

  @Prop() mode: 'invoice' | 'default' = 'default';

  @Prop() countries: any;

  @State() booking: Booking;
  @State() property: IProperty;
  @State() guestCountryName: string;
  @State() isLoading: boolean;
  // @State() ApiClient: string;

  private bookingService = new BookingService();
  private roomService = new RoomService();

  private currency: string;
  private totalNights: number;
  private totalPersons: number;

  /** Re-runs init when the language changes so server-localized data follows. */
  private languageSync = new LanguageSync(SCREEN_TABLES.bookingPrinting, () => this.init());

  componentWillLoad() {
    document.body.style.background = 'white';
    if (this.ApiClient) {
      this.init();
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

  @Watch('ApiClient')
  async ticketChanged(newValue: string, oldValue: string) {
    if (newValue !== oldValue) {
      this.init();
    }
  }

  private init() {
    this.initializeRequests();
  }

  async initializeRequests() {
    try {
      this.isLoading = true;
      // Started first: it seeds `LocaleController.language` from the host prop synchronously,
      // so the requests below are built with the right language on first mount.
      const localeReady = LocaleController.load({ language: this.language, tables: SCREEN_TABLES.bookingPrinting });
      // if (!this.bookingNumber) {
      //   throw new Error('Missing booking number');
      // }
      let countries: any;

      const [property, , booking, fetchedCountries] = await Promise.all([
        this.roomService.getExposedProperty({ id: this.propertyid, language: LocaleController.language, is_backend: true }),
        localeReady,
        this.bookingService.getExposedBooking({ booking_nbr: this.bookingNumber, language: LocaleController.language }),
        this.bookingService.getCountries(LocaleController.language),
      ]);

      this.property = property['My_Result'];
      // this.booking = booking;
      countries = fetchedCountries;
      this.booking = booking;
      this.setUserCountry(countries, this.booking.guest.country_id);
      this.currency = this.booking.currency.symbol;
      this.totalPersons = this.booking?.occupancy.adult_nbr + this.booking?.occupancy.children_nbr;
      this.totalNights = calculateDaysBetweenDates(this.booking.from_date, this.booking.to_date);
    } catch (error) {
      console.error(error);
    } finally {
      this.isLoading = false;
    }
  }
  private formatGuestName({ first_name, last_name }: Guest) {
    if (!last_name) {
      return first_name;
    }
    return `${first_name} ${last_name}`;
  }
  private formatPhoneNumber({ mobile, country_phone_prefix }: Guest, is_direct: boolean) {
    if (!is_direct) {
      return mobile;
    }
    if (!country_phone_prefix) {
      return mobile;
    }
    return `+${country_phone_prefix.replace('+', '')}-${mobile}`;
  }
  private formatBookingDates(date: string) {
    return formatDate(date, 'DD-MMM-YYYY');
  }
  private setUserCountry(countries: any, country_id: number) {
    const country = countries.find(country => country.id === country_id);
    this.guestCountryName = country?.name;
  }
  private formatDate(date: Moment) {
    const dayMonth = formatDate(date, 'DD/MM');
    let dayOfWeekAbbr = formatDate(date, 'ddd');
    if (['Thu', 'Sun', 'Sat'].includes(dayOfWeekAbbr)) {
      dayOfWeekAbbr = dayOfWeekAbbr.slice(0, 2);
    } else {
      dayOfWeekAbbr = dayOfWeekAbbr.charAt(0);
    }
    return `${dayMonth} ${dayOfWeekAbbr}`;
  }
  private renderBookingDetails() {
    return (
      <Fragment>
        <p class="booking-number">
          {t('Lcz_Booking', { fallback: 'Booking' })}#{formatBookingNumber(this.booking.booking_nbr)}
        </p>
        <div class={'reservation-details'}>
          <p class="booked_on_date">
            {formatDate(this.booking.booked_on.date, 'DD-MMM-YYYY')} {_formatTime(this.booking.booked_on.hour.toString(), this.booking.booked_on.minute.toString())} |
          </p>
          <img src={this.booking.origin.Icon} alt={this.booking.origin.Label} class="origin-icon" />
        </div>
      </Fragment>
    );
  }
  private renderPrintingHeader() {
    if (this.mode === 'invoice') {
      return (
        <Fragment>
          <div>
            <p>
              {t('Lcz_Address', { fallback: 'Address' })}:<span> {this.property?.address}</span>
            </p>
            <p>
              {t('Lcz_Phone', { fallback: 'Phone' })}:
              <span>
                {' '}
                +{this.property?.country?.phone_prefix.replace('+', '') + '-' || ''}
                {this.property?.phone}
              </span>
            </p>
            <p>
              {t('Lcz_TaxId', { fallback: 'Tax ID' })}:<span>{this.property.tax_nbr}</span>
            </p>
            <p class="property_name">{this.property.name}</p>
          </div>
          <div>
            {this.renderBookingDetails()}
            <p class={'invoice_reference'}>
              {t('Lcz_InvoiceReference', { fallback: 'Invoice Reference:' })}
              {formatBookingNumber(this.booking.financial.invoice_nbr)}
            </p>
          </div>
        </Fragment>
      );
    }
    return (
      <Fragment>
        <div>
          <BeLogoFooter width={120} height={30} />
          <p class="property_name">{this.property.name}</p>
        </div>
        <div>{this.renderBookingDetails()}</div>
      </Fragment>
    );
  }
  private getTaxAmount(room: Room) {
    if (!this.booking.is_direct) {
      const filtered_data = room.ota_taxes.filter(tx => tx.amount > 0);
      return filtered_data.map((d, index) => {
        return (
          <Fragment>
            <p class="label-title">
              {d.is_exlusive ? t('Lcz_Excluding', { fallback: 'Excluding' }) : t('Lcz_Including', { fallback: 'Including' })} {d.name}
            </p>
            <p>{formatAmount(d.currency.symbol, d.amount)}</p>
            {index < filtered_data.length - 1 && <span>-</span>}
          </Fragment>
        );
      });
    }
    const filtered_data = this.property?.taxes?.filter(tx => tx.pct > 0);
    return filtered_data?.map((d, index) => {
      const amount = (room.total * d.pct) / 100;
      return (
        <Fragment>
          <p class="label-title">
            {d.is_exlusive ? t('Lcz_Excluding', { fallback: 'Excluding' }) : t('Lcz_Including', { fallback: 'Including' })} {d.name}
          </p>
          <p>
            {formatPercent(d.pct)}: {formatAmount(this.currency, amount)}
          </p>
          {/* {room.gross_cost > 0 && room.gross_cost !== null && <span>{_formatAmount((room.cost * d.pct) / 100, this.currency)}</span>} */}
          {index < filtered_data.length - 1 && <span>-</span>}
        </Fragment>
      );
    });
  }
  render() {
    if (this.isLoading || (!this.isLoading && (!this.booking || !this.property))) {
      return null;
    }
    console.log(this.booking.pickup_info);

    return (
      <div class="main-container">
        <section class="header">{this.renderPrintingHeader()}</section>
        <section>
          <section class="booking-details">
            <p class="label-title">
              {t('Lcz_BookedBy', { fallback: 'Booked by' })}:
              <span class="label-value">
                {this.formatGuestName(this.booking?.guest)} - {formatCount(this.totalPersons)}{' '}
                {this.totalPersons > 1 ? t('Lcz_PersonPlural', { fallback: 'persons' }) : t('Lcz_PersonSingular', { fallback: 'person' })}
              </span>
            </p>
            <p class="label-title">
              {t('Lcz_Phone', { fallback: 'Phone' })}:<span class="label-value">{this.formatPhoneNumber(this.booking?.guest, this.booking?.is_direct)}</span>
            </p>
            <p class="label-title">
              {t('Lcz_Email', { fallback: 'Email' })}:<span class="label-value">{this.booking?.guest?.email}</span>
            </p>
            {this.guestCountryName && (
              <p class="label-title">
                {t('Lcz_Country', { fallback: 'Country' })}:<span class="label-value">{this.guestCountryName}</span>
              </p>
            )}
            {this.booking.guest.city && (
              <p class="label-title">
                {t('Lcz_CityPlaceholder', { fallback: 'City' })}:<span class="label-value">{this.booking?.guest?.city}</span>
              </p>
            )}
            <p class="label-title">
              <span class="label-title__text--capitalize">{t('Lcz_ArrivalTime', { fallback: 'Arrival time' })}</span>:
              <span class="label-value">{this.booking?.arrival?.description}</span>
            </p>
          </section>
          <section>
            <div class="accommodation-summary">
              <p class="accommodation-title">{t('Lcz_Accommodation', { fallback: 'Accommodation' })}</p>
              <p class="booking-dates">{this.formatBookingDates(this.booking?.from_date)}</p>
              <p class="booking-dates">{this.formatBookingDates(this.booking?.to_date)}</p>
              <p class="number-of-nights">
                {formatCount(this.totalNights)} {this.totalNights === 1 ? t('Lcz_Night', { fallback: 'night' }) : t('Lcz_Nights', { fallback: 'nights' })}
              </p>
              <p class="vat-exclusion">
                <i>{this.property.tax_statement}</i>
              </p>
            </div>
            <div>
              {this.booking?.rooms?.map(room => (
                <Fragment>
                  <table>
                    <tr class={'roomtype-title'}>
                      <td>{room.roomtype.name}</td>
                      <td>{room.rateplan.name}</td>
                    </tr>
                    <tr>
                      <td colSpan={12}>
                        <p class="label-title">
                          {t('Lcz_GuestName', { fallback: 'Guest name' })}:<span class="label-value">{this.formatGuestName(room?.guest)}</span>
                        </p>
                      </td>
                    </tr>
                  </table>
                  <div class="policies-container">
                    <p class="policies" innerHTML={room.rateplan.cancelation}></p>
                    <p class="policies" innerHTML={room.rateplan.guarantee}></p>
                  </div>
                  <div class="pricing-summary">
                    <div class={'pricing-breakdown'}>
                      <p class="label-title">
                        {t('Lcz_Total', { fallback: 'Total' })}:<span class="label-value">{formatAmount(this.currency, room.total)}</span>
                      </p>
                      <span>-</span>
                      {this.getTaxAmount(room)}
                    </div>
                    <p class="label-title">
                      {t('Lcz_GrandTotalLabel', { fallback: 'Grand total:' })}
                      <span class="label-value">{formatAmount(this.currency, room.gross_total)}</span>
                    </p>
                    <p class="label-title">
                      {t('Lcz_DueUponBookingLabel', { fallback: 'Due upon booking:' })}
                      <span class="label-value">{formatAmount(this.currency, room.gross_guarantee)}</span>
                    </p>
                  </div>

                  {/* Rendering room dates */}
                  <div class={'room_amount_main_container'}>
                    {/* <div class={'room_amount_container'}>
                      <p class="room_amount room_amount_empty">Dates</p>
                      <p class="room_amount room_amount_rate">Rate</p>
                    </div> */}
                    {room.days?.map(d => (
                      <div class={'room_amount_container'}>
                        <p class="room_amount date">{this.formatDate(moment(d.date, 'YYYY-MM-DD'))}</p>
                        <p class="room_amount amount">{formatAmount(this.currency, d.amount)}</p>
                      </div>
                    ))}
                  </div>
                </Fragment>
              ))}
            </div>
          </section>
        </section>
        {this.booking.pickup_info && (
          <section class="pickup-container">
            <p class="pickup_title">
              {t('Lcz_PickupYesFrom', { fallback: 'PICKUP Yes,from ' })}
              {this.booking.pickup_info.selected_option.location.description}
            </p>
            <div class={'pickup-details'}>
              <p class="label-title">
                {t('Lcz_ArrivalDateLabel', { fallback: 'Arrival date:' })}
                <span class="label-value">{formatDate(this.booking?.pickup_info.date, 'ddd, DD MMM YYYY')}</span>
              </p>
              <p class="label-title">
                {t('Lcz_TimeLabel', { fallback: 'Time:' })}
                <span class="label-value">{_formatTime(this.booking.pickup_info.hour.toString(), this.booking.pickup_info.minute.toString())}</span>
              </p>
              <p class="label-title">
                {t('Lcz_FlightDetailsLabel', { fallback: 'Flight details:' })}
                <span class="label-value">{this.booking?.pickup_info.details}</span>
              </p>

              <p class="car_name">
                {this.booking.pickup_info.selected_option.vehicle.description}
                <span> - </span>
                {formatAmount(this.booking.pickup_info.selected_option.currency.code, this.booking.pickup_info.selected_option.amount)}
              </p>
              <p class="label-title">
                {t('Lcz_NumberOfVehicles', { fallback: 'No. of Vehicles:' })}
                <span class="label-value">{formatCount(this.booking?.pickup_info.nbr_of_units)}</span>
              </p>
              <p class="label-title">
                {t('Lcz_DueUponBookingLabel', { fallback: 'Due upon booking:' })}
                <span class="label-value">{formatAmount(this.booking.pickup_info.currency.code, this.booking?.pickup_info.total)}</span>
              </p>
            </div>
          </section>
        )}
        {this.booking.financial?.payments && (
          <section>
            <table class="billing_table">
              <caption>{t('Lcz_Billing', { fallback: 'Billing' })}</caption>
              <thead>
                <th class="billing_header">{t('Lcz_DateLabel', { fallback: 'Date' })}</th>
                <th class="billing_header">{t('Lcz_Amount', { fallback: 'Amount' })}</th>
                <th class="billing_header">{t('Lcz_Designation', { fallback: 'Designation' })}</th>
                {/* <th class="billing_header">Reference</th> */}
              </thead>
              <tbody>
                {this.booking.financial?.payments?.map(p => (
                  <Fragment>
                    <tr key={p.id}>
                      <td class="billing_cell">{formatDate(p.date, 'DD-MMM-YYYY')}</td>
                      <td class="billing_cell">{formatAmount(p.currency.code, p.amount)}</td>
                      <td class="billing_cell">{p.designation || '_'}</td>
                      {/* <td class="billing_cell billing_reference">{p.reference || '_'}</td> */}
                    </tr>
                    {p.reference && (
                      <tr>
                        <td colSpan={3}>
                          {t('Lcz_Ref', { fallback: 'Ref:' })}
                          {p.reference}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </div>
    );
  }
}
