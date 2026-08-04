import { Component, Element, Event, EventEmitter, Host, Method, Prop, State, h } from '@stencil/core';
export type ToastVariants = 'neutral' | 'brand' | 'success' | 'danger' | 'warning';
@Component({
  tag: 'ir-toast-item',
  styleUrl: 'ir-toast-item.css',
  shadow: true,
})
export class IrToastItem {
  @Element() el: HTMLElement;

  @Prop() variant: ToastVariants = 'neutral';
  /** Auto-dismiss delay in milliseconds. Pass `0` or `Infinity` for a persistent toast. */
  @Prop() duration: number = 5000;
  /** Whether the close button is rendered. */
  @Prop() dismissible: boolean = true;

  @State() progress: number = 100;
  @State() leaving: boolean = false;
  @State() entered: boolean = false;

  /** Emitted once the exit animation finishes and the toast should be removed from the DOM. */
  @Event() irDismiss: EventEmitter<void>;

  private timer: number;
  private remainingMs: number;
  private resumedAt: number;
  private timerStarted = false;
  private hiding = false;
  private hovered = false;
  private focused = false;

  componentDidLoad() {
    if (!this.timerStarted) {
      this.startTimer();
    }
    // Once the enter animation has played, mark the host so re-parenting (the
    // provider moving the toast layer in/out of a modal dialog) never replays it.
    const markEntered = () => {
      clearTimeout(fallback);
      this.entered = true;
    };
    const fallback = window.setTimeout(markEntered, 500);
    this.el.shadowRoot?.querySelector('.toast-item')?.addEventListener('animationend', markEntered, { once: true });
  }

  connectedCallback() {
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    // Re-parenting disconnects and reconnects the element; resume the countdown
    // with whatever time was left when it was paused.
    if (this.timerStarted && !this.hovered && !this.focused) {
      this.resumeTimer();
    }
  }

  disconnectedCallback() {
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    this.pauseTimer();
  }

  /** Starts the auto-dismiss countdown. Safe to call more than once. */
  @Method()
  async startTimer() {
    this.timerStarted = true;
    if (this.hovered || this.focused) {
      return;
    }
    this.resumeTimer();
  }

  /** Plays the exit animation, then emits `irDismiss`. */
  @Method()
  async hide() {
    if (this.hiding) {
      return;
    }
    this.hiding = true;
    this.pauseTimer();
    if (!this.prefersReducedMotion()) {
      this.leaving = true;
      await new Promise<void>(resolve => {
        const done = () => {
          clearTimeout(fallback);
          resolve();
        };
        // Safety timeout in case animationend never fires (display:none ancestors, etc.)
        const fallback = window.setTimeout(done, 300);
        this.el.shadowRoot?.querySelector('.toast-item')?.addEventListener('animationend', done, { once: true });
      });
    }
    this.irDismiss.emit();
  }

  private get hasTimer() {
    return Number.isFinite(this.duration) && this.duration > 0;
  }

  private prefersReducedMotion() {
    return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  }

  // The countdown is wall-clock based so it survives pauses, re-parenting, and
  // interval throttling in background tabs without drifting.
  private resumeTimer() {
    if (!this.hasTimer || this.hiding || this.timer || document.hidden) {
      return;
    }
    this.remainingMs = this.remainingMs ?? this.duration;
    this.resumedAt = Date.now();
    this.timer = window.setInterval(() => {
      const left = this.remainingMs - (Date.now() - this.resumedAt);
      this.progress = Math.max(0, (left / this.duration) * 100);
      if (left <= 0) {
        this.hide();
      }
    }, 100);
  }

  private pauseTimer() {
    if (this.timer) {
      this.remainingMs = Math.max(0, this.remainingMs - (Date.now() - this.resumedAt));
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  private handleVisibilityChange = () => {
    if (document.hidden) {
      this.pauseTimer();
    } else {
      this.updateInteraction();
    }
  };

  private updateInteraction() {
    if (this.hovered || this.focused) {
      // Reset the countdown while the user is interacting; it restarts from
      // the full duration once they move away.
      this.pauseTimer();
      this.remainingMs = this.duration;
      this.progress = 100;
    } else if (this.timerStarted) {
      this.resumeTimer();
    }
  }

  private handleMouseEnter = () => {
    this.hovered = true;
    this.updateInteraction();
  };

  private handleMouseLeave = () => {
    this.hovered = false;
    this.updateInteraction();
  };

  private handleFocusIn = () => {
    this.focused = true;
    this.updateInteraction();
  };

  private handleFocusOut = () => {
    this.focused = false;
    this.updateInteraction();
  };

  private handleClose = () => {
    this.hide();
  };

  render() {
    return (
      <Host
        data-leaving={this.leaving ? 'true' : undefined}
        data-entered={this.entered ? 'true' : undefined}
        style={{ '--accent-color': `var(--wa-color-${this.variant}-fill-loud)` }}
      >
        <div class={'toast-item'} onMouseEnter={this.handleMouseEnter} onMouseLeave={this.handleMouseLeave} onFocusin={this.handleFocusIn} onFocusout={this.handleFocusOut}>
          <div part="accent" class="accent"></div>
          <div part="icon" class="icon">
            <slot name="icon"></slot>
          </div>
          <div part="content" class="content">
            <slot></slot>
          </div>
          {this.dismissible && (
            <button part="close-button" class="close-button" type="button" aria-label="Close notification" onClick={this.handleClose}>
              {this.hasTimer ? (
                <wa-progress-ring
                  part="progress-ring"
                  aria-hidden="true"
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
              ) : (
                <wa-icon part="close-icon" exportparts="svg:close-icon__svg" name="xmark" library="system" variant="solid" aria-hidden="true"></wa-icon>
              )}
            </button>
          )}
        </div>
      </Host>
    );
  }
}
