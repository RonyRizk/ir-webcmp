import { newSpecPage } from '@stencil/core/testing';
import { IrGapNights } from '../ir-gap-nights';

describe('ir-gap-nights', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IrGapNights],
      html: `<ir-gap-nights></ir-gap-nights>`,
    });
    expect(page.root).toEqualHtml(`
      <ir-gap-nights>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </ir-gap-nights>
    `);
  });
});
