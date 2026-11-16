import { Component, Host, h, Prop, Event, EventEmitter, State, Fragment, Listen } from '@stencil/core';
import { BookingService } from '@/services/booking-service/booking.service';
import { SetupEntries, ICountry } from '@/models/IBooking';
import { v4 } from 'uuid';
import { TPropertyButtonsTypes } from '@/components';
import { z } from 'zod';
import { validateEmail } from '@/utils/utils';
import booking_store, { BookingStore, modifyBookingStore, setBookedByGuestManualEditState } from '@/stores/booking.store';
import calendar_data from '@/stores/calendar-data';
import { AllowedPaymentMethod } from '@/models/booking.dto';
import { isRequestPending } from '@/stores/ir-interceptor.store';
import { ExposedGuests } from '@/services/booking-service/types';
import IMask from 'imask';
import { BookingGuestSchema } from '../../types';

import { t } from '@/services/locale/t';
import { getSetupEntryLabel } from '@/services/setup';
@Component({
  tag: 'igl-property-booked-by',
  styleUrl: 'igl-property-booked-by.css',
  scoped: true,
})
export class IglPropertyBookedBy {
  @Prop() language: string;
  @Prop() showPaymentDetails: boolean = false;
  @Prop() defaultData: { [key: string]: any };
  @Prop() countries: ICountry[] = [];
  @Prop() propertyId: number;

  @State() isButtonPressed: boolean = false;
  @State() bookedByData: { [key: string]: any } = {
    id: undefined,
    email: '',
    firstName: '',
    lastName: '',
    countryId: '',
    isdCode: '',
    contactNumber: '',
    selectedArrivalTime: '',
    emailGuest: false,
    message: '',
    cardNumber: '',
    cardHolderName: '',
    expiryMonth: '',
    expiryYear: '',
  };
  @State() guests: ExposedGuests;
  @State() typedEmail: string;

  @Event() dataUpdateEvent: EventEmitter<{ [key: string]: any }>;

  private bookingService: BookingService = new BookingService();
  private arrivalTimeList: SetupEntries[] = [];
  private currentMonth: string = '01';
  private country;
  private paymentMethods: AllowedPaymentMethod[] = [];
  private pickerRef: HTMLIrPickerElement;

  componentWillLoad() {
    this.assignCountryCode();
    this.initializeDateData();
    this.populateBookedByData();
    this.paymentMethods = calendar_data.property.allowed_payment_methods.filter(p => p.is_active && !p.is_payment_gateway);
    if (this.paymentMethods.length > 0) {
      modifyBookingStore('selectedPaymentMethod', { code: this.paymentMethods[0].code });
    }
  }

  @Listen('buttonClicked', { target: 'body' })
  handleButtonClicked(
    event: CustomEvent<{
      key: TPropertyButtonsTypes;
      data?: CustomEvent;
    }>,
  ) {
    switch (event.detail.key) {
      case 'book':
      case 'bookAndCheckIn':
        this.isButtonPressed = true;
        break;
    }
  }
  private async assignCountryCode() {
    const country = await this.bookingService.getUserDefaultCountry();
    const countryId = country['COUNTRY_ID'];
    this.country = countryId;
    const _c = this.countries.find(c => c.id?.toString() === countryId?.toString());
    this.bookedByData = { ...this.bookedByData, isdCode: _c.phone_prefix.toString(), countryId };
  }
  private initializeDateData() {
    const dt = new Date();
    const month = dt.getMonth() + 1;
    this.currentMonth = month < 10 ? `0${month}` : month.toString();
  }

  private populateBookedByData() {
    this.bookedByData = this.defaultData ? { ...this.bookedByData, ...this.defaultData } : {};
    this.arrivalTimeList = this.defaultData?.arrivalTime || [];
    this.bookedByData = { ...this.bookedByData, selectedArrivalTime: this.arrivalTimeList[0].CODE_NAME };
    if (!this.bookedByData.expiryMonth) {
      this.bookedByData.expiryMonth = this.currentMonth;
    }
    if (!this.bookedByData.expiryYear) {
      this.bookedByData.expiryYear = new Date().getFullYear();
    }
  }

