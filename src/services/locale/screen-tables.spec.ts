import * as fs from 'fs';
import * as path from 'path';

import { BASE_TABLES, SCREEN_TABLES, type ScreenName } from './screen-tables';
import { LOCALE_TABLES, type LocaleTable } from './types';

/**
 * Re-derives every `SCREEN_TABLES` entry from the strings the screen actually
 * renders, so a hand-maintained list cannot silently rot.
 *
 * A screen's `Lcz_*` keys mostly live in the leaves it renders, not in its own
 * file — `ir-arrivals` declares one key but reaches `ir-booked-by-cell`, whose
 * `Lcz_P` only exists in `_BOOKING_LIST_FRONT`. So this walks the component tree
 * by JSX tag, maps every key back to the table that declares it (see `keyTables`
 * below), and fails when a screen uses a key no table it
 * requested can supply. Without this the symptom is a raw `Lcz_*` key on screen,
 * and only on the screens a developer did not happen to open.
 */

const REPO_ROOT = path.resolve(__dirname, '../../..');

/** Where each screen's tree starts. `guestInfo` has two entry points. */
const SCREEN_ROOTS: Record<ScreenName, string[]> = {
  agents: ['src/components/ir-agents/ir-agents.tsx'],
  arrivals: ['src/components/ir-arrivals/ir-arrivals.tsx'],
  auth: ['src/components/ir-auth/ir-auth.tsx'],
  bookingDetails: ['src/components/ir-booking-details/ir-booking-details.tsx'],
  bookingEditor: ['src/components/igloo-calendar/ir-booking-editor/ir-booking-editor.tsx'],
  bookingListing: ['src/components/ir-booking-listing/ir-booking-listing.tsx'],
  bookingPrinting: ['src/components/ir-booking-printing/ir-booking-printing.tsx'],
  bookProperty: ['src/components/igl-book-property-container/igl-book-property-container.tsx'],
  calendar: ['src/components/igloo-calendar/igloo-calendar.tsx'],
  channel: ['src/components/ir-channel/ir-channel.tsx'],
  cityLedger: ['src/components/ir-city-ledger/ir-city-ledger.tsx'],
  cloneRates: ['src/components/ir-clone-rates/ir-clone-rates.tsx'],
  dailyRevenue: ['src/components/ir-daily-revenue/ir-daily-revenue.tsx'],
  dashboard: ['src/components/ir-dashboard/ir-dashboard.tsx'],
  departures: ['src/components/ir-departures/ir-departures.tsx'],
  dpReport: ['src/components/ir-dp-report/ir-dp-report.tsx'],
  extraServicesSettings: ['src/components/ir-extra-services-settings/ir-extra-services-settings.tsx'],
  financialActions: ['src/components/ir-financial-actions/ir-financial-actions.tsx'],
  fiscalDocuments: ['src/components/ir-fiscal-documents/ir-fiscal-documents.tsx'],
  gapNights: ['src/components/ir-gap-nights/ir-gap-nights.tsx'],
  ghsOnboarding: ['src/components/ir-ghs-onboarding/ir-ghs-onboarding.tsx'],
  guestInfo: ['src/components/ir-guest-info/ir-guest-info.tsx', 'src/components/ir-guest-info/ir-guest-info-form/ir-guest-info-form.tsx'],
  hkStaffTasks: ['src/components/ir-housekeeping/ir-hk-staff-tasks/ir-hk-staff-tasks.tsx'],
  hkTasks: ['src/components/ir-housekeeping/ir-hk-tasks/ir-hk-tasks.tsx'],
  housekeeping: ['src/components/ir-housekeeping/ir-housekeeping.tsx'],
  invoice: ['src/components/ir-invoice/ir-invoice.tsx'],
  login: ['src/components/ir-login/ir-login.tsx'],
  mealReport: ['src/components/ir-meal-report/ir-meal-report.tsx'],
  monthlyBookingsReport: ['src/components/ir-monthly-bookings-report/ir-monthly-bookings-report.tsx'],
  otpModal: ['src/components/ir-otp-modal/ir-otp-modal.tsx'],
  paymentOption: ['src/components/ir-payment-option/ir-payment-option.tsx'],
  pmsPage: ['src/components/pms-header/ir-pms-page/ir-pms-page.tsx'],
  pmsSearch: ['src/components/pms-header/ir-pms-search/ir-pms-search.tsx'],
  queueManager: ['src/components/ir-queue-manager/ir-queue-manager.tsx'],
  resetPassword: ['src/components/ir-reset-password/ir-reset-password.tsx'],
  salesByChannel: ['src/components/ir-sales-by-channel/ir-sales-by-channel.tsx'],
  salesByCountry: ['src/components/ir-sales-by-country/ir-sales-by-country.tsx'],
  unbookableRooms: ['src/components/ir-unbookable-rooms/ir-unbookable-rooms.tsx'],
  uninvoicedBookings: ['src/components/ir-uninvoiced-bookings/ir-uninvoiced-bookings.tsx'],
  userManagement: ['src/components/ir-user-management/ir-user-management.tsx'],
};

