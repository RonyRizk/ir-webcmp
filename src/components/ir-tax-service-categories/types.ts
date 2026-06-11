import { IEntries } from '@/models/property';
import { z } from 'zod';

export enum TaxationStrategy {
  Normal = '000',
  Cumulative = '001',
}

/**
 * Charge rule (VAT, City Tax, Service Charge)
 */
export const ChargeRuleSchema = z.object({
  value: z.number().nullable(),
  mode: z.string().min(1),
});
export type ChargeRule = z.infer<typeof ChargeRuleSchema>;

/**
 * Main setup schema
 */
export const TaxAndChargeSetupSchema = z.object({
  vat: ChargeRuleSchema,
  cityTax: ChargeRuleSchema.nullable(),
  serviceCharge: ChargeRuleSchema.nullable(),
  taxationStrategy: z.nativeEnum(TaxationStrategy).nullable(),
});
export type TaxAndChargeSetup = z.infer<typeof TaxAndChargeSetupSchema>;

export type TaxesSetupEntries = { vat_included: IEntries[]; svc_category: IEntries[]; city_tax_included: IEntries[]; service_charge_included: IEntries[] };
