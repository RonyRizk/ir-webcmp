import { z } from 'zod';
import { t } from '@/services/locale/t';

export const GuestCredentials = z.object({
  first_name: z.string().nonempty(),
  last_name: z.string().nonempty(),
});
export const RoomGuestSchema = z
  .object({
    bed_preference: z.string().optional().nullable(),
    requires_bed_preference: z.boolean().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.requires_bed_preference && !data.bed_preference) {
      ctx.addIssue({
        path: ['bed_preference'],
        message: t('Lcz_BedPreferenceRequired', { fallback: 'Bed preference is required' }),
        code: z.ZodIssueCode.custom,
      });
    }
  });
export const RoomsInfoSchema = z.array(RoomGuestSchema);
export const BookingGuestSchema = z.object({
  first_name: z.string().nonempty(),
  last_name: z.string().nonempty(),
});
