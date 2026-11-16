export {};

type Config = { method?: string; url?: string; data?: unknown; params?: unknown; headers?: Record<string, unknown> };

jest.mock('axios', () => ({
  __esModule: true,
  default: { defaults: {}, interceptors: { request: { use: jest.fn() } } },
}));

const mockedAxios = require('axios').default as { interceptors: { request: { use: jest.Mock } } };
const { locales } = require('../stores/locales.store') as typeof import('../stores/locales.store');
const { injectLanguage, installLanguageInjector } = require('./language-injector') as typeof import('./language-injector');
const { LocaleController } = require('../services/locale/locale.controller') as typeof import('../services/locale/locale.controller');

const send = (config: Config) => injectLanguage({ headers: {}, ...config } as any) as Config;

beforeEach(() => {
  locales.language = 'ar';
});

describe('installLanguageInjector', () => {
  it('is installed as soon as LocaleController loads, without an ApiClient or a ticket', () => {
    expect(mockedAxios.interceptors.request.use).toHaveBeenCalledTimes(1);
    expect(mockedAxios.interceptors.request.use).toHaveBeenCalledWith(injectLanguage);
  });

  it('registers once however often it is called — ir-interceptor calls it again on every mount', () => {
    installLanguageInjector(() => 'xx');
    installLanguageInjector(() => 'yy');
    expect(mockedAxios.interceptors.request.use).toHaveBeenCalledTimes(1);
    expect(send({ method: 'post', url: '/a' }).data).toEqual({ language: LocaleController.language });
  });
});

describe('injectLanguage', () => {
  it('gives a body-less POST the selected language', () => {
    expect(send({ method: 'post', url: '/Get_Exposed_Payment_Methods' }).data).toEqual({ language: 'ar' });
  });

  it('adds the language to a payload that has none', () => {
    expect(send({ method: 'post', url: '/Get_Exposed_Booking', data: { booking_nbr: '123' } }).data).toEqual({ booking_nbr: '123', language: 'ar' });
  });

  it('covers every body-carrying method', () => {
    ['put', 'patch', 'delete'].forEach(method => expect(send({ method, url: '/a' }).data).toEqual({ language: 'ar' }));
  });

  it('keeps an explicit language', () => {
    expect(send({ method: 'post', url: '/a', data: { language: 'fr' } }).data).toEqual({ language: 'fr' });
  });

  it('fills an empty or null language', () => {
    expect(send({ method: 'post', url: '/a', data: { language: '' } }).data).toEqual({ language: 'ar' });
    expect(send({ method: 'post', url: '/b', data: { language: null } }).data).toEqual({ language: 'ar' });
  });

  it('fills `lang` instead of adding a second key', () => {
    expect(send({ method: 'post', url: '/Print_Cl_Statement', data: { agency_id: '1', lang: '' } }).data).toEqual({ agency_id: '1', lang: 'ar' });
  });

  it('does not mutate the caller’s params', () => {
    const params = { booking_nbr: '123' };
    send({ method: 'post', url: '/a', data: params });
    expect(params).toEqual({ booking_nbr: '123' });
  });

  it('fills a pre-serialized JSON body and keeps it a string', () => {
    expect(send({ method: 'post', url: '/a', data: '{"x":1}' }).data).toBe('{"x":1,"language":"ar"}');
    expect(send({ method: 'post', url: '/b', data: '{"language":"fr"}' }).data).toBe('{"language":"fr"}');
    expect(send({ method: 'post', url: '/c', data: 'not json' }).data).toBe('not json');
  });

  it('appends to a URLSearchParams body', () => {
    const body = new URLSearchParams({ x: '1' });
    send({ method: 'post', url: '/a', data: body });
    expect(body.get('language')).toBe('ar');
  });

  it('puts the language in the query string of a GET', () => {
    const get = send({ method: 'get', url: '/a' });
    expect(get.params).toEqual({ language: 'ar' });
    expect(get.data).toBeUndefined();
    expect(send({ method: 'get', url: '/b', params: { id: 1, language: 'fr' } }).params).toEqual({ id: 1, language: 'fr' });
  });

  it('reads the language per request, so it follows a switch', () => {
    expect(send({ method: 'post', url: '/a', data: {} }).data).toEqual({ language: 'ar' });
    locales.language = 'fr';
    expect(send({ method: 'post', url: '/b', data: {} }).data).toEqual({ language: 'fr' });
  });
});
