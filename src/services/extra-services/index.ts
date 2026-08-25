import axios from 'axios';
import {
  ExtraServiceDefinition,
  GetExposedExtraServicesProps,
  GetExposedExtraServicesPropsSchema,
  HandleExposedExtraServiceProps,
  HandleExposedExtraServicePropsSchema,
} from './types';

export * from './types';

export const extraServicesCategories = new Set(['ECI', 'LCO', 'BCT', 'EXB', 'HMP', 'ANP', 'BRF', 'LNC', 'DIN', 'HBD', 'FBD', 'MNB', 'DUZ']);

export class ExtraServicesService {
  public async getExposedExtraServices(props: GetExposedExtraServicesProps): Promise<ExtraServiceDefinition[]> {
    const payload = GetExposedExtraServicesPropsSchema.parse(props);
    const { data } = await axios.post('/Get_Exposed_Extra_Services', payload);
    if (data.ExceptionMsg !== '') {
      throw new Error(data.ExceptionMsg);
    }
    return data.My_Result ?? [];
  }

  public async handleExposedExtraService(props: HandleExposedExtraServiceProps): Promise<ExtraServiceDefinition> {
    const payload = HandleExposedExtraServicePropsSchema.parse(props);
    const { data } = await axios.post('/Handle_Exposed_Extra_Service', payload);
    if (data.ExceptionMsg !== '') {
      throw new Error(data.ExceptionMsg);
    }
    return data.My_Result;
  }
}
