import { newE2EPage } from '@stencil/core/testing';

describe('ir-queue-chart', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-queue-chart></ir-queue-chart>');

    const element = await page.find('ir-queue-chart');
    expect(element).toHaveClass('hydrated');
  });
});
