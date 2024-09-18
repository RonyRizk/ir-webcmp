import axios from 'axios';
import { IPayment } from '@/models/booking.dto';
import { Token } from '@/models/Token';
export interface IPaymentAction {
  amount: number;
  currency: {
    code: string;
    id: number;
    symbol: string;
  };
  due_on: string;
  type: 'overdue' | 'future';
}
export class PaymentService extends Token {
  public async AddPayment(payment: IPayment, book_nbr: string): Promise<any> {
    try {
      const token = this.getToken();
      if (token !== null) {
        const { data } = await axios.post(`/Do_Payment?Ticket=${token}`, { payment: { ...payment, book_nbr } });
        if (data.ExceptionMsg !== '') {
          throw new Error(data.ExceptionMsg);
        }
        return data.My_Result;
      }
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  public async CancelPayment(id: number): Promise<any> {
    try {
      const token = this.getToken();
      if (token !== null) {
        const { data } = await axios.post(`/Cancel_Payment?Ticket=${token}`, { id });
        if (data.ExceptionMsg !== '') {
          throw new Error(data.ExceptionMsg);
        }
        return data.My_Result;
      }
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }
  public async GetExposedCancelationDueAmount(params: { booking_nbr: string; currency_id: number }): Promise<IPaymentAction[]> {
    try {
      const token = this.getToken();
      if (token !== null) {
        const { data } = await axios.post(`/Get_Exposed_Cancelation_Due_Amount?Ticket=${token}`, params);
        if (data.ExceptionMsg !== '') {
          throw new Error(data.ExceptionMsg);
        }
        return data.My_Result;
      }
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }
}
