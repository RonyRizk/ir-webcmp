import { h } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';
import type { Booking } from '@/models/booking.dto';
import { IrDashboardBookingsTable, type DashboardBookingsTableVariant } from '../ir-dashboard-bookings-table';

const bookings = [
  {
    booking_nbr: '1001',
    guest: { first_name: 'Ana', last_name: 'Lee' },
    status: { code: '002', description: 'Confirmed' },
    currency: { symbol: '€' },
    rooms: [{ identifier: 'r1', from_date: '2026-10-16', to_date: '2026-10-17', guest: { first_name: 'Ana', last_name: 'Lee' } }],
  },
] as unknown as Booking[];

const render = (variant: DashboardBookingsTableVariant) =>
  newSpecPage({
    components: [IrDashboardBookingsTable],
    template: () => <ir-dashboard-bookings-table variant={variant} bookings={bookings}></ir-dashboard-bookings-table>,
  });

const headers = (root: HTMLElement) => Array.from(root.querySelectorAll('thead th')).map(th => th.textContent.trim());

describe('ir-dashboard-bookings-table', () => {
  it('lists in-house rooms without a balance or status column', async () => {
    const page = await render('inHouse');
    expect(headers(page.root)).toEqual(['Booking#', 'Booked by /Guest name', 'Unit', 'Dates']);
    expect(page.root.querySelector('ir-balance-cell')).toBeNull();
  });

  it.each(['newBookings', 'cancellations'] as const)('ends %s with balance, then status', async variant => {
    const page = await render(variant);
    expect(headers(page.root)).toEqual(['Booking#', 'Booked by /Guest name', 'Unit', 'Dates', 'Balance', 'Status']);
    expect(page.root.querySelector('ir-balance-cell')).not.toBeNull();
    expect(page.root.querySelector('ir-status-activity-cell')).not.toBeNull();
    expect(page.root.querySelector('ir-booked-on-cell')).toBeNull();
  });
});
