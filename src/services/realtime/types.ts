import type { HKSkipParams } from '@/services/housekeeping.service';
import type { SetRoomCalendarExtraParams } from '@/services/property/types';
import type { DoDayUseParams, SetDepartureTimeProps } from '@/services/booking-service/types';
import type { ClTx } from '@/services/city-ledger';
import type { RoomHkStatus } from '@/models/booking.dto';

// ---------------------------------------------------------------------------
// Payload types that describe the wire-format of each REASON.
// Previously scattered across component files — owned here so the service is
// the single source of truth for realtime message shapes.
// ---------------------------------------------------------------------------

export interface UnitHkStatusChangePayload {
  PR_ID: number;
  ROOM_CATEGORY_ID: number;
  NAME: string;
  DESCRIPTION: string;
  ENTRY_USER_ID: number;
  ENTRY_DATE: string;
  OWNER_ID: number;
  IS_ACTIVE: boolean;
  HKS_CODE: RoomHkStatus;
  HKM_ID: number;
  CHECKLIST: null;
  My_Room_category: null;
  My_Hkm: null | { NAME: string };
}

/** Shared between ROOM_TYPE_CLOSE, ROOM_TYPE_OPEN, UPDATE_CALENDAR_RATE. */
export interface SalesBatchPayload {
  rate_plan_id: number;
  night: string;
  is_available_to_book: boolean;
}

export interface AvailabilityBatchPayload {
  room_type_id: number;
  date: string;
  availability: number;
}

/** Broadcast when a day-use extra service is added, edited, or removed. */
export interface DayUseModifiedPayload {
  booking_nbr: string;
  is_remove: boolean;
  system_id: number;
  booking_system_id: number;
  category: { code: string; description: string | null };
  description: string;
  start_date: string;
  end_date: string;
  price: number;
  cost: number | null;
  currency_id: number;
  pool: string;
  from_time: string;
  to_time: string;
  net_amount: number;
  tax_amount: number;
  gross_amount: number;
  pr_id: number;
  room_identifier: string | null;
  agent: unknown;
  charges: {
    net_amount: number;
    tax_amount: number;
    total_amount: number;
    vat_percent: number;
    vat_amount: number;
    city_tax_percent: number;
    city_tax_amount: number;
    service_charge_percent: number;
    service_charge_amount: number;
  };
}

/** Broadcast when a day-use extra service is removed. Unlike `DAY_USE_MODIFIED`, keys are UPPER_SNAKE. */
export interface DayUseRemovedPayload {
  BSE_ID: number;
  BH_ID: number;
  START_DATE: string;
  END_DATE: string;
  DESCRIPTION: string;
  CURRENCY_ID: number;
  PRICE: number;
  COST: number | null;
  ENTRY_USER_ID: number;
  ENTRY_DATE: string;
  OWNER_ID: number;
  SVC_CATEGORY_CODE: string;
  TRAVEL_AGENCY_ID: number | null;
  POOL: string;
  FROM_TIME: string;
  TO_TIME: string;
  NET_AMOUNT: number;
  TAX_AMOUNT: number;
  GROSS_AMOUNT: number;
  PR_ID: number;
  BSA_REF: unknown;
  My_Bh: unknown;
  My_Currency: unknown;
  My_Travel_agency: unknown;
  My_Pr: unknown;
}

// ---------------------------------------------------------------------------
// Event map — every known REASON mapped to its payload shape.
// Use `unknown` where the server shape has not been confirmed.
// ---------------------------------------------------------------------------

export interface RealtimeEventMap {
  // ── Calendar / Booking ───────────────────────────────────────────────────
  DORESERVATION: unknown;
  BLOCK_EXPOSED_UNIT: unknown;
  ASSIGN_EXPOSED_ROOM: unknown;
  REALLOCATE_EXPOSED_ROOM_BLOCK: unknown;
  REALLOCATE_EXPOSED_ROOM_BOOK: unknown;
  UNBLOCK_EXPOSED_UNIT: unknown;
  /** Raw pool identifier — may not be valid JSON; arrives as the PAYLOAD string itself. */
  DELETE_CALENDAR_POOL: unknown;
  /** Pipe-separated date range, e.g. "FROM_DATE:2024-01-01|TO_DATE:2024-12-31". Not JSON. */
  GET_UNASSIGNED_DATES: unknown;
  UPDATE_CALENDAR_AVAILABILITY: AvailabilityBatchPayload;
  CHANGE_IN_DUE_AMOUNT: { pools: number[]; due_amount: number };
  CHANGE_IN_BOOK_STATUS: { pools: number[]; status_code: string };
  NON_TECHNICAL_CHANGE_IN_BOOKING: { booking_nbr: string; extras: unknown };
  SHARING_PERSONS_UPDATED: { identifier: string; guests: unknown[] };
  ROOM_STATUS_CHANGED: { room_identifier: string; status: string };
  UNIT_HK_STATUS_CHANGED: UnitHkStatusChangePayload;
  EMAIL_VERIFIED: { id: string | number };
  /** Server sends rate/availability fields; is_available_to_book is added client-side. */
  ROOM_TYPE_CLOSE: Omit<SalesBatchPayload, 'is_available_to_book'>;
  ROOM_TYPE_OPEN: Omit<SalesBatchPayload, 'is_available_to_book'>;
  HK_SKIP: HKSkipParams;
  SET_ROOM_CALENDAR_EXTRA: SetRoomCalendarExtraParams;
  UPDATE_CALENDAR_RATE: { rate_plan_id: number; date: string; is_closed: boolean };
  SET_DEPARTURE_TIME: SetDepartureTimeProps;
  HK_ISSUE_FOUND: { HK_ISSUE_ID: number | string; My_Hka: unknown };
  HK_ISSUE_FIXED: { HK_ISSUE_ID: number | string; My_Hka: unknown };
  /** Broadcast after a `Do_Day_Use` call succeeds — payload mirrors the request body. */
  DAY_USE_CREATED: DoDayUseParams;
  /** Broadcast when a day-use extra service is added/edited/removed (e.g. from another agent/tab). */
  DAY_USE_MODIFIED: DayUseModifiedPayload;
  /** Broadcast when a day-use extra service is removed. */
  DAY_USE_REMOVED: DayUseRemovedPayload;
  // ── Housekeeping ─────────────────────────────────────────────────────────
  HK_TASK_OVERRIDE: { HKM_ID: number | null; DATE: string };
  // ── City Ledger ──────────────────────────────────────────────────────────
  CL_TX_HOLD_TOGGLED: { cl_tx_id: number; agency_id: number; is_hold: boolean };
  /** Full ClTx — use CL_TX_ID + IS_LOCKED + TRAVEL_AGENCY_ID from the object. */
  CL_TX_LOCKING: ClTx;
  CL_TX_CREATED: ClTx;
}

/** Union of all known REASON strings. */
export type RealtimeReason = keyof RealtimeEventMap;

/**
 * Discriminated union: narrowing `msg.reason` in a switch/if also narrows `msg.payload`.
 *
 * @example
 * realtimeService.subscribe(pid, (msg) => {
 *   if (msg.reason === 'CL_TX_LOCKING') {
 *     // msg.payload → { cl_tx_id, agency_id, is_locked }
 *   }
 * });
 */
export type RealtimeMessage = {
  [K in RealtimeReason]: { reason: K; payload: RealtimeEventMap[K] };
}[RealtimeReason];
