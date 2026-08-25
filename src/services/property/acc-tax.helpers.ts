import calendar_data from '@/stores/calendar-data';
import { Tax } from '@/models/property';

export type AccChargeRule = { mode: string; value: number | null };

/** Strips non-alphanumeric characters and lowercases a string for fuzzy matching against tax names. */
function normalizeTaxName(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/** Finds a tax entry by keyword from the property's taxes array. Undefined means Not Applicable. */
export function findAccTax(keyword: string): Tax | undefined {
  const taxes = calendar_data.property?.taxes ?? [];
  return taxes.find(t => normalizeTaxName(t.name).includes(normalizeTaxName(keyword)));
}

/** Converts a property tax entry to an AccChargeRule. Absent tax resolves to Not Applicable. */
export function toAccChargeRule(tax: Tax | undefined): AccChargeRule {
  if (!tax) return { mode: '002', value: null };
  return { mode: tax.is_exlusive ? '000' : '001', value: tax.pct };
}

/**
 * Reads the property's current accommodation-level tax setup (VAT, City Tax, Service Charge,
 * Taxation Strategy) unchanged, for callers that must submit these required top-level fields
 * to `Handle_Exposed_Property_Tax_Categories` without actually managing/editing them.
 */
export function getAccTaxPayloadFields() {
  const vat = toAccChargeRule(findAccTax('vat'));
  const cityTax = toAccChargeRule(findAccTax('city'));
  const serviceCharge = toAccChargeRule(findAccTax('service'));
  const taxationStrategy = calendar_data.property?.taxation_strategy?.code ?? '000';

  return {
    VAT_INCLUDED_CODE: vat.mode,
    VAT_PC: vat.mode === '002' ? 0 : (vat.value ?? 0),
    CITY_TAX_INCLUDED_CODE: cityTax.mode,
    CITY_TAX_PCT: cityTax.mode === '002' ? 0 : (cityTax.value ?? 0),
    SERVICE_CHARGE_INCLUDED_CODE: serviceCharge.mode,
    SERVICE_CHARGE_PCT: serviceCharge.mode === '002' ? 0 : (serviceCharge.value ?? 0),
    TAXATION_STRATEGY: taxationStrategy,
  };
}
