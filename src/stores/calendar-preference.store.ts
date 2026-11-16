import { createStore } from '@stencil/store';
import { CalendarSystem, NumberingSystemPreference } from '@/utils/date/types';

export interface ICalendarPreference {
  /** What's actually applied right now — device-detected or the persisted override. */
  resolved: CalendarSystem;
  /** Explicit user/QA choice, or `null` when following device auto-detect. */
  override: CalendarSystem | null;
  /** Digit script dates and numbers render in. `'auto'` resolves per locale — see `numerals.ts`. */
  numberingSystem: NumberingSystemPreference;
}

const initialState: ICalendarPreference = {
  resolved: 'gregory',
  override: null,
  // Follow the locale's conventional digits (Arabic-Indic under `ar`, Latin elsewhere). A persisted
  // `ir_numbering_system` value overrides this on init. The API boundary stays Latin regardless.
  numberingSystem: 'auto',
};

export const { state: calendarPreference, onChange: onCalendarPreferenceChange } = createStore<ICalendarPreference>(initialState);

export default calendarPreference;
