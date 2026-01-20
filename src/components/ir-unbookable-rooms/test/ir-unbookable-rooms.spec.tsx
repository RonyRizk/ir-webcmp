import { newSpecPage } from '@stencil/core/testing';
import { IrUnbookableRooms } from '../ir-unbookable-rooms';

describe('ir-unbookable-rooms', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IrUnbookableRooms],
      html: `<ir-unbookable-rooms></ir-unbookable-rooms>`,
    });
    const title = page.root.shadowRoot.querySelector('.hero__title');
    expect(title?.textContent).toBe('Unbookable periods detected');
  });
});
