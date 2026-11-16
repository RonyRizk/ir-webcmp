import { Component, Event, EventEmitter, Prop, Watch, h } from '@stencil/core';
import { t } from '@/services/locale/t';

@Component({
  tag: 'ir-password-validator',
  styleUrl: 'ir-password-validator.css',
  scoped: true,
})
export class IrPasswordValidator {
  /**
   * The password string to validate
   */
  @Prop() password: string = '';

  @Event({ bubbles: true, composed: true }) passwordValidationChange: EventEmitter<boolean>;

  @Watch('password')
  handlePasswordChange(newValue: string, oldValue: string) {
    if (newValue !== oldValue) {
      this.passwordValidationChange.emit(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+]).{8,16}$/.test(newValue));
    }
  }

  private get validLength(): boolean {
    if (!this.password) {
      return false;
    }
    return this.password.length >= 8 && this.password.length <= 16;
  }

  private get hasUppercase(): boolean {
    if (!this.password) {
      return false;
    }
    return /[A-Z]/.test(this.password);
  }

  private get hasLowercase(): boolean {
    if (!this.password) {
      return false;
    }
    return /[a-z]/.test(this.password);
  }

  private get hasDigit(): boolean {
    if (!this.password) {
      return false;
    }
    return /[0-9]/.test(this.password);
  }

  private get hasSpecialChar(): boolean {
    if (!this.password) {
      return false;
    }
    return /[!@#$%^&*()\-_=+]/.test(this.password);
  }
  render() {
    return (
      <div class="m-0 p-0">
        <requirement-check isValid={this.validLength} text={t('Lcz_Minimum8Characters', { fallback: 'Minimum 8 characters' })}></requirement-check>
        <requirement-check isValid={this.hasUppercase} text={t('Lcz_AtLeastOneUppercaseLetter', { fallback: 'At least one uppercase letter' })}></requirement-check>
        <requirement-check isValid={this.hasLowercase} text={t('Lcz_AtLeastOneLowercaseLetter', { fallback: 'At least one lowercase letter' })}></requirement-check>
        <requirement-check isValid={this.hasDigit} text={t('Lcz_AtLeastOneDigit', { fallback: 'At least one digit' })}></requirement-check>
        <requirement-check isValid={this.hasSpecialChar} text={t('Lcz_AtLeastOneSpecialCharacter', { fallback: 'At least one special character' })}></requirement-check>
      </div>
    );
  }
}
