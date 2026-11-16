import type { ClTx } from '@/services/city-ledger';
import { ClTxTypeCode } from '@/types/enums';
import { t } from '@/services/locale/t';

export interface FolioRow {
  _rowId: string;
  _raw: ClTx;
  status: {
    id: string;
    label: string;
    variant: string;
    description: string;
  };
  type: string;
  serviceDate: string;
  bookingNumber: string;
  docNumber: string | null;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}
const lockedStatus = new Set([ClTxTypeCode.Payment, ClTxTypeCode.CreditNote, ClTxTypeCode.DebitNote]);
export function mapClTxToFolioRow(tx: ClTx): Omit<FolioRow, '_rowId'> {
  const status = tx.IS_LOCKED
    ? {
        id: 'billed',
        label: lockedStatus.has(tx.CL_TX_TYPE_CODE as any) ? t('Lcz_Locked', { fallback: 'Locked' }) : t('Lcz_Billed', { fallback: 'Billed' }),
        variant: 'success',
        description: '',
      }
    : tx.IS_HOLD
      ? { id: 'held', label: t('Lcz_Held', { fallback: 'Held' }), variant: 'warning', description: '' }
      : { id: 'unbilled', label: t('Lcz_Unbilled', { fallback: 'Unbilled' }), variant: 'neutral', description: '' };

  return {
    _raw: tx,
    status,
    type: tx.CATEGORY,
    serviceDate: tx.SERVICE_DATE,
    bookingNumber: tx.BOOK_NBR ? tx.BOOK_NBR : null,
    docNumber: tx.DOC_NUMBER ?? tx.EXTERNAL_REF,
    description: tx.DESCRIPTION,
    debit: tx.DEBIT,
    credit: tx.CREDIT,
    balance: tx.RUNNING_BALANCE,
  };
}

export interface FolioFilters {
  fromDate?: string;
  toDate?: string;
  status?: string;
  search?: string;
}

export interface FolioSummary {
  startingBalance: number;
  totalDebits: number;
  totalCredits: number;
  currentBalance: number;
  unbilledCount: number;
}
