import { Component, Event, EventEmitter, Host, Listen, Method, Prop, h } from '@stencil/core';
import { ToastVariants } from '@components/ui/ir-toast-item/ir-toast-item';

export interface Toast {
  id?: string;
  title: string;
  description?: string;
  type?: 'info' | 'success' | 'warning' | 'error' | 'danger';
  duration?: number;
  dismissible?: boolean;
  actionLabel?: string;
}

interface ActiveItem {
  id: string;
  el: HTMLIrToastItemElement;
}

// In current Chrome, anything outside a modal dialog (`showModal()`) is inert —
// including popovers shown *after* the dialog, even though they paint above it.
// The only place a toast stays clickable while an ir-drawer/wa-dialog is open is
// *inside* the topmost modal dialog's subtree. The provider therefore keeps all
// toasts in a single fixed "layer" element that lives in document.body as a
// popover="manual" (top layer) when no modal is open, and re-parents into the
// topmost modal dialog whenever one opens.
const EDGE_PADDING = 16; // px from screen edges
const ITEM_GAP = 8; // px between toasts

// Pages and feature roots alike embed ir-toast (which renders a provider), so
// several providers can be connected at once — each listening for `toast`
// events on the body. Only the most recently connected provider handles them,
// so one event never produces duplicate toasts.
const connectedProviders: IrToastProvider[] = [];

/** `matches()` that tolerates engines without the pseudo-class (e.g. Stencil mock-doc). */
function safeMatches(el: Element, selector: string): boolean {
  try {
    return el.matches(selector);
  } catch (e) {
    return false;
  }
}

/** Finds the native <dialog> rendered by a component (e.g. ir-drawer → wa-drawer → dialog). */
function findDialogIn(el: Element | null): HTMLDialogElement | null {
  if (!el) {
    return null;
  }
  if (el instanceof HTMLDialogElement) {
    return el;
  }
  const root = (el as HTMLElement).shadowRoot;
  if (!root) {
    return null;
  }
  const direct = root.querySelector('dialog');
  if (direct) {
    return direct;
  }
  for (const child of Array.from(root.querySelectorAll('*'))) {
    const nested = findDialogIn(child);
    if (nested) {
      return nested;
    }
  }
  return null;
}

@Component({
  tag: 'ir-toast-provider',
  styleUrl: 'ir-toast-provider.css',
  shadow: true,
})
export class IrToastProvider {
  @Prop() position: 'top-start' | 'top-center' | 'top-end' | 'bottom-start' | 'bottom-center' | 'bottom-end' = 'top-end';
  @Prop() rtl: boolean = false;
  @Prop() duration: number = 5000;

  /** Emitted when a toast's action button is clicked. */
  @Event() toastAction: EventEmitter<{ id: string }>;

  private items: ActiveItem[] = [];
  private layer: HTMLElement | null = null;
  private liveRegion: HTMLElement | null = null;
  private modalStack: HTMLDialogElement[] = [];
  private positionCache = new Map<HTMLElement, DOMRect>();

  connectedCallback() {
    connectedProviders.push(this);
    document.addEventListener('keydown', this.handleKeyDown);
  }

  disconnectedCallback() {
    const index = connectedProviders.indexOf(this);
    if (index > -1) {
      connectedProviders.splice(index, 1);
    }
    document.removeEventListener('keydown', this.handleKeyDown);
    this.layer?.remove();
    this.layer = null;
    this.liveRegion = null;
    this.items = [];
    this.modalStack = [];
  }

  @Listen('toast', { target: 'body' })
  handleToast(event: CustomEvent<Partial<Toast> & { type?: string }>) {
    if (connectedProviders[connectedProviders.length - 1] !== this) {
      return;
    }
    const detail = event?.detail || {};
    // Legacy IToast emitters (ir-interceptor, booking details, …) often send an
    // empty description and put the message in `title`, or vice versa.
    const title = detail.title || detail.description || 'Notification';
    const payload: Toast = {
      ...detail,
      title,
      description: detail.title ? detail.description || undefined : undefined,
      type: this.normalizeType(detail.type),
    };
    this.addToast(payload);
  }

  // A modal dialog opening makes everything outside it inert; track it and move
  // the toast layer inside so toasts stay visible and clickable above it.
  @Listen('drawerShow', { target: 'body' })
  @Listen('wa-show', { target: 'body' })
  handleOverlayShow(event: Event) {
    const dialog = findDialogIn(event.target as Element);
    if (!dialog) {
      return;
    }
    this.modalStack = this.modalStack.filter(d => d !== dialog);
    this.modalStack.push(dialog);
    // Defer so the dialog is actually modal (showModal may run after the event).
    requestAnimationFrame(() => this.relocateLayer());
  }

  @Listen('drawerHide', { target: 'body' })
  @Listen('wa-hide', { target: 'body' })
  @Listen('wa-after-hide', { target: 'body' })
  handleOverlayHide() {
    if (!this.layer) {
      return;
    }
    requestAnimationFrame(() => this.relocateLayer());
  }

