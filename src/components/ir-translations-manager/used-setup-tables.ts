/**
 * The setup tables this codebase actually reads at runtime.
 *
 * Setup holds far more tables than the app consumes, so the manager can hide the
 * ones nothing reads. There is no runtime way to ask the bundle which tables it
 * touches, so this is a hand-maintained snapshot — **update it when call sites
 * change**. To re-derive it, collect the string literals passed to:
 *
 *   - `BookingService.getSetupEntriesByTableName(...)`
 *   - `BookingService.getSetupEntriesByTableNameMulti([...])`
 *   - `RoomService.fetchLanguage(code, [...sections])` — including its
 *     `_PMS_FRONT` default when the second argument is omitted
 *
 * plus the members of the `TableEntries` union in
 * `src/services/booking-service/booking.service.ts`, which is the declared
 * contract for those same getters.
 *
 *   grep -rnE "getSetupEntriesByTable(Name|NameMulti)|fetchLanguage" src
 */
export const USED_SETUP_TABLES = [
  '_AGENT_RATE_TYPE',
  '_AGENT_TYPE',
  '_ARRIVAL_TIME',
  '_BED_PREFERENCE_TYPE',
  '_BOOKING_LIST_FRONT',
  '_CALENDAR_BLOCKED_TILL',
  '_CHANNEL_FRONT',
  '_CITY_TAX_INCLUDED',
  '_CL_POST_TIMING',
  '_CL_TX_TYPE',
  '_DEPARTURE_TIME',
  '_FD_STATUS',
  '_FD_TYPE',
  '_GAP_RANGE',
  '_GAP_RULE',
  '_HB_PREFERENCE',
  '_HK_FREQUENCY',
  '_HK_FRONT',
  '_ID_TYPE',
  '_INVOICE_TARGET',
  '_MEAL_TYPE',
  '_PAYMENT_BACK',
  '_PAY_METHOD',
  '_PAY_TYPE',
  '_PAY_TYPE_GROUP',
  '_PMS_FRONT',
  '_RATE_PRICING_MODE',
  '_SERVICE_CHARGE_INCLUDED',
  '_SVC_CATEGORY',
  '_TAXATION_STRATEGY',
  '_TA_PAYMENT_METHOD',
  '_USER_MGT',
  '_USER_TYPE',
  '_VAT_INCLUDED',
] as const;

/** Membership test for the list above — the manager checks this per table and per row. */
export const USED_SETUP_TABLE_SET: ReadonlySet<string> = new Set(USED_SETUP_TABLES);
