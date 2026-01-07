import { Component, Event, EventEmitter, Prop, h } from '@stencil/core';
import { TPositions } from '@components/ui/ir-toast/toast';
import WaCallout from '@awesome.me/webawesome/dist/components/callout/callout';

export type ToastVariant = 'info' | 'success' | 'warning' | 'danger';

@Component({
  tag: 'ir-toast-alert',
  styleUrl: 'ir-toast-alert.css',
  shadow: true,
})
export class IrToastAlert {
  /** Unique identifier passed back to the provider when interacting with the toast */
  @Prop() toastId!: string;

  /** Heading displayed at the top of the toast */
  @Prop() label?: string;

  /** Plain text description for the toast body */
  @Prop() description?: string;

  /** Maps to visual style tokens */
  @Prop({ reflect: true }) variant: ToastVariant = 'info';

  /** Whether the close button should be rendered */
  @Prop() dismissible = true;

  /** Optional primary action label */
  @Prop() actionLabel?: string;

  /** Indicates when the provider is playing the exit animation */
  @Prop() leaving = false;

  /** Toast position drives enter/exit direction */
  @Prop() position: TPositions = 'top-right';

  @Event() irToastDismiss: EventEmitter<{ id: string; reason: 'manual' }>;
  @Event() irToastAction: EventEmitter<{ id: string }>;
  @Event() irToastInteractionChange: EventEmitter<{ id: string; interacting: boolean }>;

  private interacting = false;

  private setInteracting = (interacting: boolean) => {
    if (this.interacting === interacting) {
      return;
    }
    this.interacting = interacting;
    this.irToastInteractionChange.emit({ id: this.toastId, interacting });
  };

  private getIcon() {
    switch (this.variant) {
      case 'success':
        return <wa-icon slot="icon" name="circle-check"></wa-icon>;
      case 'warning':
        return <wa-icon slot="icon" name="triangle-exclamation"></wa-icon>;
      case 'danger':
        return <wa-icon slot="icon" name="triangle-exclamation"></wa-icon>;
      default:
        return <wa-icon slot="icon" name="circle-info"></wa-icon>;
    }
  }

  private get calloutVariant(): WaCallout['variant'] {
    switch (this.variant) {
      case 'info':
        return 'neutral';
      case 'success':
        return 'success';
      case 'warning':
        return 'warning';
      case 'danger':
        return 'danger';
    }
  }

  render() {
    return (
      <div
        class="toast"
        data-position={this.position}
        data-leaving={this.leaving}
        onMouseEnter={() => this.setInteracting(true)}
        onMouseLeave={() => this.setInteracting(false)}
        onFocusin={() => this.setInteracting(true)}
        onFocusout={() => this.setInteracting(false)}
      >
        <wa-callout variant={this.calloutVariant}>
          {this.getIcon()}

          <div class="toast__body">
            {this.label && <h3 class="toast__title">{this.label}</h3>}
            {this.description && <p class="toast__description">{this.description}</p>}
          </div>
        </wa-callout>
      </div>
    );
  }
}
