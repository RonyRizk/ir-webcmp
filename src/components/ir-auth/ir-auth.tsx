import { Component, Element, Event, EventEmitter, Host, Prop, State, Watch, h } from '@stencil/core';
import { z } from 'zod';
import { LegacyAuthService, type LegacyUserInfo } from '@/services/auth/legacy-auth.service';
import { LanguageSync } from '@/services/locale/language-sync';
import { LocaleController } from '@/services/locale/locale.controller';
import { SCREEN_TABLES } from '@/services/locale/screen-tables';
import { t } from '@/services/locale/t';
import { showToast } from '@/utils/utils';

export type AuthLanguage = { code: string; label: string };
export type AuthView = 'login' | 'forgotPassword' | 'forgotUsername';
type AuthField = 'username' | 'password' | 'forgotPasswordUsername' | 'email';

/** `localStorage` keys `Get_Startup_Data` is unpacked into, read by the rest of the extranet. */
const STARTUP_STORAGE_KEYS = {
  SetupEntries_b: 'My_SetupEntries',
  Languages_b: 'My_Languages',
  Currencies_b: 'My_Currencies',
  Countries_b: 'My_Countries',
  Hotel_Chains_b: 'My_Hotel_chain',
  Food_Arrangements_b: 'My_Food_arrangement_light',
  Cards_b: 'My_Card',
  Amenities_b: 'My_Amenity_light',
  Beddings_b: 'My_Bedding_light',
  Gateways_b: 'My_Gw',
} as const;

/**
 * The extranet sign-in panel: login, forgot password and forgot username.
 *
 * Owns validation and the whole legacy login chain (`IsAuthenticated_JSON` →
 * `Get_Startup_Data_Signature` → `Get_Startup_Data`), then redirects the way
 * `Default.aspx` always has: to the OTP page, or by clicking the server's
 * `btn_RedirectFromLogin`, whose handler reads `Request.Form["txt_username"]`.
 *
 * Renders no `<form>` of its own, and no encapsulation: mount it inside the page's
 * `<form runat="server">`, exactly where the legacy fields sat, so `#txt_username`
 * posts with the redirect like the original input did. Every other submit of that
 * form is intercepted and handled here.
 */
@Component({
  tag: 'ir-auth',
  styleUrl: 'ir-auth.css',
})
export class IrAuth {
  @Element() el: HTMLIrAuthElement;

  /** The page's current language, e.g. `<%= CurrentLanguage %>`. */
  @Prop() language: string = 'en';

  /** Languages offered by the switcher, as an array or a JSON string of `{ code, label }`. */
  @Prop() languages: string | AuthLanguage[] = [];

  @Prop({ attribute: 'logo-url' }) logoUrl: string;

  /** Hides the app links and the sign-up button when the page runs inside MPO. */
  @Prop({ attribute: 'inside-mpo' }) insideMpo: boolean = false;

  /** When set together with {@link autoPassword}, signs in on load. */
  @Prop() autoUsername: string;
  @Prop() autoPassword: string;

  /**
   * Base URL of the app's WCF service the login endpoints live on — `_apiUri` in
   * `js/CommonLibrary.js`. The default resolves next to the page (`…/Default.aspx` → `…/AppWCF.svc/`).
   */
  @Prop({ attribute: 'api-url' }) apiUrl: string = 'AppWCF.svc/';

  /** Id of the server button whose postback signs the user in (`FormsAuthentication.RedirectFromLoginPage`). */
  @Prop({ attribute: 'redirect-button' }) redirectButton: string = 'btn_RedirectFromLogin';

  /** Where users who must confirm a one-time password are sent instead. */
  @Prop({ attribute: 'otp-url' }) otpUrl: string = './OTPVerifier.aspx';

  @State() view: AuthView = 'login';
  @State() username: string = '';
  @State() password: string = '';
  @State() rememberUsername: boolean = true;
  @State() forgotPasswordUsername: string = '';
  @State() email: string = '';
  @State() isLoading: boolean = false;
  /** Set once navigation starts, so the submit button stays busy until the page unloads. */
  @State() redirecting: boolean = false;
  @State() languageList: AuthLanguage[] = [];

  @Event() authLanguageChange: EventEmitter<{ code: string }>;
  /** Fires after a successful login, before redirecting. Call `preventDefault()` to handle navigation yourself. */
  @Event({ cancelable: true }) authFinish: EventEmitter<{ userInfo: LegacyUserInfo; requiresOtp: boolean }>;

