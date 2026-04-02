import { z } from 'zod';

export const SetHKTaskLabelsParamsSchema = z.object({
  property_id: z.number(),
  t1_label: z.string().optional(),
  t1_freq: z.string().optional(),
  t2_label: z.string().optional(),
  t2_freq: z.string().optional(),
});
export type SetHKTaskLabelsParams = z.infer<typeof SetHKTaskLabelsParamsSchema>;

export const ResolveHKIssueParamsSchema = z.object({
  issue_ids: z.array(z.number().min(0)),
});
export type ResolveHKIssueParams = z.infer<typeof ResolveHKIssueParamsSchema>;

export const OverrideHKTaskOwnershipParamsSchema = z.object({
  property_id: z.number(),
  is_to_remove: z.boolean().optional().default(false),
  assignments: z.array(
    z.object({
      PR_ID: z.number(),
      DATE: z.string(),
      HK_TASK_TYPE_CODE: z.string(),
      HKM_ID: z.number().nullable(),
    }),
  ),
});
export type OverrideHKTaskOwnershipParams = z.infer<typeof OverrideHKTaskOwnershipParamsSchema>;
export interface IExposedHouseKeepingSetup {
  statuses: IHKStatuses[];
  housekeepers: IHouseKeepers[];
  units_assignments: IUnitAssignments;
  cleaning_frequencies: ExposedHKSetup[];
  cleaning_periods: ExposedHKSetup[];
  dusty_periods: ExposedHKSetup[];
  highlight_checkin_options: ExposedHKSetup[];
  t1_config: HousekeepingTasksConfig;
  t2_config: HousekeepingTasksConfig;
}
export interface HousekeepingTasksConfig {
  freq: string;
  label: string;
}
export interface ExposedHKSetup {
  code: string;
  description: string;
}

export interface IHouseKeepers {
  id: number;
  is_active: boolean;
  is_soft_deleted: boolean;
  mobile: string;
  name: string;
  note: string;
  password: string;
  property_id: number;
  phone_prefix: string;
  username: string;
  assigned_units: IUnit[];
}
export type THKUser = Omit<IHouseKeepers, 'is_soft_deleted' | 'is_active' | 'assigned_units'>;
export type TPendingHkSetupParams = {
  property_id: number;
  bracket: {
    code: string;
  };
  housekeeper: {
    id: number;
  };
};
export interface IHKTasks {
  brackets: IBrackets[];
  housekeepers: IHouseKeepers[];
}
export interface IBrackets {
  code: string;
  description: string;
}
export interface IUnit {
  calendar_cell: string | null;
  housekeeper: null;
  id: number;
  name: string;
  is_active: boolean;
}
export interface IUnitAssignments {
  assigned: number;
  total: number;
  un_assigned: number;
  unassigned_units: IUnit[];
}
export interface IHKStatuses {
  action: string;
  code: string;
  description: string;
  inspection_mode: IInspectionMode;
  style: IHKStatusesStyle;
}
export interface IHKStatusesStyle {
  color: string;
  shape: TShape;
}
export interface IInspectionMode {
  is_active: boolean;
  window: number;
}
export type TShape = 'smallcircle' | 'bigcircle';

export interface ICauseBase {
  type: string;
}
export interface IUnassignedUnitsCause extends ICauseBase {
  type: 'unassigned_units';
  user: IHouseKeepers | null;
}
export interface IUserCause extends ICauseBase {
  type: 'user';
  isEdit: boolean;
  user: THKUser | null;
}
export interface IDeleteCause extends ICauseBase {
  type: 'delete';
  user: IHouseKeepers;
}

export type THousekeepingTrigger = IUnassignedUnitsCause | IUserCause | IDeleteCause;
export interface IPropertyHousekeepingAssignment {
  hkm_id: number;
  unit_id: number;
  is_to_assign: boolean;
}
export interface IPendingActions {
  arrival: string;
  arrival_time: string;
  housekeeper: IHouseKeepers;
  status: IHKStatuses;
  unit: IUnit;
}
export interface ArchivedTask {
  booking_nbr: string;
  date: string;
  house_keeper: string;
  unit: string;
}
export interface HKIssue {
  date: string;
  description: string;
  hka_id: number;
  housekeeper_name: string;
  id: number;
  unit: Unit;
  hour: number | null;
  minute: number | null;
}

export interface Unit {
  id: number;
  name: string;
}

export interface Task {
  id: string;
  adult: number;
  child: number;
  date: string;
  is_highlight: boolean;
  formatted_date: string;
  hint: string;
  hkm_id: number;
  task_type: {
    code: 'CLN' | 'T1' | 'T2';
    description: string;
  };
  infant: number;
  status: TaskStatus;
  unit: IUnit;
  housekeeper: string;
  booking_nbr: string | null;
  extra_task: Task[] | null;
}
export type TaskStatus = {
  code: string;
  description: string;
};

export type TaskStatusCode = 'IH' | 'CI' | 'CO' | 'VA';

export type CleanTaskEvent = {
  task: Task;
  status?: '001' | '004';
};

export const SkipHKTasksParamsSchema = z.object({
  property_id: z.number(),
  tasks_to_skip: z.array(
    z.object({
      unit_id: z.number(),
      booking_nbr: z.string(),
      date: z.string(),
      reason_code: z.string().optional().default('001'),
    }),
  ),
});
export type SkipHKTasksParams = z.infer<typeof SkipHKTasksParamsSchema>;
