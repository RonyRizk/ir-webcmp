export {};

jest.mock('axios', () => ({
  __esModule: true,
  // `interceptors`: LocaleController installs the language injector when it loads.
  default: { post: jest.fn(), interceptors: { request: { use: jest.fn() } } },
}));

const mockedAxios = require('axios').default as { post: jest.Mock };
const { LocaleController } = require('./locale.controller') as typeof import('./locale.controller');
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

/** The `sections` array of the nth POST. */
function sectionsOf(call = 0): string[] {
  return mockedAxios.post.mock.calls[call][1].sections;
}

beforeEach(() => {
  mockedAxios.post.mockReset();
  LocaleController.reset();
  locales.entries = null;
  locales.language = null;
  locales.direction = 'ltr';
  locales.loadedTables = [];
  locales.status = 'idle';
});

describe('LocaleController.load', () => {
  it("sends the shared vocabulary alongside the screen's own table", async () => {
    respond({ Lcz_Balance: 'Balance' });

    await LocaleController.load({ language: 'en', tables: ['_HK_FRONT'] });

    expect(sectionsOf()).toEqual(['_COMMON', '_HK_FRONT']);
  });

  it('sends only the base table when a screen asks for none', async () => {
    respond({ Lcz_Balance: 'Balance' });

    await LocaleController.load({ language: 'en' });

    expect(sectionsOf()).toEqual(['_COMMON']);
  });

  it('does not send a screen a table it never asked for', async () => {
    respond({ Lcz_Balance: 'Balance' });

    await LocaleController.load({ language: 'en', tables: ['_CHANNEL_FRONT'] });

    expect(sectionsOf()).not.toContain('_USER_MGT');
    expect(sectionsOf()).not.toContain('_HK_FRONT');
  });

  it('publishes entries, direction and language into the store', async () => {
    respond({ Lcz_Balance: 'Balance' }, 'RTL');

    await LocaleController.load({ language: 'AR' });

    expect(locales.entries).toMatchObject({ Lcz_Balance: 'Balance' });
    expect(locales.direction).toBe('rtl');
    expect(locales.language).toBe('ar');
    expect(locales.status).toBe('ready');
    expect(document.documentElement.lang).toBe('ar');
  });

  it('does not refetch tables that are already loaded', async () => {
    respond({ Lcz_Balance: 'Balance' });

    await LocaleController.load({ language: 'en', tables: ['_USER_MGT'] });
    await LocaleController.load({ language: 'en', tables: ['_USER_MGT'] });
    await LocaleController.load({ language: 'en' });

    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
  });

  it('fetches again when a new table is requested', async () => {
    respond({ Lcz_Balance: 'Balance' });
    await LocaleController.load({ language: 'en' });

    respond({ Lcz_Housekeeper: 'Housekeeper' });
    await LocaleController.load({ language: 'en', tables: ['_HK_FRONT'] });

    expect(mockedAxios.post).toHaveBeenCalledTimes(2);
    expect(locales.entries).toMatchObject({ Lcz_Balance: 'Balance', Lcz_Housekeeper: 'Housekeeper' });
  });

  it('collapses concurrent identical loads into one request', async () => {
    respond({ Lcz_Balance: 'Balance' });

    await Promise.all([LocaleController.load({ language: 'en' }), LocaleController.load({ language: 'en' }), LocaleController.load({ language: 'en' })]);

    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
  });

  it('marks the store as errored and rethrows when the request fails', async () => {
    mockedAxios.post.mockRejectedValueOnce(new Error('Missing token!!'));

    await expect(LocaleController.load({ language: 'en' })).rejects.toThrow('Missing token!!');
    expect(locales.status).toBe('error');
  });
});

