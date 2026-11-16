import { newE2EPage } from '@stencil/core/testing';

/** Mounted as in Default.aspx: ir-auth inside the server form, next to the redirect button. */
const SERVER_FORM = `
  <form id="frm_login">
    <ir-auth></ir-auth>
    <input type="submit" id="btn_RedirectFromLogin" name="btn_RedirectFromLogin" value="ddd" style="display: none" />
  </form>`;

/** What the browser would post for `frm_login` — what `Request.Form` sees on the server. */
const postedUsername = () => new FormData(document.querySelector<HTMLFormElement>('#frm_login')).get('txt_username');

describe('ir-auth', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<form><ir-auth></ir-auth></form>');

    const element = await page.find('ir-auth');
    expect(element).toHaveClass('hydrated');
  });

  it('posts what is typed into #txt_username as Request.Form["txt_username"]', async () => {
    const page = await newE2EPage();
    await page.setContent(SERVER_FORM);

    const input = await page.find('#txt_username >>> input');
    await input.type('jdoe');
    await page.waitForChanges();

    expect(await page.evaluate(postedUsername)).toBe('jdoe');
  });

  it('posts a username set without typing (remembered or auto-filled)', async () => {
    const page = await newE2EPage();
    await page.setContent(SERVER_FORM);

    await page.$eval('#txt_username', (el: HTMLIrInputElement) => (el.value = 'remembered'));
    await page.waitForChanges();

    expect(await page.evaluate(postedUsername)).toBe('remembered');
  });
});
