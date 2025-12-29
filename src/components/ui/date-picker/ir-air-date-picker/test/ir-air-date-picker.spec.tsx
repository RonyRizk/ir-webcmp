import { newSpecPage } from '@stencil/core/testing';
import { IrAirDatePicker } from '../ir-air-date-picker';

describe('ir-air-date-picker', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IrAirDatePicker],
      html: `<ir-air-date-picker></ir-air-date-picker>`,
    });
    expect(page.root).toEqualHtml(`
      <ir-air-date-picker>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </ir-air-date-picker>
    `);
  });
});
