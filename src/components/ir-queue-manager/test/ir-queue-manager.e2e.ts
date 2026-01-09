import { newE2EPage } from '@stencil/core/testing';

describe('ir-queue-manager', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-queue-manager></ir-queue-manager>');

    const element = await page.find('ir-queue-manager');
    expect(element).toHaveClass('hydrated');
  });
});
