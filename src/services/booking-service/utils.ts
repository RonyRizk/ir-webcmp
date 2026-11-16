import { PaymentEntries } from '@/components/ir-booking-details/types';
import { z } from 'zod';
import { SetupEntries, SetupEntrySchema } from '../../models/IBooking';
/**
 * Builds a grouped payment types record from raw entries and groups.
 *
 * @param paymentEntries - The flat list of all available payment  entries.
 * @returns A record where each key is a group CODE_NAME and the value is the
 *          ordered array of payment type entries belonging to that group.
 *
 * @example
 * const result = buildPaymentTypes(paymentEntries);
 * // {
 * //   PAYMENTS: [ { CODE_NAME: "001", CODE_VALUE_EN: "Cash", ... }, ... ],
 * //   ADJUSTMENTS: [ ... ],
 * //   ...
 * // }
 */
export function buildPaymentTypes(paymentEntries: PaymentEntries): Record<string, SetupEntries[]> {
  try {
    const { groups, types } = z
      .object({
        types: SetupEntrySchema.array().min(1),
        groups: SetupEntrySchema.array().min(1),
        methods: SetupEntrySchema.array().min(1),
      })
      .parse(paymentEntries);
    const items = [...types];

    const byCodes = (codes: string[]) => codes.map(code => items.find(i => i.CODE_NAME === code)).filter((x): x is SetupEntries => Boolean(x));

    const extractGroupCodes = (code: string) => {
      const paymentGroup = groups.find(pt => pt.CODE_NAME === code);
      return paymentGroup ? paymentGroup.CODE_VALUE_EN.split(',') : [];
    };
    let rec: Record<string, SetupEntries[]> = {};
    groups.forEach(group => {
      // if (group.CODE_NAME === 'PAYMENTS') {
      //   rec[group.CODE_NAME] = methods.map(entry => ({
      //     ...entry,
      //     CODE_VALUE_EN: `Payment: ${entry.CODE_VALUE_EN}`,
      //   })) as SetupEntries[];
      // } else if (group.CODE_NAME === 'REFUND') {
      //   rec[group.CODE_NAME] = methods.map(entry => ({
      //     ...entry,
      //     CODE_VALUE_EN: `Refund: ${entry.CODE_VALUE_EN}`,
      //   })) as SetupEntries[];
      rec[group.CODE_NAME] = byCodes(extractGroupCodes(group.CODE_NAME));
    });
    return rec;
  } catch (error) {
    console.log(error);
    return {};
  }
}
