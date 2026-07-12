import { newSpecPage } from '@stencil/core/testing';
import { IrDpReportSummary } from '../ir-dp-report-summary';

describe('ir-dp-report-summary', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IrDpReportSummary],
      html: `<ir-dp-report-summary></ir-dp-report-summary>`,
    });
    expect(page.root).toEqualHtml(`
      <ir-dp-report-summary>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </ir-dp-report-summary>
    `);
  });
});
