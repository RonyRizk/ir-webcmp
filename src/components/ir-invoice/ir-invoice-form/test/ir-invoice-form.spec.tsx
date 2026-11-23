import { newSpecPage, SpecPage } from '@stencil/core/testing';
import { h } from '@stencil/core';

// The real services pull in axios (ESM), which this jest setup can't parse.
jest.mock('axios', () => {
  const axios = { post: jest.fn(), interceptors: { request: { use: jest.fn() } } };
  return { __esModule: true, default: axios, ...axios };
});

const mockGetExposedBooking = jest.fn();
const mockGetBookingInvoiceInfo = jest.fn();
const mockIssueInvoice = jest.fn();
jest.mock('../../../../services/booking-service/booking.service', () => ({
  BookingService: jest.fn().mockImplementation(() => ({
    getExposedBooking: mockGetExposedBooking,
    getBookingInvoiceInfo: mockGetBookingInvoiceInfo,
    issueInvoice: mockIssueInvoice,
  })),
}));

jest.mock('../../../../services/setup', () => ({
  ...jest.requireActual('../../../../services/setup'),
  SetupService: jest.fn().mockImplementation(() => ({
    getSetupEntriesByTableName: jest.fn(async (table: string) =>
      table === '_INVOICE_TARGET'
        ? [
            { CODE_NAME: '001', CODE_VALUE_EN: 'Guest' },
            { CODE_NAME: '002', CODE_VALUE_EN: 'Company' },
          ]
        : [],
    ),
  })),
}));

import calendar_data from '@/stores/calendar-data';
import { Booking } from '@/models/booking.dto';
import { BookingInvoiceInfo, InvoiceableItem } from '../../types';
import { IrInvoiceForm } from '../ir-invoice-form';

const USD = { code: 'USD', id: 4, symbol: 'US$' };

const payment = (system_id: number, code: string, operation: 'CR' | 'DB', amount: number) => ({
  system_id,
  id: system_id,
  date: '2026-11-13',
  amount,
  currency: USD,
  designation: '',
  reference: '',
  payment_type: { code, description: '', operation },
});

/** Shaped like `Get_Booking_Invoice_Info` for booking 25783626000: payment items come back with `system_id: null`. */
const paymentItem = (key: number, amount: number, overrides: Partial<InvoiceableItem> = {}): InvoiceableItem => ({
  amount,
  booking_nbr: '25783626000',
  currency: USD,
  invoice_nbr: null,
  is_invoiceable: true,
  key,
  reason: null,
  status: null,
  system_id: null,
  type: 'PAYMENT',
  ...overrides,
});

const makeBooking = (payments: ReturnType<typeof payment>[]) =>
  ({
    booking_nbr: '25783626000',
    from_date: '2026-11-10',
    to_date: '2026-11-13',
    currency: USD,
    guest: { id: 1 },
    rooms: [],
    extra_services: [],
    pickup_info: null,
    financial: { payments },
  }) as unknown as Booking;

async function renderForm({ booking, invoiceInfo }: { booking: Booking; invoiceInfo: BookingInvoiceInfo }): Promise<SpecPage> {
  mockGetExposedBooking.mockResolvedValue(booking);
  mockGetBookingInvoiceInfo.mockResolvedValue(invoiceInfo);
  const page = await newSpecPage({
    components: [IrInvoiceForm],
    template: () => <ir-invoice-form formId="invoice-form" booking={booking}></ir-invoice-form>,
  });
  // init() is fire-and-forget from componentWillLoad; let its awaits settle.
  for (let i = 0; i < 5; i++) {
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  await page.waitForChanges();
  return page;
}

const rowLabelled = (page: SpecPage, label: string) =>
  Array.from(page.root.querySelectorAll('.ir-invoice__service')).find(row => row.querySelector('.ir-invoice__room-info')?.textContent.includes(label));

// wa-checkbox isn't registered in the spec, so Stencil reflects `checked`/`disabled` as attributes.
const isChecked = (row: Element) => row.querySelector('wa-checkbox').hasAttribute('checked');

/**
 * The form binds `onchange` (lowercase), which mock-doc's MockElement already declares, so Stencil
 * assigns it as the `onchange` property — and mock-doc's dispatchEvent only runs addEventListener
 * listeners, never on* properties. A browser runs both, so invoke the property the way it would.
 */
const setChecked = async (page: SpecPage, row: Element, checked: boolean) => {
  const checkbox = row.querySelector('wa-checkbox') as any;
  checkbox.checked = checked;
  const event = new (page.win as any).Event('change');
  Object.defineProperty(event, 'target', { value: checkbox });
  checkbox.onchange(event);
  await page.waitForChanges();
};

describe('ir-invoice-form', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    calendar_data.property = { id: 42 } as any;
  });

  it('shows an invoiceable discount as a selectable row with a negative amount', async () => {
    const page = await renderForm({
      booking: makeBooking([payment(54929, '009', 'CR', 100)]),
      invoiceInfo: { invoiceable_items: [paymentItem(54929, 100)], invoices: [] },
    });

    const row = rowLabelled(page, 'Discount');
    expect(row).toBeDefined();
    expect(row.querySelector('.ir-invoice__checkbox-price').textContent).toBe('- US$ 100.00');
    expect(isChecked(row)).toBe(true);
  });

  it('shows an invoiceable cancellation adjustment as a selectable row, keeping a debit positive', async () => {
    const page = await renderForm({
      booking: makeBooking([payment(61000, '012', 'DB', 25)]),
      invoiceInfo: { invoiceable_items: [paymentItem(61000, 25)], invoices: [] },
    });

    const row = rowLabelled(page, 'Cancellation adjustment');
    expect(row).toBeDefined();
    expect(row.querySelector('.ir-invoice__checkbox-price').textContent).toBe('US$ 25.00');
    expect(isChecked(row)).toBe(true);
  });

  describe('issuing the invoice', () => {
    const booking = makeBooking([payment(54929, '009', 'CR', 100), payment(61000, '012', 'DB', 25)]);
    const invoiceInfo = { invoiceable_items: [paymentItem(54929, 100), paymentItem(61000, 25)], invoices: [] };

    const submit = async (page: SpecPage) => {
      mockGetBookingInvoiceInfo.mockResolvedValue({ ...invoiceInfo, invoices: [{ nbr: 'INNO-121', credit_note: null }] });
      page.root.querySelector('form').dispatchEvent(new (page.win as any).Event('submit'));
      for (let i = 0; i < 5; i++) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    };
    const issuedKeys = () => mockIssueInvoice.mock.calls[0][0].invoice.items.map((item: InvoiceableItem) => item.key);

    it('sends the ticked discount and cancellation adjustment', async () => {
      const page = await renderForm({ booking, invoiceInfo });

      await submit(page);

      expect(issuedKeys()).toEqual([54929, 61000]);
    });

    it('leaves out a discount the user unticked', async () => {
      const page = await renderForm({ booking, invoiceInfo });
      await setChecked(page, rowLabelled(page, 'Discount'), false);

      await submit(page);

      expect(issuedKeys()).toEqual([61000]);
    });

    it('never sends an invoiceable item the form has no row for', async () => {
      const page = await renderForm({
        booking: makeBooking([payment(54929, '009', 'CR', 100)]),
        // 70000 matches nothing on the booking, so the user can't see or untick it.
        invoiceInfo: { invoiceable_items: [paymentItem(54929, 100), paymentItem(70000, 40)], invoices: [] },
      });

      await submit(page);

      expect(issuedKeys()).toEqual([54929]);
    });
  });
});
