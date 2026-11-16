import { newSpecPage, SpecPage } from '@stencil/core/testing';
import { h } from '@stencil/core';

// The real services pull in axios (ESM), which this jest setup can't parse.
jest.mock('axios', () => {
  const axios = { post: jest.fn(), interceptors: { request: { use: jest.fn() } } };
  return { __esModule: true, default: axios, ...axios };
});

import axios from 'axios';
import { IglRateExtenderForm } from '../igl-rate-extender-form';

const RATE_PLAN_ID = 100;
const ROOM_TYPE_ID = 1;

const variation = {
  adult_nbr: 2,
  child_nbr: 0,
  discounted_amount: 150,
  nights: [
    { night: '2026-11-12', discounted_amount: 150 },
    { night: '2026-11-13', discounted_amount: 160 },
  ],
};

/** Booked 10 → 12 Nov; the form is opened to extend it through to the 14th, adding the nights of the 12th and 13th. */
const booking = {
  booking_nbr: 'B-1',
  currency: { id: 1, code: 'USD', symbol: '$' },
  property: { id: 42 },
  rooms: [
    {
      identifier: 'room-1',
      from_date: '2026-11-10',
      to_date: '2026-11-12',
      days: [
        { date: '2026-11-10', amount: 100, cost: null },
        { date: '2026-11-11', amount: 100, cost: null },
      ],
      roomtype: { id: ROOM_TYPE_ID, name: 'Standard' },
      rateplan: { id: RATE_PLAN_ID, short_name: 'BB', is_non_refundable: false, selected_variation: { adult_nbr: 2, child_nbr: 0 } },
      unit: { name: '101' },
    },
  ],
};

const availability = [{ id: ROOM_TYPE_ID, inventory: 3, is_available_to_book: true, rateplans: [{ id: RATE_PLAN_ID, variations: [variation] }] }];

const post = axios.post as jest.Mock;

const openForm = async (): Promise<SpecPage> => {
  const page = await newSpecPage({
    components: [IglRateExtenderForm],
    template: () => (
      <igl-rate-extender-form
        bookingNumber="B-1"
        propertyId={42}
        identifier="room-1"
        pool="pool-1"
        fromDate="2026-11-10"
        toDate="2026-11-14"
        defaultDates={{ from_date: '2026-11-10', to_date: '2026-11-12' }}
      ></igl-rate-extender-form>
    ),
  });
  await new Promise(resolve => setTimeout(resolve));
  await page.waitForChanges();
  return page;
};

const nightInput = (page: SpecPage, label: string) => Array.from(page.root.querySelectorAll('ir-input')).find(input => input.getAttribute('label') === label);

const typePrice = async (page: SpecPage, label: string, price: string) => {
  nightInput(page, label).dispatchEvent(new CustomEvent('text-change', { detail: price, bubbles: true, composed: true }));
  await page.waitForChanges();
};

const confirm = async (page: SpecPage) => {
  page.root.querySelector('form').dispatchEvent(new Event('submit', { cancelable: true }));
  await new Promise(resolve => setTimeout(resolve));
  await page.waitForChanges();
};

const reservationCalls = () => post.mock.calls.filter(([url]) => url === '/DoReservation');

describe('igl-rate-extender-form', () => {
  beforeEach(() => {
    post.mockReset();
    post.mockImplementation((url: string) => {
      switch (url) {
        case '/Get_Exposed_Booking':
          return Promise.resolve({ data: { ExceptionMsg: '', My_Result: booking } });
        case '/Check_Availability':
          return Promise.resolve({ data: { ExceptionMsg: '', My_Result: availability } });
        default:
          return Promise.resolve({ data: { ExceptionMsg: '', My_Result: {} } });
      }
    });
  });

  it('leaves a night empty when its price is deleted', async () => {
    const page = await openForm();
    expect(nightInput(page, 'Thu, Nov 12').getAttribute('value')).toBe('150');

    await typePrice(page, 'Thu, Nov 12', '');

    expect(nightInput(page, 'Thu, Nov 12').getAttribute('value')).toBe('');
  });

  it('does not save the extension while a night has no price', async () => {
    const page = await openForm();
    await typePrice(page, 'Thu, Nov 12', '');

    await confirm(page);

    expect(reservationCalls()).toHaveLength(0);
  });

  it('saves the new price once an emptied night is filled in again', async () => {
    const page = await openForm();
    await typePrice(page, 'Thu, Nov 12', '');
    await typePrice(page, 'Thu, Nov 12', '175');

    await confirm(page);

    expect(reservationCalls()).toHaveLength(1);
    const [, body] = reservationCalls()[0];
    expect(body.booking.rooms[0].days.map(day => day.amount)).toEqual([100, 100, 175, 160]);
  });

  it('accepts a free night', async () => {
    const page = await openForm();
    await typePrice(page, 'Thu, Nov 12', '0');

    await confirm(page);

    expect(reservationCalls()).toHaveLength(1);
    const [, body] = reservationCalls()[0];
    expect(body.booking.rooms[0].days.map(day => day.amount)).toEqual([100, 100, 0, 160]);
  });

  it('rules out negative prices on the night inputs', async () => {
    const page = await openForm();

    expect(nightInput(page, 'Thu, Nov 12').getAttribute('min')).toBe('0');
  });
});
