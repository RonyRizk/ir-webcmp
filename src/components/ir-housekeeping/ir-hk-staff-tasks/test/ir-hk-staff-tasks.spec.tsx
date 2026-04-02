import { newSpecPage } from '@stencil/core/testing';
import { IrHkStaffTasks } from '../ir-hk-staff-tasks';

describe('ir-hk-staff-tasks', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IrHkStaffTasks],
      html: `<ir-hk-staff-tasks></ir-hk-staff-tasks>`,
    });
    expect(page.root).toEqualHtml(`
      <ir-hk-staff-tasks>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </ir-hk-staff-tasks>
    `);
  });
});
