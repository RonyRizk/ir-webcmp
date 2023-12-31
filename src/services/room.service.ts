import axios from 'axios';
import { store } from '../redux/store';
import { addLanguages } from '../redux/features/languages';

export class RoomService {
  public async fetchData(id: number, language: string): Promise<{ [key: string]: any }> {
    try {
      const token = JSON.parse(sessionStorage.getItem('token'));
      if (token !== null) {
        const { data } = await axios.post(`/Get_Exposed_Property?Ticket=${token}`, { id, language });
        if (data.ExceptionMsg !== '') {
          throw new Error(data.ExceptionMsg);
        }
        return data;
      }
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }
  public async fetchLanguage(code: string): Promise<{ [key: string]: any }> {
    try {
      const token = JSON.parse(sessionStorage.getItem('token'));
      if (token !== null) {
        const { data } = await axios.post(`/Get_Exposed_Language?Ticket=${token}`, { code });
        if (data.ExceptionMsg !== '') {
          throw new Error(data.ExceptionMsg);
        }
        let entries = this.transformArrayToObject(data.My_Result.entries);
        store.dispatch(addLanguages({ entries, direction: data.My_Result.direction }));
        return { entries, direction: data.My_Result.direction };
      }
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }
  private transformArrayToObject(data: any) {
    let object: any = {};
    for (const d of data) {
      object[d.code] = d.description;
    }
    return object;
  }
}
