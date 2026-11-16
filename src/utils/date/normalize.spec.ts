import moment from 'moment';
import { toDate } from './normalize';

describe('toDate', () => {
  it('parses the YYYY-MM-DD fast path to the same instant moment produced', () => {
    for (const iso of ['2026-08-27', '2020-01-01', '1999-12-31', '2024-02-29']) {
      expect(toDate(iso)!.getTime()).toBe(moment(iso, 'YYYY-MM-DD').toDate().getTime());
    }
  });

  it('yields local midnight, not UTC', () => {
    const d = toDate('2026-08-27')!;
    expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()]).toEqual([2026, 7, 27, 0]);
  });

  it('rejects impossible dates rather than rolling them over', () => {
    // `new Date(2026, 1, 31)` would silently become 3 March.
    expect(toDate('2026-02-31')).toBeNull();
    expect(toDate('2026-13-01')).toBeNull();
    expect(toDate('2026-00-10')).toBeNull();
    expect(toDate('2023-02-29')).toBeNull();
  });

  it('still handles Date, Moment, ISO date-times and unparseable input', () => {
    const native = new Date(2026, 7, 27, 14, 30);
    expect(toDate(native)).toBe(native);
    expect(toDate(moment('2026-08-27'))!.getTime()).toBe(moment('2026-08-27').toDate().getTime());
    expect(toDate('2026-08-27T14:30:00')!.getHours()).toBe(14);
    expect(toDate('not-a-date')).toBeNull();
    expect(toDate(null)).toBeNull();
    expect(toDate('')).toBeNull();
    expect(toDate(new Date('nope'))).toBeNull();
  });
});