  private handleDataChange(key, event) {
    this.bookedByData = { ...this.bookedByData, [key]: key === 'emailGuest' ? event.target.checked : event.target.value };
    this.dataUpdateEvent.emit({
      key: 'bookedByInfoUpdated',
      data: { ...this.bookedByData },
    });
    if (key === 'firstName' || key === 'lastName') {
      setBookedByGuestManualEditState(true);
    }
    if (key === 'countryId') {
      this.bookedByData = {
        ...this.bookedByData,
        isdCode: event.target.value,
      };
    }
    // console.log(this.bookedByData);
  }
  private handleCreditCardDataChange(key, value: string) {
    this.bookedByData[key] = value;
    this.dataUpdateEvent.emit({
      key: 'bookedByInfoUpdated',
      data: { ...this.bookedByData },
    });
    if (key === 'countryId') {
      this.bookedByData = {
        ...this.bookedByData,
        isdCode: value,
      };
    }
    // console.log(this.bookedByData);
  }
  private handleCountryChange(value) {
    const country = this.countries?.find(country => country.id === value);
    this.bookedByData = {
      ...this.bookedByData,
      isdCode: this.bookedByData?.contactNumber ? this.bookedByData?.isdCode : country?.phone_prefix,
      countryId: value,
    };
    this.dataUpdateEvent.emit({
      key: 'bookedByInfoUpdated',
      data: { ...this.bookedByData },
    });
  }

  private updateGuest(props: Partial<BookingStore['checkout_guest']>) {
    modifyBookingStore('checkout_guest', { ...(booking_store.checkout_guest ?? {}), ...props });
  }

  private handleComboboxSelect(e: CustomEvent) {
    const guest = this.guests?.find(guest => guest.id?.toString() === e.detail.item.value);
    if (!guest) {
      console.warn(`guest not found with id ${e.detail.item.value}`);
      return;
    }
    this.bookedByData.email = guest.email;
    this.bookedByData = {
      ...this.bookedByData,
      id: guest.id,
      firstName: guest.first_name,
      lastName: guest.last_name,
      contactNumber: guest.mobile_without_prefix,
      countryId: guest.country_id,
      isdCode: guest['country_phone_prefix'] ?? guest?.country_id,
    };
    this.dataUpdateEvent.emit({
      key: 'bookedByInfoUpdated',
      data: this.bookedByData,
    });
  }

  private clearEvent() {
    this.bookedByData = {
      ...this.bookedByData,
      id: '',
      firstName: '',
      lastName: '',
      contactNumber: '',
      email: '',
      isdCode: this.country.toString(),
      countryId: this.country,
    };
    setBookedByGuestManualEditState(false);
    this.dataUpdateEvent.emit({
      key: 'bookedByInfoUpdated',
      data: { ...this.bookedByData },
    });
  }

