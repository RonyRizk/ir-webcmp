import type { AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';

// The real axios, so every interceptor runs in its real order on real AxiosHeaders. Jest can't load
// axios's ESM entry, hence its CJS build.
jest.mock('axios', () => jest.requireActual('axios/dist/node/axios.cjs'));

const axios = require('axios') as typeof import('axios').default;
const { AxiosHeaders } = axios;
const ApiClient = (require('./ApiClient') as typeof import('./ApiClient')).default;
const { installLanguageInjector } = require('./language-injector') as typeof import('./language-injector');

/** The selected app language, as LocaleController would report it. */
let appLanguage = 'ar';
installLanguageInjector(() => appLanguage);
new ApiClient();
new ApiClient();

/**
 * Sends a real request through every interceptor and returns the config that would reach the wire,
 * captured by an adapter instead of a network call.
 */
async function send(config: AxiosRequestConfig): Promise<InternalAxiosRequestConfig> {
  let sent: InternalAxiosRequestConfig | undefined;
  await axios.request({
    url: '/Get_Exposed_Booking',
    method: 'post',
    ...config,
    adapter: async c => {
      sent = c;
      return { data: {}, status: 200, statusText: 'OK', headers: {}, config: c };
    },
  });
  return sent!;
}

/** Every value sent under `name`, matched case-insensitively the way the wire treats header names. */
function headerValues(config: InternalAxiosRequestConfig, name: string): unknown[] {
  const headers = AxiosHeaders.from(config.headers).toJSON();
  return Object.entries(headers)
    .filter(([key]) => key.toLowerCase() === name.toLowerCase())
    .map(([, value]) => value);
}

beforeEach(() => {
  appLanguage = 'ar';
});

describe('Content-Language header', () => {
  it('carries the selected app language when the request names none', async () => {
    expect(headerValues(await send({}), 'Content-Language')).toEqual(['ar']);
  });

  it('carries the language a `lang` subtree puts in the body, not the app language', async () => {
    expect(headerValues(await send({ data: { booking_nbr: '1', language: 'el' } }), 'Content-Language')).toEqual(['el']);
  });

  it('carries the language a GET names in its query string', async () => {
    expect(headerValues(await send({ method: 'get', url: '/Get_Countries', params: { language: 'el' } }), 'Content-Language')).toEqual(['el']);
    const query = new URLSearchParams({ lang: 'fr' });
    expect(headerValues(await send({ method: 'get', url: '/Print', params: query }), 'Content-Language')).toEqual(['fr']);
  });

  it('follows a language switch on the next request', async () => {
    appLanguage = 'fr';
    expect(headerValues(await send({}), 'Content-Language')).toEqual(['fr']);
  });

  it('is sent once, replacing a stale value a caller set under any casing', async () => {
    const sent = await send({ headers: { 'content-language': 'en' }, data: { language: 'el' } });
    expect(headerValues(sent, 'Content-Language')).toEqual(['el']);
  });
});

describe('Accept-Language header', () => {
  it('is never added — the browser owns it', async () => {
    expect(headerValues(await send({}), 'Accept-Language')).toEqual([]);
    expect(headerValues(await send({ method: 'get', params: { language: 'el' } }), 'Accept-Language')).toEqual([]);
  });

  it('passes through untouched when a caller sets it', async () => {
    const sent = await send({ headers: { 'Accept-Language': 'de-CH, de;q=0.9' }, data: { language: 'el' } });
    expect(headerValues(sent, 'Accept-Language')).toEqual(['de-CH, de;q=0.9']);
  });
});
