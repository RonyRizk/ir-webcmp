import { newSpecPage } from '@stencil/core/testing';
import { IrHkStaffTask } from '../ir-hk-staff-task';

describe('ir-hk-staff-task', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IrHkStaffTask],
      html: `<ir-hk-staff-task></ir-hk-staff-task>`,
    });
    expect(page.root).toEqualHtml(`
      <ir-hk-staff-task>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </ir-hk-staff-task>
    `);
  });
});
