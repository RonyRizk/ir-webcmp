import { RoomHkStatus } from '@/models/booking.dto';
import { ArchivedTask, IExposedHouseKeepingSetup, IInspectionMode, IPropertyHousekeepingAssignment, THKUser, TPendingHkSetupParams } from '@/models/housekeeping';
import { updateHKStore } from '@/stores/housekeeping.store';
import axios from 'axios';
export type HKSkipParams = { HK_SKIP_ID: number; BOOK_NBR: string; PR_ID: number; DATE: string; HK_SKIP_REASON_CODE: '001'; COMMENT: string };
export class HouseKeepingService {
  public async getExposedHKSetup(property_id: number): Promise<IExposedHouseKeepingSetup> {
    const { data } = await axios.post(`/Get_Exposed_HK_Setup`, {
      property_id,
    });
    updateHKStore('hk_criteria', data['My_Result']);
    return data['My_Result'];
  }
  public async getExposedHKStatusCriteria(property_id: number): Promise<IExposedHouseKeepingSetup> {
    const { data } = await axios.post(`/Get_Exposed_HK_Status_Criteria`, { property_id });
    updateHKStore('hk_tasks', data['My_Result']);
    return data['My_Result'];
  }
  public async editHkSkip(params: HKSkipParams) {
    const { data } = await axios.post(`/Edit_Hk_skip`, params);
    return data;
  }
  public async getArchivedHKTasks(params: {
    property_id: number;
    from_date: string;
    to_date: string;
    filtered_by_hkm?: number[];
    filtered_by_unit?: number[];
    is_export_to_excel?: boolean;
  }): Promise<{ tasks: ArchivedTask[]; url: string } | null> {
    const { data } = await axios.post(`/Get_Archived_HK_Tasks`, params);
    return { url: data.My_Params_Get_Archived_HK_Tasks.Link_excel, tasks: data['My_Result'] ?? [] };
  }

  public async setExposedInspectionMode(property_id: number, mode: IInspectionMode) {
    const { data } = await axios.post(`/Set_Exposed_Inspection_Mode`, {
      property_id,
      mode,
    });
    return data['My_Result'];
  }
  public async manageExposedAssignedUnitToHKM(property_id: number, assignments: IPropertyHousekeepingAssignment[]) {
    const { data } = await axios.post(`/Manage_Exposed_Assigned_Unit_To_HKM`, {
      property_id,
      links: assignments,
    });
    return data['My_Result'];
  }
  public async editExposedHKM(params: THKUser, is_to_remove: boolean = false) {
    const { data } = await axios.post(`/Edit_Exposed_HKM`, { ...params, is_to_remove });
    return data['My_Result'];
  }
  public async getHKPendingActions(params: TPendingHkSetupParams) {
    const { data } = await axios.post(`/Get_HK_Pending_Actions`, { ...params });
    updateHKStore(
      'pending_housekeepers',
      [...data['My_Result']].map(d => ({ original: d, selected: false })),
    );
    return data['My_Result'];
  }
  public async setExposedUnitHKStatus(params: {
    property_id: number;
    status: {
      code: RoomHkStatus;
    };
    unit: {
      id: number;
    };
  }) {
    const { data } = await axios.post(`/Set_Exposed_Unit_HK_Status`, { ...params });
    return data['My_Result'];
  }
  public async getHkTasks(params: {
    property_id: number;
    from_date: string;
    to_date: string;
    housekeepers?: { id: number }[];
    cleaning_frequency?: string;
    dusty_window?: string;
    highlight_window?: string;
    is_export_to_excel?: boolean;
  }) {
    const { data } = await axios.post('/Get_HK_Tasks', params);
    if (data.ExceptionMsg !== '') {
      throw new Error(data.ExceptionMsg);
    }
    return { url: data.My_Params_Get_HK_Tasks?.Link_excel, tasks: data.My_Result };
  }
  public async executeHKAction(params: {
    actions: {
      unit_id: number;
      hkm_id: number;
      description: string;
      booking_nbr?: string | number;
      status: '001' | '004';
    }[];
  }) {
    await axios.post(`/Execute_HK_Action`, { ...params });
  }
  public async generateUserName(name: string) {
    const { data } = await axios.post(`/Generate_UserName`, { name });
    return data.My_Result;
  }
}
