/**
 * Calendar-wide coordination between booking bars.
 *
 * A calendar can hold thousands of bars. Giving each one its own window listeners means every click
 * and every drop runs thousands of handlers, so the bars of a window share one registry instead:
 * one listener per concern for the whole calendar, and the outside-click listener only exists while
 * a bubble is actually open.
 *
 * Registries are per window (the bar's own `ownerDocument.defaultView`), so separate documents never
 * share state, and a registry tears its listeners down when its last bar disconnects.
 */
export interface RegisteredBar {
  readonly element: HTMLElement;
  bookingId(): string;
  pool(): string;
  /** Close this bar's info bubble. */
  closeInfo(): void;
  /** The calendar resolved this bar's drop. */
  onMoveBookingTo(event: CustomEvent): void;
  /** The calendar wants this bar back where its data puts it. */
  onRevertBooking(): void;
}

class BarRegistry {
  private bars = new Set<RegisteredBar>();
  private openBar: RegisteredBar | null = null;

  constructor(private win: Window) {}

  get isEmpty() {
    return this.bars.size === 0;
  }

  add(bar: RegisteredBar) {
    if (this.bars.size === 0) {
      this.win.addEventListener('moveBookingTo', this.onMoveBookingTo);
      this.win.addEventListener('revertBooking', this.onRevertBooking);
    }
    this.bars.add(bar);
  }

  remove(bar: RegisteredBar) {
    this.release(bar);
    this.bars.delete(bar);
    if (this.bars.size === 0) {
      this.win.removeEventListener('moveBookingTo', this.onMoveBookingTo);
      this.win.removeEventListener('revertBooking', this.onRevertBooking);
    }
  }

  /** Makes `bar` the one bar with an open bubble, closing whichever bar had it before. */
  claim(bar: RegisteredBar) {
    if (this.openBar === bar) {
      return;
    }
    const previous = this.openBar;
    this.openBar = bar;
    if (previous) {
      previous.closeInfo();
    } else {
      this.win.addEventListener('click', this.onClick);
    }
  }

  /** `bar`'s bubble closed; stop watching for outside clicks if it was the open one. */
  release(bar: RegisteredBar) {
    if (this.openBar !== bar) {
      return;
    }
    this.openBar = null;
    this.win.removeEventListener('click', this.onClick);
  }

  /** Closes whichever bubble is open, if any. */
  closeOpen() {
    this.openBar?.closeInfo();
  }

  private onClick = (event: Event) => {
    if (this.openBar && !this.openBar.element.contains(event.target as Node)) {
      this.openBar.closeInfo();
    }
  };

  private onMoveBookingTo = (event: CustomEvent) => {
    const bookingId = event.detail?.bookingId;
    for (const bar of this.bars) {
      if (bar.bookingId() === bookingId) {
        bar.onMoveBookingTo(event);
      }
    }
  };

  private onRevertBooking = (event: CustomEvent<string>) => {
    for (const bar of this.bars) {
      if (bar.pool() === event.detail) {
        bar.onRevertBooking();
      }
    }
  };
}

const registries = new WeakMap<Window, BarRegistry>();

function windowOf(bar: RegisteredBar): Window | null {
  return bar.element.ownerDocument?.defaultView ?? null;
}

export function registerBar(bar: RegisteredBar) {
  const win = windowOf(bar);
  if (!win) {
    return;
  }
  let registry = registries.get(win);
  if (!registry) {
    registry = new BarRegistry(win);
    registries.set(win, registry);
  }
  registry.add(bar);
}

export function unregisterBar(bar: RegisteredBar) {
  const win = windowOf(bar);
  const registry = win && registries.get(win);
  if (!registry) {
    return;
  }
  registry.remove(bar);
  if (registry.isEmpty) {
    registries.delete(win);
  }
}

export function claimInfoBubble(bar: RegisteredBar) {
  const win = windowOf(bar);
  win && registries.get(win)?.claim(bar);
}

export function releaseInfoBubble(bar: RegisteredBar) {
  const win = windowOf(bar);
  win && registries.get(win)?.release(bar);
}

/** Closes any open bubble in `bar`'s calendar - a drag starting anywhere should not leave one up. */
export function closeOpenInfoBubble(bar: RegisteredBar) {
  const win = windowOf(bar);
  win && registries.get(win)?.closeOpen();
}