  private async fetchGuests(email: string) {
    this.typedEmail = email;
    this.guests = await this.bookingService.fetchExposedGuest(email, this.propertyId);
  }
  private get expiryDate(): string {
    const { expiryMonth, expiryYear } = this.bookedByData;

    if (!expiryMonth || !expiryYear) {
      return '';
    }

    // Normalize year to YY
    const year = expiryYear.toString().length === 4 ? expiryYear.toString().slice(-2) : expiryYear.toString();

    return `${expiryMonth}/${year}`;
  }
  render() {
    return (
      <Host>
        <div class="ir-text-start mt-3">
          <div class="d-flex" style={{ alignItems: 'flex-end', gap: '0.5rem' }}>
            <ir-picker
              class="bookedByEmailContainer m-0 p-0"
              label={t('Lcz_BookedBy', { fallback: 'Booked by' })}
              value={this.bookedByData.email}
              ref={el => (this.pickerRef = el)}
              aria-invalid={String(Boolean(this.isButtonPressed && this.bookedByData.email !== '' && validateEmail(this.bookedByData.email)))}
              withClear
              onText-change={event => this.fetchGuests(event.detail)}
              debounce={300}
              onInput-picker-blurred={e => {
                e.stopPropagation();
                e.stopImmediatePropagation();
                const email = this.typedEmail;
                if (this.bookedByData.email) {
                  return;
                }
                if (this.guests.length === 0) {
                  if (z.string().email().safeParse(email).success) {
                    this.bookedByData = {
                      ...this.bookedByData,
                      email,
                    };
                  } else {
                    this.clearEvent();
                    this.pickerRef.clearInput();
                  }
                }
              }}
              onCombobox-clear={e => {
                e.stopImmediatePropagation();
                e.stopPropagation();
                this.clearEvent();
              }}
              loading={isRequestPending('/Fetch_Exposed_Guests')}
              placeholder={t('Lcz_FindEmailAddress', { fallback: 'Find email address or add new' })}
              mode="select-async"
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
            <div style={{ paddingBottom: '0.5rem' }}>
              <wa-tooltip for={`main_guest-search-tooltip`}>{t('Lcz_LeaveEmptyIfEmailUnavailable', { fallback: 'Leave empty if email is unavailable' })}</wa-tooltip>
              <wa-icon name="circle-info" id={`main_guest-search-tooltip`}></wa-icon>
            </div>
          </div>
        </div>
        <div class="bookedDetailsForm ir-text-start mt-2 font-small-3 ">
          <div class="d-flex flex-column flex-md-row  justify-content-md-between " style={{ gap: '1rem' }}>
            <div class="fd-property-booked-by__guest-form ">
              <ir-validator value={this.bookedByData.firstName} schema={BookingGuestSchema.shape.first_name}>
                <ir-input
                  // aria-invalid={String(Boolean(this.isButtonPressed && this.bookedByData.firstName === ''))}
                  onText-change={event => {
                    this.updateGuest({ first_name: event.detail });
                    this.handleDataChange('firstName', { target: { value: event.detail.trim() } });
                  }}
                  defaultValue={this.bookedByData.firstName}
                  value={this.bookedByData.firstName}
                  label={t('Lcz_FirstName', { fallback: 'First name' })}
                  placeholder={t('Lcz_FirstName', { fallback: 'First name' })}
                  required
                  name="last_name_custom"
                  autocomplete="family-name"
                ></ir-input>
              </ir-validator>
              <ir-validator value={this.bookedByData.lastName} schema={BookingGuestSchema.shape.last_name}>
                <ir-input
                  // aria-invalid={String(Boolean(this.isButtonPressed && this.bookedByData.lastName === ''))}
                  onText-change={event => {
                    this.updateGuest({ last_name: event.detail });
                    this.handleDataChange('lastName', { target: { value: event.detail.trim() } });
                  }}
                  name="first_name_custom"
                  autocomplete="given-name"
                  defaultValue={this.bookedByData.lastName}
                  value={this.bookedByData.lastName}
                  label={t('Lcz_LastName', { fallback: 'Last name' })}
                  placeholder={t('Lcz_LastName', { fallback: 'Last name' })}
                  required
                ></ir-input>
              </ir-validator>
              <ir-country-picker
                label={t('Lcz_Country', { fallback: 'Country' })}
                variant="modern"
                testId="main_guest_country"
                class="flex-grow-1 m-0"
                onCountryChange={e => this.handleCountryChange(e.detail.id)}
                countries={this.countries}
                country={this.countries.find(c => c.id === this.bookedByData.countryId)}
              ></ir-country-picker>
              <ir-mobile-input
                size="s"
                onMobile-input-change={e => {
                  this.handleDataChange('contactNumber', { target: { value: e.detail.formattedValue } });
                }}
                onMobile-input-country-change={e => this.handleDataChange('isdCode', { target: { value: e.detail.phone_prefix } })}
                value={this.bookedByData.contactNumber}
                // required
                countryCode={this.countries.find(c => c.phone_prefix === this.bookedByData.isdCode)?.code}
                countries={this.countries}
              ></ir-mobile-input>
              <wa-select
                size="s"
                label={t('Lcz_YourArrivalTime', { fallback: 'Your arrival time' })}
                data-testid="arrival_time"
                aria-disabled={String(Boolean(this.isButtonPressed && this.bookedByData.selectedArrivalTime.code === ''))}
                id={v4()}
                defaultValue={this.arrivalTimeList[0].CODE_NAME}
                value={this.bookedByData.selectedArrivalTime.code}
                onchange={event => this.handleDataChange('selectedArrivalTime', event)}
              >
                {this.arrivalTimeList.map(time => (
                  <wa-option value={time.CODE_NAME} selected={this.bookedByData.selectedArrivalTime.code === time.CODE_NAME}>
                    {getSetupEntryLabel(time)}
                  </wa-option>
                ))}
              </wa-select>
            </div>
            <div class="p-0 flex-fill  ml-md-3 d-flex flex-column" style={{ gap: '0.5rem' }}>
              <wa-textarea
                onchange={event => this.handleDataChange('message', event)}
                size="s"
                value={this.bookedByData.message}
                defaultValue={this.bookedByData.message}
                label={t('Lcz_AnyMessageForUs', { fallback: 'Any message for us' })}
                rows={4}
              ></wa-textarea>
              {this.paymentMethods.length > 1 && (
                <wa-select
                  label={t('Lcz_PaymentMethod', { fallback: 'Payment Method' })}
                  size="s"
                  value={booking_store?.selectedPaymentMethod?.code}
                  onchange={e =>
                    modifyBookingStore('selectedPaymentMethod', {
                      code: (e.target as HTMLSelectElement).value,
                    })
                  }
                >
                  {this.paymentMethods.map(p => (
                    <wa-option value={p.code}>{p.description}</wa-option>
                  ))}
                </wa-select>
              )}
              {booking_store.selectedPaymentMethod?.code === '001' && (
                <Fragment>
                  <ir-input
                    value={this.bookedByData.cardNumber}
                    defaultValue={this.bookedByData.cardNumber}
                    onText-change={e => this.handleCreditCardDataChange('cardNumber', e.detail.trim())}
                    label={t('Lcz_CardNumber', { fallback: 'Card number' })}
                  ></ir-input>
                  <ir-input
                    value={this.bookedByData.cardHolderName}
                    defaultValue={this.bookedByData.cardHolderName}
                    onText-change={e => this.handleCreditCardDataChange('cardHolderName', e.detail.trim())}
                    label={t('Lcz_CardHolderName', { fallback: 'Card holder name' })}
                  ></ir-input>
                  <ir-input
                    onText-change={e => {
                      const [month, year] = e.detail.split('/');
                      this.handleCreditCardDataChange('expiryYear', month ?? '');
                      this.handleCreditCardDataChange('expiryMonth', year ?? '');
                    }}
                    value={this.expiryDate}
                    mask={{
                      mask: 'MM/YY',
                      placeholderChar: '_',
                      blocks: {
                        MM: {
                          mask: IMask.MaskedRange,
                          from: 1,
                          to: 12,
                          maxLength: 2,
                        },
                        YY: {
                          mask: IMask.MaskedRange,
                          from: new Date().getFullYear() % 100,
                          to: (new Date().getFullYear() % 100) + 20,
                          maxLength: 2,
                        },
                      },
                    }}
                    label={t('Lcz_ExpiryDate', { fallback: 'Expiry date' })}
                  ></ir-input>
                </Fragment>
              )}
              {booking_store.selectedPaymentMethod?.code === '005' && (
                <div class="form-group mt-md-1 mt-1 p-0 d-flex flex-column flex-md-row align-items-md-center">
                  <label class="p-0 m-0 margin3"></label>
                  <div class="p-0 m-0  controlContainer flex-fill">
                    <div
                      class="property-booked-by__money-transfer-description"
                      innerHTML={this.paymentMethods.find(p => p.code === '005')?.localizables.find(l => l.language.code.toLowerCase() === 'en')?.description}
                    ></div>
                  </div>
                </div>
              )}
              <wa-checkbox checked={this.bookedByData.emailGuest} onchange={event => this.handleDataChange('emailGuest', event)}>
                {t('Lcz_EmailTheGuest', { fallback: 'Email the guest' })}
              </wa-checkbox>
            </div>
          </div>
        </div>
      </Host>
    );
  }
}
