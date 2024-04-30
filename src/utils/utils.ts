import { ICurrency } from '@/components';
import { Assignableunit } from '@/models/property';
import app_store, { changeLocale } from '@/stores/app.store';
import clsx, { ClassValue } from 'clsx';
import { addDays, differenceInCalendarDays, format, Locale } from 'date-fns';
import { ar, es, fr, de, pl, uk, ru, el, enUS } from 'date-fns/locale';
import { twMerge } from 'tailwind-merge';
const localeMap: { [key: string]: Locale } = {
  en: enUS,
  ar: ar,
  fr: fr,
  es: es,
  de: de,
  pl: pl,
  ua: uk,
  ru: ru,
  el: el,
};
export function matchLocale(locale: string): Locale {
  return localeMap[locale.toLowerCase()] || enUS;
}
export function getAbbreviatedWeekdays(locale: Locale) {
  const baseDate = new Date(2020, 5, 7);
  let weekdays = [];
  for (let i = 0; i < 7; i++) {
    const weekday = format(addDays(baseDate, i), 'eee', { locale });
    weekdays.push(weekday);
  }
  return weekdays.slice(1, 7).concat(weekdays.slice(0, 1));
}

export function setLanguagePreference(language: string): void {
  const expiryDate = new Date();
  expiryDate.setFullYear(expiryDate.getFullYear() + 10);
  const cookieValue = `language=${language}; expires=${expiryDate.toUTCString()}; path=/; Secure; SameSite=Lax`;
  document.cookie = cookieValue;
}

export function getLanguagePreference(): string | null {
  const cookies = document.cookie.split(';');
  for (let i = 0; i < cookies.length; i++) {
    let cookie = cookies[i].trim();
    if (cookie.startsWith('language=')) {
      return cookie.substring('language='.length);
    }
  }
  return null;
}
export function getAvailableRooms(assignable_units: Assignableunit[]) {
  let result = [];
  assignable_units.map(unit => {
    if (unit.Is_Fully_Available) {
      result.push({ name: unit.name, id: unit.pr_id });
    }
  });
  return result;
}
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export const formatAmount = (amount: any, currency: string = 'USD') => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency }).format(amount);
};
type HSLColor = {
  h: number;
  s: number;
  l: number;
};

export function hexToHSL(hex: string): HSLColor {
  let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

  let r = parseInt(result[1], 16);
  let g = parseInt(result[2], 16);
  let b = parseInt(result[3], 16);

  (r /= 255), (g /= 255), (b /= 255);
  let max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h,
    s,
    l = (max + min) / 2;

  if (max == min) {
    h = s = 0; // achromatic
  } else {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  s = s * 100;
  s = Math.round(s);
  l = l * 100;
  l = Math.round(l);
  h = Math.round(360 * h);

  return { h, s, l };
}
export function generateColorShades(baseHex: string): string[] {
  const { h, s, l: baseL } = hexToHSL(baseHex);
  let shades = [];
  for (let i = -3; i <= 6; i++) {
    let l = baseL + i * 4;
    shades.push({ h, s, l: Math.min(Math.max(l, 0), 100) });
  }
  return shades;
}
export function getDateDifference(date1: Date, date2: Date) {
  return differenceInCalendarDays(date2, date1);
}
export function renderTime(time: number) {
  return time < 10 ? time.toString().padStart(2, '0') : time.toString();
}
export function getUserPrefernce() {
  const p = JSON.parse(localStorage.getItem('user_prefernce'));
  if (p) {
    const { direction, ...others } = p;
    app_store.userPreferences = {
      ...others,
    };
    changeLocale(direction, matchLocale(p.language_id));
  }
}
export function setDefaultLocale({ currency }: { currency: ICurrency }) {
  app_store.userPreferences = {
    ...app_store.userPreferences,
    currency_id: currency.code.toString(),
  };
  // matchLocale(language_id)
}
