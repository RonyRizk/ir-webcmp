/**
 * Request payload for previewing a guest fiscal document.
 *
 * Mirrors the agent-side `ClFiscalDocumentPreviewRequest`, but the guest flow
 * only needs the document number and its fiscal type (to pick the print mode).
 */
export interface GuestDocumentPreviewRequest {
  documentNumber: string;
  fdTypeCode: string;
  bookingNumber: string;
  autoDownload?: boolean;
  extras?: string;
  creditNoteDocNumber?: string;
}
