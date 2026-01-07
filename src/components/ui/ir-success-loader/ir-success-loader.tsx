import { Component, Event, EventEmitter, Host, Prop, State, Watch, h } from '@stencil/core';

type LoaderPhase = 'spinner' | 'success';

@Component({
  tag: 'ir-success-loader',
  styleUrl: 'ir-success-loader.css',
  shadow: true,
})
export class IrSuccessLoader {
  /**
   * How long the spinner should be shown before transitioning to the success icon.
   * Value is expressed in milliseconds.
   */
  @Prop() spinnerDuration = 1500;

  /**
   * How long the success icon should be shown before the loader dispatches the completion event.
   * Value is expressed in milliseconds.
   */
  @Prop() successDuration = 1000;

  /**
   * Whether the loader should automatically start its cycle when it becomes active.
   */
  @Prop() autoStart = true;

  /**
   * Controls the visibility of the loader. Setting this to `true` starts the spinner/success cycle.
   */
  @Prop({ mutable: true, reflect: true }) active = true;

  /**
   * Emit when the loader finishes the success state and should be hidden by the parent.
   */
  @Event({ bubbles: true, composed: true }) loaderComplete: EventEmitter<void>;

  @State() private phase: LoaderPhase = 'spinner';

  private spinnerTimer?: number;
  private successTimer?: number;

  componentWillLoad() {
    if (this.autoStart && this.active) {
      this.startCycle();
    }
  }

  disconnectedCallback() {
    this.clearTimers();
  }

  @Watch('active')
  protected onActiveChange(isActive: boolean) {
    if (isActive) {
      if (this.autoStart) {
        this.startCycle();
      }
    } else {
      this.resetCycle();
    }
  }

  @Watch('spinnerDuration')
  @Watch('successDuration')
  protected onDurationChange() {
    if (this.active && this.autoStart) {
      this.startCycle();
    }
  }

  private startCycle() {
    this.clearTimers();
    this.phase = 'spinner';
    const spinnerDelay = Math.max(0, Number(this.spinnerDuration) || 0);
    if (spinnerDelay === 0) {
      this.showSuccess();
      return;
    }
    this.spinnerTimer = window.setTimeout(() => this.showSuccess(), spinnerDelay);
  }

  private showSuccess() {
    this.phase = 'success';
    const successDelay = Math.max(0, Number(this.successDuration) || 0);
    if (successDelay === 0) {
      this.handleCompletion();
      return;
    }
    this.successTimer = window.setTimeout(() => this.handleCompletion(), successDelay);
  }

  private handleCompletion() {
    this.loaderComplete.emit();
    this.active = false;
  }

  private resetCycle() {
    this.clearTimers();
    this.phase = 'spinner';
  }

  private clearTimers() {
    if (this.spinnerTimer) {
      clearTimeout(this.spinnerTimer);
      this.spinnerTimer = undefined;
    }
    if (this.successTimer) {
      clearTimeout(this.successTimer);
      this.successTimer = undefined;
    }
  }

  render() {
    return (
      <Host>
        {this.phase === 'spinner' ? <wa-spinner></wa-spinner> : <wa-icon part="check" name="check" style={{ color: 'var(--wa-color-success-fill-loud,#45b16d)' }}></wa-icon>}
      </Host>
    );
  }
}
