import { formatAmount, formatBookingNumber, formatCount, formatNumber, formatPercent, normalizeNumericInput } from './number';

describe('formatNumber', () => {
  it('returns an empty string for null/undefined/NaN', () => {
    expect(formatNumber(null)).toBe('');
    expect(formatNumber(undefined)).toBe('');
    expect(formatNumber(NaN)).toBe('');
    expect(formatNumber(0)).toBe('0');
  });

  it('renders Latin digits by default', () => {
    expect(formatNumber(3, { locale: 'en', numberingSystem: 'latn' })).toBe('3');
    expect(formatNumber(1234567, { locale: 'en', numberingSystem: 'latn' })).toBe('1,234,567');
  });

  it('renders Arabic-Indic digits, with Arabic separators', () => {
    expect(formatNumber(3, { locale: 'ar', numberingSystem: 'arab' })).toBe('٣');
    // Grouping and decimal separators localize too — digit substitution alone would leave
    // Latin ',' and '.' inside Arabic text.
    expect(formatNumber(1234.5, { locale: 'ar', numberingSystem: 'arab', minimumFractionDigits: 2 })).toBe('١٬٢٣٤٫٥٠');
  });

  it('renders Eastern Arabic-Indic digits', () => {
    expect(formatNumber(3, { locale: 'en', numberingSystem: 'arabext' })).toBe('۳');
  });

  it("'auto' follows the locale's own numbering system", () => {
    expect(formatNumber(3, { locale: 'ar', numberingSystem: 'auto' })).toBe('٣'); // Mashriq convention
    expect(formatNumber(3, { locale: 'ar-ma', numberingSystem: 'auto' })).toBe('3');
  });
});

describe('formatCount', () => {
  it('pins fraction digits to zero', () => {
    expect(formatCount(3.0000001, { locale: 'en', numberingSystem: 'latn' })).toBe('3');
    expect(formatCount(3, { locale: 'ar', numberingSystem: 'arab' })).toBe('٣');
  });
});

describe('formatPercent', () => {
  it('takes 0–100 and renders a localized percentage', () => {
    expect(formatPercent(87, { locale: 'en', numberingSystem: 'latn' })).toBe('87%');
    expect(formatPercent(87, { locale: 'ar', numberingSystem: 'arab' })).toMatch(/٨٧/);
  });

  it('returns an empty string for null/undefined', () => {
    expect(formatPercent(null)).toBe('');
    expect(formatPercent(undefined)).toBe('');
  });
});

describe('formatAmount', () => {
  it('keeps the existing symbol-then-amount shape at two decimal places', () => {
    expect(formatAmount('$', 1234.5, { locale: 'en', numberingSystem: 'latn' })).toBe('$ 1,234.50');
    expect(formatAmount('$', 0, { locale: 'en', numberingSystem: 'latn' })).toBe('$ 0.00');
  });

  it('renders a negative amount with a leading minus before the symbol', () => {
    expect(formatAmount('$', -20, { locale: 'en', numberingSystem: 'latn' })).toBe('- $ 20.00');
  });

  it('localizes the digits when an Arabic-Indic script is active', () => {
    expect(formatAmount('ر.س', 1234.5, { locale: 'ar', numberingSystem: 'arab' })).toBe('ر.س ١٬٢٣٤٫٥٠');
  });

  it('defaults the amount to zero', () => {
    expect(formatAmount('$', undefined, { locale: 'en', numberingSystem: 'latn' })).toBe('$ 0.00');
  });
});

describe('formatBookingNumber', () => {
  const ar = { locale: 'ar', numberingSystem: 'arab' } as const;
  const latn = { locale: 'en', numberingSystem: 'latn' } as const;

  it('keeps leading zeros — they are part of the identifier', () => {
    expect(formatBookingNumber('0042', latn)).toBe('0042');
    expect(formatBookingNumber('0042', ar)).toBe('٠٠٤٢');
    expect(formatBookingNumber('000', ar)).toBe('٠٠٠');
    expect(formatBookingNumber('0', ar)).toBe('٠');
  });

  it('never groups — a booking number is an identifier, not a quantity', () => {
    expect(formatBookingNumber('100234', latn)).toBe('100234');
    expect(formatBookingNumber('100234', ar)).toBe('١٠٠٢٣٤');
    // The exact failure this function exists to prevent:
    expect(formatNumber(Number('100234'), latn)).toBe('100,234');
    expect(formatNumber(Number('0042'), latn)).toBe('42');
  });

  it('preserves length and any non-digit characters', () => {
    expect(formatBookingNumber('BK-0042/7', ar)).toBe('BK-٠٠٤٢/٧');
    expect(formatBookingNumber('0042', ar)).toHaveLength('0042'.length);
  });

  it('round-trips back to the original digits', () => {
    const original = '0090812';
    expect(formatBookingNumber(formatBookingNumber(original, ar), latn)).toBe(original);
  });

  it('handles empty, null and undefined input', () => {
    expect(formatBookingNumber('')).toBe('');
    expect(formatBookingNumber(null)).toBe('');
    expect(formatBookingNumber(undefined)).toBe('');
  });

  it('does not throw when a numeric value slips through from the API', () => {
    expect(formatBookingNumber(42 as unknown as string, ar)).toBe('٤٢');
  });

  it('follows the active digit script for each variant', () => {
    expect(formatBookingNumber('0042', { locale: 'en', numberingSystem: 'arabext' })).toBe('۰۰۴۲');
    // ar-ma conventionally uses Latin digits, so 'auto' leaves them alone.
    expect(formatBookingNumber('0042', { locale: 'ar-ma', numberingSystem: 'auto' })).toBe('0042');
    expect(formatBookingNumber('0042', { locale: 'ar', numberingSystem: 'auto' })).toBe('٠٠٤٢');
  });
});

describe('normalizeNumericInput', () => {
  it('converts Arabic-Indic and Persian digits to Latin', () => {
    expect(normalizeNumericInput('٠١٢٣٤٥٦٧٨٩')).toBe('0123456789');
    expect(normalizeNumericInput('۰۱۲۳۴۵۶۷۸۹')).toBe('0123456789');
  });

  it('converts mixed-script input and keeps non-digit characters', () => {
    expect(normalizeNumericInput('+٩٦١ 3-٤٥')).toBe('+961 3-45');
    expect(normalizeNumericInput('١٤:٣٠')).toBe('14:30');
  });

  it('maps the Arabic decimal and thousands separators', () => {
    expect(normalizeNumericInput('١٬٢٣٤٫٥٠')).toBe('1,234.50');
  });

  it('leaves Latin input untouched', () => {
    expect(normalizeNumericInput('1,234.50')).toBe('1,234.50');
  });

  it('handles empty, null and undefined input', () => {
    expect(normalizeNumericInput('')).toBe('');
    expect(normalizeNumericInput(null)).toBe('');
    expect(normalizeNumericInput(undefined)).toBe('');
  });
});
