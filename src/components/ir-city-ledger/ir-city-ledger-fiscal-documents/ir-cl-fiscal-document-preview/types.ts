export interface ClFiscalDocumentPreviewRequest {
  fdTypeCode: string;
  documentNumber: string;
  agentId: number;
  agentName: string;
  fdId?: number;
  autoPrint?: boolean;
  externalRef: string;
  url?: string;
  fromDate?: string | null;
  toDate?: string | null;
  bookingNbr?: string | null;
}