  @Method()
  async addToast(toast: Toast): Promise<string> {
    const id = toast.id ?? this.generateToastId();
    const type = toast.type ?? 'info';

    const item = document.createElement('ir-toast-item') as HTMLIrToastItemElement;
    item.variant = this.mapVariant(type);
    item.duration = toast.duration ?? this.duration;
    item.dismissible = toast.dismissible ?? true;
    item.setAttribute('data-placement', this.position);
    Object.assign(item.style, {
      pointerEvents: 'auto',
      minWidth: '20rem',
      maxWidth: `min(28rem, calc(100vw - ${EDGE_PADDING * 2}px))`,
    });

    item.append(this.buildIcon(type), ...this.buildContent(id, toast));
    item.addEventListener('irDismiss', () => this.destroyItem(item));

    const layer = this.ensureLayer();
    this.relocateLayer();
    this.capturePositions();
    layer.prepend(item);
    this.items.unshift({ id, el: item });
    this.showLayerIfNeeded();
    requestAnimationFrame(() => this.animatePositions());

    this.announce(`${type}: ${toast.title}${toast.description ? '. ' + toast.description : ''}`, type === 'error' || type === 'danger');
    return id;
  }

  @Method()
  async removeToast(id: string): Promise<void> {
    const entry = this.items.find(item => item.id === id);
    if (!entry) {
      return;
    }
    await entry.el.hide();
  }

  @Method()
  async clearAllToasts(): Promise<void> {
    await Promise.all(this.items.map(({ el }) => el.hide()));
  }

  private handleKeyDown = async (event: KeyboardEvent) => {
    // Let modal drawers/dialogs consume Escape first (they mark it defaultPrevented).
    await new Promise<void>(resolve => setTimeout(resolve));
    if (event.key === 'Escape' && !event.defaultPrevented && this.items.length > 0) {
      event.preventDefault();
      this.removeToast(this.items[0].id);
    }
  };

  private destroyItem(el: HTMLElement) {
    if (!el.parentElement) {
      return;
    }
    this.capturePositions();
    el.remove();
    this.items = this.items.filter(item => item.el !== el);
    if (this.items.length === 0) {
      this.hideLayer();
    } else {
      requestAnimationFrame(() => this.animatePositions());
    }
  }

  private ensureLayer(): HTMLElement {
    if (this.layer) {
      this.applyLayerPlacement();
      return this.layer;
    }
    const layer = document.createElement('div');
    layer.setAttribute('data-ir-toast-layer', '');
    Object.assign(layer.style, {
      position: 'fixed',
      display: 'flex',
      gap: `${ITEM_GAP}px`,
      padding: `${EDGE_PADDING}px`,
      boxSizing: 'border-box',
      left: '0',
      right: '0',
      width: 'auto',
      height: 'auto',
      maxHeight: '100vh',
      margin: '0',
      border: 'none',
      background: 'transparent',
      overflow: 'visible',
      pointerEvents: 'none',
      zIndex: '2147483647',
    });

    // Visually hidden live region travels with the layer so announcements are
    // never inside an inert subtree while a modal drawer is open.
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('data-ir-toast-live-region', '');
    liveRegion.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;white-space:nowrap;clip-path:inset(50%);pointer-events:none;';
    layer.append(liveRegion);

    this.layer = layer;
    this.liveRegion = liveRegion;
    this.applyLayerPlacement();
    return layer;
  }

  private applyLayerPlacement() {
    if (!this.layer) {
      return;
    }
    const [vertical = 'top', horizontal = 'end'] = this.position.split('-');
    const s = this.layer.style;
    s.flexDirection = vertical === 'bottom' ? 'column-reverse' : 'column';
    s.top = vertical === 'bottom' ? 'auto' : '0';
    s.bottom = vertical === 'bottom' ? '0' : 'auto';
    s.alignItems = horizontal === 'center' ? 'center' : horizontal === 'start' ? 'flex-start' : 'flex-end';
    this.layer.setAttribute('dir', this.rtl ? 'rtl' : 'ltr');
  }

  /** Deep-scans the document (piercing shadow roots) for open modal dialogs. */
  private findOpenModalDialogs(): HTMLDialogElement[] {
    const found: HTMLDialogElement[] = [];
    const walk = (root: Document | ShadowRoot) => {
      for (const dialog of Array.from(root.querySelectorAll('dialog'))) {
        if (safeMatches(dialog, ':modal')) {
          found.push(dialog);
        }
      }
      for (const el of Array.from(root.querySelectorAll('*'))) {
        if (el.shadowRoot) {
          walk(el.shadowRoot);
        }
      }
    };
    walk(document);
    return found;
  }

