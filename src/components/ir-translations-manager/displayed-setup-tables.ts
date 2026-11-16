/**
 * The setup tables whose entries are shown to the user — as select/radio options
 * or as labels — rather than only used for logic or echoed back to the API.
 *
 * A subset of `USED_SETUP_TABLES` (`./used-setup-tables.ts`) plus `_STAY_STATUS`,
 * which `src/utils/booking.ts` fetches directly. Hand-maintained snapshot (Nov 2026) —
 * **update it when display sites change**.
 *
 * Read by the app but not displayed, so deliberately absent:
 *   - `_PAY_TYPE_GROUP` — groups `_PAY_TYPE` options; its values are code lists
 *   - `_HB_PREFERENCE` — loaded by the meal report, never rendered
 *   - `_INVOICE_TARGET`, `_TA_PAYMENT_METHOD`, `_AGENT_RATE_TYPE` — sent to the API only
 *   - `_FD_STATUS`, `_TAXATION_STRATEGY` — declared in `TableEntries`, never fetched
 *
 * Displayed in English regardless of language (read `CODE_VALUE_EN` directly):
 * `_STAY_STATUS`, `_CL_POST_TIMING`.
 */
export const DISPLAYED_SETUP_TABLES = [
  /** Arrival-time select: booked-by form, booking editor guest form, arrival-time dialog. */
  '_ARRIVAL_TIME',
  /** Departure-time dialog select (booking details). */
  '_DEPARTURE_TIME',
  /** Bed preference select (new booking guest info); label in room details. */
  '_BED_PREFERENCE_TYPE',
  /** Pricing mode select per rate plan (new booking). */
  '_RATE_PRICING_MODE',
  /** Release options in the block-dates select. */
  '_CALENDAR_BLOCKED_TILL',
  /** Calendar block-unit label. English only. */
  '_STAY_STATUS',
  /** ID type select in the room guests form. */
  '_ID_TYPE',
  /** Payment type select (payment folio form); labels in the daily revenue table. */
  '_PAY_TYPE',
  /** Payment method selects (payment folio, listing modal, city-ledger payment fields); labels in daily revenue and the CL receipt preview. */
  '_PAY_METHOD',
  /** Extra-service category select and names; invoice lines; extra-services settings; tax categories; city-ledger filters. */
  '_SVC_CATEGORY',
  /** Tax-mode select (`ir-tax-input`) in tax/service categories. */
  '_VAT_INCLUDED',
  /** Tax-mode select, city-tax row. */
  '_CITY_TAX_INCLUDED',
  /** Tax-mode select, service-charge row. */
  '_SERVICE_CHARGE_INCLUDED',
  /** Transaction type select in the city-ledger transaction form. */
  '_CL_TX_TYPE',
  /** Document type label in the fiscal documents table and guest billing. */
  '_FD_TYPE',
  /** Agent type select (agent profile); label in the agents table. */
  '_AGENT_TYPE',
  /** Posting-timing select in the agent contract. English only. */
  '_CL_POST_TIMING',
  /** Gap-rule radio buttons (gap nights). */
  '_GAP_RULE',
  /** Days-ahead select (gap nights). */
  '_GAP_RANGE',
  /** Frequency select in the housekeeping operations card. */
  '_HK_FREQUENCY',
  /** Meal-type radio buttons in the meal report filters. */
  '_MEAL_TYPE',
  /** User type select and labels in user management. */
  '_USER_TYPE',
] as const;

/** Membership test for the list above. */
export const DISPLAYED_SETUP_TABLE_SET: ReadonlySet<string> = new Set(DISPLAYED_SETUP_TABLES);
