import { newSpecPage, SpecPage } from '@stencil/core/testing';
import { h } from '@stencil/core';

// The real services pull in axios (ESM), which this jest setup can't parse.
jest.mock('axios', () => {
  const axios = { post: jest.fn(), interceptors: { request: { use: jest.fn() } } };
  return { __esModule: true, default: axios, ...axios };
});

import axios from 'axios';
import calendar_data from '@/stores/calendar-data';
import { Booking } from '@/models/booking.dto';
import { IrValidator } from '@/components/ui/ir-validator/ir-validator';
import { IrReallocationForm } from '../ir-reallocation-form';

const CURRENT_RATEPLAN_ID = 100;
const TARGET_ROOM_TYPE_ID = 2;
const TARGET_UNIT_ID = 7;
const OTHER_TARGET_UNIT_ID = 8;
const MATCHING_ROOM_TYPE_ID = 3;
const MATCHING_UNIT_ID = 9;
const MATCHING_RATEPLAN_ID = 301;

const booking = {
  agent: null,
  currency: { id: 1, code: 'USD' },
  property: { id: 42 },
  rooms: [
    {
      identifier: 'room-1',
      from_date: '2026-11-10',
      to_date: '2026-11-12',
      roomtype: { name: 'Standard' },
      rateplan: { id: CURRENT_RATEPLAN_ID, short_name: 'BB', is_non_refundable: false },
      unit: { name: '101' },
    },
  ],
} as unknown as Booking;

const bedAndBreakfast = (id: number) => ({ id, is_active: true, short_name: 'BB', meal_plan: { code: 'BB' }, custom_text: null, is_non_refundable: false });

/** TARGET has no rateplan matching the booked one, so the user must pick; MATCHING has one, so it is chosen for them. */
const propertyRoomTypes = [
  { id: 1, rateplans: [bedAndBreakfast(CURRENT_RATEPLAN_ID)] },
  {
    id: TARGET_ROOM_TYPE_ID,
    rateplans: [
      { id: 201, is_active: true, short_name: 'Room Only', meal_plan: { code: 'RO' }, custom_text: null, is_non_refundable: false },
      { id: 202, is_active: true, short_name: 'Half Board', meal_plan: { code: 'HB' }, custom_text: 'Car Rental included', is_non_refundable: false },
    ],
  },
  { id: MATCHING_ROOM_TYPE_ID, rateplans: [bedAndBreakfast(MATCHING_RATEPLAN_ID)] },
];

const availability = [
  {
    id: TARGET_ROOM_TYPE_ID,
    name: 'Suite',
    is_available_to_book: true,
    rateplans: [
      {
        id: 201,
        assignable_units: [
          { pr_id: TARGET_UNIT_ID, name: '201', Is_Fully_Available: true },
          { pr_id: OTHER_TARGET_UNIT_ID, name: '202', Is_Fully_Available: true },
          { pr_id: 6, name: '200', Is_Fully_Available: false },
        ],
      },
      // The same physical unit is assignable under every rate plan of its room type.
      { id: 202, assignable_units: [{ pr_id: TARGET_UNIT_ID, name: '201', Is_Fully_Available: true }] },
    ],
  },
  {
    id: MATCHING_ROOM_TYPE_ID,
    name: 'Deluxe',
    is_available_to_book: true,
    rateplans: [{ id: MATCHING_RATEPLAN_ID, assignable_units: [{ pr_id: MATCHING_UNIT_ID, name: '301', Is_Fully_Available: true }] }],
  },
  {
    id: 4,
    name: 'Penthouse',
    is_available_to_book: false,
    rateplans: [{ id: 401, assignable_units: [{ pr_id: 10, name: '401', Is_Fully_Available: true }] }],
  },
];

const post = axios.post as jest.Mock;

async function renderForm(formBooking: Booking = booking) {
  const page = await newSpecPage({
    components: [IrReallocationForm, IrValidator],
    template: () => <ir-reallocation-form booking={formBooking} identifier="room-1" pool="pool-1" formId="reallocation-form"></ir-reallocation-form>,
  });
  await page.waitForChanges();
  return page;
}

function respondWith({ checkAvailability, reallocate }: { checkAvailability?: () => Promise<unknown>; reallocate?: () => Promise<unknown> }) {
  post.mockImplementation((url: string) => {
    if (url === '/Check_Availability') {
      return checkAvailability ? checkAvailability() : Promise.resolve({ data: { ExceptionMsg: '', My_Result: availability } });
    }
    return reallocate ? reallocate() : Promise.resolve({ data: { ExceptionMsg: '' } });
  });
}

