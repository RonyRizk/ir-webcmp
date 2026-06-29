import { FiscalFilterType } from '../ir-city-ledger/ir-city-ledger-fiscal-documents/types';
import type { UnifiedFolioRecord } from '@/services/property/types';

export type FiscalFolioType = 'all' | 'agent' | 'guest';

/**
 * Row rendered by the standalone fiscal-documents table.
 *
 * Sourced from the unified folio endpoint ({@link UnifiedFolioRecord}), which
 * returns both agent- and guest-scoped documents in a single list,
 * discriminated by `TARGET_TYPE` (`'AGENT'` | `'GUEST'`).
 */
export type FiscalDocumentRow = UnifiedFolioRecord;

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
  /** Which field the free-text search targets. */
  searchBy: 'doc_nbr' | 'booking_nbr';
  export?: boolean;
}
