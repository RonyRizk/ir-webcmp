import ApiClient from '@/models/ApiClient';
import { AuthService } from '@/services/authenticate.service';
import { isRequestPending } from '@/stores/ir-interceptor.store';
import { Component, Event, EventEmitter, Host, Prop, State, h } from '@stencil/core';
import { LocaleController } from '@/services/locale/locale.controller';
import { SCREEN_TABLES } from '@/services/locale/screen-tables';
import { t } from '@/services/locale/t';

@Component({
  tag: 'ir-login',
  styleUrl: 'ir-login.css',
  scoped: true,
})
export class IrLogin {
  @Prop() language: string = 'en';

  @State() username: string;
  @State() password: string;
  @State() showPassword: boolean = false;
  @Event() authFinish: EventEmitter<{
    ApiClient: string;
    code: 'succsess' | 'error';
  }>;

  private authService = new AuthService();
  private ApiClient = new ApiClient();

  componentWillLoad() {
    LocaleController.load({ language: this.language, tables: SCREEN_TABLES.login });
  }

  private async handleSignIn(e: Event) {
    e.preventDefault();
    try {
      const ApiClient = await this.authService.authenticate({
        password: this.password,
        username: this.username,
      });
      this.ApiClient.setApiClient(ApiClient);
      this.authFinish.emit({ ApiClient, code: 'succsess' });
    } catch (error) {
      console.log(error.message);
    }
  }
  render() {
    return (
      <Host>
        <ir-interceptor></ir-interceptor>
        <ir-toast></ir-toast>
        <form onSubmit={this.handleSignIn.bind(this)} class="card form-container px-2">
          <img
            class="logo"
            src="https://x.igloorooms.com/app-assets/images/logo/logo-dark.png"
            alt={t('Lcz_LoginToIglooroomsExtranet', { fallback: 'Login to igloorooms extranet' })}
          />
          <div class="separator-container">
            <div class="separator"></div>
            <p>{t('Lcz_SignInToManageYourProperty', { fallback: 'Sign in to manage your property' })}</p>
            <div class="separator"></div>
          </div>
          <ir-input-text value={this.username} onTextChange={e => (this.username = e.detail)} variant="icon" label="" placeholder={t('Lcz_Username', { fallback: 'Username' })}>
            <ir-icons name="user" slot="icon"></ir-icons>
          </ir-input-text>
          <div class={'position-relative'}>
            <ir-input-text
              value={this.password}
              onTextChange={e => (this.password = e.detail)}
              variant="icon"
              label=""
              placeholder={t('Lcz_Password', { fallback: 'Password' })}
              type={this.showPassword ? 'text' : 'password'}
            >
              <ir-icons name="key" slot="icon"></ir-icons>
            </ir-input-text>
            <button type="button" class="password_toggle" onClick={() => (this.showPassword = !this.showPassword)}>
              <ir-icons name={!this.showPassword ? 'open_eye' : 'closed_eye'}></ir-icons>
            </button>
          </div>
          <ir-button
            isLoading={isRequestPending('/Authenticate')}
            btn_type="submit"
            iconPosition="left"
            icon_name="unlock"
            text={t('Lcz_Login', { fallback: 'Login' })}
            size="md"
            class="login-btn"
          ></ir-button>
          <div class="card-body text-center p-0 app_links">
            <a href="https://apps.apple.com/lb/app/igloorooms/id1607846173" target="_new">
              <img src="https://x.igloorooms.com/assets/images/svg/AppStore_ios.svg" alt={t('Lcz_InstallIglooroomsIosApp', { fallback: 'Install igloorooms iOS App' })} />
            </a>
            <a href="https://play.google.com/store/apps/details?id=com.iglooroomsapp" target="_new">
              <img src="https://x.igloorooms.com/assets/images/svg/AppStore_android.svg" alt={t('Lcz_InstallIglooroomsAndroidApp', { fallback: 'Install igloorooms Android App' })} />
            </a>
          </div>
          <a href="https://info.igloorooms.com/signup" class="btn btn-outline-danger btn-block btn-md mt-2" target="_new">
            {t('Lcz_NewToIgloorooms', { fallback: 'New to igloorooms?' })}
          </a>
          <p class={'font-small-3  my-1'}>
            {t('Lcz_ByLoggingInYouAccept', { fallback: 'By logging in, you accept our' })}{' '}
            <span>
              <a href="https://info.igloorooms.com/privacy/" target="_new">
                {t('Lcz_PrivacyAndCookiesPolicies', { fallback: 'Privacy and Cookies Policies' })}
              </a>
            </span>{' '}
            {t('Lcz_NeedHelpContactSupport', { fallback: 'Need help? support@igloorooms.com' })}
          </p>
        </form>
      </Host>
    );
  }
}
