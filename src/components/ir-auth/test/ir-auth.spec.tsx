import { newSpecPage } from '@stencil/core/testing';

// The real services pull in axios (ESM), which this jest setup can't parse.
const mockAuthService = {
  isAuthenticated: jest.fn(),
  getStartupDataSignature: jest.fn(),
  getStartupData: jest.fn(),
  forgotPassword: jest.fn(),
  forgotUsername: jest.fn(),
};
jest.mock('../../../services/auth/legacy-auth.service', () => ({ LegacyAuthService: jest.fn(() => mockAuthService) }));
jest.mock('../../../services/locale/locale.controller', () => ({
  LocaleController: { load: jest.fn(() => Promise.resolve()), subscribe: jest.fn(() => () => undefined), language: 'en' },
}));
jest.mock('../../../utils/utils', () => ({ showToast: jest.fn() }));
import { IrAuth } from '../ir-auth';
import { IrValidator } from '../../ui/ir-validator/ir-validator';
import { LocaleController } from '../../../services/locale/locale.controller';
import { LegacyAuthService } from '../../../services/auth/legacy-auth.service';
import { InterceptorError } from '../../ir-interceptor/InterceptorError';
import { showToast } from '../../../utils/utils';

/** Mounts ir-auth the way Default.aspx does: inside the server form, next to the redirect button. */
async function render(attributes = '', { beforeMount }: { beforeMount?: (win: Window) => void } = {}) {
  const page = await newSpecPage({ components: [IrAuth, IrValidator], html: '' });
  beforeMount?.(page.win as unknown as Window);
  await page.setContent(`<form id="frm_login"><ir-auth ${attributes}></ir-auth><input type="submit" id="btn_RedirectFromLogin" name="btn_RedirectFromLogin" value="ddd" /></form>`);
  const form = page.body.querySelector('#frm_login') as HTMLFormElement;
  const auth = page.body.querySelector('ir-auth') as HTMLElement;
  return { page, form, auth };
}

type Rendered = Awaited<ReturnType<typeof render>>;

/** What a user typing into a field produces: ir-input's `text-change`. */
async function type({ page, auth }: Rendered, id: string, value: string) {
  auth.querySelector(`#${id}`).dispatchEvent(new CustomEvent('text-change', { detail: value, bubbles: true }));
  await page.waitForChanges();
}

/** Submits the server form (what the buttons and Enter do) and reports whether ir-auth blocked the post. */
async function submit({ page, form }: Rendered) {
  const event = new Event('submit', { cancelable: true });
  form.dispatchEvent(event);
  await page.waitForChanges();
  return event.defaultPrevented;
}

const flush = () => new Promise(resolve => setTimeout(resolve));

/** Messages the field validators show, after their 300ms debounce has run. */
async function validationMessages({ page, auth }: Rendered) {
  await new Promise(resolve => setTimeout(resolve, 350));
  await page.waitForChanges();
  return Array.from(auth.querySelectorAll('ir-validator')).map(el => el.shadowRoot.querySelector('.error-message')?.textContent ?? null);
}

/** ir-input is not registered here, so its `value` lands as a property or an attribute. */
const fieldValue = (el: Element) => (el as HTMLInputElement).value ?? el.getAttribute('value');

