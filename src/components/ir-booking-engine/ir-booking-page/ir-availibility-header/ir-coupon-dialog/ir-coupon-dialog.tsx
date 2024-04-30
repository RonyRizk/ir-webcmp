import app_store from '@/stores/app.store';
import booking_store, { modifyBookingStore } from '@/stores/booking';
import { cn } from '@/utils/utils';
import { Component, Fragment, h, State, Event, EventEmitter } from '@stencil/core';
import { isBefore } from 'date-fns';

@Component({
  tag: 'ir-coupon-dialog',
  styleUrl: 'ir-coupon-dialog.css',
  shadow: true,
})
export class IrCouponDialog {
  @State() coupon: string;
  @State() validationMessage: { error: boolean; message: string };

  @Event() resetBooking: EventEmitter<null>;

  dialogRef: HTMLIrDialogElement;

  activateCoupon() {
    this.validationMessage = null;
    const c = app_store.property.promotions.find(p => p.key === this.coupon.trim());
    if (!c) {
      return (this.validationMessage = { error: true, message: 'Invalid coupon' });
    }
    if (isBefore(new Date(c.to), new Date())) {
      return (this.validationMessage = { error: true, message: 'Invalid coupon' });
    }
    modifyBookingStore('bookingAvailabilityParams', {
      coupon: this.coupon,
      loyalty: false,
    });
    this.validationMessage = { error: false, message: this.coupon };
    this.resetBooking.emit(null);
    this.dialogRef.closeModal();
  }
  removeCoupon() {
    this.validationMessage = null;
    this.coupon = '';
    modifyBookingStore('bookingAvailabilityParams', {
      coupon: null,
      loyalty: false,
    });
  }

  render() {
    const showCoupon = app_store.property?.promotions?.some(p => p.key !== '');
    if (!showCoupon || booking_store.bookingAvailabilityParams.loyalty) {
      return null;
    }
    return (
      <Fragment>
        <div class="flex w-full items-center justify-center gap-4">
          <ir-button
            class={cn('w-full', {
              'w-fit': this.validationMessage && !this.validationMessage.error,
            })}
            onButtonClick={() => this.dialogRef.openModal()}
            variants="outline"
            label="Have a coupon?"
            haveLeftIcon
          >
            <ir-icons slot="left-icon" name="heart"></ir-icons>
          </ir-button>
          {this.validationMessage && !this.validationMessage.error && (
            <div class="flex items-center  text-sm text-[hsl(var(--brand-600))]">
              <p onClick={this.removeCoupon.bind(this)}>Discount applied</p>
              <ir-button aria-label="remove coupon" variants="icon" onButtonClick={this.removeCoupon.bind(this)}>
                <ir-icons slot="btn-icon" title="remove coupon" name="xmark" svgClassName="text-[hsl(var(--brand-600))]"></ir-icons>
              </ir-button>
            </div>
          )}
        </div>

        <ir-dialog ref={el => (this.dialogRef = el)}>
          <form
            onSubmit={e => {
              e.preventDefault();
              this.activateCoupon();
            }}
            class="p-4 sm:p-6"
            slot="modal-body"
          >
            <h1 class="title">Have a coupon? </h1>
            {/* <p class="Supporting-text mb-8">If you have a coupon available, you can enter it below to unlock special discounts:</p> */}
            <ir-input
              error={this.validationMessage?.error}
              onTextChanged={e => (this.coupon = e.detail)}
              autofocus
              inputId="booking_code"
              label="Enter your coupon code"
            ></ir-input>
            {this.validationMessage?.error && <p class="text-red-500">{this.validationMessage.message}</p>}
            <div class="mt-8 flex flex-col-reverse items-center justify-end gap-4 sm:flex-row">
              <ir-button
                size="md"
                onButtonClick={() => {
                  this.dialogRef.closeModal();
                }}
                variants="outline"
                label="Cancel"
                class={'w-full sm:w-fit'}
              ></ir-button>
              <ir-button type="submit" size="md" label="Apply" class="w-full sm:w-fit"></ir-button>
            </div>
          </form>
        </ir-dialog>
      </Fragment>
    );
  }
}
