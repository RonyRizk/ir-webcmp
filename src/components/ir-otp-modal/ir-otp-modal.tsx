import Token from '@/models/Token';
import { RoomService } from '@/services/room.service';
import { SystemService } from '@/services/system.service';
import locales from '@/stores/locales.store';
import { Component, Element, Event, EventEmitter, Fragment, Host, Method, Prop, State, Watch, h } from '@stencil/core';
import { z } from 'zod';

@Component({
  tag: 'ir-otp-modal',
  styleUrl: 'ir-otp-modal.css',
  scoped: false,
})
export class IrOtpModal {
  @Prop() language: string = 'en';
  /** Number of seconds to wait before allowing OTP resend */
  @Prop() resendTimer = 60;

  /** URL or endpoint used to validate the OTP */
  @Prop() requestUrl: string;
  /** URL or endpoint used to validate the OTP */
  @Prop() baseOTPUrl: string;

  /** Whether the resend option should be visible */
  @Prop() showResend: boolean = true;

  /** User's email address to display in the modal and send the OTP to */
  @Prop() email: string;

  /** Number of digits the OTP should have */
  @Prop() otpLength: number = 6;

  /** ticket for verifying and resending the verification code */
  @Prop() ticket: string;

  @State() otp = '';
  @State() error = '';
  @State() isLoading = false;
  @State() timer = 60;
  @State() open = false;

  @Element() el: HTMLIrOtpModalElement;

  private dialogRef: HTMLIrDialogElement;
  private timerInterval: number;
  private systemService = new SystemService();
  private roomService = new RoomService();
  private tokenService = new Token();

  private otpVerificationSchema = z.object({ email: z.string().nonempty(), requestUrl: z.string().nonempty(), otp: z.string().length(this.otpLength) });

  /** Emits the final OTP (or empty on cancel) */
  @Event({ bubbles: true, composed: true }) otpFinished: EventEmitter<{
    otp: string;
    type: 'success' | 'cancelled';
  }>;
  @State() isInitializing: boolean;

  componentWillLoad() {
    if (this.ticket) {
      this.tokenService.setToken(this.ticket);
    }
    this.fetchLocale();
  }

  @Watch('ticket')
  handleTicketChange(newValue: string, oldValue: string) {
    if (newValue !== oldValue) {
      this.tokenService.setToken(newValue);
      this.fetchLocale();
    }
  }

  /** Open & reset everything */
  @Method()
  async openModal() {
    this.resetState();
    this.open = true;
    if (this.showResend) this.startTimer();
    await this.focusFirstInput();
  }

  /** Hide & clear timer */
  @Method()
  async closeModal() {
    this.open = false;
    this.otp = null;
    this.clearTimer();
  }

  /**
   * Keeps the dialog non-dismissible: Escape / outside-click / programmatic
   * hide are ignored, so the flow can only be ended via the Cancel/Verify
   * buttons (which call closeModal explicitly).
   */
  private handleDialogHide(e: CustomEvent<{ source: Element }>) {
    e.preventDefault();
    // ir-dialog has already flipped its internal open state to false; since our
    // `open` prop is unchanged Stencil won't re-push it, so re-open imperatively.
    if (this.open) {
      this.dialogRef?.openModal();
    }
  }
  private async fetchLocale() {
    if (!this.tokenService.getToken()) {
      return;
    }
    this.isInitializing = true;
    await this.roomService.fetchLanguage(this.language, ['_USER_MGT']);
    this.isInitializing = false;
  }

  private resetState() {
    this.otp = '';
    this.error = '';
    this.isLoading = false;
    this.timer = 60;
    this.clearTimer();
  }

  private startTimer() {
    this.clearTimer();
    this.timerInterval = window.setInterval(() => {
      if (this.timer > 0) {
        this.timer--;
      } else {
        this.clearTimer();
      }
    }, 1000);
  }

  private clearTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private async focusFirstInput() {
    await new Promise(r => setTimeout(r, 50));
    const first = this.el.querySelector('input');
    first && (first as HTMLInputElement).focus();
  }

  private handleOtpComplete = (e: CustomEvent<string>) => {
    this.error = '';
    this.otp = e.detail;
  };

  private async verifyOtp() {
    if (this.otp.length < this.otpLength) return;
    this.isLoading = true;
    this.otpVerificationSchema.parse({
      otp: this.otp,
      requestUrl: this.requestUrl,
      email: this.email,
    });
    try {
      await this.systemService.validateOTP({ METHOD_NAME: this.requestUrl, OTP: this.otp });
      this.otpFinished.emit({ otp: this.otp, type: 'success' });
      this.closeModal();
    } catch (err) {
      this.error = 'Verification failed. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }

  private async resendOtp() {
    if (this.timer > 0) return;
    // Resend otp
    try {
      await this.systemService.resendOTP({ METHOD_NAME: this.requestUrl });
      this.timer = 60;
      this.startTimer();
    } catch (error) {
      console.log(error);
    }
  }
  private handleCancelClicked() {
    if (this.baseOTPUrl === 'Check_OTP_Necessity') {
      this.closeModal();
      this.otpFinished.emit({
        otp: null,
        type: 'cancelled',
      });
      return;
    }
    window.location.reload();
  }
  disconnectedCallback() {
    this.clearTimer();
  }
  render() {
    return (
      <Host>
        <ir-dialog
          class="otp-modal"
          ref={el => (this.dialogRef = el as HTMLIrDialogElement)}
          open={this.open}
          withoutHeader
          lightDismiss={false}
          onIrDialogHide={e => this.handleDialogHide(e)}
        >
          {this.isInitializing || !locales.entries ? (
            <div class="modal-loading-container">
              <ir-spinner></ir-spinner>
            </div>
          ) : (
            <Fragment>
              <header class="otp-modal-header">
                <h5 class="otp-modal-title">{locales.entries.Lcz_VerifyYourIdentity}</h5>
              </header>

              <section class="otp-modal-body">
                <p class="verification-message">
                  {locales.entries.Lcz_WeSentYuoVerificationCode} {this.email}
                </p>
                <ir-otp autoFocus length={this.otpLength} defaultValue={this.otp} onOtpComplete={this.handleOtpComplete}></ir-otp>

                {this.error && <p class="otp-error">{this.error}</p>}

                {this.showResend && (
                  <Fragment>
                    {this.timer > 0 ? (
                      <p class="otp-resend-timer">
                        {locales.entries.Lcz_ResendCode} 00:{String(this.timer).padStart(2, '0')}
                      </p>
                    ) : (
                      <ir-custom-button
                        class="otp-resend-btn"
                        link
                        size="s"
                        onClickHandler={e => {
                          e.stopImmediatePropagation();
                          e.stopPropagation();
                          this.resendOtp();
                        }}
                      >
                        Didn’t receive code? Resend
                      </ir-custom-button>
                    )}
                  </Fragment>
                )}
              </section>

              <div slot="footer" class="otp-modal-footer">
                <ir-custom-button variant="neutral" appearance="filled" size="m" onClickHandler={() => this.handleCancelClicked()}>
                  {locales.entries.Lcz_Cancel}
                </ir-custom-button>
                <ir-custom-button
                  variant="brand"
                  size="m"
                  loading={this.isLoading}
                  disabled={this.otp?.length < this.otpLength || this.isLoading}
                  onClickHandler={() => this.verifyOtp()}
                >
                  {locales.entries.Lcz_VerifyNow}
                </ir-custom-button>
              </div>
            </Fragment>
          )}
        </ir-dialog>
      </Host>
    );
  }
}
