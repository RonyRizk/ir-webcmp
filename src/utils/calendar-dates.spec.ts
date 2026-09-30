import { addDaysISO, addMonthsISO, nightsBetween, todayISO } from './calendar-dates';

// Run under several `TZ` values (e.g. America/Los_Angeles, UTC, Pacific/Kiritimati): results must not change.
describe('calendar-dates', () => {
  it('adds days across month, year and DST boundaries', () => {
    expect(addDaysISO('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDaysISO('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDaysISO('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDaysISO('2026-03-07', 1)).toBe('2026-03-08'); // US spring-forward
    expect(addDaysISO('2026-03-08', 1)).toBe('2026-03-09');
    expect(addDaysISO('2026-11-01', 1)).toBe('2026-11-02'); // US fall-back
    expect(addDaysISO('2026-03-29', 1)).toBe('2026-03-30'); // EU spring-forward
  });

  it('adds months, clamping to the month end', () => {
    expect(addMonthsISO('2026-09-28', 2)).toBe('2026-11-28');
    expect(addMonthsISO('2026-12-31', 2)).toBe('2027-02-28');
  });

  it('counts whole nights, including across DST changes', () => {
    expect(nightsBetween('2026-03-07', '2026-03-10')).toBe(3);
    expect(nightsBetween('2026-10-31', '2026-11-02')).toBe(2);
    expect(nightsBetween('2026-12-30', '2027-01-02')).toBe(3);
    expect(nightsBetween('2026-05-10', '2026-05-10')).toBe(0);
    expect(nightsBetween('2026-05-10', '2026-05-08')).toBe(-2);
  });

  it('ignores a trailing time on an API date', () => {
    expect(addDaysISO('2026-05-10T00:00:00', 1)).toBe('2026-05-11');
  });

  it('formats today as YYYY-MM-DD', () => {
    expect(todayISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('zero-padded ISO days compare correctly as strings', () => {
    expect('2026-09-30' < '2026-10-01').toBe(true);
    expect('2026-12-31' < '2027-01-01').toBe(true);
  });
});
