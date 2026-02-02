import { newSpecPage } from '@stencil/core/testing';
import { IrArrivalTimeDialog } from '../ir-arrival-time-dialog';

describe('ir-arrival-time-dialog', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IrArrivalTimeDialog],
      html: `<ir-arrival-time-dialog></ir-arrival-time-dialog>`,
    });
    expect(page.root).toEqualHtml(`
      <ir-arrival-time-dialog>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </ir-arrival-time-dialog>
    `);
  });
});
