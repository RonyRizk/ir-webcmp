import { PropertyService } from '@/services/api/property.service';
import app_store from '@/stores/app.store';
import { checkout_store, updateUserFormData } from '@/stores/checkout.store';
import { Component, Fragment, h, Prop } from '@stencil/core';
import { ZodIssue } from 'zod';

@Component({
  tag: 'ir-user-form',
  styleUrl: 'ir-user-form.css',
  shadow: true,
})
export class IrUserForm {
  @Prop() errors: Record<string, ZodIssue>;
  private dialogRef: HTMLIrDialogElement;
  private propertyService = new PropertyService();
  async componentWillLoad() {
    this.propertyService.setToken(app_store.app_data.token);
    await this.propertyService.fetchSetupEntries();
  }
  handleButtonClick() {
    setTimeout(() => {
      this.dialogRef.openModal();
    }, 50);
  }
  render() {
    if (!app_store.setup_entries) {
      return null;
    }
    return (
      <Fragment>
        <section class={'w-full'}>
          <ir-badge-group
            variant="primary"
            clickable
            badge="Sign in"
            onClick={this.handleButtonClick.bind(this)}
            message="Sign in or create an account to book faster"
          ></ir-badge-group>
          <div class="mt-6 flex  w-full flex-col gap-4">
            <div class="flex w-full flex-col gap-4 md:flex-row">
              <ir-input
                placeholder=""
                value={checkout_store.userFormData?.firstName}
                error={!!this.errors?.firstName}
                label="First name"
                onTextChanged={e => updateUserFormData('firstName', e.detail)}
                class="w-full"
              />
              <ir-input
                placeholder=""
                value={checkout_store.userFormData?.lastName}
                label="Last name"
                onTextChanged={e => updateUserFormData('lastName', e.detail)}
                error={!!this.errors?.lastName}
                class="w-full"
              />
            </div>
            <div class="flex w-full flex-col gap-4 md:flex-row">
              <ir-input
                placeholder=""
                value={checkout_store.userFormData?.email}
                label="Email address"
                onTextChanged={e => updateUserFormData('email', e.detail)}
                error={!!this.errors?.email}
                class="w-full"
              />
              {/* <ir-input onTextChanged={e => updateUserFormData('mobile_number', e.detail)} class="w-full" /> */}
              <ir-phone-input
                // mobile_number={checkout_store.userFormData?.mobile_number.toString()}
                error={!!this.errors?.mobile_number}
                class="w-full"
                onTextChange={e => {
                  updateUserFormData('mobile_number', e.detail.mobile);
                  updateUserFormData('country_code', e.detail.phone_prefix);
                }}
              ></ir-phone-input>
            </div>
            <div class="flex w-full flex-col gap-4 md:flex-row">
              <ir-select
                label={`Your arrival time(check-in from ${app_store.property?.time_constraints.check_in_from})`}
                variant="double-line"
                value={checkout_store.userFormData?.arrival_time}
                onValueChange={e => updateUserFormData('arrival_time', e.detail)}
                data={app_store.setup_entries.arrivalTime.map(entry => ({
                  id: entry.CODE_NAME,
                  value: entry.CODE_VALUE_EN,
                }))}
                class={'w-full'}
              ></ir-select>
              {/* <ir-input label="Your arrival time(check-in from 14:00)" onTextChanged={e => updateUserFormData('arrival_time', e.detail)} class="w-full" /> */}
              <ir-input
                value={checkout_store.userFormData?.message}
                placeholder=""
                label="Any message for us?"
                maxlength={555}
                onTextChanged={e => updateUserFormData('message', e.detail)}
                class="w-full"
              />
            </div>
          </div>
          <ir-checkbox
            checked={checkout_store.userFormData?.bookingForSomeoneElse}
            label="I am booking for someone else"
            class="mt-3"
            onCheckChange={e => updateUserFormData('bookingForSomeoneElse', e.detail)}
          />
        </section>
        <ir-dialog ref={el => (this.dialogRef = el)}>
          <ir-auth slot="modal-body"></ir-auth>;
        </ir-dialog>
      </Fragment>
    );
  }
}
