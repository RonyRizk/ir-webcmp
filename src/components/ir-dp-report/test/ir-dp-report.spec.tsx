import { newSpecPage } from '@stencil/core/testing';
import { IrDpReport } from '../ir-dp-report';

describe('ir-dp-report', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IrDpReport],
      html: `<ir-dp-report></ir-dp-report>`,
    });
    expect(page.root).toEqualHtml(`
      <ir-dp-report>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </ir-dp-report>
    `);
  });
});
