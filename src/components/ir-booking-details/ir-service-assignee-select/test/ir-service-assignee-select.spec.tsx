import { newSpecPage } from '@stencil/core/testing';
import { IrServiceAssigneeSelect } from '../ir-service-assignee-select';

describe('ir-service-assignee-select', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IrServiceAssigneeSelect],
      html: `<ir-service-assignee-select></ir-service-assignee-select>`,
    });
    expect(page.root).toEqualHtml(`
      <ir-service-assignee-select>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </ir-service-assignee-select>
    `);
  });
});
