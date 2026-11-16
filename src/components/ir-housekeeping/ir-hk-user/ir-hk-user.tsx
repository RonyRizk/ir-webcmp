import { THKUser } from '@/models/housekeeping';
import { HouseKeepingService } from '@/services/housekeeping';
import { UserService } from '@/services/user.service';
import calendar_data from '@/stores/calendar-data';
import { getDefaultProperties } from '@/stores/housekeeping.store';
import { CONSTANTS } from '@/utils/constants';
import { Component, Prop, State, h, Event, EventEmitter } from '@stencil/core';
import { z, ZodError } from 'zod';

import { t } from '@/services/locale/t';
@Component({
  tag: 'ir-hk-user',
  styleUrls: ['ir-hk-user.css', '../../../common/sheet.css'],
  scoped: true,
})
export class IrHkUser {
  @Prop() user: THKUser | null = null;
  @Prop() isEdit: boolean = false;

  @State() isLoading: boolean = false;
  @State() autoValidate = false;

  @State() userInfo: THKUser = {
    id: -1,
    mobile: '',
    name: '',
    note: '',
    password: '',
    property_id: null,
    username: null,
    phone_prefix: null,
  };

  @State() errors: { [P in keyof THKUser]?: any } | null = null;
  @State() showPasswordValidation: boolean = false;
  @State() isUsernameTaken: boolean;

  @Event() resetData: EventEmitter<null>;
  @Event() closeSideBar: EventEmitter<null>;

