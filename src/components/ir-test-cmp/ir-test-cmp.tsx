import { Component, Element, Host, State, h } from '@stencil/core';
import { Toast } from '../ir-toast-provider/ir-toast-provider';
import { showToast } from '@/utils/utils';

@Component({
  tag: 'ir-test-cmp',
  styleUrl: 'ir-test-cmp.css',
  scoped: true,
})
export class IrTestCmp {
  @Element() el: HTMLElement;
  ela: HTMLIrOtpModalElement;

  private get provider(): HTMLIrToastProviderElement {
    return this.el.querySelector('ir-toast-provider');
  }

  private toast(toast: Toast) {
    this.provider.addToast({ duration: 10000, ...toast });
  }
  @State() open: boolean;

  render() {
    return (
      <Host class={'p-2'}>
        <ir-toast-provider></ir-toast-provider>
        <button onClick={() => (this.open = true)}>open</button>
        <button onClick={() => this.ela.openModal()}>Ela</button>
        <button
          onClick={() =>
            showToast({
              title: 'Something went wrong',
            })
          }
        >
          emit toast
        </button>
        <button onClick={() => this.toast({ title: 'Heads up', description: 'This is an info message.', type: 'info' })}>Info</button>
        <ir-drawer open={this.open}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button onClick={() => this.toast({ title: 'Heads up', description: 'This is an info message.', type: 'info' })}>Info</button>
            <button onClick={() => this.toast({ title: 'Saved', description: 'Operation completed successfully!', type: 'success' })}>Success</button>
            <button onClick={() => this.toast({ title: 'Failed', description: 'Something went wrong. Please try again.', type: 'error' })}>Danger</button>
            <button onClick={() => this.toast({ title: 'Careful', description: 'Proceed with caution.', type: 'warning' })}>Warning</button>
            <button onClick={() => this.toast({ title: 'Item archived', actionLabel: 'Undo', type: 'info' })}>With action</button>
            <button onClick={() => this.toast({ title: 'Persistent', description: 'Stays until closed.', type: 'info', duration: 0 })}>Persistent</button>
          </div>
        </ir-drawer>
        <ir-otp-modal ref={el => (this.ela = el)}></ir-otp-modal>
      </Host>
    );
  }
}
