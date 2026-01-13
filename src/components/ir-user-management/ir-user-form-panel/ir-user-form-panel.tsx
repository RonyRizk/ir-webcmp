import { Component, Event, EventEmitter, Fragment, Prop, State, h } from '@stencil/core';

import locales from '@/stores/locales.store';
import { z } from 'zod';
import { CONSTANTS } from '@/utils/constants';
import { UserService } from '@/services/user.service';
import calendar_data from '@/stores/calendar-data';
import { User } from '@/models/Users';
import { _formatTime } from '@/components/ir-booking-details/functions';
import moment from 'moment';
import { UAParser } from 'ua-parser-js';
import { AllowedUser } from '../types';
import Token from '@/models/Token';

@Component({
  tag: 'ir-user-form-panel',
  styleUrls: ['ir-user-form-panel.css', '../../../common/sheet.css'],
  scoped: true,
})
export class IrUserFormPanel {
  @Prop() formId: string;
  @Prop() user: User;
  @Prop() userTypes = Map<number | string, string>;
  @Prop() isEdit: boolean = false;
  @Prop() language: string = 'en';
  @Prop() property_id: number;
  @Prop() haveAdminPrivileges: boolean;
  @Prop() superAdminId: string = '5';
  @Prop() userTypeCode: string | number;
  @Prop() allowedUsersTypes: AllowedUser[] = [];
  @Prop() baseUserTypeCode: string | number;

  @State() showFullHistory = false;

  @State() userInfo: User = {
    type: '',
    id: -1,
    is_active: true,
    sign_ins: null,
    created_on: null,
    mobile: '',
    name: '',
    note: '',
    password: '',
    email: '',
    property_id: null,
    username: null,
    phone_prefix: null,
  };

  @State() showPasswordValidation: boolean = false;
  @State() isUsernameTaken: boolean;
  @State() isOpen: boolean;

  @Event() resetData: EventEmitter<null>;
  @Event() closeSideBar: EventEmitter<null>;

  private userService = new UserService();
  private disableFields = false;
  private isPropertyAdmin = false;
  private token = new Token();
  private mobileMask = {};
  private userSchema = z.object({
    mobile: z.string().optional(),
    email: z
      .string()
      .email()
      .refine(
        async email => {
          if (this.user && this.user.email === email) {
            return true; // unchanged email
          }
          const exists = await new UserService().checkUserExistence({
            Email: email,
            UserName: '',
          });
          return !exists;
        },
        { message: 'Email already exists.' },
      ),
    password: z
      .string()
      .nullable()
      // .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+]).{8,16}$/)
      .refine(
        password => {
          if (this.user && !this.userInfo?.password) {
            return true;
          }
          return CONSTANTS.PASSWORD.test(password);
        },
        { message: 'Password must be at least 8 characters long.' },
      ),
    type: z.union([z.literal(1), z.literal(Number(this.superAdminId?.toString() ?? '5')), z.coerce.string().nonempty().min(2)]),
    username: z
      .string()
      .min(3)
      .refine(
        async name => {
          if (this.user && this.user.username) {
            return true;
          }
          if (name.length >= 3) {
            const exists = await new UserService().checkUserExistence({
              UserName: name,
            });
            return !exists;
          }
          return true;
        },
        { message: 'Username already exists.' },
      ),
  });

  //make user active by default
  async componentWillLoad() {
    if (!this.user) {
      this.userInfo['property_id'] = this.property_id;
      // this.showPasswordValidation = true;
    }
    if (this.user) {
      this.userInfo = { ...this.user, password: '' };
      // this.disableFields = true;
    }
    this.isPropertyAdmin = this.userTypeCode.toString() === '17';
    if (this.isPropertyAdmin) {
      this.updateUserField('type', '17');
    }
    this.mobileMask = {
      mask: `{${calendar_data.country.phone_prefix}} 000000000000`,
      lazy: false,
      autofix: true,
      placeholderChar: '\u200B',
    };
  }

  private updateUserField(key: keyof User, value: any) {
    this.userInfo = { ...this.userInfo, [key]: value };
  }

