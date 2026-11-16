import { newSpecPage } from '@stencil/core/testing';
import { IrLoginAside } from '../ir-login-aside';

describe('ir-login-aside', () => {
  it('renders the image view', async () => {
    const page = await newSpecPage({
      components: [IrLoginAside],
      html: `<ir-login-aside view="image" image-src="/login.jpg"></ir-login-aside>`,
    });
    expect(page.root.querySelector('ir-login-aside-image')).not.toBeNull();
    expect(page.root.querySelector('ir-login-aside-calendar')).toBeNull();
  });

  it('renders the calendar view by default', async () => {
    const page = await newSpecPage({
      components: [IrLoginAside],
      html: `<ir-login-aside></ir-login-aside>`,
    });
    expect(page.root.querySelector('ir-login-aside-calendar')).not.toBeNull();
    expect(page.root.querySelector('ir-login-aside-image')).toBeNull();
  });

  it('renders the dynamic pricing view on request', async () => {
    const page = await newSpecPage({
      components: [IrLoginAside],
      html: `<ir-login-aside view="dynamic-pricing"></ir-login-aside>`,
    });
    expect(page.root.querySelector('ir-login-aside-dynamic-pricing')).not.toBeNull();
    expect(page.root.querySelector('ir-login-aside-calendar')).toBeNull();
  });

  it('renders the showcase view on request', async () => {
    const page = await newSpecPage({
      components: [IrLoginAside],
      html: `<ir-login-aside view="showcase"></ir-login-aside>`,
    });
    expect(page.root.querySelector('ir-login-aside-showcase')).not.toBeNull();
    expect(page.root.querySelector('ir-login-aside-calendar')).toBeNull();
  });
});
