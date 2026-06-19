import { newSpecPage } from '@stencil/core/testing';
import { IrHbPreferenceDialog } from '../ir-hb-preference-dialog';

describe('ir-hb-preference-dialog', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IrHbPreferenceDialog],
      html: `<ir-hb-preference-dialog></ir-hb-preference-dialog>`,
    });
    expect(page.root).toEqualHtml(`
      <ir-hb-preference-dialog>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </ir-hb-preference-dialog>
    `);
  });
});