/**
 * Keys used in the codebase but declared by neither the catalog nor the legacy snapshot.
 * They cannot be attributed to a table, so they are skipped rather than failing
 * a screen for a gap that is not the screen's fault. Shrink this list by adding
 * the keys to `lcz-labels.json` — see the `locale-known-gaps` note.
 */
const UNDECLARED_KEYS = new Set(['Lcz_GuestFirstname', 'Lcz_GuestLastname', 'Lcz_NotAvailable', 'Lcz_YouNeedToSelect', 'Lcz_HighlightCheck']);

/**
 * key -> the tables that declare it. Two sources, since the store no longer
 * carries per-table types:
 *
 * - `lcz-labels.json` (repo root): the hardcoded-label migration catalog, one
 *   top-level object per Setup module (`_COMMON`, `_BOOKING`, `_CALENDAR`, …).
 * - `legacy-locale-keys.json` (next to this spec): a snapshot of the six backend
 *   tables `Get_Exposed_Language` has always served (`_PMS_FRONT`, `_USER_MGT`,
 *   …), taken from the per-table types `locales.store.ts` declared before they
 *   were dropped (commit d48e8d15). Regenerate it if those tables change.
 *
 * A key can live in both — the catalog reuses a legacy key when the text already
 * existed — so every owner is kept and a screen passes if any of them is loaded.
 */
const keyTables = (() => {
  const map = new Map<string, Set<LocaleTable>>();
  const add = (key: string, table: string) => {
    if (!(LOCALE_TABLES as readonly string[]).includes(table)) throw new Error(`${table} is not a LocaleTable`);
    if (!map.has(key)) map.set(key, new Set());
    map.get(key)!.add(table as LocaleTable);
  };
  const catalog: Record<string, Record<string, string>> = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'lcz-labels.json'), 'utf8'));
  for (const [table, keys] of Object.entries(catalog)) for (const key of Object.keys(keys)) add(key, table);
  const legacy: Record<string, string[]> = JSON.parse(fs.readFileSync(path.join(__dirname, 'legacy-locale-keys.json'), 'utf8'));
  for (const [table, keys] of Object.entries(legacy)) for (const key of keys) add(key, table);
  return map;
})();

function sourceFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) sourceFiles(full, acc);
    else if (/\.tsx?$/.test(entry.name) && !/\.spec\.|\.e2e\./.test(entry.name)) acc.push(full);
  }
  return acc;
}

const files = sourceFiles(path.join(REPO_ROOT, 'src'));
const contents = new Map(files.map(file => [file, fs.readFileSync(file, 'utf8')]));

