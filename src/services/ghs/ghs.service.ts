import Token from '../../models/Token';
import axios from 'axios';

export interface GHS_Candidate_Property {
  AC_ID: number;
  NAME: string;
  aname: string;
  level2: string;
  COUNTRY_ID: number;
}

export interface Params_Get_GHS_Candidate_Properties {
  COUNTRY_ID?: number;
}

export interface Params_Generate_GHS_Listing_For_Selection {
  Selected_AC_IDs: number[];
}

export class GHSService {
  private baseUrl = 'https://gateway.igloorooms.com/IR'; // Correct gateway URL
  private tokenObj = new Token();

  public async Get_GHS_Candidate_Properties(params: Params_Get_GHS_Candidate_Properties): Promise<GHS_Candidate_Property[]> {
    try {
      const token = this.tokenObj.getToken();
      if (!token) throw new Error('No token found');

      const response = await axios.post(
        `${this.baseUrl}/Get_GHS_Candidate_Properties`,
        params,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data.My_Result || [];
    } catch (error) {
      console.error('Error fetching GHS candidate properties:', error);
      throw error;
    }
  }

  public async Generate_GHS_Listing_For_Selection(params: Params_Generate_GHS_Listing_For_Selection): Promise<string> {
    try {
      const token = this.tokenObj.getToken();
      if (!token) throw new Error('No token found');

      const response = await axios.post(
        `${this.baseUrl}/Generate_GHS_Listing_For_Selection`,
        params,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data.My_Result;
    } catch (error) {
      console.error('Error generating GHS listing:', error);
      throw error;
    }
  }
}