import { z } from 'zod';

export const IrUserFormData = z.object({
  firstName: z.string().min(2, {
    message: 'FullNameCannotBeEmpty',
  }),
  lastName: z.string().min(2, {
    message: 'LastNameCannotBeEmpty',
  }),
  email: z.string().email({ message: 'InvalidEmail' }),
  mobile_number: z.coerce.number().min(5),
  arrival_time: z.string(),
  message: z.string().optional(),
  bookingForSomeoneElse: z.boolean().default(false),
  country_id: z.coerce.number(),
  country_code: z.string().min(1),
});
IrUserFormData.strip().parse;
export type TUserFormData = z.infer<typeof IrUserFormData>;
