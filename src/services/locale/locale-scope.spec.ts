export {};

jest.mock('axios', () => ({
  __esModule: true,
  // `interceptors`: LocaleController installs the language injector when it loads.
  default: { post: jest.fn(), interceptors: { request: { use: jest.fn() } } },
}));

const mockedAxios = require('axios').default as { post: jest.Mock };
const { LocaleController } = require('./locale.controller') as typeof import('./locale.controller');
const { getLocalLanguage, getLocaleScope } = require('./locale-scope') as typeof import('./locale-scope');
const { locales } = require('../../stores/locales.store') as typeof import('../../stores/locales.store');
const { t, tRaw } = require('./t') as typeof import('./t');

/** Queues one `Get_Exposed_Language` response. */
function respond(entries: Record<string, string>, direction = 'LTR') {
  mockedAxios.post.mockResolvedValueOnce({
    data: {
      My_Result: {
        entries: Object.entries(entries).map(([code, description]) => ({ code, description })),
        direction,
      },
      ExceptionMsg: '',
    },
  });
}

/** Seeds the app-wide language the way a screen root's first `load` does. */
async function loadGlobal(language: string, entries: Record<string, string>) {
  respond(entries);
  await LocaleController.load({ language });
}

beforeEach(() => {
  mockedAxios.post.mockReset();
  LocaleController.reset();
  locales.entries = null;
  locales.language = null;
  locales.direction = 'ltr';
  locales.loadedTables = [];
  locales.status = 'idle';
  document.documentElement.lang = 'en';
  document.body.innerHTML = '';
  ['ar', 'fr', 'he'].forEach(language => {
    getLocaleScope(language).entries = null;
  });
});

describe('getLocalLanguage', () => {
  it('finds the nearest lang below <html>', () => {
    document.body.innerHTML = '<div lang="AR"><section><span id="leaf"></span></section></div>';
    expect(getLocalLanguage(document.getElementById('leaf'))).toBe('ar');
  });

  it('ignores <html lang>, which is the document language rather than a scope', () => {
    document.body.innerHTML = '<span id="leaf"></span>';
    document.documentElement.lang = 'fr';
    expect(getLocalLanguage(document.getElementById('leaf'))).toBeUndefined();
  });

  it('walks out of a shadow root to its host', () => {
    document.body.innerHTML = '<div lang="he"><div id="host"></div></div>';
    const shadow = document.getElementById('host').attachShadow({ mode: 'open' });
    const inner = document.createElement('span');
    shadow.appendChild(inner);
    expect(getLocalLanguage(inner)).toBe('he');
  });
});

describe('LocaleController.loadScope', () => {
  it("fills the subtree's scope without moving the app's language", async () => {
    await loadGlobal('en', { Lcz_Book: 'Book' });
    respond({ Lcz_Book: 'احجز' }, 'RTL');

    await LocaleController.loadScope({ language: 'ar', tables: ['_BOOKING'] });

    expect(mockedAxios.post.mock.calls[1][1]).toEqual({ code: 'ar', sections: ['_BOOKING', '_COMMON'] });
    expect(getLocaleScope('ar').entries).toEqual({ Lcz_Book: 'احجز' });
    expect(getLocaleScope('ar').direction).toBe('rtl');
    expect(LocaleController.language).toBe('en');
    expect(document.documentElement.lang).toBe('en');
    expect(t('Lcz_Book')).toBe('Book');
  });

  it('does not refetch tables the scope already has', async () => {
    respond({ Lcz_Book: 'Réserver' });
    await LocaleController.loadScope({ language: 'fr', tables: ['_BOOKING'] });
    await LocaleController.loadScope({ language: 'fr', tables: ['_BOOKING'] });

    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
  });
});

describe('LocaleController.loadFor', () => {
  it('loads the scope for an element inside a lang subtree', async () => {
    await loadGlobal('en', { Lcz_Book: 'Book' });
    document.body.innerHTML = '<div lang="ar"><span id="leaf"></span></div>';
    respond({ Lcz_Book: 'احجز' });

    await LocaleController.loadFor(document.getElementById('leaf'), { language: 'ar', tables: ['_BOOKING'] });

    expect(mockedAxios.post.mock.calls[1][1].code).toBe('ar');
    expect(LocaleController.language).toBe('en');
    expect(LocaleController.languageFor(document.getElementById('leaf'))).toBe('ar');
  });

  it('is a plain load outside any subtree', async () => {
    document.body.innerHTML = '<span id="leaf"></span>';
    respond({ Lcz_Book: 'Book' });

    await LocaleController.loadFor(document.getElementById('leaf'), { language: 'en', tables: ['_BOOKING'] });

    expect(LocaleController.language).toBe('en');
    expect(locales.entries).toEqual({ Lcz_Book: 'Book' });
    expect(getLocaleScope('en').entries).toBeNull();
  });

  it("is a plain load when the subtree's language is already the app's", async () => {
    await loadGlobal('ar', { Lcz_Book: 'احجز' });
    document.body.innerHTML = '<div lang="ar"><span id="leaf"></span></div>';

    await LocaleController.loadFor(document.getElementById('leaf'), { language: 'ar' });

    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
    expect(getLocaleScope('ar').entries).toBeNull();
  });
});

describe('t() with a language', () => {
  it('reads that language’s scope', async () => {
    await loadGlobal('en', { Lcz_Book: 'Book' });
    respond({ Lcz_Book: 'احجز' });
    await LocaleController.loadScope({ language: 'ar' });

    expect(t('Lcz_Book', { language: 'ar' })).toBe('احجز');
    expect(tRaw('Lcz_Book', { language: 'AR' })).toBe('احجز');
  });

  it('falls back to the app’s strings for a key the scope has not loaded', async () => {
    await loadGlobal('en', { Lcz_Book: 'Book', Lcz_Cancel: 'Cancel' });
    respond({ Lcz_Book: 'احجز' });
    await LocaleController.loadScope({ language: 'ar' });

    expect(t('Lcz_Cancel', { language: 'ar' })).toBe('Cancel');
  });

  it('reads the app’s strings when the language is the app’s own', async () => {
    await loadGlobal('en', { Lcz_Book: 'Book' });
    getLocaleScope('en').entries = { Lcz_Book: 'stale' };

    expect(t('Lcz_Book', { language: 'en' })).toBe('Book');
  });
});
