import { toHijriFormat } from './tokens';

describe('toHijriFormat', () => {
  it('rewrites year, month and day tokens to their moment-hijri equivalents', () => {
    expect(toHijriFormat('YYYY-MM-DD')).toBe('iYYYY-iMM-iDD');
    expect(toHijriFormat('MMM DD, YYYY')).toBe('iMMM iDD, iYYYY');
    expect(toHijriFormat('MMMM YYYY')).toBe('iMMMM iYYYY');
    expect(toHijriFormat('D/M/YY')).toBe('iD/iM/iYY');
  });

  it('leaves weekday and time tokens alone — both are calendar-independent', () => {
    expect(toHijriFormat('ddd, DD MMM YYYY')).toBe('ddd, iDD iMMM iYYYY');
    expect(toHijriFormat('dddd')).toBe('dddd');
    expect(toHijriFormat('HH:mm')).toBe('HH:mm');
    expect(toHijriFormat('h:mm A')).toBe('h:mm A');
    expect(toHijriFormat('MMM DD, HH:mm')).toBe('iMMM iDD, HH:mm');
  });

  it('never rewrites inside a [bracketed literal]', () => {
    expect(toHijriFormat('[MMM DD] MMM DD')).toBe('[MMM DD] iMMM iDD');
    expect(toHijriFormat('[YYYY]')).toBe('[YYYY]');
  });

  it('preserves separators and returns falsy input untouched', () => {
    expect(toHijriFormat('DD/MM ddd')).toBe('iDD/iMM ddd');
    expect(toHijriFormat('ddd D')).toBe('ddd iD');
    expect(toHijriFormat('')).toBe('');
  });
});