  private authService: LegacyAuthService;
  private languageSync = new LanguageSync(SCREEN_TABLES.auth, () => LocaleController.load({ tables: SCREEN_TABLES.auth }));
  /** The page's server form this component sits in. */
  private formEl?: HTMLFormElement | null;
  private schemaCache?: { key: string; schemas: Record<AuthField, z.ZodTypeAny> };

  componentWillLoad() {
    LocaleController.load({ language: this.language, tables: SCREEN_TABLES.auth }).catch(error => console.error('Failed to load login strings', error));
    this.parseLanguages(this.languages);
    this.createAuthService(this.apiUrl);
    this.username = this.readStorage('USERNAME') ?? '';
  }

  connectedCallback() {
    this.formEl = this.el.closest('form');
    if (!this.formEl) {
      console.warn('[ir-auth] Not inside a <form>: sign-in cannot submit or post "txt_username". Mount it in the page\'s <form runat="server">.');
    }
    // Capture, so the request is stopped before ASP.NET's own onsubmit handling sees it.
    this.formEl?.addEventListener('submit', this.handleSubmit, true);
  }

  componentDidLoad() {
    this.languageSync.connect();
    if (this.autoUsername && this.autoPassword) {
      this.username = this.autoUsername;
      this.password = this.autoPassword;
      this.authenticate();
    }
  }

  disconnectedCallback() {
    this.languageSync.disconnect();
    this.formEl?.removeEventListener('submit', this.handleSubmit, true);
    this.formEl = undefined;
  }

  @Watch('language')
  languageChanged(next: string, previous: string) {
    this.languageSync.propChanged(next, previous);
  }

  @Watch('languages')
  parseLanguages(value: string | AuthLanguage[]) {
    if (Array.isArray(value)) {
      this.languageList = value;
      return;
    }
    try {
      const parsed = value ? JSON.parse(value) : [];
      this.languageList = Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.warn('[ir-auth] "languages" is not valid JSON.', error);
      this.languageList = [];
    }
  }

  @Watch('apiUrl')
  createAuthService(url: string) {
    this.authService = new LegacyAuthService(url || 'AppWCF.svc/');
  }

  /**
   * One schema per field. `ir-validator` uses them to show messages on submit and while
   * typing; the submit handlers re-check them to block the request.
   */
  private get schemas(): Record<AuthField, z.ZodTypeAny> {
    const messages = {
      username: t('Lcz_PleaseEnterYourUsername', { fallback: 'Please enter your username' }),
      password: t('Lcz_PleaseEnterYourPassword', { fallback: 'Please enter your password' }),
      email: t('Lcz_PleaseEnterYourEmail', { fallback: 'Please enter your email' }),
      validEmail: t('Lcz_PleaseEnterValidEmail', { fallback: 'Please enter a valid email' }),
    };
    // Rebuilt only when the translations change: a new schema object re-runs every validator.
    const key = Object.values(messages).join('\u0000');
    if (this.schemaCache?.key !== key) {
      const required = (message: string) => z.string().trim().min(1, message);
      const username = required(messages.username);
      this.schemaCache = {
        key,
        schemas: {
          username,
          password: required(messages.password),
          forgotPasswordUsername: username,
          email: required(messages.email).pipe(z.string().email(messages.validEmail)),
        },
      };
    }
    return this.schemaCache.schemas;
  }

  private isValid(...fields: AuthField[]): boolean {
    const schemas = this.schemas;
    return fields.every(field => schemas[field].safeParse(this[field] ?? '').success);
  }

  private switchView(view: AuthView) {
    this.view = view;
  }

