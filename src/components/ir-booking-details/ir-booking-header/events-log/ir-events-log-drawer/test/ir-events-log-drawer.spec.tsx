import { newSpecPage } from '@stencil/core/testing';
import { Component, Event, EventEmitter, Prop, h } from '@stencil/core';
import { IrEventsLogDrawer } from '../ir-events-log-drawer';
import { IrEventsLog } from '../../ir-events-log';
import { ExposedBookingEvent } from '../../../../../../models/booking.dto';

/** Spec-test double for `ir-drawer`: same public props and `drawerHide` event, without wa-drawer / MutationObserver internals mock-doc can't run. Kept inside the spec so the Stencil build never sees a second `ir-drawer`. */
@Component({ tag: 'ir-drawer', shadow: false })
class IrDrawerStub {
  @Prop() open: boolean;
  @Prop() label: string;
  @Event() drawerHide: EventEmitter<{ source: Element }>;

  render() {
    return <slot></slot>;
  }
}

const events: ExposedBookingEvent[] = [
  { id: 1, date: '2026-03-04', hour: 9, minute: 5, second: 7, type: 'New booking', user: 'alice' },
  { id: 2, date: '2026-03-05', hour: 14, minute: 30, second: 0, type: 'Status changed to Confirmed', user: 'bob' },
];

async function render(props: { open?: boolean; events?: ExposedBookingEvent[] }) {
  const page = await newSpecPage({
    components: [IrEventsLogDrawer, IrEventsLog, IrDrawerStub],
    template: () => <ir-events-log-drawer open={props.open} events={props.events}></ir-events-log-drawer>,
  });
  const drawer = page.root.querySelector('ir-drawer') as HTMLElement & { open: boolean; label: string };
  return { page, drawer };
}

describe('ir-events-log-drawer', () => {
  it('opens a drawer labelled "Events log" listing each event with its time, type and user', async () => {
    const { drawer } = await render({ open: true, events });

    expect(drawer).not.toBeNull();
    expect(drawer.open).toBe(true);
    expect(drawer.label).toBe('Events log');

    const rows = Array.from(drawer.querySelectorAll('[data-testid="events-log-entry"]'));
    expect(rows).toHaveLength(2);
    expect(rows[0].textContent).toContain('09:05:07');
    expect(rows[0].textContent).toContain('New booking');
    expect(rows[0].textContent).toContain('alice');
    expect(rows[1].textContent).toContain('14:30:00');
    expect(rows[1].textContent).toContain('Status changed to Confirmed');
    expect(rows[1].textContent).toContain('bob');
  });

  it('keeps the events in the order the API returned them, without re-sorting', async () => {
    const unsorted: ExposedBookingEvent[] = [
      { id: 7, date: '2026-03-05', hour: 8, minute: 0, second: 0, type: 'Third', user: 'u' },
      { id: 3, date: '2026-03-01', hour: 8, minute: 0, second: 0, type: 'First', user: 'u' },
      { id: 5, date: '2026-03-09', hour: 8, minute: 0, second: 0, type: 'Second', user: 'u' },
    ];
    const { drawer } = await render({ open: true, events: unsorted });

    const types = Array.from(drawer.querySelectorAll('[data-testid="events-log-entry"]')).map(r => r.querySelectorAll('td')[1].textContent.trim());
    expect(types).toEqual(['Third', 'First', 'Second']);
  });

  it('shows an empty state instead of an empty table when there are no events', async () => {
    const { drawer } = await render({ open: true, events: [] });

    expect(drawer.querySelector('ir-empty-state')).not.toBeNull();
    expect(drawer.querySelector('[data-testid="events-log-entry"]')).toBeNull();
  });

  it('emits eventsLogDrawerClosed when the drawer is dismissed', async () => {
    const { page, drawer } = await render({ open: true, events });
    const closed = jest.fn();
    page.root.addEventListener('eventsLogDrawerClosed', closed);

    drawer.dispatchEvent(new (page.win as any).CustomEvent('drawerHide', { detail: { source: drawer }, bubbles: true }));
    await page.waitForChanges();

    expect(closed).toHaveBeenCalledTimes(1);
  });
});
