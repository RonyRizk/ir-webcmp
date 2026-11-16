import type { RoomType } from '@/models/property';
import type { CloneRatesParams } from '@/services/property/types';
import { t } from '@/services/locale/t';
import { formatDateRange } from '@/utils/date';
import { formatAmount, formatPercent } from '@/utils/number';
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

/** Weekday values in display order, using JS `day()` numbering (0 = Sunday). */
export const WEEKDAYS: number[] = [1, 2, 3, 4, 5, 6, 0];

const WEEKDAY_FALLBACK = 'M, T, W, Th, Fr, Sa, Su';

/** Localized short weekday labels, in {@link WEEKDAYS} order — the same source `ir-weekday-selector` reads. */
function weekdayLabels(): string[] {
  const labels = t('Lcz_WeekdayAbbreviations', { fallback: WEEKDAY_FALLBACK })
    .split(',')
    .map(s => s.trim());
  const fallback = WEEKDAY_FALLBACK.split(', ');
  return WEEKDAYS.map((_, i) => labels[i] || fallback[i]);
}

/** Built on call (not at import time) so the labels follow the loaded locale. */
export function getAdjustments(): { value: Adjustment; label: string }[] {
  return [
    { value: 'none', label: t('Lcz_UseCurrentRates', { fallback: 'Use current rates' }) },
    { value: 'inc-fixed', label: t('Lcz_IncreaseRatesByFixedSum', { fallback: 'Increase rates by a fixed sum' }) },
    { value: 'inc-pct', label: t('Lcz_IncreaseRatesByPercentage', { fallback: 'Increase rates by a percentage' }) },
    { value: 'dec-pct', label: t('Lcz_DecreaseRatesByPercentage', { fallback: 'Decrease rates by a percentage' }) },
    { value: 'dec-fixed', label: t('Lcz_DecreaseRatesByFixedSum', { fallback: 'Decrease rates by a fixed sum' }) },
  ];
}

const DATE_FORMAT = 'YYYY-MM-DD';

export interface RoomTypeOption {
  id: number;
  name: string;
  ratePlans: { id: number; label: string; customText?: string }[];
}

/** Active room types with their active base (non-derived) rate plans; room types without any are dropped. */
export function toRoomTypeOptions(roomTypes: RoomType[]): RoomTypeOption[] {
  return (roomTypes ?? [])
    .filter(rt => rt.is_active)
    .map(rt => ({
      id: rt.id,
      name: rt.name,
      ratePlans: (rt.rateplans ?? [])
        .filter(rp => rp.is_active && !rp.is_derived)
        .map(rp => ({ id: rp.id, label: rp.short_name || rp.name, customText: rp.custom_text?.trim() || undefined })),
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
    errors.dates = t('Lcz_SelectStartAndEndDate', { fallback: 'Please select a start and end date.' });
  } else if (moment(state.fromDate, DATE_FORMAT).isAfter(moment(state.toDate, DATE_FORMAT), 'day')) {
    errors.dates = t('Lcz_StartDateBeforeEndDate', { fallback: 'The start date must be before the end date.' });
  }

  if (state.weekdays.length === 0) {
    errors.weekdays = t('Lcz_SelectAtLeastOneWeekday', { fallback: 'Please select at least one day of the week.' });
  }

  if (state.ratePlanIds.length === 0) {
    errors.ratePlans = t('Lcz_SelectAtLeastOneRatePlan', { fallback: 'Please select at least one rate plan.' });
  }

  if (state.adjustment !== 'none') {
    const amount = Number(state.amount);
    if (state.amount.trim() === '' || !Number.isFinite(amount) || amount <= 0) {
      errors.amount = t('Lcz_AmountGreaterThanZero', { fallback: 'Please enter an amount greater than 0.' });
    } else if (state.adjustment === 'dec-pct' && amount >= 100) {
      errors.amount = t('Lcz_PercentageLessThan100', { fallback: 'The percentage must be less than 100.' });
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

function formatReviewRange(from: string, to: string): string {
  return formatDateRange(from, to, 'MMM D, YYYY');
}

function formatAdjustment(adjustment: Adjustment, amount: string, currencySymbol: string): string {
  if (adjustment === 'none') return t('Lcz_UseCurrentRates', { fallback: 'Use current rates' });
  const sign = isDecrease(adjustment) ? '−' : '+';
  const value = Number(amount);
  return isPercentage(adjustment) ? `${sign} ${formatPercent(value, { maximumFractionDigits: 2 })}` : `${sign} ${formatAmount(currencySymbol, value)}`;
}

/** Human-readable summary of the form, shown in the review dialog before confirming. */
export function buildReviewRows(state: CloneRatesFormState, roomTypes: RoomTypeOption[], currencySymbol: string): ReviewRow[] {
  const selected = new Set(state.ratePlanIds);
  const totalRatePlans = roomTypes.reduce((sum, rt) => sum + rt.ratePlans.length, 0);
  const ratePlans =
    selected.size === totalRatePlans
      ? t('Lcz_AllRatePlansForAllRoomTypes', { fallback: 'All rate plans for all room types' })
      : roomTypes
          .map(rt => ({ name: rt.name, plans: rt.ratePlans.filter(rp => selected.has(rp.id)).map(rp => rp.label) }))
          .filter(rt => rt.plans.length > 0)
          .map(rt => `${rt.name} (${rt.plans.join(', ')})`)
          .join('; ');
  const labels = weekdayLabels();
  const days = WEEKDAYS.map((value, i) => (state.weekdays.includes(value) ? labels[i] : null)).filter(Boolean);

  return [
    { label: t('Lcz_CopyRatesFrom', { fallback: 'Copy rates from' }), value: formatReviewRange(state.fromDate, state.toDate) },
    { label: t('Lcz_CopyRatesTo', { fallback: 'Copy rates to' }), value: formatReviewRange(toTargetDate(state.fromDate), toTargetDate(state.toDate)) },
    { label: t('Lcz_DaysOfTheWeek', { fallback: 'Days of the week' }), value: days.length === WEEKDAYS.length ? t('Lcz_AllDays', { fallback: 'All days' }) : days.join(', ') },
    { label: t('Lcz_RatePlans', { fallback: 'Rate plans' }), value: ratePlans },
    { label: t('Lcz_RateChanges', { fallback: 'Rate changes' }), value: formatAdjustment(state.adjustment, state.amount, currencySymbol) },
    {
      label: t('Lcz_CopyMinStayRestrictions', { fallback: 'Copy minimum stay restrictions' }),
      value: state.copyMinStay ? t('Lcz_Yes', { fallback: 'Yes' }) : t('Lcz_No', { fallback: 'No' }),
    },
  ];
}
