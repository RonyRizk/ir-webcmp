import { ClTxTypeCode, FdTypes } from '@/types/enums';

// Re-export from the new location for backwards compatibility.
export * from './city-ledger/index';
export const actionableClTypes = new Set([ClTxTypeCode.Adjustment, ClTxTypeCode.CancellationPenalty, ClTxTypeCode.Discount, ClTxTypeCode.StandardChargeDebit]);
export const debitFdTypeCode = new Set([FdTypes.Invoice, FdTypes.DebitNote, FdTypes.Draft, FdTypes.CreditReceipt]);
