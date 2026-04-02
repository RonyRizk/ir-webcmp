import { newSpecPage } from '@stencil/core/testing';
import { IrHkStaffTasksHeader } from '../ir-hk-staff-tasks-header';

describe('ir-hk-staff-tasks-header', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IrHkStaffTasksHeader],
      html: `<ir-hk-staff-tasks-header></ir-hk-staff-tasks-header>`,
    });
    expect(page.root).toEqualHtml(`
      <ir-hk-staff-tasks-header>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </ir-hk-staff-tasks-header>
    `);
  });
});
