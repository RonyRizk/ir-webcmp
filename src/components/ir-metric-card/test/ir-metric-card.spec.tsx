import { newSpecPage } from '@stencil/core/testing';
import { IrMetricCard } from '../ir-metric-card';

describe('ir-metric-card', () => {
  it('renders the label, value and unit', async () => {
    const page = await newSpecPage({
      components: [IrMetricCard],
      html: `<ir-metric-card label="Breakfast" value="124" unit="guests"></ir-metric-card>`,
    });
    const text = page.root.shadowRoot.textContent;
    expect(text).toContain('Breakfast');
    expect(text).toContain('124');
    expect(text).toContain('guests');
  });

  it('renders a positive trend indicator', async () => {
    const page = await newSpecPage({
      components: [IrMetricCard],
      html: `<ir-metric-card value="100" trend="12.5"></ir-metric-card>`,
    });
    const trend = page.root.shadowRoot.querySelector('[part="trend"]');
    expect(trend).not.toBeNull();
    expect(trend.classList.contains('metric__trend--positive')).toBe(true);
    expect(trend.textContent).toContain('12.5%');
  });

  it('emits metricClick when clickable and activated', async () => {
    const page = await newSpecPage({
      components: [IrMetricCard],
      html: `<ir-metric-card label="KPI" clickable></ir-metric-card>`,
    });
    const handler = jest.fn();
    page.root.addEventListener('metricClick', handler);
    page.root.click();
    await page.waitForChanges();
    expect(handler).toHaveBeenCalledTimes(1);
    expect(page.root.getAttribute('role')).toBe('button');
  });

  it('shows skeletons while loading', async () => {
    const page = await newSpecPage({
      components: [IrMetricCard],
      html: `<ir-metric-card value="100" loading></ir-metric-card>`,
    });
    expect(page.root.shadowRoot.querySelector('.metric__skeleton')).not.toBeNull();
    expect(page.root.getAttribute('aria-busy')).toBe('true');
  });
});
