import { ICountry } from '@/models/IBooking';
import { THKUser } from '@/models/housekeeping';
import { BookingService } from '@/services/booking-service/booking.service';
import { HouseKeepingService } from '@/services/housekeeping';
import { UserService } from '@/services/user.service';
import calendar_data from '@/stores/calendar-data';
import { getDefaultProperties } from '@/stores/housekeeping.store';
import { CONSTANTS } from '@/utils/constants';
import { Component, Event, EventEmitter, Fragment, Prop, State, h } from '@stencil/core';
import { z, type ZodTypeAny } from 'zod';

import { t } from '@/services/locale/t';

@Component({
  tag: 'ir-hk-user-drawer-form',
  styleUrl: 'ir-hk-user-drawer-form.css',
  scoped: true,
})
export class IrHkUserDrawerForm {
  @Prop() isEdit: boolean = false;
  @Prop() user: THKUser | null = null;
  @Prop() formId: string;

  @State() isPageLoading: boolean = false;
  @State() autoValidate = false;
  @State() showPasswordValidation: boolean = false;
  @State() isChangingPassword: boolean = false;
  @State() confirmPassword: string = '';
  @State() countries: ICountry[] = [];
  @State() countryCode: string = '';
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

  @Event() resetData: EventEmitter<null>;
  @Event() closeSideBar: EventEmitter<null>;
  @Event() loadingChanged: EventEmitter<boolean>;

  private housekeepingService = new HouseKeepingService();
  private bookingService = new BookingService();

  // Stable schema references — closures read current `this` state at validation time.
  // Built in `buildSchemas()` rather than at module load so their messages resolve against the loaded locale.
  private nameSchema: ZodTypeAny;
  private mobileSchema: ZodTypeAny;
  private usernameSchema: ZodTypeAny;
  private passwordSchema: ZodTypeAny;
  private fullSchema: ZodTypeAny;

  componentWillLoad() {
    this.init();
  }

  private async init() {
    try {
      this.isPageLoading = true;
      const { language, property_id } = getDefaultProperties();
      if (!this.user) {
        this.userInfo['property_id'] = property_id;
      }
      if (this.user) {
        this.autoValidate = true;
        this.userInfo = { ...this.user, password: '' };
      }
      this.buildSchemas();
      const countries = await this.bookingService.getCountries(language);
      this.countries = countries;

      const propertyCountry = this.countries.find(c => c.id === calendar_data.country.id);
      if (!this.user) {
        this.countryCode = propertyCountry?.code ?? '';
        this.updateUserField('phone_prefix', propertyCountry.phone_prefix);
      } else if (this.user.phone_prefix) {
        const match = countries.find(c => c.phone_prefix === this.user.phone_prefix);
        this.countryCode = match?.code ?? calendar_data.country?.code ?? '';
      }
    } catch (error) {
      console.error(error);
    } finally {
      this.isPageLoading = false;
    }
  }
  private buildSchemas() {
    this.nameSchema = z.string().min(2, t('Lcz_NameMinLength', { fallback: 'Name must be at least 2 characters.' }));
    this.mobileSchema = z
      .string()
      .min(1, t('Lcz_MobileRequired', { fallback: 'Mobile is required.' }))
      .max(14, t('Lcz_MobileMaxLength', { fallback: 'Mobile must be at most 14 characters.' }));
    const usernameBaseSchema = z.string().min(3, t('Lcz_UsernameMinLength', { fallback: 'Username must be at least 3 characters.' }));
    this.usernameSchema = usernameBaseSchema.refine(
      async name => {
        if (this.user && this.user.username === name) return true;
        if (name.length >= 3) {
          return !(await new UserService().checkUserExistence({ UserName: name }));
        }
        return true;
      },
      { message: t('Lcz_UsernameAlreadyExists', { fallback: 'Username already exists.' }) },
    );

    this.passwordSchema = z
      .string()
      .nullable()
      .refine(
        password => {
          if (this.user && !this.userInfo?.password) return true;
          return CONSTANTS.PASSWORD.test(password);
        },
        { message: t('Lcz_PasswordMinLength', { fallback: 'Password must be at least 8 characters long.' }) },
      );

    this.fullSchema = z.object({
      name: this.nameSchema,
      mobile: this.mobileSchema,
      password: this.passwordSchema,
      username: this.usernameSchema,
    });
  }

  private updateUserField(key: keyof THKUser, value: any) {
    this.userInfo = { ...this.userInfo, [key]: value };
  }

  private async addUser() {
    try {
      this.loadingChanged.emit(true);
      if (!this.autoValidate) {
        this.autoValidate = true;
      }
      if (this.isChangingPassword && this.confirmPassword !== this.userInfo.password) return;
      const toValidate = {
        ...this.userInfo,
        password: this.user && !this.isChangingPassword ? this.user.password : this.userInfo.password,
      };
      const result = await this.fullSchema.safeParseAsync(toValidate);
      if (!result.success) return;
      await this.housekeepingService.editExposedHKM(toValidate);
      this.resetData.emit(null);
      this.closeSideBar.emit(null);
    } catch (error) {
      console.error(error);
    } finally {
      this.loadingChanged.emit(false);
    }
  }

  private cancelPasswordChange() {
    this.isChangingPassword = false;
    this.updateUserField('password', '');
    this.confirmPassword = '';
    this.showPasswordValidation = false;
  }

