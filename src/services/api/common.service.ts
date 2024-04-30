import axios from 'axios';
import { MissingTokenError, Token } from '../../models/Token';
import app_store from '@/stores/app.store';

export class CommonService extends Token {
  public async getCurrencies() {
    const token = this.getToken();
    if (!token) {
      throw new MissingTokenError();
    }
    const { data } = await axios.post(`/Get_Exposed_Currencies?Ticket=${token}`);
    app_store.currencies = [...data['My_Result']];
    return data['My_Result'];
  }
  public async getExposedLanguages() {
    const token = this.getToken();
    if (!token) {
      throw new MissingTokenError();
    }
    const { data } = await axios.post(`/Get_Exposed_Languages?Ticket=${token}`);
    return data['My_Result'];
  }
  public async getCountries(language: string) {
    try {
      const token = this.getToken();
      if (token) {
        const { data } = await axios.post(`/Get_Exposed_Countries?Ticket=${token}`, {
          language,
        });
        if (data.ExceptionMsg !== '') {
          throw new Error(data.ExceptionMsg);
        }
        return data.My_Result;
      }
    } catch (error) {
      console.error(error);
      throw new Error(error);
    }
  }
  public async getUserDefaultCountry() {
    try {
      const token = this.getToken();
      if (token) {
        const { data } = await axios.post(`/Get_Country_By_IP?Ticket=${token}`, {
          IP: '',
        });
        if (data.ExceptionMsg !== '') {
          throw new Error(data.ExceptionMsg);
        }
        return data['My_Result'];
      }
    } catch (error) {
      console.error(error);
      throw new Error(error);
    }
  }
  public async getExposedCountryByIp() {
    try {
      const token = this.getToken();
      if (token) {
        const { data } = await axios.post(`/Get_Exposed_Country_By_IP?Ticket=${token}`, {
          IP: '',
          lang: 'en',
        });
        if (data.ExceptionMsg !== '') {
          throw new Error(data.ExceptionMsg);
        }
        app_store.userDefaultCountry = data['My_Result'];
        return data['My_Result'];
      }
    } catch (error) {
      console.error(error);
      throw new Error(error);
    }
  }
  public async getBEToken() {
    try {
      const { data } = await axios.post(`/Get_BE_Token`, {});
      if (data.ExceptionMsg !== '') {
        throw new Error(data.ExceptionMsg);
      }
      return data['My_Result'];
    } catch (error) {
      console.error(error);
      throw new Error(error);
    }
  }
}
