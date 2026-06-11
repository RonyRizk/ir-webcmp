import { newSpecPage } from '@stencil/core/testing';
import moment from 'moment';
import { IrDateRangeFilter } from '../ir-date-range-filter';

describe('ir-date-range-filter', () => {
  it('clears both controlled dates without restoring stale state', async () => {
    const page = await newSpecPage({
      components: [IrDateRangeFilter],
      html: `<ir-date-range-filter from-date="2026-04-01" to-date="2026-04-10"></ir-date-range-filter>`,
    });
    const root = page.root as HTMLIrDateRangeFilterElement;
    const instance = page.rootInstance as IrDateRangeFilter;

    root.fromDate = undefined;
    root.toDate = undefined;
    await page.waitForChanges();

    expect(instance.dates.from).toBeNull();
    expect(instance.dates.to).toBeNull();

    const [fromButton, toButton] = Array.from(root.querySelectorAll('.drf-text-btn'));
    expect(fromButton.textContent.trim()).toBe('From');
    expect(toButton.textContent.trim()).toBe('To');
  });

  it('preserves the uncontrolled side when the other prop changes', async () => {
    const page = await newSpecPage({
      components: [IrDateRangeFilter],
      html: `<ir-date-range-filter from-date="2026-04-01"></ir-date-range-filter>`,
    });
    const root = page.root as HTMLIrDateRangeFilterElement;
    const instance = page.rootInstance as IrDateRangeFilter;

    (instance as any).selectDate(moment('2026-04-10', 'YYYY-MM-DD'), 'to');
    await page.waitForChanges();

    root.fromDate = '2026-04-03';
    await page.waitForChanges();

    expect(instance.dates.from?.format('YYYY-MM-DD')).toBe('2026-04-03');
    expect(instance.dates.to?.format('YYYY-MM-DD')).toBe('2026-04-10');
  });
});
