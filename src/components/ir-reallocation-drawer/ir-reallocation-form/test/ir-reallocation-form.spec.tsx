import { newSpecPage } from '@stencil/core/testing';
import { IrReallocationForm } from '../ir-reallocation-form';

describe('ir-reallocation-form', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IrReallocationForm],
      html: `<ir-reallocation-form></ir-reallocation-form>`,
    });
    expect(page.root).toEqualHtml(`
      <ir-reallocation-form>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </ir-reallocation-form>
    `);
  });
});
