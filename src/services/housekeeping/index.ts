import {
  OverrideHKTaskOwnershipParamsSchema,
  SkipHKTasksParamsSchema,
  ResolveHKIssueParamsSchema,
  SetHKTaskLabelsParamsSchema,
  type ArchivedTask,
  type HKIssue,
  type IExposedHouseKeepingSetup,
  type IInspectionMode,
  type THKUser,
  type IPropertyHousekeepingAssignment,
  type OverrideHKTaskOwnershipParams,
  type SetHKTaskLabelsParams,
  type SkipHKTasksParams,
  type ResolveHKIssueParams,
  type TPendingHkSetupParams,
} from '@/models/housekeeping';
import { updateHKStore } from '@/stores/housekeeping.store';
import axios from 'axios';
import {
  GetExposedHKSetupParams,
  GetExposedHKSetupParamsSchema,
  type ConnectedHK,
  type ExecuteHKActionParams,
  type GetArchivedHKTasksParams,
  type GetHkIssuesParams,
  type GetHkTasksParams,
  type SetExposedUnitHKStatusParams,
} from './types';

export * from './types';

export class HouseKeepingService {
  public async getExposedHKSetup(params: GetExposedHKSetupParams): Promise<IExposedHouseKeepingSetup> {
    const payload = GetExposedHKSetupParamsSchema.parse(params);
    const { data } = await axios.post(`/Get_Exposed_HK_Setup`, payload);
    if (data.ExceptionMsg !== '') {
      throw new Error(data.ExceptionMsg);
    }
    updateHKStore('hk_criteria', data['My_Result']);
    return data['My_Result'];
  }
  public async resolveHKIssue(params: ResolveHKIssueParams) {
    const payload = ResolveHKIssueParamsSchema.parse(params);
    const { data } = await axios.post('/Resolve_HK_Issue', payload);
    if (data.ExceptionMsg !== '') {
      throw new Error(data.ExceptionMsg);
    }
    return data['My_Result'];
  }
  public async overrideHKTaskOwnership(params: OverrideHKTaskOwnershipParams) {
    const payload = OverrideHKTaskOwnershipParamsSchema.parse(params);
    const { data } = await axios.post(`/Override_HK_Task_Ownership`, payload);
    if (data.ExceptionMsg !== '') {
      throw new Error(data.ExceptionMsg);
    }
    return data['My_Result'];
  }

  public async setHKTaskLabels(params: SetHKTaskLabelsParams) {
    const payload = SetHKTaskLabelsParamsSchema.parse(params);
    const { data } = await axios.post(`/Set_HK_Task_Labels`, payload);
    if (data.ExceptionMsg !== '') {
      throw new Error(data.ExceptionMsg);
    }
    return data['My_Result'];
  }

  public async getExposedHKStatusCriteria(property_id: number): Promise<IExposedHouseKeepingSetup> {
    const { data } = await axios.post(`/Get_Exposed_HK_Status_Criteria`, { property_id });
    if (data.ExceptionMsg !== '') {
      throw new Error(data.ExceptionMsg);
    }
    updateHKStore('hk_tasks', data['My_Result']);
    return data['My_Result'];
  }

  public async skipHKTasks(params: SkipHKTasksParams) {
    const payload = SkipHKTasksParamsSchema.parse(params);
    const { data } = await axios.post(`/Skip_HK_Tasks`, payload);
    if (data.ExceptionMsg !== '') {
      throw new Error(data.ExceptionMsg);
    }
    return data;
  }

  public async getArchivedHKTasks(params: GetArchivedHKTasksParams): Promise<{ tasks: ArchivedTask[]; url: string } | null> {
    const { data } = await axios.post(`/Get_Archived_HK_Tasks`, params);
    if (data.ExceptionMsg !== '') {
      throw new Error(data.ExceptionMsg);
    }
    return { url: data.My_Params_Get_Archived_HK_Tasks.Link_excel, tasks: data['My_Result'] ?? [] };
  }

  public async setExposedInspectionMode(property_id: number, mode: IInspectionMode) {
    const { data } = await axios.post(`/Set_Exposed_Inspection_Mode`, {
      property_id,
      mode,
    });
    if (data.ExceptionMsg !== '') {
      throw new Error(data.ExceptionMsg);
    }
    return data['My_Result'];
  }

  public async manageExposedAssignedUnitToHKM(property_id: number, assignments: IPropertyHousekeepingAssignment[]) {
    const { data } = await axios.post(`/Manage_Exposed_Assigned_Unit_To_HKM`, {
      property_id,
      links: assignments,
    });
    if (data.ExceptionMsg !== '') {
      throw new Error(data.ExceptionMsg);
    }
    return data['My_Result'];
  }

  public async editExposedHKM(params: THKUser, is_to_remove: boolean = false) {
    const { data } = await axios.post(`/Edit_Exposed_HKM`, { ...params, is_to_remove });
    if (data.ExceptionMsg !== '') {
      throw new Error(data.ExceptionMsg);
    }
    return data['My_Result'];
  }

  public async getHKPendingActions(params: TPendingHkSetupParams) {
    const { data } = await axios.post(`/Get_HK_Pending_Actions`, { ...params });
    updateHKStore(
      'pending_housekeepers',
      [...data['My_Result']].map(d => ({ original: d, selected: false })),
    );
    if (data.ExceptionMsg !== '') {
      throw new Error(data.ExceptionMsg);
    }
    return data['My_Result'];
  }

  public async setExposedUnitHKStatus(params: SetExposedUnitHKStatusParams) {
    const { data } = await axios.post(`/Set_Exposed_Unit_HK_Status`, { ...params });
    if (data.ExceptionMsg !== '') {
      throw new Error(data.ExceptionMsg);
    }
    return data['My_Result'];
  }

  public async getHkTasks(params: GetHkTasksParams) {
    const { data } = await axios.post('/Get_HK_Tasks', params);
    if (data.ExceptionMsg !== '') {
      throw new Error(data.ExceptionMsg);
    }
    return { url: data.My_Params_Get_HK_Tasks?.Link_excel, tasks: data.My_Result };
  }

  public async executeHKAction(params: ExecuteHKActionParams) {
    const { data } = await axios.post(`/Execute_HK_Action`, { ...params });
    if (data.ExceptionMsg !== '') {
      throw new Error(data.ExceptionMsg);
    }
  }

  public async generateUserName(name: string) {
    const { data } = await axios.post(`/Generate_UserName`, { name });
    if (data.ExceptionMsg !== '') {
      throw new Error(data.ExceptionMsg);
    }
    return data.My_Result;
  }

  public async getHkIssues(params: GetHkIssuesParams): Promise<HKIssue[]> {
    try {
      const { data } = await axios.post('/Get_HK_Issues', params);
      if (data.ExceptionMsg !== '') {
        throw new Error(data.ExceptionMsg);
      }
      return data['My_Result'] ?? [];
    } catch {
      return [];
    }
  }

  public async getConnectedHk(): Promise<ConnectedHK> {
    const { data } = await axios.post('/Get_Connected_HK', {});
    if (data.ExceptionMsg !== '') {
      throw new Error(data.ExceptionMsg);
    }
    return data['My_Result'];
  }
}
