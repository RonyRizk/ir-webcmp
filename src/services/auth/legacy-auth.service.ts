import axios from 'axios';

/** `My_Result` of `IsAuthenticated_JSON` — only the fields the login flow reads are typed. */
export interface LegacyUserInfo {
  Ticket: string;
  OwnerID: number;
  IsRequireOTP?: boolean;
  [key: string]: unknown;
}

/** `My_Result` of `Get_Startup_Data`, keyed as the backend sends it. */
export interface LegacyStartupData {
  My_SetupEntries: unknown;
  My_Languages: unknown;
  My_Currencies: unknown;
  My_Countries: unknown;
  My_Hotel_chain: unknown;
  My_Food_arrangement_light: unknown;
  My_Card: unknown;
  My_Amenity_light: unknown;
  My_Bedding_light: unknown;
  My_Gw: unknown;
}

/** `ajaxHelper` retried a call this many times when the database reported a deadlock. */
const DEADLOCK_RETRIES = 3;

/**
 * The back-office login endpoints of the app's own WCF service (`AppWCF.svc`),
 * called the way `ajaxHelper` / `prepareApiUri` in `js/CommonLibrary.js` call them:
 * `POST {apiUrl}{method}?Ticket={ticket}` with a JSON body.
 *
 * Goes through the shared axios instance like every other service, so its interceptors
 * apply — the language injector included. Requests use an absolute URL: axios then
 * ignores the shared gateway `baseURL`, and `ApiClient`'s alpha/IRBE routing with it.
 *
 * Stateless and free of storage writes — `ir-auth` owns the flow and persists
 * what the rest of the extranet reads from `localStorage`.
 */
export class LegacyAuthService {
  private baseUrl: string;

  /** @param apiUrl The WCF base, e.g. `AppWCF.svc/` (relative to the page) or `_apiUri`. */
  constructor(apiUrl: string) {
    this.baseUrl = new URL(apiUrl.endsWith('/') ? apiUrl : `${apiUrl}/`, document.baseURI).href;
  }

  public async isAuthenticated({ username, password }: { username: string; password: string }): Promise<LegacyUserInfo> {
    return this.request<LegacyUserInfo>('IsAuthenticated_JSON', {
      My_UserInfo: { UserName: username, Password: password },
      My_Enum_Authentication_Mode: 0,
      IS_BACK_OFFICE: true,
    });
  }

  /** The server returns an Int64; compare it as a string against what `localStorage` holds. */
  public async getStartupDataSignature(ownerId: number, ticket: string): Promise<number | string> {
    return this.request<number | string>('Get_Startup_Data_Signature', { OWNER_ID: ownerId }, ticket);
  }

  public async getStartupData(ownerId: number, language: string, ticket: string): Promise<LegacyStartupData> {
    return this.request<LegacyStartupData>(
      'Get_Startup_Data',
      {
        IS_BACK_OFFICE: true,
        OWNER_ID: ownerId,
        LANGUAGE_ABBREVIATION: language,
      },
      ticket,
    );
  }

  /** Mails the password of `username`. Resolves to the (masked) address it was sent to. */
  public async forgotPassword(username: string): Promise<string> {
    return this.request<string>('Forgot_Password', {
      USERNAME: username,
      My_Enum_Forgot_Password_Mode: 0, // By USERNAME
      ENVIRONMENT_USER_ID: 2,
      LANGUAGE_ABBREVIATION: '',
    });
  }

  public async forgotUsername(email: string): Promise<unknown> {
    return this.request('Forgot_UserName', {
      EMAIL: email,
      My_Enum_Forgot_Password_Mode: 1, // By EMAIL
      ENVIRONMENT_USER_ID: 2,
    });
  }

  /**
   * An `ExceptionMsg` rejects either way: `ir-interceptor`, when mounted, throws it as an
   * `InterceptorError` before the response gets here; without it, this method throws.
   */
  private async request<T>(method: string, params: Record<string, unknown>, ticket = ''): Promise<T> {
    for (let attempt = 0; ; attempt++) {
      try {
        const { data } = await axios.post(`${this.baseUrl}${method}?Ticket=${encodeURIComponent(ticket)}`, params, {
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
        });
        const exception = String(data?.ExceptionMsg ?? '').trim();
        if (exception) {
          throw new Error(exception);
        }
        return data?.My_Result as T;
      } catch (error) {
        const deadlocked = error instanceof Error && error.message.includes('deadlocked');
        if (!deadlocked || attempt >= DEADLOCK_RETRIES) {
          throw error;
        }
      }
    }
  }
}
