import { newSpecPage } from '@stencil/core/testing';
import { IglRateExtenderForm } from '../igl-rate-extender-form';

describe('igl-rate-extender-form', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IglRateExtenderForm],
      html: `<igl-rate-extender-form></igl-rate-extender-form>`,
    });
    expect(page.root).toEqualHtml(`
      <igl-rate-extender-form>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </igl-rate-extender-form>
    `);
  });
});
