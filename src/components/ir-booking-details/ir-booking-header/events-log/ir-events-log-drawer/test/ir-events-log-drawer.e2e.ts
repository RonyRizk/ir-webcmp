import { newE2EPage } from '@stencil/core/testing';

describe('ir-events-log-drawer', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-events-log-drawer></ir-events-log-drawer>');

    const element = await page.find('ir-events-log-drawer');
    expect(element).toHaveClass('hydrated');
  });
});
