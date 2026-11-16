import { FactoryArg, Masked, MaskedRange } from 'imask';
import moment from 'moment';
import { normalizeNumericInput } from '@/utils/number';

export const masks = {
  price: {
    mask: Number,
    scale: 2,
    radix: '.',
    mapToRadix: [','],
    normalizeZeros: true,
    padFractionalZeros: true,
    thousandsSeparator: ',',
  },
  /** Percentage from 0 to 99 with up to 2 decimals; anything outside the range is rejected as it is typed. */
  percentage: {
    mask: Number,
    scale: 2,
    radix: '.',
    mapToRadix: [','],
    normalizeZeros: true,
    min: 0,
    max: 99,
  },
  email: {
    mask: /^\S*@?\S*$/,
    overwrite: false,

    prepare(value: string) {
      // Remove spaces
      return value
        .toLowerCase()
        .replace(/\s+/g, '') // remove all whitespace
        .replace(/[^a-z0-9@._'+\-]/g, '') // only allow chars from EMAIL_REGEX
        .replace(/\.{2,}/g, '.') // collapse multiple dots
        .replace(/@\./, '@'); // no dot immediately after @;
    },

    validate(value: string) {
      // Allow partial input while typing
      // but restrict characters to valid email charset
      return /^[a-zA-Z0-9._%+-]*(@?[a-zA-Z0-9.-]*)?$/.test(value);
    },
  },
  url: {
    mask: /^\S*$/,
    overwrite: false,
    prepare(appended /* string */) {
      return appended.replace(/^https?:\/\//i, '');
    },

    commit(value, masked) {
      masked._value = 'https://' + value.replace(/^https?:\/\//i, '');
    },
  },
  time: {
    mask: 'HH:mm',
    blocks: {
      HH: {
        mask: MaskedRange,
        from: 0,
        to: 23,
        placeholderChar: 'H',
      },
      mm: {
        mask: MaskedRange,
        from: 0,
        to: 59,
        placeholderChar: 'm',
      },
    },
    lazy: true,
    placeholderChar: '_',
  },
  date: {
    mask: Date,
    pattern: 'DD/MM/YYYY',
    lazy: false,
    min: moment('1900-01-01', 'YYYY-MM-DD').toDate(),
    max: new Date(),
    format: date => moment(date).format('DD/MM/YYYY'),
    parse: str => moment(str, 'DD/MM/YYYY').toDate(),
    autofix: true,
    placeholderChar: '_',
    blocks: {
      YYYY: {
        mask: MaskedRange,
        from: 1900,
        to: moment().format('YYYY'),
        placeholderChar: 'Y',
      },
      MM: {
        mask: MaskedRange,
        from: 1,
        to: 12,
        placeholderChar: 'M',
      },
      DD: {
        mask: MaskedRange,
        from: 1,
        to: 31,
        placeholderChar: 'D',
      },
    },
  },
} as const;

function buildTimeToMask(minHour: number) {
  return {
    ...masks.time,
    blocks: {
      ...masks.time.blocks,
      HH: {
        ...masks.time.blocks.HH,
        from: minHour,
      },
    },
  };
}

/**
 * "to" time mask for a from/to time pair — same shape as `masks.time`, but the hour block's
 * lower bound is raised to `minHour` so the field can't accept an hour earlier than the paired
 * "from" time. Cached per hour (0-23) so the same `minHour` always yields the same object
 * reference — `ir-input` rebuilds its IMask instance whenever the `mask` prop reference changes,
 * so a fresh object on every render would tear down/recreate the mask on every keystroke.
 */
const timeToMaskCache = new Map<number, ReturnType<typeof buildTimeToMask>>();

export function createTimeToMask(minHour: number) {
  const clampedMinHour = Math.min(Math.max(Math.trunc(minHour) || 0, 0), 23);
  const cached = timeToMaskCache.get(clampedMinHour);
  if (cached) {
    return cached;
  }
  const mask = buildTimeToMask(clampedMinHour);
  timeToMaskCache.set(clampedMinHour, mask);
  return mask;
}

/**
 * Wraps mask options so anything typed or pasted in Arabic-Indic / Persian digits is converted to
 * Latin before IMask sees it. Without this, `Number` and pattern masks silently reject those
 * keystrokes, so price, time and phone fields can't be filled from an Arabic keyboard.
 *
 * Hooks the top-level `prepare`, which IMask runs on the whole string before per-character and
 * per-block handling, so it covers `Number`, pattern masks with blocks and plain regex masks
 * alike. A mask's own `prepare` (e.g. `masks.email`) still runs, on the normalized string.
 */
export function withLatinDigits<T extends FactoryArg>(maskArg: T): T {
  // A ready-made Masked instance is configured by its owner; leave it alone.
  if (!maskArg || maskArg instanceof Masked) return maskArg;
  const opts: Record<string, any> = typeof maskArg === 'object' && !(maskArg instanceof RegExp) && !Array.isArray(maskArg) ? { ...maskArg } : { mask: maskArg };
  const prepare = opts.prepare;
  opts.prepare = (chars: string, masked: Masked, flags: unknown) => {
    const normalized = normalizeNumericInput(chars);
    return prepare ? prepare(normalized, masked, flags) : normalized;
  };
  return opts as T;
}