describe('ir-auth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('loads the login strings for the given language', async () => {
    await render('language="ar"');
    expect(LocaleController.load).toHaveBeenCalledWith({ language: 'ar', tables: ['_AUTH'] });
  });

  it('talks to the WCF service next to the page unless api-url says otherwise', async () => {
    await render();
    expect(LegacyAuthService).toHaveBeenLastCalledWith('AppWCF.svc/');
    await render('api-url="https://example.test/IR_Resp/AppWCF.svc/"');
    expect(LegacyAuthService).toHaveBeenLastCalledWith('https://example.test/IR_Resp/AppWCF.svc/');
  });

  it('renders no form of its own: the fields belong to the server form, under their legacy ids and names', async () => {
    const { auth, form } = await render();
    expect(auth.querySelector('form')).toBeNull();
    const username = auth.querySelector('#txt_username');
    expect(username.closest('form')).toBe(form);
    expect(username.getAttribute('name')).toBe('txt_username');
    expect(auth.querySelector('input[type="hidden"]')).toBeNull();
  });

  it('renders the languages passed as JSON and emits authLanguageChange', async () => {
    const { auth } = await render(`language="fr" languages='[{"code":"en","label":"English"},{"code":"fr","label":"Français"}]'`);
    const items = auth.querySelectorAll('wa-dropdown-item');
    expect(Array.from(items).map(item => item.getAttribute('value'))).toEqual(['en', 'fr']);
    expect(auth.querySelector('wa-button[slot="trigger"]').textContent.trim()).toBe('Français');

    const spy = jest.fn();
    auth.addEventListener('authLanguageChange', spy);
    auth.querySelector('wa-dropdown').dispatchEvent(new CustomEvent('wa-select', { detail: { item: { value: 'en' } } }));
    expect(spy.mock.calls[0][0].detail).toEqual({ code: 'en' });
  });

  it('blocks the server post on an empty login and shows the required messages', async () => {
    const rendered = await render();
    expect(await submit(rendered)).toBe(true);
    expect(await validationMessages(rendered)).toEqual(['Please enter your username', 'Please enter your password']);
    expect(rendered.auth.querySelector('#txt_username').getAttribute('aria-invalid')).toBe('true');
    expect(mockAuthService.isAuthenticated).not.toHaveBeenCalled();
  });

  it('prefills the remembered username', async () => {
    const { auth } = await render('', { beforeMount: win => win.localStorage.setItem('USERNAME', 'jdoe') });
    expect(fieldValue(auth.querySelector('#txt_username'))).toBe('jdoe');
  });

  it('runs the login chain and emits authFinish', async () => {
    mockAuthService.isAuthenticated.mockResolvedValue({ Ticket: 't', OwnerID: 7, IsRequireOTP: true });
    mockAuthService.getStartupDataSignature.mockResolvedValue('sig');
    mockAuthService.getStartupData.mockResolvedValue({ My_Languages: ['en'] });
    const rendered = await render();
    const otpUrl = rendered.page.win.location.href;
    // A host that cancels authFinish takes over navigation.
    const spy = jest.fn((e: CustomEvent) => e.preventDefault());
    rendered.auth.addEventListener('authFinish', spy);
    await type(rendered, 'txt_username', 'jdoe');
    await type(rendered, 'txt_password', 'secret');
    expect(await submit(rendered)).toBe(true);
    await flush();

    expect(mockAuthService.isAuthenticated).toHaveBeenCalledWith({ username: 'jdoe', password: 'secret' });
    // Calls after IsAuthenticated_JSON carry the ticket it returned (`?Ticket=` in the service).
    expect(mockAuthService.getStartupDataSignature).toHaveBeenCalledWith(7, 't');
    expect(mockAuthService.getStartupData).toHaveBeenCalledWith(7, 'EN', 't');
    expect(localStorage.getItem('USERNAME')).toBe('jdoe');
    expect(localStorage.getItem('_Startup_Data_Signature_b')).toBe('sig');
    expect(localStorage.getItem('Languages_b')).toBe('["en"]');
    expect(spy.mock.calls[0][0].detail.requiresOtp).toBe(true);
    expect(rendered.page.win.location.href).toBe(otpUrl);
  });

  it('skips Get_Startup_Data when the numeric signature matches the stored one', async () => {
    mockAuthService.isAuthenticated.mockResolvedValue({ Ticket: 't', OwnerID: 7, IsRequireOTP: false });
    mockAuthService.getStartupDataSignature.mockResolvedValue(42);
    localStorage.setItem('_Startup_Data_Signature_b', '42');
    const rendered = await render('', { beforeMount: win => win.localStorage.setItem('_Startup_Data_Signature_b', '42') });
    rendered.auth.addEventListener('authFinish', (e: CustomEvent) => e.preventDefault());
    await type(rendered, 'txt_username', 'jdoe');
    await type(rendered, 'txt_password', 'secret');
    await submit(rendered);
    await flush();

    expect(mockAuthService.getStartupDataSignature).toHaveBeenCalled();
    expect(mockAuthService.getStartupData).not.toHaveBeenCalled();
  });

  it('completes the login with the btn_RedirectFromLogin postback, letting that submit through', async () => {
    mockAuthService.isAuthenticated.mockResolvedValue({ Ticket: 't', OwnerID: 7, IsRequireOTP: false });
    mockAuthService.getStartupDataSignature.mockResolvedValue('sig');
    mockAuthService.getStartupData.mockResolvedValue({});
    const rendered = await render();
    const { form, auth } = rendered;
    // A submit button's click submits its form; report whether ir-auth let that submit through.
    const postback = jest.fn(() => {
      const event = new Event('submit', { cancelable: true });
      form.dispatchEvent(event);
      return { blocked: event.defaultPrevented, username: fieldValue(auth.querySelector('#txt_username')) };
    });
    form.querySelector('#btn_RedirectFromLogin').addEventListener('click', postback);

    await type(rendered, 'txt_username', 'jdoe');
    await type(rendered, 'txt_password', 'secret');
    expect(await submit(rendered)).toBe(true);
    await flush();

    expect(postback).toHaveBeenCalledTimes(1);
    // Posted as-is by the field itself (form-associated ir-input named txt_username).
    expect(postback.mock.results[0].value).toEqual({ blocked: false, username: 'jdoe' });

    // While the postback navigates, another submit does not sign in again.
    await submit(rendered);
    await flush();
    expect(mockAuthService.isAuthenticated).toHaveBeenCalledTimes(1);
  });

  describe('failed sign-in', () => {
    /** Signs in with a login call that rejects with `error`. */
    async function failSignIn(error: unknown) {
      mockAuthService.isAuthenticated.mockRejectedValue(error);
      const rendered = await render();
      await type(rendered, 'txt_username', 'jdoe');
      await type(rendered, 'txt_password', 'wrong');
      await submit(rendered);
      await flush();
      await rendered.page.waitForChanges();
      return rendered;
    }

    beforeEach(() => jest.spyOn(console, 'error').mockImplementation(() => undefined));
    afterEach(() => (console.error as jest.Mock).mockRestore());

    // ir-auth renders an ir-interceptor, which toasts every failed axios request itself.
    it.each([
      ['an API ExceptionMsg (InterceptorError)', new InterceptorError('Invalid username or password', 'ERR')],
      ['an HTTP or network failure (AxiosError)', Object.assign(new Error('Request failed with status code 404'), { isAxiosError: true })],
    ])('leaves %s to the interceptor instead of toasting it a second time', async (_, error) => {
      await failSignIn(error);
      expect(mockAuthService.isAuthenticated).toHaveBeenCalledTimes(1);
      expect(showToast).not.toHaveBeenCalled();
    });

    it('toasts an error that did not go through the interceptor, once', async () => {
      await failSignIn(new Error('Unexpected failure'));
      expect(showToast).toHaveBeenCalledTimes(1);
      expect(showToast).toHaveBeenCalledWith(expect.objectContaining({ type: 'error', title: 'Unexpected failure' }));
    });

    it('re-enables the submit button so the user can try again', async () => {
      let reject: (error: unknown) => void;
      mockAuthService.isAuthenticated.mockReturnValue(new Promise((_, r) => (reject = r)));
      const rendered = await render();
      const button = () => rendered.auth.querySelector('.pms-auth__submit');
      await type(rendered, 'txt_username', 'jdoe');
      await type(rendered, 'txt_password', 'wrong');
      await submit(rendered);
      expect(button().hasAttribute('loading')).toBe(true);

      reject(new InterceptorError('Invalid username or password', 'ERR'));
      await flush();
      await rendered.page.waitForChanges();
      expect(button().hasAttribute('loading')).toBe(false);
    });
  });

  it('switches to the forgot username view and validates the email', async () => {
    const rendered = await render();
    (rendered.auth.querySelector('#Lnk_ForgotUsername') as HTMLAnchorElement).click();
    await rendered.page.waitForChanges();
    expect(rendered.auth.querySelector('.pms-auth__title').textContent).toBe('Get your username');

    await type(rendered, 'txt_email', 'not-an-email');
    expect(await submit(rendered)).toBe(true);
    expect(await validationMessages(rendered)).toEqual(['Please enter a valid email']);
    expect(mockAuthService.forgotUsername).not.toHaveBeenCalled();
  });
});
