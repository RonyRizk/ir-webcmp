import { newE2EPage } from '@stencil/core/testing';

describe('ir-hk-staff-tasks', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-hk-staff-tasks></ir-hk-staff-tasks>');

    const element = await page.find('ir-hk-staff-tasks');
    expect(element).toHaveClass('hydrated');
  });
});
