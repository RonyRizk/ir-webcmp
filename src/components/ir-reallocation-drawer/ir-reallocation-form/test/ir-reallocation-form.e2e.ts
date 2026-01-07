import { newE2EPage } from '@stencil/core/testing';

describe('ir-reallocation-form', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-reallocation-form></ir-reallocation-form>');

    const element = await page.find('ir-reallocation-form');
    expect(element).toHaveClass('hydrated');
  });
});