describe('concurrent loads for one language', () => {
  it('collapses a language switch into a single request', async () => {
    // The real shape: two screens have loaded, the switcher calls setLanguage, and
    // every mounted root's @Watch('language') fires its own load in the same tick.
    respond({ Lcz_Housekeeper: 'Housekeeper' });
    await LocaleController.load({ language: 'en', tables: ['_HK_FRONT'] });
    respond({ Lcz_ExtranetUsers: 'Users' });
    await LocaleController.load({ language: 'en', tables: ['_USER_MGT'] });
    mockedAxios.post.mockReset();

    respond({ Lcz_Housekeeper: 'عامل نظافة', Lcz_ExtranetUsers: 'مستخدمون' }, 'RTL');
    await Promise.all([
      LocaleController.setLanguage('ar'),
      LocaleController.load({ language: 'ar', tables: ['_HK_FRONT'], force: true }),
      LocaleController.load({ language: 'ar', tables: ['_USER_MGT'], force: true }),
    ]);

    // setLanguage carries every loaded table, so the roots' own loads find
    // nothing missing when they re-enter after it settles.
    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
    expect(sectionsOf()).toEqual(['_COMMON', '_HK_FRONT', '_USER_MGT']);
    expect(locales.language).toBe('ar');
  });

  it('still fetches a table the in-flight request did not cover', async () => {
    respond({ Lcz_Housekeeper: 'Housekeeper' });
    respond({ Lcz_ExtranetUsers: 'Users' });

    await Promise.all([LocaleController.load({ language: 'en', tables: ['_HK_FRONT'] }), LocaleController.load({ language: 'en', tables: ['_USER_MGT'] })]);

    expect(sectionsOf(0)).toEqual(['_COMMON', '_HK_FRONT']);
    expect(sectionsOf(1)).toEqual(['_COMMON', '_USER_MGT']);
    expect(locales.entries).toMatchObject({ Lcz_Housekeeper: 'Housekeeper', Lcz_ExtranetUsers: 'Users' });
  });
});

describe('a stale @Prop() language', () => {
  it('cannot drag the app back after a switch', async () => {
    respond({ Lcz_Balance: 'Balance' });
    await LocaleController.load({ language: 'en' });

    respond({ Lcz_Balance: 'الرصيد' }, 'RTL');
    await LocaleController.setLanguage('ar');
    mockedAxios.post.mockReset();

    // A screen re-running its init still holds language="en" until the switcher
    // re-broadcasts the prop to it, and asks for a table it has not loaded yet.
    respond({ Lcz_Housekeeper: 'عامل نظافة' }, 'RTL');
    await LocaleController.load({ language: 'en', tables: ['_HK_FRONT'] });

    expect(locales.language).toBe('ar');
    expect(mockedAxios.post.mock.calls[0]?.[1].code).toBe('ar');
  });

  it('still seeds the language on the very first load', async () => {
    respond({ Lcz_Balance: 'الرصيد' }, 'RTL');

    await LocaleController.load({ language: 'ar' });

    expect(locales.language).toBe('ar');
  });
});

describe('LocaleController.language', () => {
  it('never returns an empty string, which is what @Prop() language defaults to', () => {
    locales.language = '';
    expect(LocaleController.language).toBe('en');
  });

  it('tracks the selected language after a switch', async () => {
    respond({ Lcz_Balance: 'Balance' });
    await LocaleController.load({ language: 'en' });
    expect(LocaleController.language).toBe('en');

    respond({ Lcz_Balance: 'الرصيد' }, 'RTL');
    await LocaleController.setLanguage('AR');
    expect(LocaleController.language).toBe('ar');
  });

  it('is the requested language synchronously, before the first fetch resolves', async () => {
    respond({ Lcz_Balance: 'الرصيد' }, 'RTL');

    const pending = LocaleController.load({ language: 'ar' });

    // Sibling requests built in the same Promise.all read these before any await.
    expect(LocaleController.language).toBe('ar');
    expect(locales.language).toBe('ar');
    expect(locales.entries).toBeNull();

    await pending;
    expect(LocaleController.language).toBe('ar');
  });

  it('cannot be moved by a second screen mounting while the first load is in flight', async () => {
    respond({ Lcz_Balance: 'الرصيد' }, 'RTL');
    respond({ Lcz_Housekeeper: 'عامل نظافة' }, 'RTL');

    const first = LocaleController.load({ language: 'ar' });
    // A second root whose @Prop() language is still '' / a stale default.
    const second = LocaleController.load({ language: 'en', tables: ['_HK_FRONT'] });

    expect(LocaleController.language).toBe('ar');
    await Promise.all([first, second]);

    expect(LocaleController.language).toBe('ar');
    mockedAxios.post.mock.calls.forEach(call => expect(call[1].code).toBe('ar'));
  });

  it('moves with setLanguage before the fetch resolves', async () => {
    respond({ Lcz_Balance: 'Balance' });
    await LocaleController.load({ language: 'en' });

    respond({ Lcz_Balance: 'الرصيد' }, 'RTL');
    const pending = LocaleController.setLanguage('ar');
    expect(LocaleController.language).toBe('ar');

    await pending;
    expect(LocaleController.language).toBe('ar');
  });

  it('notifies subscribers only when the language actually changes', async () => {
    const seen: string[] = [];
    const unsubscribe = LocaleController.subscribe(lang => seen.push(lang));

    respond({ Lcz_Balance: 'Balance' });
    await LocaleController.load({ language: 'en' });
    expect(seen).toEqual([]); // first load is not a change

    respond({ Lcz_Balance: 'الرصيد' }, 'RTL');
    await LocaleController.setLanguage('ar');
    expect(seen).toEqual(['ar']);

    unsubscribe();
    respond({ Lcz_Balance: 'Balance' });
    await LocaleController.setLanguage('en');
    expect(seen).toEqual(['ar']);
  });
});

