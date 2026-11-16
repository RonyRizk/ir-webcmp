import { Component, State, h, Prop, EventEmitter, Event, Watch, Fragment } from '@stencil/core';
import { Guest } from '@/models/booking.dto';
import { BookingService } from '@/services/booking-service/booking.service';
import { ICountry } from '@/components';
import ApiClient from '@/models/ApiClient';
import { isRequestPending } from '@/stores/ir-interceptor.store';
import { showToast } from '@/utils/utils';
import { LocaleController } from '@/services/locale/locale.controller';
import { LanguageSync } from '@/services/locale/language-sync';
import { SCREEN_TABLES } from '@/services/locale/screen-tables';

import { t } from '@/services/locale/t';
@Component({
  tag: 'ir-guest-info',
  styleUrls: ['ir-guest-info.css', '../../common/sheet.css'],
  scoped: true,
})
export class GuestInfo {
  @Prop() language: string;
  @Prop() headerShown: boolean;
  @Prop() email: string;
  @Prop() booking_nbr: string;
  @Prop() ticket: string;
  @Prop() isInSideBar: boolean;

  @State() countries: ICountry[];
  // @State() submit: boolean = false;
  @State() guest: Guest | null = null;
  @State() isLoading: boolean = true;
  @State() autoValidate = false;

  @Event() closeSideBar: EventEmitter<null>;
  @Event({ bubbles: true }) resetBookingEvt: EventEmitter<null>;

  private bookingService = new BookingService();
  private ApiClient: ApiClient = new ApiClient();

  /** Re-runs init when the language changes so server-localized data follows. */
  private languageSync = new LanguageSync(SCREEN_TABLES.guestInfo, () => this.init());

  async componentWillLoad() {
    if (this.ticket) {
      this.ApiClient.setApiClient(this.ticket);
    }
    if (!!this.ApiClient.getToken()) this.init();
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
    this.init();
  }

  async init() {
    try {
      // Started first: it seeds `LocaleController.language` from the host prop synchronously,
      // so the requests below are built with the right language on first mount.
      const localeReady = LocaleController.load({ language: this.language, tables: SCREEN_TABLES.guestInfo });
      console.log('first');
      this.isLoading = true;
      const [guest, countries] = await Promise.all([this.bookingService.fetchGuest(this.email), this.bookingService.getCountries(LocaleController.language), localeReady]);

      // Assign the fetched guest and countries
      this.countries = countries;
      this.guest = { ...guest, mobile: guest.mobile_without_prefix };
    } catch (error) {
      console.log(error);
    } finally {
      this.isLoading = false;
    }
  }
  private handleInputChange(params: Partial<Guest>) {
    this.guest = { ...this.guest, ...params };
  }

