import axios from 'axios';
import { DpReport, GetDPBookingsReportParams, GetDPBookingsReportParamsSchema } from './types';

export class DpReportService {
  /** Callers are expected to have already resolved property_id/property_ids/channel for the user's privilege level. */
  public async getDPBookingsReport(params: GetDPBookingsReportParams): Promise<DpReport> {
    const payload = GetDPBookingsReportParamsSchema.parse(params);
    const { data } = await axios.post(`/Get_DP_Bookings_Report`, payload);
    return { bookings: [...data.My_Result.bookings], summary: data.My_Result.summary };
  }
}
