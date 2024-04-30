import { MissingTokenError, Token } from '@/models/Token';
import app_store from '@/stores/app.store';
import { TSignInValidator, TSignUpValidator } from '@/validators/auth.validator';
import axios from 'axios';

export class AuthService extends Token {
  public async login(params: TSignInValidator) {
    const token = this.getToken();
    if (!token) {
      throw new MissingTokenError();
    }
    const { data } = await axios.post(`/Exposed_Guest_SignIn?Ticket=${token}`, params);
    if (data['ExceptionMsg'] !== '') {
      throw new Error(data['ExceptionMsg']);
    }
    localStorage.setItem('ir-token', data['My_Result']);
    app_store.app_data.token = data['My_Result'];
  }
  public async signUp(params: TSignUpValidator) {
    const token = this.getToken();
    if (!token) {
      throw new MissingTokenError();
    }
    const { data } = await axios.post(`/Exposed_Guest_SignUp?Ticket=${token}`, params);
    if (data['ExceptionMsg'] !== '') {
      throw new Error(data['ExceptionMsg']);
    }
    localStorage.setItem('ir-token', data['My_Result']);
    app_store.app_data.token = data['My_Result'];
  }
}
