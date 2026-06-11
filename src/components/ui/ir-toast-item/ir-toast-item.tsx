import { Component, Event, EventEmitter, Host, Prop, State, h } from '@stencil/core';
export type ToastVariants = 'neutral' | 'brand' | 'success' | 'danger' | 'warning';
@Component({
  tag: 'ir-toast-item',
  styleUrl: 'ir-toast-item.css',
  shadow: true,
})
export class IrToastItem {
  @Prop() variant: ToastVariants = 'neutral';
  @Prop() duration: number = 5000;

  @State() progress: number = 100;

  @Event() irDismiss: EventEmitter<void>;

  private timer: number;

  componentDidLoad() {
    this.startTimer();
  }

  disconnectedCallback() {
    this.clearTimer();
  }

  private startTimer() {
    const step = (16 / this.duration) * 100;
    this.timer = window.setInterval(() => {
      this.progress = Math.max(0, this.progress - step);
      if (this.progress <= 0) {
        this.dismiss();
      }
    }, 16);
  }

  private clearTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  private dismiss() {
    this.clearTimer();
    this.irDismiss.emit();
  }

  private handleMouseEnter = () => {
    this.clearTimer();
    this.progress = 100;
  };

  private handleMouseLeave = () => {
    this.startTimer();
  };

  private handleClose = () => {
    this.dismiss();
  };

  render() {
    return (
      <Host style={{ '--accent-color': `var(--wa-color-${this.variant}-fill-loud)` }}>
        <div class={'toast-item'} onMouseEnter={this.handleMouseEnter} onMouseLeave={this.handleMouseLeave}>
          <div part="accent" class="accent"></div>
          <div part="icon" class="icon">
            <slot name="icon"></slot>
          </div>
          <div part="content" class="content">
            <slot></slot>
          </div>
          <button part="close-button" class="close-button" type="button" aria-label="Close" onClick={this.handleClose}>
            <wa-progress-ring
              part="progress-ring"
              exportparts="
              base:progress-ring__base,
              label:progress-ring__label,
              track:progress-ring__track,
              indicator:progress-ring__indicator
            "
              value={this.progress}
            >
              <wa-icon part="close-icon" exportparts="svg:close-icon__svg" name="xmark" library="system" variant="solid" aria-hidden="true"></wa-icon>
            </wa-progress-ring>
          </button>
        </div>
      </Host>
    );
  }
}
