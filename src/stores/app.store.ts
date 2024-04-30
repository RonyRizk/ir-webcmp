import { ICurrency, pages, TCurrency, TDirection } from '@/models/common';
import { IEntries, IExposedProperty } from '@/models/property';
import { createStore } from '@stencil/store';
import { enUS, Locale } from 'date-fns/locale';
export type UserPreference = {
  language_id: string;
  currency_id: string;
};
interface IUserDefaultCountry {
  cities: [];
  currency: ICurrency;
  flag: string;
  id: number;
  name: string;
  phone_prefix: string;
}

export interface IAppStore {
  currencies: TCurrency[];
  localizedWords: string[];
  dir: TDirection;
  selectedLocale: Locale;
  userPreferences: UserPreference;
  app_data: {
    token: string;
    property_id: number;
  };
  property: IExposedProperty;
  setup_entries: {
    arrivalTime: IEntries[];
    ratePricingMode: IEntries[];
    bedPreferenceType: IEntries[];
  };
  userDefaultCountry: IUserDefaultCountry;
  fetchedBooking: boolean;
  currentPage: pages;
}

const initialState: IAppStore = {
  currentPage: 'booking',
  dir: 'LTR',
  selectedLocale: enUS,
  localizedWords: [],
  userPreferences: {
    currency_id: 'usd',
    language_id: 'en',
  },
  app_data: {
    token: '',
    property_id: null,
  },
  property: undefined,
  setup_entries: undefined,
  currencies: [],
  userDefaultCountry: undefined,
  fetchedBooking: false,
};
const { state: app_store, onChange: onAppDataChange } = createStore<IAppStore>(initialState);

export function changeLocale(dir: TDirection, locale: Locale) {
  document.body.dir = dir;
  app_store.dir = dir;
  app_store.selectedLocale = locale;
}
export function updateUserPreference(params: Partial<UserPreference>) {
  app_store.userPreferences = {
    ...app_store.userPreferences,
    ...params,
  };
}
export { onAppDataChange };
export default app_store;
