import { h } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';
import { IrBookingNumberCell } from '../ir-booking-number-cell';
import { CalendarPreferenceController } from '@/utils/date';

const ORIGIN = { Icon: 'chan.png', Label: 'Booking.com' } as any;

/**
 * Rendered via `template` rather than `html` + prop assignment: `origin` is dereferenced during
 * the *first* render, so it has to be present before that render rather than set afterwards.
 */
async function renderCell(props: { bookingNumber: string; channelBookingNumber?: string }) {
  return newSpecPage({
    components: [IrBookingNumberCell],
    template: () => <ir-booking-number-cell origin={ORIGIN} {...props}></ir-booking-number-cell>,
  });
}

describe('ir-booking-number-cell', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IrBookingNumberCell],
      html: `<ir-booking-number-cell></ir-booking-number-cell>`,
    });
    expect(page.root).toEqualHtml(`
      <ir-booking-number-cell>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </ir-booking-number-cell>
    `);
  });
});

describe('ir-booking-number-cell — booking number display', () => {
  afterEach(() => CalendarPreferenceController.setNumberingSystem('latn'));

  it('keeps the leading zero of a booking number', async () => {
    const page = await renderCell({ bookingNumber: '0042' });
    expect(page.root.shadowRoot.querySelector('.booking-nbr-cell__button').textContent).toBe('0042');
  });

  it('renders the booking and channel numbers in the active digit script, zeros intact', async () => {
    CalendarPreferenceController.setNumberingSystem('arab');
    const page = await renderCell({ bookingNumber: '0042', channelBookingNumber: '007' });
    expect(page.root.shadowRoot.querySelector('.booking-nbr-cell__button').textContent).toBe('٠٠٤٢');
    expect(page.root.shadowRoot.querySelector('.booking-nbr-cell__channel_nbr').textContent).toBe('٠٠٧');
  });

  it('never groups a long booking number the way a quantity would be grouped', async () => {
    CalendarPreferenceController.setNumberingSystem('arab');
    const page = await renderCell({ bookingNumber: '100234' });
    expect(page.root.shadowRoot.querySelector('.booking-nbr-cell__button').textContent).toBe('١٠٠٢٣٤');
  });

  it('leaves the element id raw so it stays a valid identity/anchor', async () => {
    CalendarPreferenceController.setNumberingSystem('arab');
    const page = await renderCell({ bookingNumber: '0042' });
    expect(page.root.shadowRoot.querySelector('.booked-by-source__logo').getAttribute('id')).toBe('source-logo__0042');
  });

  it('falls back to the origin label when there is no channel number', async () => {
    const page = await renderCell({ bookingNumber: '0042' });
    expect(page.root.shadowRoot.querySelector('.booking-nbr-cell__channel_nbr').textContent).toBe('Booking.com');
  });
});
