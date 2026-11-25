jest.mock('../../../../services/booking-service/booking.service', () => ({
  BookingService: jest.fn().mockImplementation(() => ({})),
}));

import { newSpecPage } from '@stencil/core/testing';
import { Component, Event, EventEmitter, Prop, h } from '@stencil/core';
import { IrBookingHeader } from '../ir-booking-header';
import { IrEventsLogDrawer } from '../events-log/ir-events-log-drawer/ir-events-log-drawer';
import { Booking } from '../../../../models/booking.dto';

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

const events = [
  { id: 1, date: '2026-03-04', hour: 9, minute: 5, second: 7, type: 'New booking', user: 'alice' },
  { id: 2, date: '2026-03-05', hour: 14, minute: 30, second: 0, type: 'Confirmed', user: 'bob' },
];

const booking = {
  booking_nbr: '12345',
  is_direct: true,
  is_editable: false,
  allowed_actions: [],
  ota_manipulations: [],
  origin: { Label: 'Website', Icon: '' },
  status: { code: '001', description: 'Pending' },
  events,
} as unknown as Booking;

async function renderHeader() {
  const page = await newSpecPage({
    components: [IrBookingHeader, IrEventsLogDrawer, IrDrawerStub],
    template: () => <ir-booking-header booking={booking}></ir-booking-header>,
  });
  const logsButton = Array.from(page.root.querySelectorAll('ir-custom-button')).find(b => b.textContent.trim() === 'Logs');
  const drawer = () => page.root.querySelector('ir-events-log-drawer') as HTMLIrEventsLogDrawerElement;
  return { page, logsButton, drawer };
}

describe('ir-booking-header events log', () => {
  it('opens the events log drawer with the booking events when "Logs" is clicked', async () => {
    const { page, logsButton, drawer } = await renderHeader();

    expect(logsButton).toBeDefined();
    expect(drawer()?.open).toBeFalsy();

    logsButton.dispatchEvent(new (page.win as any).CustomEvent('clickHandler', { detail: {} }));
    await page.waitForChanges();

    expect(drawer().open).toBe(true);
    expect(drawer().events).toEqual(events);
    expect(page.root.querySelector('ir-dialog ir-events-log')).toBeNull();
  });

  it('closes the events log drawer when it reports it was dismissed', async () => {
    const { page, logsButton, drawer } = await renderHeader();
    logsButton.dispatchEvent(new (page.win as any).CustomEvent('clickHandler', { detail: {} }));
    await page.waitForChanges();

    drawer().dispatchEvent(new (page.win as any).CustomEvent('eventsLogDrawerClosed', { detail: { source: drawer() } }));
    await page.waitForChanges();

    expect(drawer().open).toBe(false);
  });
});