const tagToFile = new Map<string, string>();
for (const [file, code] of contents) {
  for (const match of code.matchAll(/tag:\s*'([a-z0-9-]+)'/g)) tagToFile.set(match[1], file);
}

const keysIn = new Map<string, string[]>();
const tagsIn = new Map<string, string[]>();
for (const [file, code] of contents) {
  // Commented-out JSX (`{/* <ir-x> */}`) neither renders nor loads strings.
  const live = code.replace(/\/\*[\s\S]*?\*\//g, '');
  keysIn.set(file, [...new Set([...live.matchAll(/Lcz_[A-Za-z0-9_]+/g)].map(m => m[0]))]);
  tagsIn.set(file, [...new Set([...live.matchAll(/<((?:ir|igl|ac)-[a-z0-9-]+)/g)].map(m => m[1]))]);
}

/** Components that fetch their own tables — the walk stops there. */
const selfLoading = new Set(files.filter(file => /LocaleController\.load\(/.test(contents.get(file)!)));

/** Every file a screen can render, stopping at components that load for themselves. */
function subtree(entryPoints: string[]): Set<string> {
  const seen = new Set(entryPoints);
  const queue = [...entryPoints];
  while (queue.length) {
    for (const tag of tagsIn.get(queue.shift()!) ?? []) {
      const target = tagToFile.get(tag);
      if (!target || seen.has(target) || selfLoading.has(target)) continue;
      seen.add(target);
      queue.push(target);
    }
  }
  return seen;
}

describe('SCREEN_TABLES', () => {
  it('has an entry, and a real entry point, for every screen', () => {
    expect(Object.keys(SCREEN_ROOTS).sort()).toEqual(Object.keys(SCREEN_TABLES).sort());
    for (const entryPoints of Object.values(SCREEN_ROOTS)) {
      for (const file of entryPoints) {
        expect(fs.existsSync(path.join(REPO_ROOT, file))).toBe(true);
      }
    }
  });

  it('never lists a base table — those are merged in for free', () => {
    for (const [screen, tables] of Object.entries(SCREEN_TABLES)) {
      for (const base of BASE_TABLES) {
        expect([screen, tables.includes(base as never)]).toEqual([screen, false]);
      }
    }
  });

  it('only lists tables the endpoint knows', () => {
    for (const tables of Object.values(SCREEN_TABLES)) {
      for (const table of tables) expect(LOCALE_TABLES).toContain(table);
    }
  });

  describe.each(Object.keys(SCREEN_TABLES) as ScreenName[])('%s', screen => {
    const allowed = new Set<LocaleTable>([...BASE_TABLES, ...SCREEN_TABLES[screen]]);
    const reachable = subtree(SCREEN_ROOTS[screen].map(file => path.join(REPO_ROOT, file)));

    it('declares every table its strings come from', () => {
      const uncovered: string[] = [];
      for (const file of reachable) {
        for (const key of keysIn.get(file) ?? []) {
          if (UNDECLARED_KEYS.has(key)) continue;
          const owners = keyTables.get(key);
          if (!owners) continue;
          if ([...owners].some(table => allowed.has(table))) continue;
          uncovered.push(`${key} (needs ${[...owners].join('|')}) in ${path.relative(REPO_ROOT, file)}`);
        }
      }
      expect(uncovered).toEqual([]);
    });

    it('declares no table it has no string from', () => {
      // A table earns its place when it is the only *declared* owner of some key —
      // a key that also lives in a table this screen does not load still needs it.
      const used = new Set<LocaleTable>();
      for (const file of reachable) {
        for (const key of keysIn.get(file) ?? []) {
          const declaredOwners = [...(keyTables.get(key) ?? [])].filter(table => allowed.has(table));
          if (declaredOwners.length === 1) used.add(declaredOwners[0]);
        }
      }
      const unused = SCREEN_TABLES[screen].filter(table => !used.has(table));
      expect(unused).toEqual([]);
    });
  });
});
