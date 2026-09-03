import { IEntries } from '@/models/property';
import { getTopLevelSvcCategories, groupSvcCategoriesByParent } from './svc-category.utils';
import { SvcCategory } from '@/types/enums';

function makeEntry(overrides: Partial<IEntries> & { CODE_NAME: string }): IEntries {
  return {
    CODE_VALUE_AR: '',
    CODE_VALUE_DE: '',
    CODE_VALUE_EL: '',
    CODE_VALUE_EN: overrides.CODE_NAME,
    CODE_VALUE_FR: '',
    CODE_VALUE_HE: '',
    CODE_VALUE_PL: '',
    CODE_VALUE_RU: '',
    CODE_VALUE_UA: '',
    DISPLAY_ORDER: 0,
    ENTRY_DATE: '',
    ENTRY_USER_ID: 0,
    INVARIANT_VALUE: null,
    ISDELETEABLE: false,
    ISDELETED: false,
    ISSYSTEM: false,
    ISUPDATEABLE: false,
    ISVISIBLE: true,
    NOTES: '',
    OWNER_ID: 0,
    TBL_NAME: '_SVC_CATEGORY',
    ...overrides,
  };
}

describe('svc-category.utils', () => {
  describe('getTopLevelSvcCategories', () => {
    it('returns entries with an empty NOTES field', () => {
      const spa = makeEntry({ CODE_NAME: 'SPA', NOTES: '' });

      expect(getTopLevelSvcCategories([spa])).toEqual([spa]);
    });

    it('returns entries whose NOTES is free text rather than a code-shaped reference', () => {
      const spa = makeEntry({ CODE_NAME: 'SPA', NOTES: 'Treatments, fitness, and wellness programs' });

      expect(getTopLevelSvcCategories([spa])).toEqual([spa]);
    });

    it('excludes sub-category entries but keeps their own parent row as top-level', () => {
      const accommodation = makeEntry({ CODE_NAME: SvcCategory.Accommodation, NOTES: '' });
      const breakfast = makeEntry({ CODE_NAME: 'BRK', NOTES: SvcCategory.Accommodation });
      const spa = makeEntry({ CODE_NAME: 'SPA', NOTES: '' });

      expect(getTopLevelSvcCategories([accommodation, breakfast, spa])).toEqual([accommodation, spa]);
    });

    it('synthesizes a placeholder entry for a parent group that has no row of its own', () => {
      const breakfast = makeEntry({ CODE_NAME: 'BRK', NOTES: SvcCategory.Accommodation });

      const result = getTopLevelSvcCategories([breakfast]);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ CODE_NAME: SvcCategory.Accommodation, CODE_VALUE_EN: 'Accommodation', NOTES: '' });
    });

    it('only synthesizes one placeholder per missing parent group, positioned at its first child', () => {
      const spa = makeEntry({ CODE_NAME: 'SPA', NOTES: '' });
      const breakfast = makeEntry({ CODE_NAME: 'BRK', NOTES: SvcCategory.Accommodation });
      const minibar = makeEntry({ CODE_NAME: 'MNB', NOTES: SvcCategory.Accommodation });

      const result = getTopLevelSvcCategories([spa, breakfast, minibar]);

      expect(result.map(c => c.CODE_NAME)).toEqual(['SPA', SvcCategory.Accommodation]);
    });

    it('returns an empty array when given an empty list', () => {
      expect(getTopLevelSvcCategories([])).toEqual([]);
    });
  });

  describe('groupSvcCategoriesByParent', () => {
    it('groups entries under their NOTES-referenced parent code', () => {
      const breakfast = makeEntry({ CODE_NAME: 'BRK', NOTES: SvcCategory.Accommodation });
      const minibar = makeEntry({ CODE_NAME: 'MNB', NOTES: SvcCategory.Accommodation });
      const spa = makeEntry({ CODE_NAME: 'SPA', NOTES: '' });

      const groups = groupSvcCategoriesByParent([breakfast, minibar, spa]);

      expect(Array.from(groups.keys())).toEqual([SvcCategory.Accommodation]);
      expect(groups.get(SvcCategory.Accommodation)?.categories).toEqual([breakfast, minibar]);
    });

    it('preserves source order of entries within a group', () => {
      const minibar = makeEntry({ CODE_NAME: 'MNB', NOTES: SvcCategory.Accommodation, DISPLAY_ORDER: 2 });
      const breakfast = makeEntry({ CODE_NAME: 'BRK', NOTES: SvcCategory.Accommodation, DISPLAY_ORDER: 1 });

      const groups = groupSvcCategoriesByParent([minibar, breakfast]);

      expect(groups.get(SvcCategory.Accommodation)?.categories.map(c => c.CODE_NAME)).toEqual(['MNB', 'BRK']);
    });

    it('labels a group from the parent CODE_NAME row when one exists in the list', () => {
      const accommodationExtras = makeEntry({ CODE_NAME: SvcCategory.Accommodation, CODE_VALUE_EN: 'Accommodation Extras' });
      const breakfast = makeEntry({ CODE_NAME: 'BRK', NOTES: SvcCategory.Accommodation });

      const groups = groupSvcCategoriesByParent([accommodationExtras, breakfast], 'en');

      expect(groups.get(SvcCategory.Accommodation)?.label).toBe('Accommodation Extras');
    });

    it('falls back to a known label when the parent code has no row of its own', () => {
      const breakfast = makeEntry({ CODE_NAME: 'BRK', NOTES: SvcCategory.Accommodation });

      const groups = groupSvcCategoriesByParent([breakfast]);

      expect(groups.get(SvcCategory.Accommodation)?.label).toBe('Accommodation');
    });

    it('falls back to the raw code when there is no row and no known label', () => {
      const breakfast = makeEntry({ CODE_NAME: 'BRK', NOTES: 'xyz' });

      const groups = groupSvcCategoriesByParent([breakfast]);

      expect(groups.get('xyz')?.label).toBe('xyz');
    });

    it('resolves the group label in the requested language when available', () => {
      const accommodationExtras = makeEntry({ CODE_NAME: SvcCategory.Accommodation, CODE_VALUE_EN: 'Accommodation Extras', CODE_VALUE_FR: 'Extras hébergement' });
      const breakfast = makeEntry({ CODE_NAME: 'BRK', NOTES: SvcCategory.Accommodation });

      const groups = groupSvcCategoriesByParent([accommodationExtras, breakfast], 'fr');

      expect(groups.get(SvcCategory.Accommodation)?.label).toBe('Extras hébergement');
    });

    it('ignores entries with free-text NOTES', () => {
      const spa = makeEntry({ CODE_NAME: 'SPA', NOTES: 'Treatments, fitness, and wellness programs' });

      const groups = groupSvcCategoriesByParent([spa]);

      expect(groups.size).toBe(0);
    });

    it('returns an empty map when given an empty list', () => {
      expect(groupSvcCategoriesByParent([]).size).toBe(0);
    });
  });
});