  /**
   * `ir-input` nests `wa-input` in its own shadow root, out of reach of the form,
   * so Enter in a field no longer submits it natively. Goes through a real submit
   * (caught by {@link handleSubmit}) so every `ir-validator` shows its message.
   */
  private handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'IR-INPUT') {
      e.preventDefault();
      this.formEl?.requestSubmit();
    }
  }

  /**
   * Submits of the server form: the redirect postback (fired by {@link redirect}) goes
   * through untouched; anything else — the submit buttons, Enter — runs the active view.
   */
  private handleSubmit = (e: Event) => {
    if (this.redirecting) {
      return;
    }
    // Only preventDefault: the field `ir-validator`s listen for this same submit to show their messages.
    e.preventDefault();
    switch (this.view) {
      case 'login':
        return this.authenticate();
      case 'forgotPassword':
        return this.forgotPassword();
      case 'forgotUsername':
        return this.forgotUsername();
    }
  };

  private async authenticate() {
    if (!this.isValid('username', 'password') || this.isLoading || this.redirecting) {
      return;
    }
    this.writeStorage('USERNAME', this.rememberUsername ? this.username : '');
    this.isLoading = true;
    try {
      const userInfo = await this.authService.isAuthenticated({ username: this.username, password: this.password });
      this.writeStorage('UserInfo_b', JSON.stringify(userInfo));

      // An Int64 from the server against a string from storage — legacy compared them with `!=`.
      const signature = String(await this.authService.getStartupDataSignature(userInfo.OwnerID, userInfo.Ticket));
      if (this.readStorage('_Startup_Data_Signature_b') !== signature) {
        this.writeStorage('_Startup_Data_Signature_b', signature);
        const startupData = await this.authService.getStartupData(userInfo.OwnerID, 'EN', userInfo.Ticket);
        for (const [storageKey, field] of Object.entries(STARTUP_STORAGE_KEYS)) {
          this.writeStorage(storageKey, JSON.stringify(startupData?.[field]));
        }
        this.toastSuccess(t('Lcz_LoginSuccessfulRedirecting', { fallback: 'You have successfully logged in. Redirecting ...' }));
      } else {
        this.toastSuccess(t('Lcz_LoginSuccessful', { fallback: 'Hooray! You have successfully logged in.' }));
      }

      const requiresOtp = userInfo.IsRequireOTP === true;
      if (!this.authFinish.emit({ userInfo, requiresOtp }).defaultPrevented) {
        this.redirect(requiresOtp);
      }
    } catch (error) {
      this.logError(error);
    } finally {
      if (!this.redirecting) {
        this.isLoading = false;
      }
    }
  }

  private redirect(requiresOtp: boolean) {
    if (requiresOtp) {
      this.redirecting = true;
      window.location.href = this.otpUrl;
      return;
    }
    const button = document.getElementById(this.redirectButton) as HTMLElement | null;
    if (!button) {
      console.error(`[ir-auth] Redirect button "#${this.redirectButton}" not found; cannot complete the login postback.`);
      return;
    }
    // Lets this submit through handleSubmit; #txt_username (ir-input, form-associated) posts itself.
    this.redirecting = true;
    button.click();
  }

  private async forgotPassword() {
    if (!this.isValid('forgotPasswordUsername') || this.isLoading) {
      return;
    }
    this.isLoading = true;
    try {
      const sentTo = await this.authService.forgotPassword(this.forgotPasswordUsername);
      const [recipient] = String(sentTo ?? '').split('@');
      this.toastSuccess(t('Lcz_EmailBeingSentWithPassword', { fallback: 'An email is being sent to %1@...... containing your password', params: [recipient] }));
      this.switchView('login');
    } catch (error) {
      this.logError(error);
    } finally {
      this.isLoading = false;
    }
  }

  private async forgotUsername() {
    if (!this.isValid('email') || this.isLoading) {
      return;
    }
    this.isLoading = true;
    try {
      await this.authService.forgotUsername(this.email);
      const [recipient] = this.email.split('@');
      this.toastSuccess(t('Lcz_EmailBeingSentWithUsername', { fallback: 'An email is being sent to %1@...... containing your username', params: [recipient] }));
      this.switchView('login');
    } catch (error) {
      this.logError(error);
    } finally {
      this.isLoading = false;
    }
  }

  private toastSuccess(title: string) {
    showToast({ type: 'success', title, description: '', position: 'top-right' });
  }

  /** Error toasts belong to `ir-interceptor` (rendered below); ir-auth only logs. */
  private logError(error: unknown) {
    console.error('[ir-auth]', error);
  }

  /* Storage can throw in private windows or with site data blocked; the form must still work. */
  private readStorage(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private writeStorage(key: string, value: string) {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.warn(`[ir-auth] Failed to write "${key}" to localStorage.`, error);
    }
  }

  private renderBackToLogin() {
    return (
      <p class="pms-auth__return">
        <a href="#" class="Lnk_ReturnToLogin pms-auth__link pms-auth__link--plain pms-auth__return-link" onClick={e => (e.preventDefault(), this.switchView('login'))}>
          {t('Lcz_BackToSignIn', { fallback: 'Back to sign in' })}
        </a>
      </p>
    );
  }

  private renderSubmit(label: string) {
    return (
      <ir-custom-button class="pms-auth__submit" type="submit" variant="brand" size="l" loading={this.isLoading || this.redirecting}>
        {label}
      </ir-custom-button>
    );
  }

  /** `id` and `name` are the ones the legacy `Default.aspx` markup used, so page scripts can still find the fields. */
  private renderInput({
    field,
    id,
    name,
    label,
    type = 'text',
    autocomplete,
  }: {
    field: AuthField;
    id: string;
    name?: string;
    label: string;
    type?: 'text' | 'password' | 'email';
    autocomplete: string;
  }) {
    return (
      <fieldset class="pms-auth__field">
        {/* Keyed so a view switch mounts a fresh validator instead of reusing another field's state. */}
        <ir-validator key={field} schema={this.schemas[field]} value={this[field]} valueEvent="text-change" showErrorMessage>
          <ir-input
            id={id}
            name={name}
            type={type}
            size="l"
            passwordToggle={type === 'password'}
            autocomplete={autocomplete}
            // label={label}
            placeholder={label}
            value={this[field]}
            onText-change={(e: CustomEvent<string>) => (this[field] = e.detail)}
          ></ir-input>
        </ir-validator>
      </fieldset>
    );
  }

  private renderLogin() {
    return (
      <div class="UsedByLogin">
        <h1 class="pms-auth__title">{t('Lcz_SignInToManageYourProperty', { fallback: 'Sign in to manage your property' })}</h1>
        <p class="pms-auth__subtitle"></p>
        {this.renderInput({ field: 'username', id: 'txt_username', name: 'txt_username', label: t('Lcz_Username', { fallback: 'Username' }), autocomplete: 'username' })}
        <div class="pms-auth__row">
          <wa-checkbox
            id="chk_RememberUname"
            class="pms-auth__remember"
            defaultChecked={this.rememberUsername}
            checked={this.rememberUsername}
            onchange={e => (this.rememberUsername = (e.target as HTMLInputElement).checked)}
          >
            {t('Lcz_RememberUsername', { fallback: 'Remember username' })}
          </wa-checkbox>
          {/* Both links read "I Forgot"; the aria-label says which one. */}
          <a
            href="#"
            id="Lnk_ForgotUsername"
            class="pms-auth__link pms-auth__link--plain"
            aria-label={t('Lcz_ForgotUsername', { fallback: 'Forgot username?' })}
            onClick={e => (e.preventDefault(), this.switchView('forgotUsername'))}
          >
            {t('Lcz_IForgot', { fallback: 'I Forgot' })}
          </a>
        </div>
        {this.renderInput({
          field: 'password',
          id: 'txt_password',
          label: t('Lcz_Password', { fallback: 'Password' }),
          type: 'password',
          autocomplete: 'current-password',
        })}
        <div class="pms-auth__row pms-auth__row--end">
          <a
            href="#"
            id="Lnk_ForgotPassword"
            class="pms-auth__link pms-auth__link--plain"
            aria-label={t('Lcz_ForgotPassword', { fallback: 'Forgot password?' })}
            onClick={e => (e.preventDefault(), this.switchView('forgotPassword'))}
          >
            {t('Lcz_IForgot', { fallback: 'I Forgot' })}
          </a>
        </div>
        {this.renderSubmit(t('Lcz_Continue', { fallback: 'Continue' }))}
      </div>
    );
  }

  private renderForgotPassword() {
    return (
      <div class="UsedByForgotPwd">
        <h1 class="pms-auth__title">{t('Lcz_GetYourPassword', { fallback: 'Get your password' })}</h1>
        <p class="pms-auth__subtitle"></p>
        {this.renderInput({ field: 'forgotPasswordUsername', id: 'txt_username1', label: t('Lcz_Username', { fallback: 'Username' }), autocomplete: 'username' })}
        {this.renderSubmit(t('Lcz_GetPassword', { fallback: 'Get password' }))}
        {this.renderBackToLogin()}
      </div>
    );
  }

  private renderForgotUsername() {
    return (
      <div class="UsedByForgotUname">
        <h1 class="pms-auth__title">{t('Lcz_GetYourUsername', { fallback: 'Get your username' })}</h1>
        <p class="pms-auth__subtitle"></p>
        {this.renderInput({ field: 'email', id: 'txt_email', label: t('Lcz_Email', { fallback: 'Email' }), type: 'email', autocomplete: 'email' })}
        {this.renderSubmit(t('Lcz_GetUsername', { fallback: 'Get username' }))}
        {this.renderBackToLogin()}
      </div>
    );
  }

  /**
   * One translatable sentence; `%1` marks where the privacy-policy link goes, so each
   * language can place it wherever its grammar needs.
   */
  private renderLegalNotice() {
    const [before, after = ''] = t('Lcz_ByLoggingInYouAcceptOurPrivacyPolicy', { fallback: 'By logging in, you accept our %1.' }).split('%1');
    return (
      <p class="pms-auth__legal">
        {before}
        <a class="pms-auth__link" href="https://info.igloorooms.com/privacy/" target="_new">
          {t('Lcz_PrivacyPolicy', { fallback: 'Privacy policy' })}
        </a>
        {after}
      </p>
    );
  }

  private renderLanguageSelector() {
    if (!this.languageList.length) {
      return null;
    }
    const current = this.languageList.find(({ code }) => code.toLowerCase() === (this.language ?? '').toLowerCase());
    return (
      <div class="pms-auth__lang">
        <wa-dropdown id="language-selector" onwa-select={e => this.authLanguageChange.emit({ code: (e.detail as any).item.value })}>
          <wa-button slot="trigger" class="pms-auth__lang-trigger" size="s" appearance="outlined" variant="neutral" with-caret>
            {current?.label ?? this.language?.toUpperCase()}
          </wa-button>
          {this.languageList.map(({ code, label }) => (
            <wa-dropdown-item key={code} value={code}>
              {label}
            </wa-dropdown-item>
          ))}
        </wa-dropdown>
      </div>
    );
  }

  render() {
    return (
      <Host>
        <ir-interceptor></ir-interceptor>
        <ir-toast></ir-toast>
        <div class="pms-auth__topbar">
          <div class="pms-auth__brand">{this.logoUrl && <img class="pms-auth__logo" src={this.logoUrl} alt="igloorooms" />}</div>
          {this.renderLanguageSelector()}
        </div>

        <div class="pms-auth__card">
          {/* The fields belong to the page's server form, as in the original markup. */}
          <div class="pms-auth__form" onKeyDown={e => this.handleKeyDown(e)}>
            {this.view === 'login' && this.renderLogin()}
            {this.view === 'forgotPassword' && this.renderForgotPassword()}
            {this.view === 'forgotUsername' && this.renderForgotUsername()}
          </div>

          {!this.insideMpo && (
            <div class="pms-auth__extras">
              {/* <hr class="pms-auth__divider" /> */}
              <div class="pms-auth__apps">
                <a
                  class="pms-auth__link pms-auth__link--plain pms-auth__app-link"
                  href="https://apps.apple.com/lb/app/igloorooms/id1607846173"
                  target="_new"
                  aria-label={t('Lcz_InstallIglooroomsIosApp', { fallback: 'Install igloorooms iOS App' })}
                >
                  <wa-icon class="pms-auth__app-icon" name="app-store" family="brands"></wa-icon>
                </a>
                <a
                  class="pms-auth__link pms-auth__link--plain pms-auth__app-link"
                  href="https://play.google.com/store/apps/details?id=com.iglooroomsapp"
                  target="_new"
                  aria-label={t('Lcz_InstallIglooroomsAndroidApp', { fallback: 'Install igloorooms Android App' })}
                >
                  <wa-icon class="pms-auth__app-icon" name="google-play" family="brands"></wa-icon>
                </a>
              </div>
              <ir-custom-button class="pms-auth__signup" appearance="outlined" variant="neutral" size="l" href="https://info.igloorooms.com/signup" target="_blank">
                {t('Lcz_NewToIgloorooms', { fallback: 'New to igloorooms?' })}
              </ir-custom-button>
            </div>
          )}
        </div>

        <div class="pms-auth__footer">
          {this.renderLegalNotice()}
          <p class="pms-auth__help">{t('Lcz_NeedHelpContactSupport', { fallback: 'Need help? support@igloorooms.com' })}</p>
        </div>
      </Host>
    );
  }
}
