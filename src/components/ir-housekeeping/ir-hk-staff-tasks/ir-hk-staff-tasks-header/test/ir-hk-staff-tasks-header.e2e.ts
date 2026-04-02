import { newE2EPage } from '@stencil/core/testing';

describe('ir-hk-staff-tasks-header', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-hk-staff-tasks-header></ir-hk-staff-tasks-header>');

    const element = await page.find('ir-hk-staff-tasks-header');
    expect(element).toHaveClass('hydrated');
  });
});
