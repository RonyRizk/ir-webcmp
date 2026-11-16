import { applyDraft, findLanguage, format, isFilled, resolveDir, resolveLanguageName, targetLanguages } from './utils';

describe('ir-translatable-textarea utils', () => {
  describe('format', () => {
    it('replaces known placeholders and keeps unknown ones', () => {
      expect(format('{n} of {total} translated', { n: 2, total: 3 })).toBe('2 of 3 translated');
      expect(format('Remove {language}? {other}', { language: 'French' })).toBe('Remove French? {other}');
    });
  });

  describe('isFilled', () => {
    it('treats blank and whitespace-only text as empty', () => {
      expect(isFilled('Sea view')).toBe(true);
      expect(isFilled('')).toBe(false);
      expect(isFilled('  \n\t ')).toBe(false);
      expect(isFilled(undefined)).toBe(false);
      expect(isFilled(null)).toBe(false);
    });
  });

  describe('resolveDir', () => {
    it('prefers an explicit direction', () => {
      expect(resolveDir('ar', 'ltr')).toBe('ltr');
      expect(resolveDir('en', 'rtl')).toBe('rtl');
    });

    it('detects right-to-left languages, including regional variants', () => {
      for (const code of ['ar', 'he', 'fa', 'ur', 'ar-LB', 'he-IL']) {
        expect(resolveDir(code)).toBe('rtl');
      }
    });

    it('defaults to left-to-right', () => {
      for (const code of ['en', 'fr', 'zh-CN', 'pt-BR', 'el']) {
        expect(resolveDir(code)).toBe('ltr');
      }
    });

    it('does not throw on invalid codes', () => {
      expect(resolveDir('not a code!')).toBe('ltr');
    });
  });

  describe('resolveLanguageName', () => {
    it('prefers an explicit label', () => {
      expect(resolveLanguageName('zh-CN', 'Chinese (Simplified)')).toBe('Chinese (Simplified)');
    });

    it('uses Intl.DisplayNames in the requested locale', () => {
      expect(resolveLanguageName('fr', undefined, 'en')).toBe('French');
      expect(resolveLanguageName('fr', undefined, 'fr')).toBe('Français');
    });

    it('falls back to the uppercased code', () => {
      expect(resolveLanguageName('not a code!')).toBe('NOT A CODE!');
    });
  });

  describe('targetLanguages', () => {
    it('drops the default language and duplicates, keeping order', () => {
      const available = [{ code: 'fr' }, { code: 'en' }, { code: 'ar' }, { code: 'fr', label: 'Dup' }];
      expect(targetLanguages(available, 'en').map(language => language.code)).toEqual(['fr', 'ar']);
    });
  });

  describe('applyDraft', () => {
    it('merges edited translations and reports what changed', () => {
      const { next, changed } = applyDraft({ en: 'Hi', fr: 'Salut' }, { fr: 'Bonjour', ar: 'مرحبا' }, 'en');
      expect(next).toEqual({ en: 'Hi', fr: 'Bonjour', ar: 'مرحبا' });
      expect(changed).toEqual(['fr', 'ar']);
    });

    it('removes translations cleared to blank', () => {
      const { next, changed } = applyDraft({ en: 'Hi', fr: 'Salut' }, { fr: '   ' }, 'en');
      expect(next).toEqual({ en: 'Hi' });
      expect(changed).toEqual(['fr']);
    });

    it('ignores untouched-equivalent edits and the default language', () => {
      const { next, changed } = applyDraft({ en: 'Hi', fr: 'Salut' }, { fr: 'Salut', de: '', en: 'Changed' }, 'en');
      expect(next).toEqual({ en: 'Hi', fr: 'Salut' });
      expect(changed).toEqual([]);
    });
  });

  describe('findLanguage', () => {
    it('returns the listed definition, or a bare one for unknown codes', () => {
      expect(findLanguage([{ code: 'zh-CN', label: 'Chinese' }], 'zh-CN')).toEqual({ code: 'zh-CN', label: 'Chinese' });
      expect(findLanguage([], 'fr')).toEqual({ code: 'fr' });
      expect(findLanguage(undefined, 'fr')).toEqual({ code: 'fr' });
    });
  });
});
