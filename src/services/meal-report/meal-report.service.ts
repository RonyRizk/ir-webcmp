import axios from 'axios';
import { ParamsGetMealReport, ParamsGetMealReportSchema, ParamsSetHBPreference, ParamsSetHBPreferenceSchema, GetMealReportResult } from './types';
import { TableEntries } from '../booking-service/types';
import { IEntries } from '@/models/IBooking';

export class MealReportService {
  public async getMealReport(props: ParamsGetMealReport): Promise<GetMealReportResult> {
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
}