  private async createOrUpdateUser() {
    try {
      const resolvedPassword = this.user && this.userInfo.password === '' ? this.user.password : this.userInfo.password;

      const normalizedMobile = this.userInfo.mobile?.split(' ')?.join('')?.replace(calendar_data.country.phone_prefix, '') ?? '';

      const userPayload = {
        ...this.userInfo,
        base_user_type_code: this.baseUserTypeCode,
        property_id: this.property_id,
        password: resolvedPassword,
        type: Number(this.userInfo.type),
        mobile: normalizedMobile,
      };

      console.log('toValidateUserInfo', userPayload);

      await this.userSchema.parseAsync(userPayload);
      await this.userService.handleExposedUser(userPayload);

      this.resetData.emit(null);
      this.closeSideBar.emit(null);
    } catch (error) {
      console.error(error);
    }
  }

  render() {
    return (
      <form
        id={this.formId}
        // class="sheet-container"
        onSubmit={async e => {
          e.preventDefault();
          await this.createOrUpdateUser();
        }}
      >
        {/* <ir-title class="px-1 sheet-header" displayContext="sidebar" label={this.isEdit ? this.user.username : 'Create New User'}></ir-title>
        <section class="px-1 sheet-body"> */}
        <div class="d-flex flex-column" style={{ gap: '1rem' }}>
          <ir-validator asyncValidation showErrorMessage value={this.userInfo.email} schema={this.userSchema.shape.email}>
            <ir-input
              maxlength={40}
              onText-change={e => this.updateUserField('email', e.detail)}
              value={this.userInfo.email}
              label={locales.entries.Lcz_Email}
              data-testid="email"
              id="user-email"
            ></ir-input>
          </ir-validator>
          <ir-validator showErrorMessage value={this.userInfo.mobile} schema={this.userSchema.shape.mobile}>
            <ir-input
              onText-change={e => this.updateUserField('mobile', e.detail)}
              value={this.userInfo.mobile}
              label={locales.entries.Lcz_Mobile}
              data-testid="mobile"
              mask={this.mobileMask}
            ></ir-input>
          </ir-validator>
          {(this.user && this.user?.type?.toString() === this.superAdminId) || this.isPropertyAdmin ? null : (
            <ir-validator value={this.userInfo.type?.toString()} schema={this.userSchema.shape.type}>
              <wa-select
                data-testId="user_type"
                // error={this.errors?.type && !this.userInfo.type}
                disabled={this.disableFields}
                label="Role"
                value={this.userInfo.type?.toString()}
                size="small"
                defaultValue={this.userInfo.type?.toString()}
                placeholder={locales.entries.Lcz_Select}
                onchange={e => this.updateUserField('type', (e.target as HTMLSelectElement).value)}
              >
                {this.allowedUsersTypes.map(t => (
                  <wa-option value={t.code}>{t.value}</wa-option>
                ))}
              </wa-select>
            </ir-validator>
          )}
          {this.user?.type?.toString() !== '5' && (
            <Fragment>
              <input type="text" name="dummy" style={{ display: 'none' }} />
              <ir-validator asyncValidation schema={this.userSchema.shape.username} value={this.userInfo.username}>
                <ir-input
                  onText-change={e => this.updateUserField('username', e.detail)}
                  autocomplete="off"
                  maxlength={40}
                  value={this.userInfo.username}
                  disabled={this.disableFields}
                  label={locales.entries.Lcz_Username}
                ></ir-input>
              </ir-validator>
            </Fragment>
          )}
          {!this.user ? (
            <Fragment>
              <input type="text" name="dummy" style={{ display: 'none' }} />
              <ir-validator value={this.userInfo.password} schema={this.userSchema.shape.password}>
                <ir-input
                  data-testId="password"
                  label={locales.entries.Lcz_Password}
                  value={this.userInfo.password}
                  autocomplete="off"
                  passwordToggle
                  type="password"
                  id="password"
                  maxlength={16}
                  onInputFocus={() => (this.showPasswordValidation = true)}
                  onInput-blur={() => {
                    // if (this.user) this.showPasswordValidation = false;
                  }}
                  onText-change={e => this.updateUserField('password', e.detail)}
                ></ir-input>
              </ir-validator>
              {this.showPasswordValidation && <ir-password-validator class="mb-1" password={this.userInfo.password}></ir-password-validator>}
            </Fragment>
          ) : (
            // this.haveAdminPrivileges &&
            // this.user.type.toString() !== this.superAdminId &&
            // (this.user?.type.toString() === '17' && this.userTypeCode?.toString() === '17' ? null : (
            <div class="d-flex mt-2 align-items-center justify-content-between">
              <h4 class="m-0 p-0 logins-history-title">{locales.entries.Lcz_Password}</h4>
              <ir-button size="sm" btn_styles={'pr-0'} onClickHandler={() => (this.isOpen = true)} text={locales.entries.Lcz_ChangePassword} btn_color="link"></ir-button>
            </div>
            // ))
          )}
        </div>
        {this.user?.sign_ins?.length > 0 && (
          <section class="logins-history-section mt-2">
            <div class="d-flex align-items-center logins-history-title-container justify-content-between">
              <h4 class="logins-history-title m-0 p-0">Recent sign-ins</h4>
              {this.user.sign_ins.length > 5 && (
                <ir-button
                  btn_styles={'pr-0'}
                  text={!this.showFullHistory ? locales.entries.Lcz_ViewAll : locales.entries.Lcz_ViewLess}
                  btn_color="link"
                  size="sm"
                  onClickHandler={() => (this.showFullHistory = !this.showFullHistory)}
                ></ir-button>
              )}
            </div>
            <ul class="logins-history-list">
              {this.user.sign_ins.slice(0, this.showFullHistory ? this.user.sign_ins.length : 5).map((s, i) => {
                const ua = UAParser(s.user_agent);
                return (
                  <li class="login-entry" key={s.date + '_' + i}>
                    <div class="login-meta">
                      <p class="login-datetime">
                        {moment(s.date, 'YYYY-MM-DD').format('DD-MMM-YYYY')} {_formatTime(s.hour?.toString(), s.minute?.toString())} |
                      </p>
                      <p class="login-location">
                        <span class="login-ip">
                          {locales.entries.Lcz_IP}: {s.ip}
                        </span>{' '}
                        &nbsp;|&nbsp;
                        <span class="login-country">
                          {locales.entries.Lcz_Location}: {s.country}
                        </span>{' '}
                        &nbsp;|&nbsp;
                        <span class="login-os">
                          OS: {ua.os.name ?? 'N/A'} {ua.os.version}
                        </span>
                      </p>
                    </div>
                    {/* {ua.device.type && (
                        <div class="login-user-agent">
                          <p class="ua-device">
                            {ua.device.vendor || ''} {ua.device.model} ({ua.device.type})
                          </p>
                        </div>
                      )} */}
                  </li>
                );
              })}
            </ul>
          </section>
        )}
        <ir-sidebar
          open={this.isOpen}
          showCloseButton={false}
          style={{
            '--sidebar-block-padding': '0',
          }}
          onIrSidebarToggle={e => {
            e.stopImmediatePropagation();
            e.stopPropagation();
            this.isOpen = false;
          }}
        >
          {this.isOpen && (
            <ir-reset-password
              ticket={this.token.getToken()}
              skip2Fa={true}
              username={this.user.username}
              onCloseSideBar={e => {
                e.stopImmediatePropagation();
                e.stopPropagation();
                this.isOpen = false;
              }}
              slot="sidebar-body"
            ></ir-reset-password>
          )}
        </ir-sidebar>
        {/* </section> */}
        {/* <div class="sheet-footer">
          <ir-custom-button data-testid="cancel" onClickHandler={() => this.closeSideBar.emit(null)} class="flex-fill" appearance="filled" variant="neutral" size="medium">
            {locales.entries.Lcz_Cancel}
          </ir-custom-button>
          <ir-custom-button data-testid="save" size="medium" loading={this.isLoading} class="flex-fill" type="submit" variant="brand">
            {locales.entries.Lcz_Save}
          </ir-custom-button>
        </div> */}
      </form>
    );
  }
}
