import { newSpecPage } from '@stencil/core/testing';
import { IglDayUseBookings } from '../igl-day-use-bookings';
import calendar_data from '@/stores/calendar-data';

const stayEvent = (overrides: Record<string, any>) => ({
  PR_ID: 12,
  BOOKING_NUMBER: '111',
  NAME: 'Ada Lovelace',
  IDENTIFIER: 'room-1',
  FROM_DATE: '2026-08-19',
  TO_DATE: '2026-08-20',
  DEPARTURE_TIME: { code: '000', description: '' },
  ROOMS: [{ identifier: 'room-1', arrival_time: { code: '001', description: 'Not sure yet' }, departure_time: { code: '000', description: '' } }],
  defaultDates: { from_date: '2026-08-19', to_date: '2026-08-20' },
  ...overrides,
});

const dayUseBooking = {
  bh_id: 1,
  book_nbr: '999',
  from_time: '10:00',
  to_time: '14:00',
  gross_amount: 50,
  guest_first_name: 'Grace',
  guest_last_name: 'Hopper',
  net_amount: 45,
  room_type_id: 3,
  service_price: 50,
  target_date: '2026-08-20',
  tax_amount: 5,
  unit_id: 12,
} as any;

const render = async (bookingEvents: any[]) => {
  const page = await newSpecPage({
    components: [IglDayUseBookings],
    html: `<igl-day-use-bookings></igl-day-use-bookings>`,
  });
  const el = page.root as any;
  el.calendarData = { bookingEvents, roomsInfo: [], currency: { symbol: '$' } };
  el.dayUseBookings = [dayUseBooking];
  await page.waitForChanges();
  return page;
};

describe('igl-day-use-bookings — same-day stay movements', () => {
  beforeEach(() => {
    calendar_data.property = { time_constraints: { check_in_from: '14:00', check_out_till: '12:00' } } as any;
  });

  it('shows the departure time of the stay checking out that day', async () => {
    const page = await render([stayEvent({ DEPARTURE_TIME: { code: '004', description: '13:30' } })]);
    const chips = page.root.querySelectorAll('.dub-movement');
    expect(chips.length).toBe(1);
    expect(chips[0].textContent).toContain('Departure');
    expect(chips[0].textContent).toContain('01:30 PM');
  });

  it('falls back to the property check-out time when the stay has none', async () => {
    const page = await render([stayEvent({})]);
    expect(page.root.querySelector('.dub-movement--departure').textContent).toContain('12:00 PM');
  });

  it('shows the arrival time of the stay checking in that day', async () => {
    const page = await render([
      stayEvent({
        BOOKING_NUMBER: '222',
        FROM_DATE: '2026-08-20',
        TO_DATE: '2026-08-22',
        defaultDates: { from_date: '2026-08-20', to_date: '2026-08-22' },
        ROOMS: [{ identifier: 'room-1', arrival_time: { code: '005', description: '16:00' }, departure_time: null }],
      }),
    ]);
    const chip = page.root.querySelector('.dub-movement--arrival');
    expect(chip.textContent).toContain('Arrival');
    expect(chip.textContent).toContain('04:00 PM');
  });

  it('flags a turnover and lists both bookings in the tooltip', async () => {
    const page = await render([
      stayEvent({ DEPARTURE_TIME: { code: '003', description: '11:00' } }),
      stayEvent({
        BOOKING_NUMBER: '222',
        NAME: 'Alan Turing',
        IDENTIFIER: 'room-2',
        FROM_DATE: '2026-08-20',
        TO_DATE: '2026-08-22',
        defaultDates: { from_date: '2026-08-20', to_date: '2026-08-22' },
        ROOMS: [{ identifier: 'room-2', arrival_time: { code: '005', description: '16:00' }, departure_time: null }],
      }),
    ]);
    expect(page.root.querySelector('.dub-movement--turnover')).not.toBeNull();
    const tooltip = page.root.querySelector('wa-tooltip[for="dub-movements-1"]');
    expect(tooltip.textContent).toContain('#111');
    expect(tooltip.textContent).toContain('Ada Lovelace');
    expect(tooltip.textContent).toContain('#222');
    expect(tooltip.textContent).toContain('Alan Turing');
  });

  it('renders no movement chips when nothing moves that day', async () => {
    const page = await render([stayEvent({ FROM_DATE: '2026-08-17', TO_DATE: '2026-08-18', defaultDates: { from_date: '2026-08-17', to_date: '2026-08-18' } })]);
    expect(page.root.querySelector('.dub-booking__movements')).toBeNull();
  });
});
