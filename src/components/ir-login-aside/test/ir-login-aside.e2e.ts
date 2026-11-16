import { newE2EPage } from '@stencil/core/testing';

describe('ir-login-aside', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-login-aside></ir-login-aside>');

    const element = await page.find('ir-login-aside');
    expect(element).toHaveClass('hydrated');
  });
});
