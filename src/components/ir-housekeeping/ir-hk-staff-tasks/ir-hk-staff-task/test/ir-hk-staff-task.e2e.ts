import { newE2EPage } from '@stencil/core/testing';

describe('ir-hk-staff-task', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-hk-staff-task></ir-hk-staff-task>');

    const element = await page.find('ir-hk-staff-task');
    expect(element).toHaveClass('hydrated');
  });
});
