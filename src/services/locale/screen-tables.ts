import type { LocaleTable } from './types';

/**
 * Merged into every request. `_PMS_FRONT` is the backend's shared vocabulary and
 * `_COMMON` is the hardcoded-label migration catalog's shared module — the words
 * every screen renders — so no entry below has to list either.
 *
 * Nothing else belongs here. `_USER_MGT` looks like a candidate because
 * `ir-interceptor` can raise the OTP dialog over any page, but that dialog mounts
 * lazily and loads the table itself, so putting it in the base set would charge
 * every screen 47 keys it usually never shows.
 */
export const BASE_TABLES = ['_COMMON'] as const satisfies readonly LocaleTable[];

/**
 * The setup tables each screen needs, on top of {@link LocaleController.BASE_TABLES}.
 *
 * A screen is any component that loads its own strings — a page root, but also a
 * lazily-mounted leaf like `ir-otp-modal` that appears over any page. Whoever calls
 * `LocaleController.load` declares an entry here and passes it; nothing else picks
 * tables.
 *
 * ## Why a registry rather than a literal at each call site
 *
 * A root cannot read its own table set off its own file — the strings live in the
 * leaves it renders. `ir-arrivals` has one `Lcz_*` key of its own but reaches
 * `ir-booked-by-cell`, whose `Lcz_P` lives in `_BOOKING_LIST_FRONT`. Inline literals
 * hide that and rot silently: five roots were already under-requesting before this
 * registry existed, rendering raw `Lcz_*` keys unless another screen happened to load
 * the table first.
 *
 * So the lists are *derived*, not guessed, and `screen-tables.spec.ts` re-derives them
 * on every run: it walks each screen's component tree, maps every `Lcz_*` key back to
 * the table that declares it in `src/stores/locales.store.ts`, and fails if a key needs
 * a table the entry omits. Adding a string from a new table breaks the build here
 * instead of at runtime.
 *
 * ## Boundaries
 *
 * The walk stops at any component that loads its own tables. `ir-otp-modal` mounts only
 * when `ir-interceptor` raises it and fetches `_USER_MGT` itself at that point, so the
 * ~20 screens that can raise it do not carry its 47 keys. Keep it that way: a new
 * self-loading component needs an entry here, not an addition to its hosts.
 *
 * `_PMS_FRONT` never appears below — it is a base table, merged into every request.
 */
export const SCREEN_TABLES = {
  agents: ['_AGENTS'],
  arrivals: ['_FRONTDESK', '_BOOKING'],
  auth: ['_AUTH'],
  bookingDetails: ['_FINANCIALS', '_BOOKING', '_CALENDAR'],
  bookingEditor: ['_CALENDAR'],
  bookingListing: ['_BOOKING'],
  bookingPrinting: ['_BOOKING'],
  bookProperty: ['_CALENDAR'],
  calendar: ['_CALENDAR', '_HOUSEKEEPING', '_BOOKING'],
  channel: ['_CHANNEL_FRONT', '_SETTINGS'],
  cityLedger: ['_FINANCIALS'],
  cloneRates: ['_SETTINGS'],
  dailyRevenue: ['_REPORTS'],
  dashboard: ['_FRONTDESK', '_BOOKING', '_REPORTS', '_CALENDAR', '_PMS'],
  departures: ['_BOOKING'],
  dpReport: ['_REPORTS'],
  extraServicesSettings: ['_SETTINGS'],
  financialActions: ['_FINANCIALS', '_BOOKING'],
  fiscalDocuments: ['_FINANCIALS'],
  gapNights: ['_CALENDAR'],
  ghsOnboarding: ['_GUESTS'],
  guestInfo: [],
  housekeeping: ['_HOUSEKEEPING'],
  invoice: ['_FINANCIALS', '_BOOKING'],
  hkStaffTasks: ['_HOUSEKEEPING'],
  hkTasks: ['_HOUSEKEEPING'],
  login: ['_AUTH'],
  mealReport: ['_REPORTS'],
  monthlyBookingsReport: ['_REPORTS'],
  otpModal: ['_USER_MGT'],
  paymentOption: ['_PAYMENT_BACK'],
  pmsPage: ['_PMS', '_CALENDAR'],
  pmsSearch: [],
  queueManager: ['_FRONTDESK'],
  resetPassword: ['_USER_MGT', '_AUTH'],
  salesByChannel: ['_REPORTS'],
  salesByCountry: ['_REPORTS'],
  unbookableRooms: ['_CALENDAR'],
  uninvoicedBookings: ['_BOOKING'],
  userManagement: ['_SETTINGS', '_AUTH'],
} as const satisfies Record<string, readonly LocaleTable[]>;

export type ScreenName = keyof typeof SCREEN_TABLES;
