import { Component, Prop, h } from '@stencil/core';
import { TPositions } from './toast';

@Component({
  tag: 'ir-toast',
  styleUrl: 'ir-toast.css',
  scoped: true,
})
export class IrToast {
  /**
   * Position where toasts will appear.
   * Options include: `'top-left'`, `'top-right'`, `'bottom-left'`, `'bottom-right'`.
   */
  @Prop({ reflect: true, mutable: true }) position: TPositions = 'top-right';

  private get providerPosition(): HTMLIrToastProviderElement['position'] {
    const map: Record<TPositions, HTMLIrToastProviderElement['position']> = {
      'top-left': 'top-start',
      'top-right': 'top-end',
      'bottom-left': 'bottom-start',
      'bottom-right': 'bottom-end',
    };
    return map[this.position] ?? 'top-end';
  }

  render() {
    // ir-toast-provider renders the ir-toast-item stack and listens for
    // `toast` events on the body, so this component is a thin shell kept
    // for backwards compatibility with the many pages that embed it.
    return <ir-toast-provider position={this.providerPosition}></ir-toast-provider>;
  }
}
