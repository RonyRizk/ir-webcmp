import type { SetupEntries } from '@/models/IBooking';
import { getEntryValue, groupEntryTablesResult, toEntryLanguage, toSetupEntries } from './utils';

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
    ENTRY_DATE: '',
    ENTRY_USER_ID: 0,
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

describe('setup utilities', () => {
  it('normalizes supported language codes and falls back to English', () => {
    expect(toEntryLanguage('FR')).toBe('fr');
    expect(toEntryLanguage(null)).toBe('en');
    expect(toEntryLanguage('es')).toBe('en');
  });

  it('uses the requested translation, then English, then the code name', () => {
    expect(getEntryValue({ entry: makeEntry({ CODE_VALUE_FR: 'Défaut' }), language: 'fr' })).toBe('Défaut');
    expect(getEntryValue({ entry: makeEntry(), language: 'fr' })).toBe('Default');
    expect(getEntryValue({ entry: makeEntry({ CODE_VALUE_EN: '' }), language: 'fr' })).toBe('DEFAULT');
  });

  it('groups table entries case-insensitively and skips entries without a table name', () => {
    const arrival = makeEntry({ TBL_NAME: '_ARRIVAL_TIME' });
    const payment = makeEntry({ TBL_NAME: 'PAY_METHOD' });
    const missingTable = makeEntry({ TBL_NAME: '' });

    expect(groupEntryTablesResult([arrival, payment, missingTable])).toEqual({ arrival_time: [arrival], pay_method: [payment] });
  });

  it('maps grouped booking-editor entries to their public shape', () => {
    const arrival = makeEntry({ TBL_NAME: '_ARRIVAL_TIME' });
    const pricing = makeEntry({ TBL_NAME: '_RATE_PRICING_MODE' });
    const bed = makeEntry({ TBL_NAME: '_BED_PREFERENCE_TYPE' });

    expect(toSetupEntries(groupEntryTablesResult([arrival, pricing, bed]))).toEqual({
      arrivalTime: [arrival],
      ratePricingMode: [pricing],
      bedPreferenceType: [bed],
    });
  });
});
