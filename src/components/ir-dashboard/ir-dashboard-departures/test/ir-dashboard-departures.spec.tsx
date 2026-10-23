import { newSpecPage } from '@stencil/core/testing';

// The real loaders pull in axios (ESM), which this jest setup can't parse.
jest.mock('../../dashboard.data', () => ({ loadArrivals: jest.fn(), loadDepartures: jest.fn() }));
jest.mock('../../../../utils/booking', () => ({ isEarlyCheckout: jest.fn() }));
import { IrDashboardDepartures } from '../ir-dashboard-departures';

describe('ir-dashboard-departures', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IrDashboardDepartures],
      html: `<ir-dashboard-departures></ir-dashboard-departures>`,
    });
    expect(page.root).toBeTruthy();
  });
});
