import { createStore } from '@stencil/store';
import { GetMealReportResult, MealCountDaySummary, MealGuestEntry } from '@/services/meal-report/types';
import moment from 'moment';
import { IEntries } from '@/models/IBooking';

export interface MealReportStore {
  property_id: number | null;
  report_type: 'GUEST_LIST' | 'MEAL_COUNT';
  from: string;
  to: string;
  meal_type_code: string | null;
  guestList: MealGuestEntry[];
  mealCountSummary: MealCountDaySummary[];
  isLoading: boolean;
  setupEntries: {
    meal_type: IEntries[];
    hb_preference: IEntries[];
  };
}

const initialState: MealReportStore = {
  property_id: null,
  report_type: 'GUEST_LIST',
  from: moment().format('YYYY-MM-DD'),
  to: moment().format('YYYY-MM-DD'),
  meal_type_code: null,
  guestList: [],
  mealCountSummary: [],
  isLoading: false,
  setupEntries: {
    meal_type: [],
    hb_preference: [],
  },
};

export const { state: mealReportStore, onChange: onMealReportStoreChange } = createStore<MealReportStore>(initialState);

export function setMealReportFilters(filters: Partial<Pick<MealReportStore, 'from' | 'to' | 'report_type' | 'meal_type_code'>>) {
  if (filters.from !== undefined) mealReportStore.from = filters.from;
  if (filters.to !== undefined) mealReportStore.to = filters.to;
  if (filters.report_type !== undefined) mealReportStore.report_type = filters.report_type;
  if (filters.meal_type_code !== undefined) mealReportStore.meal_type_code = filters.meal_type_code;
}

export function setMealReportData(data: GetMealReportResult) {
  mealReportStore.guestList = data.My_Result.Guest_List || [];
  mealReportStore.mealCountSummary = data.My_Result.Meal_Count_Summary || [];
}

export function clearMealReportData() {
    mealReportStore.guestList = [];
    mealReportStore.mealCountSummary = [];
}

export function setMealReportLoading(isLoading: boolean) {
  mealReportStore.isLoading = isLoading;
}

export function setMealReportSetupEntries(entries: { meal_type: IEntries[]; hb_preference: IEntries[] }) {
  mealReportStore.setupEntries = entries;
}

export function updateMealGuestPreference(room_identifier: string, code: string) {
  const index = mealReportStore.guestList.findIndex(entry => entry.room_identifier === room_identifier);
  if (index !== -1) {
    const newList = [...mealReportStore.guestList];
    newList[index] = { ...newList[index], hb_preference_code: code };
    mealReportStore.guestList = newList;
  }
}
