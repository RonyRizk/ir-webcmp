import { Component, h, State, Method, Element, Prop, Listen } from '@stencil/core';
import { TPositions } from '@components/ui/ir-toast/toast';

export interface Toast {
  id?: string;
  title: string;
  description?: string;
  type?: 'info' | 'success' | 'warning' | 'error' | 'danger';
  duration?: number;
  dismissible?: boolean;
  actionLabel?: string;
}

type ManagedToast = Toast & { id: string; leaving?: boolean };

interface ToastTimerState {
  timeoutId?: number;
  remaining: number;
  startedAt?: number;
}

@Component({
  tag: 'ir-toast-provider',
  styleUrl: 'ir-toast-provider.css',
  shadow: true,
})
export class IrToastProvider {
  @Element() el: HTMLElement;

  @Prop() position: 'top-start' | 'top-center' | 'top-end' | 'bottom-start' | 'bottom-center' | 'bottom-end' = 'top-end';
  @Prop() rtl: boolean = false;
  @Prop() duration: number = 5000;

  @State() toasts: ManagedToast[] = [];

  private popoverRef: HTMLElement & { showPopover?: () => void; hidePopover?: () => void };
  private toastTimers: Map<string, ToastTimerState> = new Map();

  componentDidLoad() {
    // Ensure popover API is supported
    if (this.popoverRef && typeof this.popoverRef.showPopover === 'function') {
      // Initially hide the popover
      try {
        this.popoverRef.hidePopover?.();
      } catch (e) {
        // Popover might not be shown yet
      }
    }
  }

  disconnectedCallback() {
    this.toastTimers.forEach(timer => {
      if (timer.timeoutId) {
        clearTimeout(timer.timeoutId);
      }
    });
    this.toastTimers.clear();
  }

  @Listen('toast', { target: 'body' })
  handleToast(event: CustomEvent<Partial<Toast>>) {
    const detail = event?.detail || {};
    const payload: Toast = {
      ...detail,
      title: detail.title ?? 'Notification',
    };
    this.addToast(payload);
  }

  @Method()
  async addToast(toast: Toast): Promise<string> {
    const id = toast.id ?? this.generateToastId();
    const newToast: ManagedToast = {
      id,
      type: toast.type ?? 'info',
      duration: toast.duration ?? this.duration,
      dismissible: toast.dismissible ?? true,
      leaving: false,
      ...toast,
    };

    this.toasts = [...this.toasts, newToast];
    this.announceToast(newToast);

    // Show popover when first toast is added
    if (this.toasts.length === 1) {
      this.showPopover();
    }

    if (newToast.duration && newToast.duration > 0) {
      this.startTimer(newToast.id, newToast.duration);
    }

    return id;
  }

  @Method()
  async removeToast(id: string): Promise<void> {
    // Mark toast as leaving for exit animation
    this.toasts = this.toasts.map(toast => (toast.id === id ? { ...toast, leaving: true } : toast));

    // Wait for animation to complete, then remove
    setTimeout(() => {
      this.clearTimer(id);
      this.toasts = this.toasts.filter(toast => toast.id !== id);

      // Hide popover when last toast is removed
      if (this.toasts.length === 0) {
        this.hidePopover();
      }
    }, 200); // Match the exit animation duration
  }

  @Method()
  async clearAllToasts(): Promise<void> {
    this.toastTimers.forEach(timer => {
      if (timer.timeoutId) {
        clearTimeout(timer.timeoutId);
      }
    });
    this.toastTimers.clear();
    this.toasts = [];
    this.hidePopover();
  }

  private showPopover() {
    if (this.popoverRef && typeof this.popoverRef.showPopover === 'function') {
      try {
        this.popoverRef.showPopover();
      } catch (e) {
        // Popover might already be shown
      }
    }
  }

  private hidePopover() {
    if (this.popoverRef && typeof this.popoverRef.hidePopover === 'function') {
      try {
        this.popoverRef.hidePopover();
      } catch (e) {
        // Popover might already be hidden
      }
    }
  }

