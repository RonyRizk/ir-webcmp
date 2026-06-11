import { Component, Element, Host, h } from '@stencil/core';
import { IrToastsProvider } from '../ui/ir-toasts-provider/ir-toasts-provider';

@Component({
  tag: 'ir-test-cmp',
  styleUrl: 'ir-test-cmp.css',
  scoped: true,
})
export class IrTestCmp {
  @Element() el: HTMLElement;

  private get provider(): IrToastsProvider & HTMLElement {
    return this.el.querySelector('ir-toasts-provider') as any;
  }

  private toast(variant: string, message: string, icon: string) {
    this.provider.create(message, { variant: variant as any, icon });
  }

  render() {
    return (
      <Host class={'p-2'}>
        <ir-toasts-provider />
        <ir-drawer open>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button onClick={() => this.toast('neutral', 'This is a neutral message.', 'info')}>Neutral</button>
            <button onClick={() => this.toast('brand', 'A brand notification just arrived.', 'bell')}>Brand</button>
            <button onClick={() => this.toast('success', 'Operation completed successfully!', 'circle-check')}>Success</button>
            <button onClick={() => this.toast('danger', 'Something went wrong. Please try again.', 'circle-xmark')}>Danger</button>
            <button onClick={() => this.toast('warning', 'Proceed with caution.', 'triangle-exclamation')}>Warning</button>
          </div>
        </ir-drawer>
      </Host>
    );
  }
}
