import { detectDeviceCalendar, persistOverride, readStoredOverride, resolveCalendarSystem } from './calendar-resolution';

function setNavigatorLanguage(lang: string) {
  Object.defineProperty(window.navigator, 'language', { value: lang, configurable: true });
}

describe('calendar-resolution', () => {
  afterEach(() => {
    localStorage.clear();
    setNavigatorLanguage('en-US');
  });

  describe('detectDeviceCalendar', () => {
    it('defaults to Gregorian for a plain English locale', () => {
      setNavigatorLanguage('en-US');
      expect(detectDeviceCalendar()).toBe('gregory');
    });

    it('defaults to Gregorian for Arabic locales not on the curated Hijri list', () => {
      setNavigatorLanguage('ar-EG');
      expect(detectDeviceCalendar()).toBe('gregory');
    });

    it('resolves Hijri for a curated Hijri-preferring locale (ar-SA)', () => {
      setNavigatorLanguage('ar-SA');
      expect(detectDeviceCalendar()).toBe('islamic-umalqura');
    });

    it('resolves Hijri when the locale carries an explicit islamic-umalqura calendar extension', () => {
      setNavigatorLanguage('en-u-ca-islamic-umalqura');
      expect(detectDeviceCalendar()).toBe('islamic-umalqura');
    });

    it('never throws and falls back to Gregorian on an invalid locale tag', () => {
      setNavigatorLanguage('not-a-real-locale-!!!');
      expect(() => detectDeviceCalendar()).not.toThrow();
      expect(detectDeviceCalendar()).toBe('gregory');
    });
  });

  describe('persistOverride / readStoredOverride', () => {
    it('round-trips a stored override', () => {
      persistOverride('islamic-umalqura');
      expect(readStoredOverride()).toBe('islamic-umalqura');
    });

    it('clears the override when persisted with null', () => {
      persistOverride('gregory');
      persistOverride(null);
      expect(readStoredOverride()).toBeNull();
    });

    it('returns null when nothing is stored', () => {
      expect(readStoredOverride()).toBeNull();
    });

    it('ignores garbage values already present in storage', () => {
      localStorage.setItem('ir_calendar_system', 'not-a-calendar');
      expect(readStoredOverride()).toBeNull();
    });
  });

  describe('resolveCalendarSystem', () => {
    it('device auto-detect wins when no override is stored', () => {
      setNavigatorLanguage('ar-SA');
      expect(resolveCalendarSystem()).toBe('islamic-umalqura');
    });

    it('a persisted override takes precedence over device auto-detect', () => {
      setNavigatorLanguage('ar-SA');
      persistOverride('gregory');
      expect(resolveCalendarSystem()).toBe('gregory');
    });
  });
});
