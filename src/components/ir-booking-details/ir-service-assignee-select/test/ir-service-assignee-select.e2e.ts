import { newE2EPage } from '@stencil/core/testing';

describe('ir-service-assignee-select', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-service-assignee-select></ir-service-assignee-select>');

    const element = await page.find('ir-service-assignee-select');
    expect(element).toHaveClass('hydrated');
  });
});