  private async editGuest() {
    try {
      this.autoValidate = true;

      await this.bookingService.editExposedGuest(this.guest, this.booking_nbr ?? null);
      showToast({
        type: 'success',
        description: '',
        title: t('Lcz_SavedSuccessfully', { fallback: 'Saved Successfully' }),
        position: 'top-right',
      });
      this.closeSideBar.emit(null);
      this.resetBookingEvt.emit(null);
    } catch (error) {
      console.log(error);
    }
  }
  render() {
    if (this.isLoading && this.isInSideBar) {
      <div class={'loading-container'}>
        <ir-spinner></ir-spinner>
      </div>;
    }
    if (this.isLoading) {
      return null;
    }
    return (
      <form
        class={'p-0 sheet-container'}
        onSubmit={async e => {
          e.preventDefault();
          await this.editGuest();
        }}
      >
        {!this.isInSideBar && [<ir-toast></ir-toast>, <ir-interceptor></ir-interceptor>]}
        {this.headerShown && <ir-title class="px-1 sheet-header" displayContext="sidebar" label={t('Lcz_GuestDetails', { fallback: 'Guest Details' })}></ir-title>}
        <div class={this.isInSideBar ? 'sheet-body' : 'card-content collapse show '}>
          <div class={this.headerShown ? 'card-body px-1 pt-0' : 'pt-0'}>
            <ir-input-text
              autoValidate={this.autoValidate}
              label={t('Lcz_FirstName', { fallback: 'First name' })}
              name="firstName"
              // submitted={this.submit}
              value={this.guest?.first_name}
              required
              onTextChange={e => this.handleInputChange({ first_name: e.detail })}
            ></ir-input-text>
            <ir-input-text
              autoValidate={this.autoValidate}
              label={t('Lcz_LastName', { fallback: 'Last name' })}
              name="lastName"
              // submitted={this.submit}
              value={this.guest?.last_name}
              required
              onTextChange={e => this.handleInputChange({ last_name: e.detail })}
            ></ir-input-text>
            <ir-input-text
              label={t('Lcz_Email', { fallback: 'Email' })}
              name="email"
              // submitted={this.submit}
              value={this.guest?.email}
              required
              onTextChange={e => this.handleInputChange({ email: e.detail })}
            ></ir-input-text>
            <ir-input-text
              label={t('Lcz_AlternativeEmail', { fallback: 'Alternative email' })}
              name="altEmail"
              value={this.guest?.alternative_email}
              onTextChange={e => this.handleInputChange({ alternative_email: e.detail })}
            ></ir-input-text>
            {/* <ir-input-text label="Password" placeholder="" name="password" submited={this.submit} type="password" value={this.Model.password} required></ir-input-text> */}
            {/* <ir-select
              selectContainerStyle="mb-1"
              required
              name="country"
              submited={this.submit}
              label={t('Lcz_Country', { fallback: 'Country' })}
              selectedValue={this.guest?.country_id?.toString() ?? ''}
              data={this.countries?.map(item => {
                return {
                  value: item.id.toString(),
                  text: item.name,
                };
              })}
              firstOption={'...'}
              onSelectChange={e => this.handleInputChange({ country_id: e.detail })}
            ></ir-select> */}
            <ir-country-picker
              // error={this.submit && !this.guest.country_id}
              country={this.countries.find(c => c.id === this.guest.country_id)}
              label={t('Lcz_Country', { fallback: 'Country' })}
              onCountryChange={e => this.handleInputChange({ country_id: e.detail.id })}
              countries={this.countries}
            ></ir-country-picker>

            <ir-phone-input
              onTextChange={e => {
                e.stopImmediatePropagation();
                e.stopPropagation();
                const { mobile, phone_prefix } = e.detail;
                if (mobile !== this.guest.mobile) {
                  this.handleInputChange({ mobile });
                }
                if (phone_prefix !== this.guest.country_phone_prefix) this.handleInputChange({ country_phone_prefix: phone_prefix });
              }}
              phone_prefix={this.guest.country_phone_prefix}
              value={this.guest.mobile}
              language={this.language}
              label={t('Lcz_MobilePhone', { fallback: 'Mobile phone' })}
              countries={this.countries}
            />
            <div class="mb-2">
              <ir-textarea
                variant="prepend"
                onTextChange={e => this.handleInputChange({ notes: e.detail })}
                value={this.guest?.notes}
                label={t('Lcz_PrivateNote', { fallback: 'Private note' })}
              ></ir-textarea>
            </div>
            <div class={'p-0 m-0'}>
              <label class={`check-container m-0 p-0`}>
                <input
                  class={'m-0 p-0'}
                  type="checkbox"
                  name="newsletter"
                  checked={this.guest.subscribe_to_news_letter}
                  onInput={e => this.handleInputChange({ subscribe_to_news_letter: (e.target as HTMLInputElement).checked })}
                />
                <span class="checkmark m-0 p-0"></span>
                <span class={'m-0 p-0  check-label'}>{t('Lcz_Newsletter', { fallback: 'Newsletter' })}</span>
              </label>
              {!this.isInSideBar && (
                <Fragment>
                  <hr />
                  <ir-button
                    btn_styles="d-flex align-items-center justify-content-center"
                    text={t('Lcz_Save', { fallback: 'Save' })}
                    onClickHandler={this.editGuest.bind(this)}
                    isLoading={isRequestPending('/Edit_Exposed_Guest')}
                    color="btn-primary"
                  ></ir-button>
                </Fragment>
              )}
            </div>
          </div>
        </div>
        {this.isInSideBar && (
          <div class={'sheet-footer'}>
            <ir-button
              data-testid="cancel"
              onClickHandler={() => this.closeSideBar.emit(null)}
              class="flex-fill m-0 p-0"
              btn_styles="w-100 m-0  justify-content-center align-items-center"
              btn_color="secondary"
              text={t('Lcz_Cancel', { fallback: 'Cancel' })}
            ></ir-button>
            <ir-button
              data-testid="save"
              isLoading={isRequestPending('/Edit_Exposed_Guest')}
              btn_disabled={this.isLoading}
              class="flex-fill m-0"
              btn_type="submit"
              btn_styles="w-100 m-0  justify-content-center align-items-center"
              text={t('Lcz_Save', { fallback: 'Save' })}
            ></ir-button>
          </div>
        )}
      </form>
    );
  }
}
