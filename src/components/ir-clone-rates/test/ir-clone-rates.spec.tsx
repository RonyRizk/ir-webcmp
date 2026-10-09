import {
  Adjustment,
  CloneRatesFormState,
  buildCloneRatesPayload,
  buildReviewRows,
  parseSourceOption,
  toRoomTypeOptions,
  toTargetDate,
  validateCloneRates,
  yearBounds,
} from '../clone-rates.utils';

const baseState = (overrides: Partial<CloneRatesFormState> = {}): CloneRatesFormState => ({
  fromDate: '2025-01-01',
  toDate: '2025-12-31',
  weekdays: [1, 2, 3, 4, 5, 6, 0],
  ratePlanIds: [10, 20],
  adjustment: 'none',
  amount: '',
  copyMinStay: false,
  ...overrides,
});

describe('clone-rates utils', () => {
  describe('source options', () => {
    it('parses the kind and year', () => {
      expect(parseSourceOption('full-2026')).toEqual({ kind: 'full', year: 2026 });
      expect(parseSourceOption('custom-2025')).toEqual({ kind: 'custom', year: 2025 });
    });

    it('spans the full calendar year', () => {
      expect(yearBounds(2026)).toEqual({ from: '2026-01-01', to: '2026-12-31' });
    });
  });

  describe('toRoomTypeOptions', () => {
    const rp = (id: number, extra: object = {}) => ({ id, name: `Plan ${id}`, short_name: `P${id}`, is_active: true, is_derived: false, ...extra });

    it('keeps active base rate plans grouped under active room types', () => {
      const roomTypes = [
        { id: 1, name: 'Suite', is_active: true, rateplans: [rp(11), rp(12, { is_derived: true }), rp(13, { is_active: false }), rp(14, { short_name: '' })] },
        { id: 2, name: 'Closed', is_active: false, rateplans: [rp(21)] },
        { id: 3, name: 'Derived only', is_active: true, rateplans: [rp(31, { is_derived: true })] },
      ] as any;
      expect(toRoomTypeOptions(roomTypes)).toEqual([
        {
          id: 1,
          name: 'Suite',
          ratePlans: [
            { id: 11, label: 'P11' },
            { id: 14, label: 'Plan 14' },
          ],
        },
      ]);
    });
  });

  describe('toTargetDate', () => {
    it('shifts the date one year forward', () => {
      expect(toTargetDate('2025-03-15')).toBe('2026-03-15');
    });

    it('clamps Feb 29 to Feb 28', () => {
      expect(toTargetDate('2028-02-29')).toBe('2029-02-28');
    });
  });

  describe('buildCloneRatesPayload', () => {
    it('maps the form state to the API payload', () => {
      const payload = buildCloneRatesPayload(42, baseState({ copyMinStay: true }));
      expect(payload).toEqual({
        AC_ID: 42,
        SOURCE_FROM_DATE: '2025-01-01',
        SOURCE_TO_DATE: '2025-12-31',
        TARGET_FROM_DATE: '2026-01-01',
        VALUE_TO_ADD: null,
        PERCENTAGE_TO_ADD: null,
        SELECTED_ROOM_TYPE_IDS: [10, 20],
        DAYS_OF_WEEK: [0, 1, 2, 3, 4, 5, 6],
        IS_COPY_MLS: true,
      });
    });

    it.each<[Adjustment, number | null, number | null]>([
      ['none', null, null],
      ['inc-fixed', 15, null],
      ['dec-fixed', -15, null],
      ['inc-pct', null, 15],
      ['dec-pct', null, -15],
    ])('maps %s to VALUE_TO_ADD=%p and PERCENTAGE_TO_ADD=%p', (adjustment, value, percentage) => {
      const payload = buildCloneRatesPayload(1, baseState({ adjustment, amount: adjustment === 'none' ? '' : '15' }));
      expect(payload.VALUE_TO_ADD).toBe(value);
      expect(payload.PERCENTAGE_TO_ADD).toBe(percentage);
    });
  });

  describe('buildReviewRows', () => {
    const roomTypes = [
      {
        id: 1,
        name: 'Suite',
        ratePlans: [
          { id: 10, label: 'BB' },
          { id: 11, label: 'HB' },
        ],
      },
      { id: 2, name: 'Double', ratePlans: [{ id: 20, label: 'RO' }] },
    ];
    const valueOf = (rows: { label: string; value: string }[], label: string) => rows.find(r => r.label === label)?.value;

    it('summarises dates, days, plans, adjustment and min stay', () => {
      const rows = buildReviewRows(baseState({ weekdays: [1, 2], adjustment: 'dec-fixed', amount: '20', copyMinStay: true }), roomTypes, 'US$');
      expect(valueOf(rows, 'Copy rates from')).toBe('Jan 1, 2025 – Dec 31, 2025');
      expect(valueOf(rows, 'Copy rates to')).toBe('Jan 1, 2026 – Dec 31, 2026');
      expect(valueOf(rows, 'Days of the week')).toBe('Mon, Tue');
      expect(valueOf(rows, 'Rate plans')).toBe('Suite (BB); Double (RO)');
      expect(valueOf(rows, 'Rate changes')).toBe('− US$20');
      expect(valueOf(rows, 'Copy minimum stay restrictions')).toBe('Yes');
    });

    it('collapses full selections', () => {
      const rows = buildReviewRows(baseState({ ratePlanIds: [10, 11, 20], adjustment: 'inc-pct', amount: '7.5' }), roomTypes, 'US$');
      expect(valueOf(rows, 'Days of the week')).toBe('All days');
      expect(valueOf(rows, 'Rate plans')).toBe('All rate plans for all room types');
      expect(valueOf(rows, 'Rate changes')).toBe('+ 7.5%');
    });
  });

  describe('validateCloneRates', () => {
    it('accepts a complete form', () => {
      expect(validateCloneRates(baseState())).toEqual({});
    });

    it('requires both dates in order', () => {
      expect(validateCloneRates(baseState({ toDate: null })).dates).toBeDefined();
      expect(validateCloneRates(baseState({ fromDate: '2025-06-01', toDate: '2025-05-01' })).dates).toBeDefined();
    });

    it('requires at least one weekday', () => {
      expect(validateCloneRates(baseState({ weekdays: [] })).weekdays).toBeDefined();
    });

    it('requires at least one rate plan', () => {
      expect(validateCloneRates(baseState({ ratePlanIds: [] })).ratePlans).toBeDefined();
    });

    it('requires a positive amount when adjusting rates', () => {
      expect(validateCloneRates(baseState({ adjustment: 'inc-fixed', amount: '' })).amount).toBeDefined();
      expect(validateCloneRates(baseState({ adjustment: 'inc-fixed', amount: '0' })).amount).toBeDefined();
      expect(validateCloneRates(baseState({ adjustment: 'inc-fixed', amount: '5' })).amount).toBeUndefined();
    });

    it('rejects a percentage decrease of 100 or more', () => {
      expect(validateCloneRates(baseState({ adjustment: 'dec-pct', amount: '100' })).amount).toBeDefined();
      expect(validateCloneRates(baseState({ adjustment: 'dec-pct', amount: '99' })).amount).toBeUndefined();
      expect(validateCloneRates(baseState({ adjustment: 'inc-pct', amount: '150' })).amount).toBeUndefined();
    });
  });
});
