import type { RoomType } from '@/models/property';
import type { CloneRatesParams } from '@/services/property/types';
import moment from 'moment';

export type SourceKind = 'full' | 'custom';
export type SourceOption = `${SourceKind}-${number}`;
export type Adjustment = 'none' | 'inc-fixed' | 'inc-pct' | 'dec-pct' | 'dec-fixed';
export type CloneRatesErrorField = 'dates' | 'weekdays' | 'ratePlans' | 'amount';
export type CloneRatesErrors = Partial<Record<CloneRatesErrorField, string>>;

export interface CloneRatesFormState {
  fromDate: string | null;
  toDate: string | null;
  weekdays: number[];
  ratePlanIds: number[];
  adjustment: Adjustment;
  amount: string;
  copyMinStay: boolean;
}

/** Weekdays in display order, using JS `day()` numbering (0 = Sunday). */
export const WEEKDAYS: { value: number; label: string }[] = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 0, label: 'Sun' },
];

export const ADJUSTMENTS: { value: Adjustment; label: string }[] = [
  { value: 'none', label: 'Use current rates' },
  { value: 'inc-fixed', label: 'Increase rates by a fixed sum' },
  { value: 'inc-pct', label: 'Increase rates by a percentage' },
  { value: 'dec-pct', label: 'Decrease rates by a percentage' },
  { value: 'dec-fixed', label: 'Decrease rates by a fixed sum' },
];

const DATE_FORMAT = 'YYYY-MM-DD';

export interface RoomTypeOption {
  id: number;
  name: string;
  ratePlans: { id: number; label: string }[];
}

/** Active room types with their active base (non-derived) rate plans; room types without any are dropped. */
export function toRoomTypeOptions(roomTypes: RoomType[]): RoomTypeOption[] {
  return (roomTypes ?? [])
    .filter(rt => rt.is_active)
    .map(rt => ({
      id: rt.id,
      name: rt.name,
      ratePlans: (rt.rateplans ?? []).filter(rp => rp.is_active && !rp.is_derived).map(rp => ({ id: rp.id, label: rp.short_name || rp.name })),
    }))
    .filter(rt => rt.ratePlans.length > 0);
}

export function parseSourceOption(option: SourceOption): { kind: SourceKind; year: number } {
  const [kind, year] = option.split('-');
  return { kind: kind as SourceKind, year: Number(year) };
}

export function yearBounds(year: number): { from: string; to: string } {
  return { from: `${year}-01-01`, to: `${year}-12-31` };
}

export function isPercentage(adjustment: Adjustment): boolean {
  return adjustment === 'inc-pct' || adjustment === 'dec-pct';
}

export function isDecrease(adjustment: Adjustment): boolean {
  return adjustment === 'dec-pct' || adjustment === 'dec-fixed';
}

/** Shifts a `YYYY-MM-DD` date to the same calendar day one year later. */
export function toTargetDate(date: string): string {
  return moment(date, DATE_FORMAT).add(1, 'year').format(DATE_FORMAT);
}

export function validateCloneRates(state: CloneRatesFormState): CloneRatesErrors {
  const errors: CloneRatesErrors = {};

  if (!state.fromDate || !state.toDate) {
    errors.dates = 'Please select a start and end date.';
  } else if (moment(state.fromDate, DATE_FORMAT).isAfter(moment(state.toDate, DATE_FORMAT), 'day')) {
    errors.dates = 'The start date must be before the end date.';
  }

  if (state.weekdays.length === 0) {
    errors.weekdays = 'Please select at least one day of the week.';
  }

  if (state.ratePlanIds.length === 0) {
    errors.ratePlans = 'Please select at least one rate plan.';
  }

  if (state.adjustment !== 'none') {
    const amount = Number(state.amount);
    if (state.amount.trim() === '' || !Number.isFinite(amount) || amount <= 0) {
      errors.amount = 'Please enter an amount greater than 0.';
    } else if (state.adjustment === 'dec-pct' && amount >= 100) {
      errors.amount = 'The percentage must be less than 100.';
    }
  }

  return errors;
}

export function buildCloneRatesPayload(propertyId: number, state: CloneRatesFormState): CloneRatesParams {
  const amount = state.adjustment === 'none' ? null : Number(state.amount) * (isDecrease(state.adjustment) ? -1 : 1);
  return {
    AC_ID: propertyId,
    SOURCE_FROM_DATE: state.fromDate,
    SOURCE_TO_DATE: state.toDate,
    TARGET_FROM_DATE: toTargetDate(state.fromDate),
    VALUE_TO_ADD: isPercentage(state.adjustment) ? null : amount,
    PERCENTAGE_TO_ADD: isPercentage(state.adjustment) ? amount : null,
    // The backend reads SELECTED_ROOM_TYPE_IDS as rate plan ids.
    SELECTED_ROOM_TYPE_IDS: [...state.ratePlanIds],
    DAYS_OF_WEEK: [...state.weekdays].sort((a, b) => a - b),
    IS_COPY_MLS: state.copyMinStay,
  };
}

export interface ReviewRow {
  label: string;
  value: string;
}

function formatReviewDate(date: string): string {
  return moment(date, DATE_FORMAT).format('MMM D, YYYY');
}

function formatAdjustment(adjustment: Adjustment, amount: string, currencySymbol: string): string {
  if (adjustment === 'none') return 'Use current rates';
  const sign = isDecrease(adjustment) ? '−' : '+';
  return isPercentage(adjustment) ? `${sign} ${amount}%` : `${sign} ${currencySymbol}${amount}`;
}

/** Human-readable summary of the form, shown in the review dialog before confirming. */
export function buildReviewRows(state: CloneRatesFormState, roomTypes: RoomTypeOption[], currencySymbol: string): ReviewRow[] {
  const selected = new Set(state.ratePlanIds);
  const totalRatePlans = roomTypes.reduce((sum, rt) => sum + rt.ratePlans.length, 0);
  const ratePlans =
    selected.size === totalRatePlans
      ? 'All rate plans for all room types'
      : roomTypes
          .map(rt => ({ name: rt.name, plans: rt.ratePlans.filter(rp => selected.has(rp.id)).map(rp => rp.label) }))
          .filter(rt => rt.plans.length > 0)
          .map(rt => `${rt.name} (${rt.plans.join(', ')})`)
          .join('; ');
  const days = WEEKDAYS.filter(w => state.weekdays.includes(w.value)).map(w => w.label);

  return [
    { label: 'Copy rates from', value: `${formatReviewDate(state.fromDate)} – ${formatReviewDate(state.toDate)}` },
    { label: 'Copy rates to', value: `${formatReviewDate(toTargetDate(state.fromDate))} – ${formatReviewDate(toTargetDate(state.toDate))}` },
    { label: 'Days of the week', value: days.length === WEEKDAYS.length ? 'All days' : days.join(', ') },
    { label: 'Rate plans', value: ratePlans },
    { label: 'Rate changes', value: formatAdjustment(state.adjustment, state.amount, currencySymbol) },
    { label: 'Copy minimum stay restrictions', value: state.copyMinStay ? 'Yes' : 'No' },
  ];
}
