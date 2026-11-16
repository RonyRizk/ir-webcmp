import { SelectedUnitSchema } from './room-selection';

describe('SelectedUnitSchema rateplan_id', () => {
  const rateplanId = SelectedUnitSchema.shape.rateplan_id;

  it.each([
    ['null, what an empty wa-select reports', null],
    ['an empty string', ''],
    ['undefined', undefined],
    ['zero', 0],
  ])('rejects %s', (_, value) => {
    expect(rateplanId.safeParse(value).success).toBe(false);
  });

  it.each([
    ['a numeric id', 42],
    ['a stringified id, what a wa-option value holds', '42'],
  ])('accepts %s', (_, value) => {
    expect(rateplanId.safeParse(value)).toEqual({ success: true, data: 42 });
  });
});
