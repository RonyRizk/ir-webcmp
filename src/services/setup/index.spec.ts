import type { SetupEntries } from '@/models/IBooking';
import type { SetupService as SetupServiceType } from './index';

jest.mock('axios', () => ({
  __esModule: true,
  // `interceptors`: LocaleController installs the language injector when it loads.
  default: { post: jest.fn(), interceptors: { request: { use: jest.fn() } } },
}));

const mockedAxios = require('axios').default as { post: jest.Mock };
const { SetupService } = require('./index') as typeof import('./index');

function makeEntry(overrides: Partial<SetupEntries> = {}): SetupEntries {
  return {
    CODE_NAME: 'DEFAULT',
    CODE_VALUE_AR: '',
    CODE_VALUE_DE: '',
    CODE_VALUE_EL: '',
    CODE_VALUE_EN: 'Default',
    CODE_VALUE_FR: '',
    CODE_VALUE_HE: '',
    CODE_VALUE_PL: '',
    CODE_VALUE_RU: '',
    CODE_VALUE_UA: '',
    DISPLAY_ORDER: 0,
    ENTRY_DATE: '2026-01-01',
    ENTRY_USER_ID: 1,
    INVARIANT_VALUE: null,
    ISDELETEABLE: true,
    ISDELETED: false,
    ISSYSTEM: false,
    ISUPDATEABLE: true,
    ISVISIBLE: true,
    NOTES: '',
    OWNER_ID: 1,
    TBL_NAME: '_ARRIVAL_TIME',
    ...overrides,
  };
}

function respond(result: unknown, exception?: string) {
  mockedAxios.post.mockResolvedValue({ data: { My_Result: result, ...(exception ? { ExceptionMsg: exception } : {}) } });
}