  private housekeepingService = new HouseKeepingService();
  private default_properties = {
    ApiClient: '',
    language: '',
  };
  private housekeeperSchema = z.object({
    name: z.string().min(2),
    mobile: z.string().min(1).max(14),
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
        { message: t('Lcz_PasswordMinLength', { fallback: 'Password must be at least 8 characters long.' }) },
      ),
    username: z
      .string()
      .min(3)
      .refine(
        async name => {
          if (this.user && this.user.username === name) {
            return true;
          }
          if (name.length >= 3) {
            return !(await new UserService().checkUserExistence({ UserName: name }));
          }
          return true;
        },
        { message: t('Lcz_UsernameAlreadyExists', { fallback: 'Username already exists.' }) },
      ),
  });

  async componentWillLoad() {
    const { ApiClient, language, property_id } = getDefaultProperties();
    this.default_properties = { ApiClient, language };
    if (!this.user) {
      this.userInfo['property_id'] = property_id;
      // this.showPasswordValidation = true;
    }
    if (this.user) {
      this.autoValidate = true;
      this.userInfo = { ...this.user, password: '' };
    }
  }

  private updateUserField(key: keyof THKUser, value: any) {
    this.userInfo = { ...this.userInfo, [key]: value };
  }

  private async addUser() {
    try {
      this.isLoading = true;
      if (!this.autoValidate) {
        this.autoValidate = true;
      }
      const toValidateUserInfo = { ...this.userInfo, password: this.user && this.userInfo.password === '' ? this.user.password : this.userInfo.password };
      console.log('toValidateUserInfo', toValidateUserInfo);
      await this.housekeeperSchema.parseAsync(toValidateUserInfo);
      if (this.errors) {
        this.errors = null;
      }
      await this.housekeepingService.editExposedHKM(toValidateUserInfo);
      this.resetData.emit(null);
      this.closeSideBar.emit(null);
    } catch (error) {
      const e: any = {};
      if (error instanceof ZodError) {
        error.issues.map(err => {
          e[err.path[0]] = true;
        });
        this.errors = e;
      }
      console.error(error);
    } finally {
      this.isLoading = false;
    }
  }
  private async handleBlur(e: CustomEvent) {
    e.stopImmediatePropagation();
    e.stopPropagation();
    if (this.user || !this.userInfo.name) {
      return;
    }
    const usermame = await this.housekeepingService.generateUserName(this.userInfo.name);
    this.updateUserField('username', usermame);
  }

  render() {
    return (
      <div class="sheet-container">
        <ir-title
          class="px-1 sheet-header"
          displayContext="sidebar"
          label={
            this.isEdit ? t('Lcz_EditHousekeeperProfile', { fallback: 'Edit Housekeeper Profile' }) : t('Lcz_CreateHousekeeperProfile', { fallback: 'Create housekeeper profile' })
          }
        ></ir-title>
        <section class="px-1 sheet-body">
          <ir-input-text
            testId="name"
            zod={this.housekeeperSchema.pick({ name: true })}
            wrapKey="name"
            autoValidate={this.autoValidate}
            error={this.errors?.name}
            label={t('Lcz_Name', { fallback: 'Name' })}
            placeholder={t('Lcz_Name', { fallback: 'Name' })}
            onTextChange={e => this.updateUserField('name', e.detail)}
            value={this.userInfo.name}
            onInputBlur={this.handleBlur.bind(this)}
            maxLength={40}
          ></ir-input-text>
          <ir-phone-input
            testId="phone"
            placeholder={t('Lcz_Mobile', { fallback: 'Mobile' })}
            error={this.errors?.mobile && !this.userInfo?.mobile}
            language={this.default_properties.language}
            ApiClient={this.default_properties.ApiClient}
            default_country={calendar_data.country.id}
            phone_prefix={this.user?.phone_prefix}
            label={t('Lcz_Mobile', { fallback: 'Mobile' })}
            value={this.userInfo.mobile}
            onTextChange={e => {
              this.updateUserField('phone_prefix', e.detail.phone_prefix);
              this.updateUserField('mobile', e.detail.mobile);
            }}
          ></ir-phone-input>

          {/* <ir-input-text
            label={t('Lcz_Note', { fallback: 'Note' })}
            placeholder={t('Lcz_Note', { fallback: 'Note' })}
            value={this.userInfo.note}
            onTextChange={e => this.updateUserField('note', e.detail)}
            ></ir-input-text> */}
          <div class="mb-1">
            <ir-textarea
              testId="note"
              variant="prepend"
              maxLength={250}
              label={t('Lcz_Note', { fallback: 'Note' })}
              placeholder={t('Lcz_Note', { fallback: 'Note' })}
              value={this.userInfo.note}
              onTextChange={e => this.updateUserField('note', e.detail)}
            ></ir-textarea>
          </div>
          <ir-input-text
            testId="username"
            zod={this.housekeeperSchema.pick({ username: true })}
            wrapKey="username"
            error={this.errors?.username}
            asyncParse
            autoValidate={this.user ? (this.userInfo?.username !== this.user.username ? true : false) : this.autoValidate}
            errorMessage={this.errors?.username && this.userInfo?.username?.length >= 3 ? t('Lcz_UsernameAlreadyExists', { fallback: 'Username already exists.' }) : undefined}
            label={t('Lcz_Username', { fallback: 'Username' })}
            placeholder={t('Lcz_Username', { fallback: 'Username' })}
            value={this.userInfo.username}
            onTextChange={e => this.updateUserField('username', e.detail)}
          ></ir-input-text>
          <ir-input-text
            testId="password"
            autoValidate={this.user ? (!this.userInfo?.password ? false : true) : this.autoValidate}
            label={t('Lcz_Password', { fallback: 'Password' })}
            value={this.userInfo.password}
            type="password"
            maxLength={16}
            zod={this.housekeeperSchema.pick({ password: true })}
            wrapKey="password"
            error={this.errors?.password}
            onInputFocus={() => (this.showPasswordValidation = true)}
            onInputBlur={() => {
              // if (this.user) this.showPasswordValidation = false;
            }}
            onTextChange={e => this.updateUserField('password', e.detail)}
          ></ir-input-text>
          {this.showPasswordValidation && <ir-password-validator password={this.userInfo.password}></ir-password-validator>}
        </section>
        <div class="sheet-footer">
          <ir-button
            data-testid="cancel"
            onClickHandler={() => this.closeSideBar.emit(null)}
            class="flex-fill"
            btn_styles="w-100  justify-content-center align-items-center"
            btn_color="secondary"
            text={t('Lcz_Cancel', { fallback: 'Cancel' })}
          ></ir-button>
          <ir-button
            data-testid="save"
            isLoading={this.isLoading}
            onClickHandler={this.addUser.bind(this)}
            class="flex-fill"
            btn_styles="w-100 justify-content-center align-items-center"
            text={t('Lcz_Save', { fallback: 'Save' })}
          ></ir-button>
        </div>
      </div>
    );
  }
}
