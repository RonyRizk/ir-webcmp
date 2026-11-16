export {};

jest.mock('axios', () => ({
  __esModule: true,
  default: { post: jest.fn() },
}));

const mockedAxios = require('axios').default as { post: jest.Mock };
const { LocaleService } = require('./locale.service') as typeof import('./locale.service');

function respond(result: unknown, exception = '') {
  mockedAxios.post.mockResolvedValueOnce({ data: { My_Result: result, ExceptionMsg: exception } });
}

describe('LocaleService', () => {
  let service: InstanceType<typeof LocaleService>;

  beforeEach(() => {
    mockedAxios.post.mockReset();
    service = new LocaleService();
  });

  it('posts the code and sections to the IRBE gateway', async () => {
    respond({ entries: [], direction: 'LTR' });

    await service.getExposedLanguage('en', ['_PMS_FRONT', '_USER_MGT']);

    expect(mockedAxios.post).toHaveBeenCalledWith('https://gateway.igloorooms.com/IRBE/Get_Exposed_Language', {
      code: 'en',
      sections: ['_PMS_FRONT', '_USER_MGT'],
    });
  });

  it('flattens the entry rows into a lookup keyed by code', async () => {
    respond({
      entries: [
        { code: 'Lcz_Balance', description: 'Balance' },
        { code: 'Lcz_Cancel', description: 'Cancel' },
      ],
      direction: 'LTR',
    });

    const { entries } = await service.getExposedLanguage('en', ['_PMS_FRONT', '_USER_MGT']);

    expect(entries).toEqual({ Lcz_Balance: 'Balance', Lcz_Cancel: 'Cancel' });
  });

  describe('a key declared in several tables', () => {
    const catalog = { code: 'Lcz_Email', description: 'البريد الإلكتروني', table_name: '_COMMON' };
    const legacy = { code: 'Lcz_Email', description: 'Email', table_name: '_USER_MGT' };

    it.each([
      ['catalog first', [catalog, legacy]],
      ['legacy first', [legacy, catalog]],
    ])('keeps the catalog value over the untranslated legacy one (%s)', async (_order, entries) => {
      respond({ entries, direction: 'RTL' });

      const bundle = await service.getExposedLanguage('ar', ['_COMMON', '_USER_MGT']);

      expect(bundle.entries).toEqual({ Lcz_Email: 'البريد الإلكتروني' });
      expect(bundle.fallbackKeys).toEqual([]);
    });

    it('reports keys only a legacy table supplied', async () => {
      respond({ entries: [legacy, { code: 'Lcz_OS', description: 'OS', table_name: '_USER_MGT' }], direction: 'LTR' });

      const { fallbackKeys } = await service.getExposedLanguage('en', ['_COMMON', '_USER_MGT']);

      expect(fallbackKeys.sort()).toEqual(['Lcz_Email', 'Lcz_OS']);
    });

    it('never replaces a value with an empty one', async () => {
      respond({ entries: [catalog, { ...catalog, description: '', table_name: '_SETTINGS' }], direction: 'RTL' });

      const { entries } = await service.getExposedLanguage('ar', ['_COMMON', '_SETTINGS']);

      expect(entries).toEqual({ Lcz_Email: 'البريد الإلكتروني' });
    });

    it('lets a legacy value fill a catalog row that came back empty', async () => {
      respond({ entries: [{ ...catalog, description: '' }, legacy], direction: 'LTR' });

      const bundle = await service.getExposedLanguage('ar', ['_COMMON', '_USER_MGT']);

      expect(bundle.entries).toEqual({ Lcz_Email: 'Email' });
      expect(bundle.fallbackKeys).toEqual(['Lcz_Email']);
    });
  });

  it('normalizes direction to lowercase and defaults to ltr', async () => {
    respond({ entries: [], direction: 'RTL' });
    await expect(service.getExposedLanguage('ar', ['_PMS_FRONT', '_USER_MGT'])).resolves.toMatchObject({ direction: 'rtl' });

    respond({ entries: [], direction: null });
    await expect(service.getExposedLanguage('en', ['_PMS_FRONT', '_USER_MGT'])).resolves.toMatchObject({ direction: 'ltr' });
  });

  it('tolerates a null entries array', async () => {
    respond({ entries: null, direction: 'LTR' });

    await expect(service.getExposedLanguage('en', ['_PMS_FRONT', '_USER_MGT'])).resolves.toMatchObject({ entries: {} });
  });

  it('throws when the response carries an ExceptionMsg', async () => {
    respond(null, 'Invalid ticket');

    await expect(service.getExposedLanguage('en', ['_PMS_FRONT', '_USER_MGT'])).rejects.toThrow('Invalid ticket');
  });
});
