import axios from 'axios';
import Auth from './Auth';
import { requestLanguage } from './language-injector';

class ApiClient extends Auth {
  private baseUrl = 'https://gateway.igloorooms.com/IR';
  private static token: string | null = '';
  private static modifiedBaseUrl: boolean = false;
  private static isInterceptorAdded = false;
  private static isBaseUrlRouterAdded = false;
  private static isLanguageHeaderAdded = false;
  /**
   * Header carrying the language the request is sent in. `Accept-Language` is left to the browser.
   */
  public static readonly LANGUAGE_HEADER = 'Content-Language';
  private static readonly IRBE_BASE_URL = 'https://gateway.igloorooms.com/IRBE';
  /** Base URL used for every request when `window.environment === 'alpha'`. */
  private static readonly ALPHA_BASE_URL = 'https://gateway.igloorooms.com/IRALPHA';
  /** Endpoints served by the IRBE gateway instead of the default `/IR` base URL. */
  private static readonly IRBE_ENDPOINTS = new Set<string>([
    '/Set_Exposed_Restriction_Per_Room_Type',
    '/Get_Rooms_To_Check_In',
    '/Get_Rooms_To_Check_Out',
    '/Get_Exposed_Currencies',
  ]);

  constructor() {
    super();
    this.addBaseUrlRouter();
    ApiClient.addLanguageHeader();
    if (ApiClient.modifiedBaseUrl) {
      return;
    }
    ApiClient.modifiedBaseUrl = true;
    axios.defaults.baseURL = this.baseUrl;
  }
  private addBaseUrlRouter() {
    if (ApiClient.isBaseUrlRouterAdded) {
      return;
    }
    axios.interceptors.request.use(config => {
      if (ApiClient.isAlpha()) {
        config.baseURL = ApiClient.ALPHA_BASE_URL;
      }
      const path = config.url?.split('?')[0];
      if (!ApiClient.disableIrbeRouting() && path && ApiClient.IRBE_ENDPOINTS.has(path)) {
        config.baseURL = ApiClient.IRBE_BASE_URL;
      }
      return config;
    });
    ApiClient.isBaseUrlRouterAdded = true;
  }
  /**
   * Sends the request's language as `Content-Language` on every request, so the header always
   * agrees with the `language`/`lang` in the body (or query string on GET/HEAD): an explicit one
   * from a `lang` subtree, else the selected app language the injector fills in. Read per
   * request, so it follows a language switch. It only sets this header: the payload and
   * `Accept-Language` are untouched. Needs no ticket, so it is installed with the base URL
   * router rather than in {@link initialize}.
   */
  private static addLanguageHeader() {
    if (ApiClient.isLanguageHeaderAdded) {
      return;
    }
    axios.interceptors.request.use(config => {
      config.headers[ApiClient.LANGUAGE_HEADER] = requestLanguage(config);
      return config;
    });
    ApiClient.isLanguageHeaderAdded = true;
  }
  /** Read per request so a host page can set `window.environment` after this module loads. */
  private static isAlpha() {
    return typeof window !== 'undefined' && (window as Window & { environment?: string }).environment === 'alpha';
  }
  /** When true, `IRBE_ENDPOINTS` stay on the current base URL instead of IRBE. On in alpha. */
  private static disableIrbeRouting() {
    return ApiClient.isAlpha();
  }
  public getToken() {
    return ApiClient.token;
  }
  public setBaseUrl(url: string) {
    this.baseUrl = url;
    axios.defaults.baseURL = this.baseUrl;
  }
  private initialize() {
    if (ApiClient.isInterceptorAdded) {
      return;
    }
    axios.interceptors.request.use(config => {
      if (!ApiClient.token) {
        throw new MissingApiClientError();
      }
      config.headers.Authorization = ApiClient.token;
      config.headers['X-ClientId'] = 'EXTRANET';
      // config.params = config.params || {};
      // config.params.Ticket = ApiClient.token;
      return config;
    });

    ApiClient.isInterceptorAdded = true;
  }

  public setApiClient(token: string) {
    ApiClient.token = token;
    this.initialize();
  }
}
export default ApiClient;
export class MissingApiClientError extends Error {
  constructor(message = 'Missing token!!') {
    super(message);
    this.name = 'MissingApiClientError';
  }
}