  /** Moves the layer into the topmost open modal dialog, or back to document.body. */
  private relocateLayer() {
    const layer = this.layer;
    if (!layer) {
      return;
    }
    // Event tracking can miss dialogs opened before this provider connected,
    // so always reconcile against the dialogs that are actually open.
    const open = this.findOpenModalDialogs();
    this.modalStack = this.modalStack.filter(dialog => open.includes(dialog));
    const host: HTMLElement = this.modalStack[this.modalStack.length - 1] ?? open[open.length - 1] ?? document.body;
    const inDialog = host !== document.body;
    if (layer.parentNode !== host) {
      if (safeMatches(layer, ':popover-open')) {
        layer.hidePopover?.();
      }
      if (inDialog) {
        layer.removeAttribute('popover');
      } else {
        layer.setAttribute('popover', 'manual');
      }
      host.append(layer);
      // Re-parenting disconnects the items, which clears their countdown timers
      // (and Stencil may run the deferred disconnect *after* reconnect). Restart
      // them once the move has fully settled.
      requestAnimationFrame(() => {
        for (const { el } of this.items) {
          el.startTimer?.();
        }
      });
    } else if (!inDialog && !layer.hasAttribute('popover')) {
      layer.setAttribute('popover', 'manual');
    }
    this.showLayerIfNeeded();
  }

  private showLayerIfNeeded() {
    const layer = this.layer;
    if (!layer || this.items.length === 0) {
      return;
    }
    if (layer.hasAttribute('popover') && !safeMatches(layer, ':popover-open')) {
      try {
        layer.showPopover?.();
      } catch (e) {
        // Popover may be mid-transition
      }
    }
  }

  private hideLayer() {
    const layer = this.layer;
    if (layer && safeMatches(layer, ':popover-open')) {
      layer.hidePopover?.();
    }
  }

  private announce(text: string, assertive: boolean) {
    const trimmed = text.trim();
    if (!this.liveRegion || !trimmed) {
      return;
    }
    const announcer = document.createElement('div');
    announcer.setAttribute('role', assertive ? 'alert' : 'status');
    announcer.setAttribute('aria-live', assertive ? 'assertive' : 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    this.liveRegion.append(announcer);
    // Double rAF so assistive tech registers the live region before content lands.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        announcer.textContent = trimmed;
      });
    });
    setTimeout(() => announcer.remove(), 1000);
  }

  private buildIcon(type: Toast['type']): HTMLElement {
    const names: Record<string, string> = {
      success: 'circle-check',
      warning: 'triangle-exclamation',
      error: 'circle-xmark',
      danger: 'circle-xmark',
    };
    const icon = document.createElement('wa-icon');
    icon.setAttribute('slot', 'icon');
    icon.setAttribute('name', names[type] ?? 'circle-info');
    icon.setAttribute('aria-hidden', 'true');
    return icon;
  }

  private buildContent(id: string, toast: Toast): HTMLElement[] {
    const nodes: HTMLElement[] = [];
    const title = document.createElement('strong');
    title.setAttribute('data-toast-title', '');
    title.textContent = toast.title;
    nodes.push(title);
    if (toast.description) {
      const description = document.createElement('div');
      description.setAttribute('data-toast-description', '');
      description.textContent = toast.description;
      nodes.push(description);
    }
    if (toast.actionLabel) {
      const action = document.createElement('button');
      action.type = 'button';
      action.setAttribute('data-toast-action', '');
      action.textContent = toast.actionLabel;
      action.addEventListener('click', () => {
        this.toastAction.emit({ id });
        this.removeToast(id);
      });
      nodes.push(action);
    }
    return nodes;
  }

  private capturePositions() {
    this.positionCache.clear();
    for (const { el } of this.items) {
      this.positionCache.set(el, el.getBoundingClientRect());
    }
  }

  private animatePositions() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.positionCache.clear();
      return;
    }
    for (const { el } of this.items) {
      const oldRect = this.positionCache.get(el);
      if (!oldRect) {
        continue;
      }
      const newRect = el.getBoundingClientRect();
      const deltaY = oldRect.top - newRect.top;
      if (Math.abs(deltaY) > 1) {
        // Animate `translate` so it never conflicts with `transform`-based CSS animations.
        el.animate?.([{ translate: `0 ${deltaY}px` }, { translate: '0 0' }], {
          duration: 200,
          easing: 'cubic-bezier(0.2, 0, 0, 1)',
        });
      }
    }
    this.positionCache.clear();
  }

  private generateToastId() {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /** Accepts both the provider's own types and the legacy IToast vocabulary ('error', 'custom'). */
  private normalizeType(type?: string): Toast['type'] {
    switch (type) {
      case 'success':
      case 'warning':
      case 'error':
      case 'danger':
        return type;
      default:
        return 'info';
    }
  }

  private mapVariant(type?: Toast['type']): ToastVariants {
    switch (type) {
      case 'success':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
      case 'danger':
        return 'danger';
      default:
        return 'brand';
    }
  }

  render() {
    return <Host />;
  }
}
