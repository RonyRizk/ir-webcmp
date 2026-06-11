import { newSpecPage } from '@stencil/core/testing';
import { IrColumnAutocomplete } from '../ir-column-autocomplete';

describe('ir-column-autocomplete', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IrColumnAutocomplete],
      html: `<ir-column-autocomplete options='["Alpha","Beta"]'></ir-column-autocomplete>`,
    });
    expect(page.root).toHaveClass('hydrated');
    expect(page.root.shadowRoot.querySelector('wa-popover')).toBeTruthy();
    expect(page.root.shadowRoot.querySelector('wa-input')).toBeTruthy();
  });
});
