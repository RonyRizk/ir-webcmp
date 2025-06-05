import Token from '@/models/Token';
import { AuthService } from '@/services/authenticate.service';
import { RoomService } from '@/services/room.service';
import { SystemService } from '@/services/system.service';
import locales from '@/stores/locales.store';
import { CONSTANTS } from '@/utils/constants';
import { Component, Element, Event, EventEmitter, Fragment, Listen, Prop, State, Watch, h } from '@stencil/core';
import { z, ZodError } from 'zod';

@Component({
  tag: 'ir-reset-password',
  styleUrls: ['ir-reset-password.css', '../../common/sheet.css'],
  scoped: true,
})
export class IrResetPassword {
  @Element() el: HTMLIrResetPasswordElement;

  @Prop() username: string;
  @Prop() old_pwd: string;
  @Prop() ticket: string;
  @Prop() skip2Fa: boolean;
  @Prop() language: string = 'en';

  @State() confirmPassword: string;
  @State() password: string;
  @State() showValidator: boolean = false;
  @State() autoValidate: boolean = false;
  @State() error: { password?: boolean; confirm_password?: boolean } = {};
  @State() submitted: boolean = false;
  @State() isLoading = false;
  @State() isFetching = false;

  @Event() closeSideBar: EventEmitter<null>;

  private token = new Token();
  private authService = new AuthService();
  private systemService = new SystemService();
  private roomService = new RoomService();
  private initialized = false;

  componentWillLoad() {
    if (this.ticket) {
      this.token.setToken(this.ticket);
    }
  }

  componentDidLoad() {
    this.init();
  }

  @Watch('ticket')
  handleTicketChange(oldValue: string, newValue: string) {
    if (oldValue !== newValue) {
      this.token.setToken(this.ticket);
      this.init();
    }
  }

  private async init() {
    if (!this.ticket || this.initialized) {
      return;
    }
    const [localized_words] = await Promise.all([
      this.roomService.fetchLanguage(this.language, ['_USER_MGT']),
      this.systemService.checkOTPNecessity({
        METHOD_NAME: 'Change_User_Pwd',
      }),
    ]);
    locales.entries = localized_words.entries;
    locales.direction = localized_words.direction;
    this.initialized = false;
  }

  private ResetPasswordSchema = z.object({
    password: z.string().regex(CONSTANTS.PASSWORD),
    confirm_password: z
      .string()
      .nullable()
      .refine(
        password => {
          if (!CONSTANTS.PASSWORD.test(password)) {
            return false;
          }
          return password === this.password;
        },
        { message: 'Password must be at least 8 characters long.' },
      ),
  });

