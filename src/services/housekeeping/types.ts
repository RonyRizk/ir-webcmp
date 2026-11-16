import { RoomHkStatus } from '@/models/booking.dto';
import z from 'zod';
import { LanguageSchema, PropertyIdSchema } from '../commonSchemas';

export type HKSkipParams = { HK_SKIP_ID: number; BOOK_NBR: string; PR_ID: number; DATE: string; HK_SKIP_REASON_CODE: '001'; COMMENT: string };

export interface ConnectedHK {
  AC_ID: number;
  ENTRY_DATE: string;
  ENTRY_USER_ID: number;
  HKM_ID: number;
  IS_ACTIVE: boolean;
  IS_SOFT_DELETED: boolean;
  MOBILE: string;
  My_Ac: null;
  My_User: null;
  NAME: string;
  NOTES: string;
  OWNER_ID: number;
  PHONE_PREFIX: string;
  USER_ID: number;
}

export type GetArchivedHKTasksParams = {
  property_id: number;
  from_date: string;
  to_date: string;
  filtered_by_hkm?: number[];
  filtered_by_unit?: number[];
  is_export_to_excel?: boolean;
};

export type SetExposedUnitHKStatusParams = {
  property_id: number;
  status: {
    code: RoomHkStatus;
  };
  unit: {
    id: number;
  };
};

export type GetHkTasksParams = {
  property_id: number;
  from_date: string;
  to_date: string;
  housekeepers?: { id: number }[];
  cleaning_frequency?: string;
  dusty_window?: string;
  highlight_window?: string;
  is_export_to_excel?: boolean;
  language: string;
};

export type ExecuteHKActionParams = {
  actions: {
    unit_id: number;
    hkm_id: number;
    description: string;
    booking_nbr?: string | number;
    status: '001' | '004';
    hk_task_type_code: string;
    comment?: string;
  }[];
};

export type GetHkIssuesParams = { unit_id?: number; property_id: number };

export const GetExposedHKSetupParamsSchema = LanguageSchema.extend({
  property_id: PropertyIdSchema,
});
export type GetExposedHKSetupParams = z.infer<typeof GetExposedHKSetupParamsSchema>;
