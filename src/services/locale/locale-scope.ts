import { getElement, getRenderingRef } from '@stencil/core';
import { createStore } from '@stencil/store';

/**
 * Subtrees that render in a different language from the rest of the app.
 *
 * The `locales` store holds one language for the whole document. A subtree opts out of it the
 * same way HTML does, with a `lang` attribute on any element below `<html>` — e.g.
 * `<ir-booking-new-form language="ar">` reflects to `lang="ar"` on its host. Each such language
 * gets its own store here, filled by `LocaleController.loadScope`, and `t()` reads from it for
 * every component rendering inside that subtree.
 *
 * `<html lang>` itself is not a scope: it is the document language, which `locales` already holds.
 */
export type LocaleScopeState = {
  entries: Record<string, string> | null;
  direction: 'ltr' | 'rtl';
  status: 'idle' | 'loading' | 'ready' | 'error';
};

const scopes = new Map<string, LocaleScopeState>();

/** The store for `language`, created empty on first use so components can subscribe before it loads. */
export function getLocaleScope(language: string): LocaleScopeState {
  const key = language.toLowerCase();
  let scope = scopes.get(key);
  if (!scope) {
    scope = createStore<LocaleScopeState>({ entries: null, direction: 'ltr', status: 'idle' }).state;
    scopes.set(key, scope);
  }
  return scope;
}

/**
 * The `lang` set on the nearest ancestor below `<html>`, walking out of shadow roots to their
 * hosts. `undefined` when the element follows the document language.
 */
export function getLocalLanguage(el: Element): string | undefined {
  let node: Element | null = el;
  while (node && node !== document.documentElement) {
    const lang = node.getAttribute('lang');
    if (lang) return lang.toLowerCase();
    node = node.parentElement ?? (node.getRootNode() as ShadowRoot).host ?? null;
  }
  return undefined;
}

/**
 * {@link getLocalLanguage} for the component whose `render()` is running right now — the same
 * hook `@stencil/store` uses to know who to re-render. `undefined` outside a render, which is
 * why `t()` calls in event handlers and validators need an explicit `language` option.
 */
export function getRenderingLanguage(): string | undefined {
  const ref = getRenderingRef();
  if (!ref) return undefined;
  try {
    const el = getElement(ref);
    return el ? getLocalLanguage(el) : undefined;
  } catch {
    return undefined;
  }
}
