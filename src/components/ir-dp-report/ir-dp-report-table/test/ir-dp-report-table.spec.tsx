import { newSpecPage } from '@stencil/core/testing';
import { IrDpReportTable } from '../ir-dp-report-table';

describe('ir-dp-report-table', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IrDpReportTable],
      html: `<ir-dp-report-table></ir-dp-report-table>`,
    });
    expect(page.root).toEqualHtml(`
      <ir-dp-report-table>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </ir-dp-report-table>
    `);
  });
});
