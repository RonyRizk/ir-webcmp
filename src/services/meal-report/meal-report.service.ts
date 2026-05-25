import axios from 'axios';
import { ParamsGetMealReport, ParamsGetMealReportSchema, ParamsSetHBPreference, ParamsSetHBPreferenceSchema } from './types';
import { GroupedTableEntries, TableEntries } from '../booking-service/types';
import { IEntries } from '@/models/IBooking';

export class MealReportService {
  public async getMealReport(props: ParamsGetMealReport): Promise<any> {
    const payload = ParamsGetMealReportSchema.parse(props);
    const { data } = await axios.post(`/Get_Meal_Report`, payload);
    if (data.ExceptionMsg !== '') {
      throw new Error(data.ExceptionMsg);
    }
    return data;
  }

  public async setHBPreference(props: ParamsSetHBPreference): Promise<void> {
    const payload = ParamsSetHBPreferenceSchema.parse(props);
    const { data } = await axios.post(`/Set_HB_Preference`, payload);
    if (data.ExceptionMsg !== '') {
      throw new Error(data.ExceptionMsg);
    }
  }

  public async getSetupEntriesByTableNameMulti(entries: TableEntries[]): Promise<IEntries[]> {
    const { data } = await axios.post(`/Get_Setup_Entries_By_TBL_NAME_MULTI`, { TBL_NAMES: entries });
    if (data.ExceptionMsg !== '') {
      throw new Error(data.ExceptionMsg);
    }
    return data.My_Result;
  }

  public groupEntryTablesResult(entries: IEntries[]): GroupedTableEntries {
    let result: any = {};
    for (const entry of entries) {
      if (!entry.TBL_NAME) continue;
      const key = entry.TBL_NAME.startsWith('_') 
        ? entry.TBL_NAME.substring(1).toLowerCase() 
        : entry.TBL_NAME.toLowerCase();
        
      if (!result[key]) {
        result[key] = [];
      }
      result[key] = [...result[key], entry];
    }
    return result as GroupedTableEntries;
  }
}