/** Stencil's mock DOM stores a lowercase `onchange` as a property, so a dispatched event would never reach it. */
async function fireChange(page: SpecPage, element: HTMLElement, value: string) {
  (element as HTMLInputElement).value = value;
  element.onchange({ target: element, stopPropagation: () => {}, stopImmediatePropagation: () => {} } as unknown as Event);
  await page.waitForChanges();
}

/** Lets a settled request finish travelling through the service before asserting on the render. */
const requestSettled = (page: SpecPage) => new Promise(resolve => setTimeout(resolve)).then(() => page.waitForChanges());

/** Longer than ir-validator's 300ms validation debounce. */
const validationSettled = (page: SpecPage) => new Promise(resolve => setTimeout(resolve, 350)).then(() => page.waitForChanges());

const reallocationRequests = () => post.mock.calls.filter(([url]) => url === '/ReAllocate_Exposed_Room');

async function pressConfirm(page: SpecPage) {
  page.body.querySelector('form').dispatchEvent(new CustomEvent('submit'));
  await validationSettled(page);
}

const pickUnit = (page: SpecPage, roomTypeId: number, unitId: number) => fireChange(page, page.body.querySelector('wa-radio-group'), `${roomTypeId}_${unitId}`);
const pickTargetUnit = (page: SpecPage) => pickUnit(page, TARGET_ROOM_TYPE_ID, TARGET_UNIT_ID);

const availabilityRequest = () => post.mock.calls.find(([url]) => url === '/Check_Availability')[1];
const listedRoomTypes = (page: SpecPage) => Array.from(page.body.querySelectorAll('.room-type-name')).map(name => name.textContent);
const listedUnits = (page: SpecPage) => Array.from(page.body.querySelectorAll('wa-radio')).map(radio => radio.textContent);

function trackClose(page: SpecPage) {
  const closed = jest.fn();
  page.body.addEventListener('closeModal', closed);
  return closed;
}