  private generateToastId() {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private startTimer(id: string, duration: number) {
    if (typeof window === 'undefined') {
      return;
    }

    this.clearTimer(id);
    const timeoutId = window.setTimeout(() => this.removeToast(id), duration);
    this.toastTimers.set(id, { timeoutId, remaining: duration, startedAt: Date.now() });
  }

  private pauseTimer(id: string) {
    const timer = this.toastTimers.get(id);
    if (!timer || timer.timeoutId === undefined || timer.startedAt === undefined) {
      return;
    }

    clearTimeout(timer.timeoutId);
    const elapsed = Date.now() - timer.startedAt;
    const remaining = Math.max(timer.remaining - elapsed, 0);
    this.toastTimers.set(id, { remaining });
  }

  private resumeTimer(id: string) {
    const timer = this.toastTimers.get(id);
    if (!timer || timer.timeoutId !== undefined) {
      return;
    }

    if (timer.remaining <= 0) {
      this.removeToast(id);
      return;
    }

    if (typeof window === 'undefined') {
      return;
    }

    const timeoutId = window.setTimeout(() => this.removeToast(id), timer.remaining);
    this.toastTimers.set(id, { timeoutId, remaining: timer.remaining, startedAt: Date.now() });
  }

  private clearTimer(id: string) {
    const timer = this.toastTimers.get(id);
    if (timer?.timeoutId) {
      clearTimeout(timer.timeoutId);
    }
    this.toastTimers.delete(id);
  }

  private announceToast(toast: ManagedToast) {
    if (typeof document === 'undefined' || !this.el?.shadowRoot) {
      return;
    }

    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', toast.type === 'error' || toast.type === 'danger' ? 'assertive' : 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = `${toast.type}: ${toast.title}${toast.description ? '. ' + toast.description : ''}`;

    this.el.shadowRoot.appendChild(announcement);

    setTimeout(() => {
      announcement.remove();
    }, 1000);
  }

  private getPositionClass() {
    const [vertical, horizontal] = this.position.split('-');
    return `toast-container--${vertical} toast-container--${horizontal}`;
  }

  private getAlertPosition(): TPositions {
    const [vertical = 'top', horizontal = 'end'] = this.position.split('-');
    const horizontalMap: Record<string, 'left' | 'right'> = {
      start: this.rtl ? 'right' : 'left',
      end: this.rtl ? 'left' : 'right',
    };
    const resolvedHorizontal = horizontalMap[horizontal] ?? 'right';
    const resolvedVertical = vertical === 'bottom' ? 'bottom' : 'top';
    return `${resolvedVertical}-${resolvedHorizontal}` as TPositions;
  }

  private mapVariant(type?: Toast['type']): 'info' | 'success' | 'warning' | 'danger' {
    switch (type) {
      case 'success':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
      case 'danger':
        return 'danger';
      default:
        return 'info';
    }
  }

  private handleToastDismiss = (event: CustomEvent<{ id: string; reason: 'manual' }>) => {
    event.stopPropagation();
    this.removeToast(event.detail.id);
  };

  private handleInteractionChange = (event: CustomEvent<{ id: string; interacting: boolean }>) => {
    event.stopPropagation();
    if (event.detail.interacting) {
      this.pauseTimer(event.detail.id);
    } else {
      this.resumeTimer(event.detail.id);
    }
  };

  private handlePopoverToggle = (event: Event) => {
    // Prevent popover from being closed by user interaction or light dismiss
    if (this.toasts.length > 0) {
      event.preventDefault();
      this.showPopover();
    }
  };

  render() {
    return (
      <div ref={el => (this.popoverRef = el)} popover="manual" class="toast-popover" onToggle={this.handlePopoverToggle}>
        <div
          class={`toast-container ${this.getPositionClass()} ${this.rtl ? 'rtl' : ''}`}
          role="region"
          aria-label="Notifications"
          aria-live="polite"
          dir={this.rtl ? 'rtl' : 'ltr'}
        >
          {this.toasts.map(toast => (
            <div class="toast-item" key={toast.id}>
              <ir-toast-alert
                toastId={toast.id}
                label={toast.title}
                description={toast.description}
                dismissible={toast.dismissible}
                actionLabel={toast.actionLabel}
                position={this.getAlertPosition()}
                variant={this.mapVariant(toast.type)}
                leaving={toast.leaving}
                onIrToastDismiss={this.handleToastDismiss}
                onIrToastInteractionChange={this.handleInteractionChange}
              ></ir-toast-alert>
            </div>
          ))}
        </div>
      </div>
    );
  }
}
