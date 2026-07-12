import { newSpecPage } from '@stencil/core/testing';
import { IrDpReportFilters } from '../ir-dp-report-filters';

describe('ir-dp-report-filters', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IrDpReportFilters],
      html: `<ir-dp-report-filters></ir-dp-report-filters>`,
    });
    expect(page.root).toEqualHtml(`
      <ir-dp-report-filters>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </ir-dp-report-filters>
    `);
  });
});
