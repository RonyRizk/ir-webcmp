import axios, { type InternalAxiosRequestConfig } from 'axios';

/** Payload keys the gateway reads the request language from; city-ledger print endpoints use `lang`. */
const LANGUAGE_KEYS = ['language', 'lang'] as const;
/** Browsers drop a GET/HEAD body, so those carry the language as a query parameter instead. */
const BODYLESS_METHODS = new Set(['get', 'head']);

let installed = false;
/** Set by {@link installLanguageInjector}; the selected app language. */
let getLanguage: () => string = () => 'en';

const isMissing = (value: unknown) => value == null || value === '';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === '[object Object]';
}

/** Returns `record` with the language filled in, or `record` itself when it already has one. */
function withLanguage<T extends Record<string, unknown>>(record: T, language: string): T {
  const key = LANGUAGE_KEYS.find(k => k in record) ?? 'language';
  // Copy rather than mutate: callers may reuse the params object.
  return isMissing(record[key]) ? { ...record, [key]: language } : record;
}

/** Same as {@link withLanguage} for `FormData` / `URLSearchParams`, which are appended to in place. */
function appendLanguage(form: FormData | URLSearchParams, language: string): void {
  const key = LANGUAGE_KEYS.find(k => form.has(k)) ?? 'language';
  if (isMissing(form.get(key))) {
    form.set(key, language);
  }
}

/** A pre-serialized JSON object body, parsed so it can be filled in; anything else stays as is. */
function parseJsonObject(body: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(body);
    return isPlainObject(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function injectLanguage(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
  const language = getLanguage();

  if (BODYLESS_METHODS.has(config.method?.toLowerCase() ?? 'get')) {
    if (config.params instanceof URLSearchParams) {
      appendLanguage(config.params, language);
    } else if (config.params == null || isPlainObject(config.params)) {
      config.params = withLanguage(config.params ?? {}, language);
    }
    return config;
  }

  const { data } = config;
  if (data == null) {
    config.data = { language };
  } else if (isPlainObject(data)) {
    config.data = withLanguage(data, language);
  } else if ((typeof FormData !== 'undefined' && data instanceof FormData) || data instanceof URLSearchParams) {
    appendLanguage(data, language);
  } else if (typeof data === 'string') {
    // Stays a string, so the caller's Content-Type still describes the body.
    const parsed = parseJsonObject(data);
    if (parsed) {
      const filled = withLanguage(parsed, language);
      if (filled !== parsed) {
        config.data = JSON.stringify(filled);
      }
    }
  }
  return config;
}

/**
 * Gives every request on the shared axios instance the selected language — in the body,
 * or the query string for GET/HEAD — read per request through `language` so calls follow
 * a language switch without each service threading it through. Independent of
 * authentication: it does not need a ticket or an `ApiClient`.
 *
 * An explicit non-empty value wins: components inside a `lang` subtree pass
 * `LocaleController.languageFor(el)` themselves.
 *
 * Installed by `ir-interceptor`, and by `LocaleController` as soon as it loads — a screen
 * root fires its first requests from `componentWillLoad`, before its `<ir-interceptor>`
 * child has loaded, and it always reaches `LocaleController` first. Takes the language as
 * a callback rather than importing `LocaleController`, which would make that a cycle.
 * Idempotent; the first caller's `language` wins.
 *
 * Not from `src/global/app.ts`: `LocaleController` pulls in the locale store, which must
 * not be created in the global-script bundle (see the note there).
 */
export function installLanguageInjector(language: () => string): void {
  if (installed) {
    return;
  }
  getLanguage = language;
  axios.interceptors.request.use(injectLanguage);
  installed = true;
}
