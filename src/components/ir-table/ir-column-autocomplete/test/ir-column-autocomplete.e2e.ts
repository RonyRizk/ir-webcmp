import { newE2EPage } from '@stencil/core/testing';

describe('ir-column-autocomplete', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-column-autocomplete></ir-column-autocomplete>');

    const element = await page.find('ir-column-autocomplete');
    expect(element).toHaveClass('hydrated');
  });
});