  private async handleChangePassword(e: Event) {
    e.preventDefault();
    try {
      this.error = {};
      this.isLoading = true;
      this.autoValidate = true;
      this.ResetPasswordSchema.parse({
        password: this.password,
        confirm_password: this.confirmPassword,
      });
      await this.authService.changeUserPwd({
        username: this.username,
        new_pwd: this.password,
        old_pwd: this.old_pwd,
      });
      if (!this.skip2Fa) {
        // this.submitted = true;
        window.history.back();
      }
      if (this.el.slot === 'sidebar-body') {
        this.closeSideBar.emit();
      }
    } catch (error) {
      if (error instanceof ZodError) {
        let validationErrors = {};
        error.issues.map(issue => {
          const path = issue.path[0];
          console.log(path, issue);
          if (path === 'password') {
            this.showValidator = true;
          }
          validationErrors[path] = true;
        });
        this.error = validationErrors;
      }
    } finally {
      this.isLoading = false;
    }
  }
  @Listen('otpFinished', { target: 'body' })
  handleOtpFinished(e: CustomEvent) {
    if (e.detail.type === 'success') {
      return;
    }
    if (this.el.slot !== 'sidebar-body') {
      window.history.back();
    } else {
      this.closeSideBar.emit();
    }
  }
  render() {
    const insideSidebar = this.el.slot === 'sidebar-body';
    if (!locales.entries && !insideSidebar) {
      return <ir-loading-screen></ir-loading-screen>;
    }
    return (
      <div class={{ 'base-host': !insideSidebar, 'h-100': insideSidebar }}>
        {!insideSidebar && (
          <Fragment>
            <ir-interceptor suppressToastEndpoints={['/Change_User_Pwd']}></ir-interceptor>
            <ir-toast></ir-toast>
          </Fragment>
        )}
        <form onSubmit={this.handleChangePassword.bind(this)} class={{ 'sheet-container': insideSidebar }}>
          {insideSidebar && <ir-title class="px-1 sheet-header" displayContext="sidebar" label={'Change Password'}></ir-title>}
          <div class={{ 'form-container': true, 'sheet-body px-1': insideSidebar, 'px-2': !insideSidebar }}>
            <svg class="lock-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" height={24} width={24}>
              <path
                fill="currentColor"
                d="M144 144l0 48 160 0 0-48c0-44.2-35.8-80-80-80s-80 35.8-80 80zM80 192l0-48C80 64.5 144.5 0 224 0s144 64.5 144 144l0 48 16 0c35.3 0 64 28.7 64 64l0 192c0 35.3-28.7 64-64 64L64 512c-35.3 0-64-28.7-64-64L0 256c0-35.3 28.7-64 64-64l16 0z"
              />
            </svg>
            <div class="text-center mb-2">
              <h4 class="mb-1">{locales?.entries?.Lcz_SetNewPassword}</h4>
              {this.submitted ? (
                <p>An email has been sent to your address. Please check your inbox to confirm the password change.</p>
              ) : (
                <p>Your new password must be different to previously used password</p>
              )}
            </div>
            {!this.submitted && (
              <section>
                <div class={'mb-2'}>
                  <div class="m-0 p-0">
                    <div class={'position-relative'}>
                      <ir-input-text
                        error={this.error?.password}
                        autoValidate={this.autoValidate}
                        value={this.password}
                        onTextChange={e => (this.password = e.detail)}
                        label=""
                        class="m-0 p-0"
                        inputStyles={'m-0'}
                        zod={this.ResetPasswordSchema.pick({ password: true })}
                        wrapKey="password"
                        placeholder={locales.entries.Lcz_NewPassword}
                        onInputFocus={() => (this.showValidator = true)}
                        type={'password'}
                      ></ir-input-text>
                    </div>
                    {this.showValidator && <ir-password-validator class="mb-1" password={this.password}></ir-password-validator>}
                  </div>
                  <div class={'position-relative'}>
                    <ir-input-text
                      error={this.error?.confirm_password}
                      autoValidate={this.autoValidate}
                      zod={this.ResetPasswordSchema.pick({ confirm_password: true })}
                      wrapKey="confirm_password"
                      value={this.confirmPassword}
                      onTextChange={e => (this.confirmPassword = e.detail)}
                      label=""
                      placeholder={locales.entries.Lcz_ConfirmPassword}
                      type={'password'}
                    ></ir-input-text>
                  </div>
                </div>

                {!insideSidebar && (
                  <div class="d-flex flex-column mt-2 flex-sm-row align-items-sm-center" style={{ gap: '0.5rem' }}>
                    <ir-button
                      btn_styles={'flex-fill'}
                      onClickHandler={() => window.history.back()}
                      class="flex-fill"
                      text={locales.entries.Lcz_Cancel}
                      size="md"
                      btn_color="secondary"
                    ></ir-button>
                    <ir-button
                      btn_styles={'flex-fill'}
                      class="flex-fill"
                      isLoading={this.isLoading}
                      btn_type="submit"
                      text={locales.entries.Lcz_ChangePassword}
                      size="md"
                    ></ir-button>
                  </div>
                )}
              </section>
            )}
          </div>
          {insideSidebar && (
            <div class={'sheet-footer w-full'}>
              <ir-button
                text={locales.entries.Lcz_Cancel}
                onClickHandler={() => this.closeSideBar.emit(null)}
                class="flex-fill"
                btn_color="secondary"
                btn_styles="w-100 justify-content-center align-items-center"
                size="md"
              ></ir-button>
              <ir-button
                isLoading={this.isLoading}
                class="flex-fill"
                btn_type="submit"
                btn_styles="w-100 justify-content-center align-items-center"
                text={locales.entries.Lcz_ChangePassword}
                size="md"
              ></ir-button>
            </div>
          )}
        </form>
      </div>
    );
  }
}