describe('SetupService', () => {
  let service: SetupServiceType;

  beforeEach(() => {
    service = new SetupService();
    mockedAxios.post.mockReset();
  });

  it('requests one setup table and normalizes an empty API result to an empty list', async () => {
    respond(null);

    await expect(service.getSetupEntriesByTableName('_ARRIVAL_TIME')).resolves.toEqual([]);
    expect(mockedAxios.post).toHaveBeenCalledWith('/Get_Setup_Entries_By_TBL_NAME', { TBL_NAME: '_ARRIVAL_TIME' });
  });

  it('fetches, groups, and maps the booking-editor setup tables', async () => {
    const arrival = makeEntry({ CODE_NAME: 'EARLY', TBL_NAME: '_ARRIVAL_TIME' });
    const pricing = makeEntry({ CODE_NAME: 'PER_ROOM', TBL_NAME: '_RATE_PRICING_MODE' });
    const bed = makeEntry({ CODE_NAME: 'KING', TBL_NAME: '_BED_PREFERENCE_TYPE' });
    respond([arrival, pricing, bed]);

    await expect(service.fetchSetupEntries()).resolves.toEqual({
      arrivalTime: [arrival],
      ratePricingMode: [pricing],
      bedPreferenceType: [bed],
    });
    expect(mockedAxios.post).toHaveBeenCalledWith('/Get_Setup_Entries_By_TBL_NAME_MULTI', {
      TBL_NAMES: ['_ARRIVAL_TIME', '_RATE_PRICING_MODE', '_BED_PREFERENCE_TYPE'],
    });
  });

  it('returns blocked info and payment entries from their expected table groups', async () => {
    const blocked = makeEntry({ TBL_NAME: '_CALENDAR_BLOCKED_TILL' });
    respond([blocked]);
    await expect(service.getBlockedInfo()).resolves.toEqual([blocked]);
    expect(mockedAxios.post).toHaveBeenLastCalledWith('/Get_Setup_Entries_By_TBL_NAME_MULTI', { TBL_NAMES: ['_CALENDAR_BLOCKED_TILL'] });

    const type = makeEntry({ TBL_NAME: '_PAY_TYPE' });
    const group = makeEntry({ TBL_NAME: '_PAY_TYPE_GROUP' });
    const method = makeEntry({ TBL_NAME: '_PAY_METHOD' });
    respond([type, group, method]);
    await expect(service.getPaymentEntries()).resolves.toEqual({ types: [type], groups: [group], methods: [method] });
    expect(mockedAxios.post).toHaveBeenLastCalledWith('/Get_Setup_Entries_By_TBL_NAME_MULTI', {
      TBL_NAMES: ['_PAY_TYPE', '_PAY_TYPE_GROUP', '_PAY_METHOD'],
    });
  });

  it('normalizes distinct setup table strings and table-name objects', async () => {
    respond(['_ARRIVAL_TIME', { TBL_NAME: '_PAY_METHOD', ignored: true }]);

    await expect(service.getDistinctSetupTables()).resolves.toEqual(['_ARRIVAL_TIME', '_PAY_METHOD']);
    expect(mockedAxios.post).toHaveBeenCalledWith('/Get_Distinct_Setup_Tables', {});
  });

  it('validates the distinct-table response', async () => {
    respond([{ TBL_NAME: 42 }]);

    await expect(service.getDistinctSetupTables()).rejects.toThrow();
  });

  it('gets a setup entry by code, validates it, and converts an absent result to null', async () => {
    const entry = makeEntry({ CODE_NAME: 'LATE' });
    respond(entry);
    await expect(service.getSetupEntryByCode({ TBL_NAME: '_ARRIVAL_TIME', CODE_NAME: 'LATE' })).resolves.toEqual(entry);
    expect(mockedAxios.post).toHaveBeenLastCalledWith('/Get_SetupEntry_By_Code', { TBL_NAME: '_ARRIVAL_TIME', CODE_NAME: 'LATE' });

    respond(null);
    await expect(service.getSetupEntryByCode({ TBL_NAME: '_ARRIVAL_TIME', CODE_NAME: 'NONE' })).resolves.toBeNull();
  });

  it('applies edit defaults, posts the normalized entry, and returns it', async () => {
    respond(undefined);

    await expect(service.editSetup({ TBL_NAME: '_ARRIVAL_TIME', CODE_NAME: 'LATE', ENTRY_DATE: '2026-01-01' })).resolves.toMatchObject({
      TBL_NAME: '_ARRIVAL_TIME',
      CODE_NAME: 'LATE',
      ISVISIBLE: true,
      CODE_VALUE_EN: '',
      INVARIANT_VALUE: null,
    });
    expect(mockedAxios.post).toHaveBeenCalledWith('/Edit_Setup', expect.objectContaining({ TBL_NAME: '_ARRIVAL_TIME', CODE_NAME: 'LATE' }));
  });

  it('posts bulk edits under list_setup_entries and returns normalized entries', async () => {
    respond(undefined);

    const result = await service.editSetupMany([{ TBL_NAME: '_PAY_METHOD', CODE_NAME: 'CASH', ENTRY_DATE: '2026-01-01' }]);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ TBL_NAME: '_PAY_METHOD', CODE_NAME: 'CASH', ISDELETEABLE: true });
    expect(mockedAxios.post).toHaveBeenCalledWith('/Edit_Setup_Many', { list_setup_entries: result });
  });

  it('validates exposed languages and posts to the gateway endpoint', async () => {
    const languages = [{ code: 'en', culture: 'en-US', description: 'English', direction: 'ltr', entries: null, flag: '/en.svg', id: 1 }];
    respond(languages);

    await expect(service.getExposedLanguages()).resolves.toEqual(languages);
    expect(mockedAxios.post).toHaveBeenCalledWith('https://gateway.igloorooms.com/IRBE/Get_Exposed_Languages', {});
  });

  it('validates missing-entry and description-search results', async () => {
    const entry = makeEntry();
    respond([entry]);
    await expect(service.getMissingSetupEntries({ language: 'fr' })).resolves.toEqual([entry]);
    expect(mockedAxios.post).toHaveBeenLastCalledWith('/Get_Missing_Setup_Entries', { language: 'fr' });

    respond([entry]);
    await expect(service.searchSetupByDescription({ query: 'default' })).resolves.toEqual([entry]);
    expect(mockedAxios.post).toHaveBeenLastCalledWith('/Search_Setup_By_Description', { query: 'default' });
  });

  it('moves entries, returns duplicated entries, and propagates API exceptions', async () => {
    respond(undefined);
    await expect(service.moveSetupEntry({ old_tbl_name: '_OLD', code_name: 'CODE', new_tbl_name: '_NEW' })).resolves.toBeUndefined();
    expect(mockedAxios.post).toHaveBeenLastCalledWith('/Move_Setup_Entry', { old_tbl_name: '_OLD', code_name: 'CODE', new_tbl_name: '_NEW' });

    const duplicates = [{ DESCRIPTION: 'Default', OCCURRENCES: 2, ENTRIES: [{ CODE_NAME: 'DEFAULT', TBL_NAME: '_ONE' }] }];
    respond(duplicates);
    await expect(service.getDuplicatedSetupEntriesAcrossTables()).resolves.toEqual(duplicates);

    respond(null, 'Permission denied');
    await expect(service.getSetupEntriesByTableName('_ARRIVAL_TIME')).rejects.toThrow('Permission denied');
  });

  it('rejects invalid request parameters before calling the API', async () => {
    await expect(service.getSetupEntryByCode({ TBL_NAME: '', CODE_NAME: 'CODE' })).rejects.toThrow();
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });
});
