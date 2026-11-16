import axios from 'axios';
import { ParamsGetMealReport, ParamsGetMealReportSchema, ParamsSetHBPreference, ParamsSetHBPreferenceSchema, GetMealReportResult } from './types';

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
}
