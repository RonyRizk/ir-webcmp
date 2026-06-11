import { FiscalFilterType } from '../ir-city-ledger/ir-city-ledger-fiscal-documents/types';
import type { FiscalDocument } from '@/services/city-ledger';

export type FiscalFolioType = 'all' | 'agent' | 'guest';

/**
 * Fiscal document row used by the standalone fiscal-documents table.
 *
 * Extends the city-ledger {@link FiscalDocument} with the guest name, which is
 * only present for guest-folio documents (agent name + booking number already
 * exist on the base type as `AGENCY_NAME` / `BOOK_NBR`).
 */
export interface FiscalDocumentRow extends FiscalDocument {
  GUEST_NAME?: string | null;
}

export interface FiscalDocumentFilters {
  fromDate: string | null;
  toDate: string | null;
  docNumber: string;
  taxableOnly: boolean;
  type: FiscalFilterType;
  proformaOnly: boolean;
  /** Which folio scope the documents belong to. */
  folioType: FiscalFolioType;
  /** Selected agent id when `folioType === 'agent'`. */
  agentId: number | null;
  /** Selected guest id when `folioType === 'guest'`. */
  guestId: number | null;
}
