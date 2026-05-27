import { createStore } from '@stencil/store';
import { GHS_Candidate_Property } from '../services/ghs/ghs.service';
import { ICountry } from '../models/IBooking';

interface GHSStore {
  properties: GHS_Candidate_Property[];
  countries: ICountry[];
  selectedCountryId: number | null;
  selectedPropertyIds: number[];
  isLoading: boolean;
}

const { state: ghsStore, reset } = createStore<GHSStore>({
  properties: [],
  countries: [],
  selectedCountryId: null,
  selectedPropertyIds: [],
  isLoading: false,
});

export function setGhsProperties(properties: GHS_Candidate_Property[]) {
  ghsStore.properties = properties;
}

export function setGhsCountries(countries: ICountry[]) {
  ghsStore.countries = countries;
}

export function setGhsSelectedCountry(countryId: number | null) {
  ghsStore.selectedCountryId = countryId;
}

export function toggleGhsPropertySelection(acId: number) {
  if (ghsStore.selectedPropertyIds.includes(acId)) {
    ghsStore.selectedPropertyIds = ghsStore.selectedPropertyIds.filter(id => id !== acId);
  } else {
    ghsStore.selectedPropertyIds = [...ghsStore.selectedPropertyIds, acId];
  }
}

export function toggleAllGhsProperties(selectAll: boolean) {
  if (selectAll) {
    ghsStore.selectedPropertyIds = ghsStore.properties.map(p => p.AC_ID);
  } else {
    ghsStore.selectedPropertyIds = [];
  }
}

export function clearGhsPropertySelections() {
  ghsStore.selectedPropertyIds = [];
}

export function setGhsLoading(isLoading: boolean) {
  ghsStore.isLoading = isLoading;
}

export function resetGhsStore() {
  reset();
}

export default ghsStore;