import { toLatinDigits, toNumerals } from './numerals';

describe('toNumerals', () => {
  it('converts Latin digits into each supported script', () => {
    expect(toNumerals('2026-09-01', 'latn')).toBe('2026-09-01');
    expect(toNumerals('2026-09-01', 'arab')).toBe('٢٠٢٦-٠٩-٠١');
    expect(toNumerals('2026-09-01', 'arabext')).toBe('۲۰۲۶-۰۹-۰۱');
  });

  it('converts between the two Arabic-Indic scripts', () => {
    expect(toNumerals('٢٠٢٦', 'arabext')).toBe('۲۰۲۶');
    expect(toNumerals('۲۰۲۶', 'arab')).toBe('٢٠٢٦');
  });

  it('leaves non-digit characters untouched, including Arabic letters', () => {
    expect(toNumerals('ربيع 1 1448', 'arab')).toBe('ربيع ١ ١٤٤٨');
    expect(toNumerals('Aug 27, 2026', 'arab')).toBe('Aug ٢٧, ٢٠٢٦');
  });

  it('is idempotent', () => {
    const once = toNumerals('2026-09-01', 'arab');
    expect(toNumerals(once, 'arab')).toBe(once);
  });
});

describe('toLatinDigits', () => {
  it('normalises every supported script back to Latin', () => {
    expect(toLatinDigits('٢٠٢٦-٠٩-٠١')).toBe('2026-09-01');
    expect(toLatinDigits('۲۰۲۶-۰۹-۰۱')).toBe('2026-09-01');
    expect(toLatinDigits('2026-09-01')).toBe('2026-09-01');
  });

  it("strips the Arabic-Indic digit embedded in ar-sa's abbreviated Hijri month names", () => {
    expect(toLatinDigits('ربيع ١')).toBe('ربيع 1');
  });
});
