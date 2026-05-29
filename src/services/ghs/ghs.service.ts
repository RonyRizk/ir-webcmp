import axios from 'axios';
import {
  GHS_Candidate_Property,
  Params_Get_GHS_Candidate_Properties,
  Params_Generate_GHS_Listing_For_Selection,
  Params_Get_GHS_Candidate_Properties_Schema,
  Params_Generate_GHS_Listing_For_Selection_Schema,
} from './types';

export class GHSService {
  public async Get_GHS_Candidate_Properties(params: Params_Get_GHS_Candidate_Properties): Promise<GHS_Candidate_Property[]> {
    const validatedParams = Params_Get_GHS_Candidate_Properties_Schema.parse(params);
    const { data } = await axios.post(`/Get_GHS_Candidate_Properties`, validatedParams);
    
    if (data.ExceptionMsg !== '') {
      throw new Error(data.ExceptionMsg);
    }
    
    return data.My_Result || [];
  }

  public async Generate_GHS_Listing_For_Selection(params: Params_Generate_GHS_Listing_For_Selection): Promise<string> {
    const validatedParams = Params_Generate_GHS_Listing_For_Selection_Schema.parse(params);
    const { data } = await axios.post(`/Generate_GHS_Listing_For_Selection`, validatedParams);
    
    if (data.ExceptionMsg !== '') {
      throw new Error(data.ExceptionMsg);
    }

    return data.My_Result;
  }
}
