import { newSpecPage } from '@stencil/core/testing';
import { IrDpReportChart } from '../ir-dp-report-chart';

describe('ir-dp-report-chart', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IrDpReportChart],
      html: `<ir-dp-report-chart></ir-dp-report-chart>`,
    });
    expect(page.root).toEqualHtml(`
      <ir-dp-report-chart>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </ir-dp-report-chart>
    `);
  });
});
