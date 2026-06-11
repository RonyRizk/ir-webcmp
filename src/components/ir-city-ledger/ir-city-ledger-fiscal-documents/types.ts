export type FiscalDocumentType = 'invoice' | 'receipt' | 'credit-note' | 'debit-note';

export type FiscalFilterType = 'all' | FiscalDocumentType;

export interface ClFiscalDocumentFilters {
  fromDate: string | null;
  toDate: string | null;
  docNumber: string;
  taxableOnly: boolean;
  type: FiscalFilterType;
  proformaOnly: boolean;
}