describe('LocaleController.setLanguage', () => {
  it('refetches the union of every table loaded so far', async () => {
    respond({ Lcz_Housekeeper: 'Housekeeper' });
    await LocaleController.load({ language: 'en', tables: ['_HK_FRONT'] });

    respond({ Lcz_Housekeeper: 'عامل نظافة' }, 'RTL');
    await LocaleController.setLanguage('ar');

    expect(sectionsOf(1)).toEqual(['_COMMON', '_HK_FRONT']);
    expect(mockedAxios.post.mock.calls[1][1].code).toBe('ar');
    expect(locales.direction).toBe('rtl');
  });

  it('drops the previous language strings instead of merging them', async () => {
    respond({ Lcz_Balance: 'Balance', Lcz_Cancel: 'Cancel' });
    await LocaleController.load({ language: 'en' });

    respond({ Lcz_Balance: 'الرصيد' }, 'RTL');
    await LocaleController.setLanguage('ar');

    expect(locales.entries).toEqual({ Lcz_Balance: 'الرصيد' });
  });
});

describe('legacy vs catalog tables across requests', () => {
  /** Queues one response whose rows all come from `table`. */
  function respondFrom(table: string, entries: Record<string, string>) {
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        My_Result: { entries: Object.entries(entries).map(([code, description]) => ({ code, description, table_name: table })), direction: 'RTL' },
        ExceptionMsg: '',
      },
    });
  }

  it('a later legacy-only load cannot put an untranslated value back over a catalog one', async () => {
    respondFrom('_COMMON', { Lcz_Cancel: 'إلغاء' });
    await LocaleController.load({ language: 'ar' });

    // e.g. the OTP modal mounting and loading `_USER_MGT`
    respondFrom('_USER_MGT', { Lcz_Cancel: 'Cancel', Lcz_OtpOnly: 'OTP' });
    await LocaleController.load({ language: 'ar', tables: ['_USER_MGT'] });

    expect(locales.entries).toEqual({ Lcz_Cancel: 'إلغاء', Lcz_OtpOnly: 'OTP' });
  });

  it('a later catalog load replaces a legacy value', async () => {
    respondFrom('_USER_MGT', { Lcz_EditUser: 'Edit User' });
    await LocaleController.load({ language: 'ar', tables: ['_USER_MGT'] });

    respondFrom('_SETTINGS', { Lcz_EditUser: 'تعديل المستخدم' });
    await LocaleController.load({ language: 'ar', tables: ['_SETTINGS'] });

    expect(locales.entries).toMatchObject({ Lcz_EditUser: 'تعديل المستخدم' });
  });

  it('forgets catalog provenance on a language switch', async () => {
    respondFrom('_COMMON', { Lcz_Cancel: 'Cancel' });
    await LocaleController.load({ language: 'en' });

    respondFrom('_USER_MGT', { Lcz_Cancel: 'Annuler' });
    await LocaleController.setLanguage('fr');

    expect(locales.entries).toEqual({ Lcz_Cancel: 'Annuler' });
  });
});

describe('t', () => {
  it('returns the loaded translation', async () => {
    respond({ Lcz_Balance: 'Balance' });
    await LocaleController.load({ language: 'en' });

    expect(t('Lcz_Balance')).toBe('Balance');
  });

  it('returns the key itself when nothing is loaded', () => {
    expect(t('Lcz_Balance')).toBe('Lcz_Balance');
  });

  it('honours an explicit fallback', () => {
    expect(t('Lcz_Balance', { fallback: '' })).toBe('');
  });

  it('fills the positional %1 / %2 placeholders', async () => {
    respond({ Lcz_EmailBookingto: 'Email booking to %1', Lcz_Range: 'From %1 to %2' });
    await LocaleController.load({ language: 'en' });

    expect(t('Lcz_EmailBookingto', { params: ['a@b.com'] })).toBe('Email booking to a@b.com');
    expect(tRaw('Lcz_Range', { params: ['Mon', 'Fri'] })).toBe('From Mon to Fri');
  });

  it('leaves placeholders alone when no params are given', async () => {
    respond({ Lcz_EmailBookingto: 'Email booking to %1' });
    await LocaleController.load({ language: 'en' });

    expect(t('Lcz_EmailBookingto')).toBe('Email booking to %1');
  });
});
