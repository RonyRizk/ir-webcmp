import { createStore } from '@stencil/store';
import { GHS_Candidate_Property } from '../services/ghs/ghs.service';
import { ICountry } from '../models/IBooking';

interface GHSStore {
  properties: GHS_Candidate_Property[];
  countries: ICountry[];
  selectedCountryId: number | null;
  selectedProperties: GHS_Candidate_Property[];
  isLoading: boolean;
}

const { state: ghsStore, reset } = createStore<GHSStore>({
  properties: [],
  countries: [],
  selectedCountryId: null,
  selectedProperties: [],
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

export function toggleGhsPropertySelection(property: GHS_Candidate_Property) {
  const index = ghsStore.selectedProperties.findIndex(p => p.AC_ID === property.AC_ID);
  if (index !== -1) {
    ghsStore.selectedProperties = ghsStore.selectedProperties.filter(p => p.AC_ID !== property.AC_ID);
  } else {
    ghsStore.selectedProperties = [...ghsStore.selectedProperties, property];
  }
}

export function removeGhsPropertySelection(acId: number) {
  ghsStore.selectedProperties = ghsStore.selectedProperties.filter(p => p.AC_ID !== acId);
}

export function toggleAllGhsProperties(selectAll: boolean) {
  if (selectAll) {
    // Add only those not already selected to avoid duplicates
    const currentSelectedIds = ghsStore.selectedProperties.map(p => p.AC_ID);
    const newSelections = ghsStore.properties.filter(p => !currentSelectedIds.includes(p.AC_ID));
    ghsStore.selectedProperties = [...ghsStore.selectedProperties, ...newSelections];
  } else {
    // Remove all properties that are currently in the candidate list from the selection
    const candidateIds = ghsStore.properties.map(p => p.AC_ID);
    ghsStore.selectedProperties = ghsStore.selectedProperties.filter(p => !candidateIds.includes(p.AC_ID));
  }
}

export function clearGhsPropertySelections() {
  ghsStore.selectedProperties = [];
}

export function setGhsLoading(isLoading: boolean) {
  ghsStore.isLoading = isLoading;
}

export function resetGhsStore() {
  reset();
}

export default ghsStore;