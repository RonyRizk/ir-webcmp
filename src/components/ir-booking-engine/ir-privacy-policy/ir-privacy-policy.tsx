import app_store from '@/stores/app.store';
import { Component, Host, h } from '@stencil/core';

@Component({
  tag: 'ir-privacy-policy',
  styleUrl: 'ir-privacy-policy.css',
  shadow: true,
})
export class IrPrivacyPolicy {
  dialogRef: HTMLIrDialogElement;

  render() {
    return (
      <Host>
        <ir-button label="privacy policy" buttonStyles={{ padding: '0' }} variants="link" onButtonClick={() => this.dialogRef.openModal()}></ir-button>
        <ir-dialog ref={el => (this.dialogRef = el)}>
          <div class="max-h-[83vh] overflow-y-auto p-4  text-[var(--gray-600,#475467)] md:p-6" slot="modal-title">
            <h1 class="mb-4 text-xl font-semibold text-[var(--gray-700,#344054)]">Privacy and policy</h1>
            <div class="text-sm">
              <p innerHTML={app_store.property?.privacy_policy}></p>
            </div>
          </div>
        </ir-dialog>
      </Host>
    );
  }
}
