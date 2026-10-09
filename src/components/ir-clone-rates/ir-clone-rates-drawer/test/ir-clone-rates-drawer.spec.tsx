import { newSpecPage } from '@stencil/core/testing';
import { h } from '@stencil/core';
import { IrCloneRatesDrawer } from '../ir-clone-rates-drawer';

describe('ir-clone-rates-drawer', () => {
  it('renders Cancel and a Review button that submits the clone rates form', async () => {
    const page = await newSpecPage({
      components: [IrCloneRatesDrawer],
      template: () => <ir-clone-rates-drawer></ir-clone-rates-drawer>,
    });
    const buttons = Array.from(page.root.querySelectorAll('[slot="footer"] ir-custom-button'));
    expect(buttons.map(b => b.textContent.trim())).toEqual(['Cancel', 'Review']);
    expect(buttons[0].getAttribute('data-drawer')).toBe('close');
    expect(buttons[1].getAttribute('form')).toBe('clone-rates-form');
  });

  it('mounts the form only while open', async () => {
    const page = await newSpecPage({
      components: [IrCloneRatesDrawer],
      template: () => <ir-clone-rates-drawer></ir-clone-rates-drawer>,
    });
    expect(page.root.querySelector('ir-clone-rates')).toBeNull();

    page.root.open = true;
    await page.waitForChanges();
    expect(page.root.querySelector('ir-clone-rates').getAttribute('mode')).toBe('drawer');
  });

  it('emits cloneRatesDrawerClosed when the drawer hides', async () => {
    const page = await newSpecPage({
      components: [IrCloneRatesDrawer],
      template: () => <ir-clone-rates-drawer open></ir-clone-rates-drawer>,
    });
    const closed = jest.fn();
    page.root.addEventListener('cloneRatesDrawerClosed', closed);

    page.root.querySelector('ir-drawer').dispatchEvent(new CustomEvent('drawerHide', { detail: { source: page.root } }));
    expect(closed).toHaveBeenCalledTimes(1);

    page.root.querySelector('ir-clone-rates').dispatchEvent(new CustomEvent('ratesCloned'));
    expect(closed).toHaveBeenCalledTimes(2);
  });
});
