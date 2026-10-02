import axios from 'axios';
import { Booking } from '@/models/booking.dto';
import { extras } from '@/utils/utils';
import {
  AssignUnitParams,
  AssignUnitParamsSchema,
  GetAggregatedUnAssignedRoomsByDateRangeParams,
  GetAggregatedUnAssignedRoomsByDateRangeParamsSchema,
  GetAggregatedUnAssignedRoomsByDateRangeResult,
} from './types';

export class UnassignedUnitsService {
  public async assignUnit(props: AssignUnitParams): Promise<Booking> {
    try {
      const payload = AssignUnitParamsSchema.parse(props);
      const { data } = await axios.post(`/Assign_Exposed_Room`, {
        ...payload,
        extras,
      });
      if (data.ExceptionMsg !== '') {
        throw new Error(data.ExceptionMsg);
      }
      return data['My_Result'];
    } catch (error) {
      console.error(error);
      throw new Error(error);
    }
  }
  public async getAggregatedUnAssignedRoomsByDateRange(params: GetAggregatedUnAssignedRoomsByDateRangeParams): Promise<GetAggregatedUnAssignedRoomsByDateRangeResult> {
    const payload = GetAggregatedUnAssignedRoomsByDateRangeParamsSchema.parse(params);
    const { data } = await axios.post('/Get_UnAssigned_Dates_Light', payload);
    if (data.ExceptionMsg !== '') {
      throw new Error(data.ExceptionMsg);
    }
    return data.My_Result as GetAggregatedUnAssignedRoomsByDateRangeResult;
  }
}