  private async handleNameBlur(e: CustomEvent) {
    e.stopImmediatePropagation();
    e.stopPropagation();
    if (this.user || !this.userInfo.name) return;
    const username = await this.housekeepingService.generateUserName(this.userInfo.name);
    this.updateUserField('username', username);
  }

  private renderPasswordChangeView() {
    return (
      <form
        id={this.formId}
        class="hk-user-form hk-user-form--password-change"
        onSubmit={e => {
          e.preventDefault();
          this.addUser();
        }}
      >
        <ir-custom-button type="button" class="hk-user-form__back-btn" appearance="plain" variant="neutral" size="s" onClickHandler={() => this.cancelPasswordChange()}>
          <wa-icon class="ir-flip-rtl" name="arrow-left" aria-hidden="true" style={{ fontSize: '1rem' }}></wa-icon>
        </ir-custom-button>

        <div class="hk-user-form__password-fields">
          <div class="hk-user-form__password-header">
            <wa-icon name="lock" class="hk-user-form__password-icon"></wa-icon>
            <h4 class="hk-user-form__password-title">{t('Lcz_SetNewPassword', { fallback: 'Set new password' })}</h4>
            <p class="hk-user-form__password-hint">{t('Lcz_NewPasswordMustBeDifferent', { fallback: 'Your new password must be different to previously used password' })}</p>
          </div>

          <ir-validator schema={this.passwordSchema} value={this.userInfo.password} valueEvent="text-change" showErrorMessage>
            <ir-input
              placeholder={t('Lcz_NewPassword', { fallback: 'New password' })}
              value={this.userInfo.password}
              type="password"
              maxlength={16}
              passwordToggle
              onText-change={(e: CustomEvent<string>) => this.updateUserField('password', e.detail)}
              onInputFocus={() => (this.showPasswordValidation = true)}
            />
          </ir-validator>

          {this.showPasswordValidation && <ir-password-validator password={this.userInfo.password} />}

          <ir-validator
            schema={z.string().refine(v => v === this.userInfo.password, { message: t('Lcz_PasswordsDoNotMatch', { fallback: 'Passwords do not match.' }) })}
            value={this.confirmPassword}
            valueEvent="text-change"
            showErrorMessage
          >
            <ir-input
              placeholder={t('Lcz_ConfirmPassword', { fallback: 'Confirm password' })}
              value={this.confirmPassword}
              type="password"
              maxlength={16}
              passwordToggle
              onText-change={(e: CustomEvent<string>) => (this.confirmPassword = e.detail)}
            />
          </ir-validator>
        </div>
      </form>
    );
  }

  render() {
    if (this.isPageLoading) {
      return (
        <div class="drawer__loader-container">
          <ir-spinner></ir-spinner>
        </div>
      );
    }
    if (this.user && this.isChangingPassword) {
      return this.renderPasswordChangeView();
    }
    return (
      <form
        id={this.formId}
        class="hk-user-form"
        onSubmit={e => {
          e.preventDefault();
          this.addUser();
        }}
      >
        <ir-validator schema={this.nameSchema} value={this.userInfo.name} valueEvent="text-change" showErrorMessage>
          <ir-input
            label={t('Lcz_Name', { fallback: 'Name' })}
            value={this.userInfo.name}
            maxlength={40}
            onText-change={(e: CustomEvent<string>) => this.updateUserField('name', e.detail)}
            onInput-blur={this.handleNameBlur.bind(this)}
          />
        </ir-validator>

        <ir-validator schema={this.mobileSchema} value={this.userInfo.mobile} valueEvent="mobile-input-change" showErrorMessage>
          <ir-mobile-input
            label={t('Lcz_Mobile', { fallback: 'Mobile' })}
            value={this.userInfo.mobile}
            countryCode={this.countryCode}
            countries={this.countries}
            onMobile-input-change={e => {
              this.updateUserField('phone_prefix', e.detail.country.phone_prefix);
              this.updateUserField('mobile', e.detail.value);
            }}
          />
        </ir-validator>

        <wa-textarea
          data-testid="note"
          maxlength={250}
          size="s"
          label={t('Lcz_Note', { fallback: 'Note' })}
          value={this.userInfo.note}
          defaultValue={this.userInfo.note}
          onchange={e => this.updateUserField('note', (e.target as HTMLTextAreaElement).value)}
        />

        <ir-validator schema={this.usernameSchema} value={this.userInfo.username} valueEvent="text-change" asyncValidation showErrorMessage>
          <ir-input
            label={t('Lcz_Username', { fallback: 'Username' })}
            value={this.userInfo.username}
            onText-change={(e: CustomEvent<string>) => this.updateUserField('username', e.detail)}
          />
        </ir-validator>

        {!this.user ? (
          <Fragment>
            <ir-validator schema={this.passwordSchema} value={this.userInfo.password} valueEvent="text-change" showErrorMessage>
              <ir-input
                label={t('Lcz_Password', { fallback: 'Password' })}
                value={this.userInfo.password}
                type="password"
                maxlength={16}
                passwordToggle
                onText-change={(e: CustomEvent<string>) => this.updateUserField('password', e.detail)}
                onInputFocus={() => (this.showPasswordValidation = true)}
              />
            </ir-validator>
            {this.showPasswordValidation && <ir-password-validator password={this.userInfo.password} />}
          </Fragment>
        ) : (
          <wa-button size="s" appearance="plain" variant="brand" type="button" class="hk-user-form__change-password-btn" onClick={() => (this.isChangingPassword = true)}>
            {t('Lcz_ChangePassword', { fallback: 'Change Password' })}
          </wa-button>
        )}
      </form>
    );
  }
}
