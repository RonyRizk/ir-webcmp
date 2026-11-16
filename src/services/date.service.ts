import { formatDate, formatDateRange, formatDateTime, formatTime, getFirstDayOfWeek, getMonthLabel, getWeekdayLabels, toApiDate, toApiDateTime } from '@/utils/date';

/**
 * Public façade for date formatting. The implementation lives in `@/utils/date` — this is the
 * ergonomic entry point, not a second implementation.
 *
 *   import { dateService } from '@/services/date.service';
 *   dateService.format(booking.from_date, 'ddd, DD MMM YYYY');
 *   dateService.toApiDate(picked);   // always Gregorian Latin-digit YYYY-MM-DD
 *
 * Importing `{ formatDate }` from `@/utils/date` directly is equally valid and is what most
 * component code does.
 */
export const dateService = {
  format: formatDate,
  formatRange: formatDateRange,
  formatTime,
  formatDateTime,
  toApiDate,
  toApiDateTime,
  getWeekdayLabels,
  getMonthLabel,
  getFirstDayOfWeek,
};

export * from '@/utils/date';
export default dateService;
