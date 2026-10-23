import { newSpecPage } from '@stencil/core/testing';

// The real loaders pull in axios (ESM), which this jest setup can't parse.
jest.mock('../../dashboard.data', () => ({ loadArrivals: jest.fn(), loadDepartures: jest.fn() }));
import { IrDashboardArrivals } from '../ir-dashboard-arrivals';

describe('ir-dashboard-arrivals', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IrDashboardArrivals],
      html: `<ir-dashboard-arrivals></ir-dashboard-arrivals>`,
    });
    expect(page.root).toBeTruthy();
  });
});