describe('ir-reallocation-form', () => {
  beforeEach(() => {
    post.mockReset();
    respondWith({});
    calendar_data.property = { roomtypes: propertyRoomTypes } as any;
  });

  it('labels rate plan options without a null custom text', async () => {
    const page = await renderForm();
    await pickTargetUnit(page);

    const labels = Array.from(page.body.querySelectorAll('wa-option')).map(option => option.textContent);
    expect(labels).toEqual(['Room Only', 'Half Board | Car Rental included']);
  });

  it('marks the rate plan select invalid and reallocates nothing when confirming without a rate plan', async () => {
    const page = await renderForm();
    await pickTargetUnit(page);

    await pressConfirm(page);

    expect(page.body.querySelector('wa-select').getAttribute('aria-invalid')).toBe('true');
    expect(reallocationRequests()).toHaveLength(0);
  });

  it('clears the error and reallocates with the chosen rate plan once one is picked', async () => {
    const page = await renderForm();
    await pickTargetUnit(page);
    await pressConfirm(page);

    await fireChange(page, page.body.querySelector('wa-select'), '202');
    await validationSettled(page);
    await pressConfirm(page);

    expect(page.body.querySelector('wa-select').hasAttribute('aria-invalid')).toBe(false);
    expect(reallocationRequests()).toHaveLength(1);
    expect(reallocationRequests()[0][1]).toMatchObject({ pool: 'pool-1', destination_pr_id: TARGET_UNIT_ID, rateplan_id: 202 });
  });

  it('does not carry a chosen rate plan over to another unit', async () => {
    const page = await renderForm();
    await pickTargetUnit(page);
    await fireChange(page, page.body.querySelector('wa-select'), '202');

    await pickUnit(page, TARGET_ROOM_TYPE_ID, OTHER_TARGET_UNIT_ID);
    await pressConfirm(page);

    expect(reallocationRequests()).toHaveLength(0);
  });

  it('skips the rate plan select when the room type has a matching rate plan', async () => {
    const page = await renderForm();

    await pickUnit(page, MATCHING_ROOM_TYPE_ID, MATCHING_UNIT_ID);
    await pressConfirm(page);

    expect(page.body.querySelector('wa-select')).toBeNull();
    expect(reallocationRequests()[0][1]).toMatchObject({ destination_pr_id: MATCHING_UNIT_ID, rateplan_id: MATCHING_RATEPLAN_ID });
  });

  it('asks for a room and reallocates nothing when confirming without one', async () => {
    const page = await renderForm();
    expect(page.body.querySelector('.error-message')).toBeNull();

    await pressConfirm(page);

    expect(page.body.querySelector('.error-message').textContent).toBe('Please select a room');
    expect(reallocationRequests()).toHaveLength(0);
  });

  it('reallocates for the same stay dates', async () => {
    const page = await renderForm();
    await pickUnit(page, MATCHING_ROOM_TYPE_ID, MATCHING_UNIT_ID);

    await pressConfirm(page);

    expect(reallocationRequests()[0][1]).toMatchObject({ from_date: '2026-11-10', to_date: '2026-11-12' });
  });

  it('closes once the reallocation succeeds', async () => {
    const page = await renderForm();
    const closed = trackClose(page);
    await pickUnit(page, MATCHING_ROOM_TYPE_ID, MATCHING_UNIT_ID);

    await pressConfirm(page);

    expect(closed).toHaveBeenCalledTimes(1);
  });

  it('stays open when the reallocation is refused', async () => {
    respondWith({ reallocate: () => Promise.resolve({ data: { ExceptionMsg: 'Unit no longer available' } }) });
    const page = await renderForm();
    const closed = trackClose(page);
    await pickUnit(page, MATCHING_ROOM_TYPE_ID, MATCHING_UNIT_ID);

    await pressConfirm(page);

    expect(closed).not.toHaveBeenCalled();
  });

  it('shows a spinner until availability arrives', async () => {
    let resolveAvailability: (response: unknown) => void;
    respondWith({ checkAvailability: () => new Promise(resolve => (resolveAvailability = resolve)) });
    const page = await renderForm();

    expect(page.body.querySelector('ir-spinner')).not.toBeNull();
    expect(page.body.querySelector('form')).toBeNull();

    resolveAvailability({ data: { ExceptionMsg: '', My_Result: availability } });
    await requestSettled(page);

    expect(page.body.querySelector('ir-spinner')).toBeNull();
    expect(page.body.querySelector('form')).not.toBeNull();
  });

  it('stops the spinner when availability fails', async () => {
    respondWith({ checkAvailability: () => Promise.reject(new Error('Network down')) });
    const page = await renderForm();
    await requestSettled(page);

    expect(page.body.querySelector('ir-spinner')).toBeNull();
  });

  it('checks availability for the stay, outside agent mode for a direct booking', async () => {
    await renderForm();

    expect(availabilityRequest()).toMatchObject({
      from_date: '2026-11-10',
      to_date: '2026-11-12',
      propertyid: 42,
      currency_ref: 'USD',
      is_in_agent_mode: false,
      agent_id: null,
    });
  });

  it('checks availability in agent mode for an agent booking', async () => {
    await renderForm({ ...booking, agent: { id: 9 } } as unknown as Booking);

    expect(availabilityRequest()).toMatchObject({ is_in_agent_mode: true, agent_id: 9 });
  });

  it('shows where the guest is staying now', async () => {
    const page = await renderForm();

    expect(page.body.querySelector('.rateplan-details').textContent).toContain('Standard BB');
    expect(page.body.querySelector('.rateplan-details-unit').textContent).toBe('101');
  });

  it('flags a non-refundable current rate plan', async () => {
    const [room] = booking.rooms;
    const page = await renderForm({ ...booking, rooms: [{ ...room, rateplan: { ...room.rateplan, is_non_refundable: true } }] } as Booking);

    expect(page.body.querySelector('.rateplan-details').textContent).toContain('Non-refundable');
  });

  it('lists only bookable room types', async () => {
    const page = await renderForm();

    expect(listedRoomTypes(page)).toEqual(['Suite', 'Deluxe']);
  });

  it('lists each fully available unit once', async () => {
    const page = await renderForm();

    expect(listedUnits(page)).toEqual(['201', '202', '301']);
  });

  it('shows the empty state when nothing is available', async () => {
    respondWith({ checkAvailability: () => Promise.resolve({ data: { ExceptionMsg: '', My_Result: [] } }) });
    const page = await renderForm();

    expect(page.body.querySelector('ir-empty-state')).not.toBeNull();
    expect(page.body.querySelector('wa-radio-group')).toBeNull();
  });
});
