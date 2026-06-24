import { ClTxTypeCode, FdStatus, FdTypes } from '@/types/enums';
import moment from 'moment';
import * as z from 'zod';

// ---------------------------------------------------------------------------
// Shared / Base types
// ---------------------------------------------------------------------------

export const CategorySchema = z.string().nullable();
/** Optional transaction category code. */
export type Category = z.infer<typeof CategorySchema>;

export const RelEntitySchema = z.enum(['TBL_BSAD', 'TBL_BSP']);
/** Related entity table name for a city-ledger record. */
export type RelEntity = z.infer<typeof RelEntitySchema>;

export const CLAgencyContextSchema = z.object({
  AGENCY_ID: z.number(),
  CURRENCY_ID: z.number(),
});
/** Base agency context required by city-ledger endpoints. */
export type CLAgencyContext = z.infer<typeof CLAgencyContextSchema>;

export const FiscalDocumentSchema = z.object({
  AGENCY_ID: z.number().nullable().optional(),

  AGENCY_NAME: z.string().nullable().optional(),

  CREDIT: z.number().nullable().optional(),
  CREDIT_DISPLAY: z.string().nullable().optional(),

  CURRENCY_CODE: z.string().nullable().optional(),
  CURRENCY_ID: z.number().nullable().optional(),

  DEBIT: z.number().nullable().optional(),
  DEBIT_DISPLAY: z.string().nullable().optional(),

  DOC_NUMBER: z.string().nullable().optional(),

  EXTERNAL_REF: z.string().nullable().optional(),

  FD_ID: z.number().nullable().optional(),

  FD_STATUS_CODE: z.string().nullable().optional(),
  FD_STATUS_NAME: z.string().nullable().optional(),

  FD_TYPE_CODE: z.string().nullable().optional(),
  FD_TYPE_NAME: z.string().nullable().optional(),

  ISSUE_DATE: z.string().nullable().optional(),
  ISSUE_DATE_DISPLAY: z.string().nullable().optional(),

  IS_PRINTED: z.boolean().nullable().optional(),

  NET_AMOUNT: z.number().nullable().optional(),
  NET_AMOUNT_DISPLAY: z.string().nullable().optional(),

  TAX_AMOUNT: z.number().nullable().optional(),
  TAX_AMOUNT_DISPLAY: z.string().nullable().optional(),

  TOTAL_AMOUNT: z.number().nullable().optional(),

  BALANCE_BEFORE_TX: z.number().nullable(),
  BALANCE_AFTER_TX: z.number().nullable(),

  FROM_DATE: z.string().nullable().optional(),
  TO_DATE: z.string().nullable().optional(),
  BOOK_NBR: z.string().nullable().optional(),
});

export type FiscalDocument = z.infer<typeof FiscalDocumentSchema>;

// ---------------------------------------------------------------------------
// Transaction record & fetch
// ---------------------------------------------------------------------------

export const ClTxSchema = z.object({
  BH_ID: z.number(),
  BSA_REF: z.union([z.null(), z.string()]),
  CATEGORY: CategorySchema,

  // booking info
  BOOK_NBR: z.string(),
  AGENT_BOOKING_NBR: z.union([z.string(), z.null()]),

  // guest counts
  ADULTS_NBR: z.number(),
  CHILD_NBR: z.number(),
  INFANT_NBR: z.number(),

  // guest info
  GUEST_FIRST_NAME: z.string(),
  GUEST_LAST_NAME: z.string(),

  // room info
  ROOM_CATEGORY_ID: z.number(),
  ROOM_TYPE_ID: z.number(),
  RATE_PLAN_ID: z.union([z.number(), z.null()]),
  PR_ID: z.number(),

  // dates
  FROM_DATE: z.string(),
  TO_DATE: z.string(),
  SERVICE_DATE: z.string(),
  ENTRY_DATE: z.string(),

  CITY_TAX_AMOUNT: z.number(),
  CITY_TAX_PERCENT: z.number(),

  CL_TX_ID: z.number(),
  CL_TX_TYPE_CODE: z.union([z.string(), z.null()]),

  CREDIT: z.number(),
  DEBIT: z.number(),

  CURRENCY_ID: z.number(),

  DESCRIPTION: z.string(),
  ENTRY_USER_ID: z.number(),

  EXTERNAL_REF: z.union([z.string(), z.null()]),
  FD_ID: z.union([z.number(), z.null()]),

  IS_HOLD: z.boolean(),
  IS_LOCKED: z.boolean(),

  My_Bh: z.any().nullable(),
  My_Currency: z.any().nullable(),
  My_Fd: FiscalDocumentSchema.nullable(),
  My_Pr: z.any().nullable(),
  My_Room_category: z.any().nullable(),
  RUNNING_BALANCE: z.number().nullable(),
  My_Room_type: z.any().nullable(),
  My_Travel_agency: z.null(),
  DOC_NUMBER: z.string().nullable().optional().default(null),

  NET_AMOUNT: z.number(),

  OWNER_ID: z.number(),
  PAY_METHOD_CODE: z.union([z.string(), z.null()]),

  REL_ENTITY: RelEntitySchema,
  REL_ENTITY_KEY: z.number(),

  TAX_AMOUNT: z.number(),
  TOTAL_AMOUNT: z.number(),

  TRAVEL_AGENCY_ID: z.number(),

  VAT_AMOUNT: z.number(),
  VAT_PERCENT: z.number(),
});
/** City-ledger transaction row returned by the API. */
export type ClTx = z.infer<typeof ClTxSchema>;

export const FetchCLParamsSchema = z.object({
  AGENCY_ID: z.number(),
  START_DATE: z.string().optional().nullable().default(null),
  END_DATE: z.string().optional().nullable().default(null),
  START_ROW: z.number().default(0),
  END_ROW: z.number().default(20),
  SEARCH_QUERY: z.string().nullable().optional().default(null),
  IS_LOCKED: z.boolean().optional().nullable().default(null),
  IS_HOLD: z.boolean().optional().nullable().default(null),
  IS_CHECKED_OUT_ONLY: z.boolean().optional().nullable().default(null),
  is_export_to_excel: z.boolean().optional().nullable().default(false),
});

/** Filters and pagination for fetching city-ledger transactions. */
export type FetchCLParams = z.infer<typeof FetchCLParamsSchema>;

export const FetchCLResultSchema = z.object({
  My_Cl_tx: z.array(ClTxSchema),
  TOTAL_COUNT: z.number(),
});
/** Paginated city-ledger transaction response payload. */
export type FetchCLResult = z.infer<typeof FetchCLResultSchema>;

// ---------------------------------------------------------------------------
// Transaction mutations
// ---------------------------------------------------------------------------

export const ToggleCLTxHoldParamsSchema = z.object({
  CL_TX_ID: z.number(),
  IS_HOLD: z.boolean(),
});
/** Payload for toggling a transaction hold status. */
export type ToggleCLTxHoldParams = z.infer<typeof ToggleCLTxHoldParamsSchema>;

export const IssueManualCLTxParamsSchema = z.object({
  CL_TX_ID: z.number().optional().default(-1),
  AGENCY_ID: z.number(),
  SERVICE_DATE: z.string(),
  // CATEGORY: z.string(),
  CL_TX_TYPE_CODE: z.string(),
  DESCRIPTION: z.string(),
  DEBIT: z.number(),
  CREDIT: z.number(),
  CURRENCY_ID: z.number(),
  PAY_METHOD_CODE: z.string().optional().default(''),
  EXTERNAL_REF: z.string(),
  // VAT handling for the transaction
  // 001 = VAT included in amount
  // 002 = VAT not applicable
  VAT_INCLUDED_CODE: z.enum(['001', '002', '']).default(''),

  // VAT percentage (used only when VAT is included)
  VAT_PCT: z.number().optional().nullable().default(null),
  //Booking number system id.
  BH_ID: z.number().optional().nullable().default(null),

  IS_DELETE: z.boolean().optional().default(false),
}).superRefine((data, ctx) => {
  if (data.CL_TX_TYPE_CODE === ClTxTypeCode.Payment && !data.PAY_METHOD_CODE) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['PAY_METHOD_CODE'],
      message: 'PAY_METHOD_CODE is required for payment transactions',
    });
  }
});
/** Payload for issuing a manual city-ledger transaction. */
export type IssueManualCLTxParams = z.infer<typeof IssueManualCLTxParamsSchema>;

export const AllocateCLCreditParamsSchema = z.object({
  CL_TX_ID: z.number(),
  List_Cl_tx_allocation: z.array(
    z.object({
      FD_ID: z.number(),
      AMOUNT: z.number(),
      DESCRIPTION: z.string(),
    }),
  ),
});
/** Payload for allocating a credit transaction to folios. */
export type AllocateCLCreditParams = z.infer<typeof AllocateCLCreditParamsSchema>;

export const SyncBookingToCityLedgerParamsSchema = z.object({
  booking_nbr: z.number(),
  is_force_post: z.boolean(),
});
/** Payload for syncing a booking into city ledger. */
export type SyncBookingToCityLedgerParams = z.infer<typeof SyncBookingToCityLedgerParamsSchema>;

export const TransferCLTransactionsParamsSchema = z.object({
  AGENCY_ID: z.number(),
  List_CL_TX_ID: z.array(z.number()),
});
/** Payload for transferring city-ledger transactions. */
export type TransferCLTransactionsParams = z.infer<typeof TransferCLTransactionsParamsSchema>;

// ---------------------------------------------------------------------------
// Account & balance
// ---------------------------------------------------------------------------

// GetCLAccountBalance, GetCLUnallocatedTransactions, GetCLAccountOverview all
// take only the base context — use the shared type directly.
/** Params for fetching account balance. */
export type GetCLAccountBalanceParams = CLAgencyContext;
/** Params for fetching unallocated transactions. */
export type GetCLUnallocatedTransactionsParams = CLAgencyContext;
/** Params for fetching account overview. */
export type GetCLAccountOverviewParams = CLAgencyContext;

/** Aggregated city-ledger account totals. */
export type CLAccountBalance = {
  NET_BALANCE: number;
  TOTAL_CREDIT: number;
  TOTAL_DEBIT: number;
};

/** High-level city-ledger account summary metrics. */
export type CLAccountOverview = {
  ACCOUNT_NET_BALANCE: number;
  STARTING_BALANCE: number;
  TOTAL_DUE_INVOICED: number;
  TOTAL_UNINVOICED: number;
};

export const GetCLAgingReportParamsSchema = CLAgencyContextSchema.extend({
  AS_OF_DATE: z.string(),
});
/** Params for generating an aging report snapshot. */
export type GetCLAgingReportParams = z.infer<typeof GetCLAgingReportParamsSchema>;

export const GetCLStatementParamsSchema = CLAgencyContextSchema.extend({
  START_DATE: z.string(),
  END_DATE: z.string(),
});
/** Params for fetching a city-ledger statement range. */
export type GetCLStatementParams = z.infer<typeof GetCLStatementParamsSchema>;

/** City-ledger statement data with running balances. */
export type CLStatements = {
  ENDING_BALANCE: number;
  My_Rows: {
    Cl_tx: ClTx;
    DOC_NUMBER: string | null;
    RUNNING_BALANCE: number;
  }[];
  STARTING_BALANCE: number;
};

// ---------------------------------------------------------------------------
// Fiscal documents
// ---------------------------------------------------------------------------

export const IssueFiscalDocumentParamsSchema = CLAgencyContextSchema.extend({
  START_DATE: z.string(),
  END_DATE: z.string(),
  LIST_CL_TX_ID: z.array(z.number()).optional().default([]),
  BOOKING_NBR: z.string().optional().nullable().default(null),
  FD_TYPE_CODE: z.string(),
  FD_STATUS_CODE: z.string().optional().default(FdStatus.Issued),
});
/** Params for issuing fiscal documents from city-ledger entries. */
export type IssueFiscalDocumentParams = z.infer<typeof IssueFiscalDocumentParamsSchema>;

export const GetFiscalDocumentsParamsSchema = z.object({
  DOC_NUMBER: z.string().optional().default(''),
  START_DATE: z.string().optional().nullable(),
  END_DATE: z.string().optional().nullable(),
  BOOK_NBR: z.string().optional().nullable(),
  LIST_FD_TYPE_CODE: z.array(z.string()).optional().nullable().default(null),
  LIST_FD_STATUS_CODE: z.array(z.string()).optional().nullable().default(null),
  AGENCY_ID: z.number(),
});
/** Filters for listing fiscal documents. */
export type GetFiscalDocumentsParams = z.infer<typeof GetFiscalDocumentsParamsSchema>;

export const IssueInvoiceFromDraftParamsSchema = z.object({
  FD_ID: z.number(),
});
/** Payload for issuing an invoice from a draft document. */
export type IssueInvoiceFromDraftParams = z.infer<typeof IssueInvoiceFromDraftParamsSchema>;

export const VoidInvoiceByCreditNoteParamsSchema = z.object({
  FD_ID: z.number(),
  VOID_DATE: z.string().optional().default(moment().format('YYYY-MM-DD')),
  REASON: z.string().optional(),
});
/** Payload for voiding an invoice via credit note. */
export type VoidInvoiceByCreditNoteParams = z.infer<typeof VoidInvoiceByCreditNoteParamsSchema>;

export const DeleteDraftFiscalDocumentParamsSchema = z.object({
  FD_ID: z.number(),
});
/** Payload for deleting a draft fiscal document. */
export type DeleteDraftFiscalDocumentParams = z.infer<typeof DeleteDraftFiscalDocumentParamsSchema>;

export type FiscalDocuments = FiscalDocument[];

export type FdType = (typeof FdTypes)[keyof typeof FdTypes];

export const PrintClFiscalDocumentParamsSchema = z.object({
  doc_number: z.string(),
  lang: z.string().optional().default('en'),
});
export type PrintClFiscalDocumentParams = z.infer<typeof PrintClFiscalDocumentParamsSchema>;

export const PrintClStatementParamsSchema = z.object({
  agency_id: z.string(),
  from_date: z.string(),
  to_date: z.string(),
  lang: z.string().optional().default('en'),
});
export type PrintClStatementParams = z.infer<typeof PrintClStatementParamsSchema>;

export const PrintClProformaParamsSchema = z.object({
  agency_id: z.string(),
  from_date: z.string(),
  to_date: z.string(),
  lang: z.string().optional().default('en'),
  booking_nbr: z.string().optional().nullable().default(null),
});
export type PrintClProformaParams = z.infer<typeof PrintClProformaParamsSchema>;

export const GetClProformaLinkParamsSchema = z.object({
  FD_ID: z.number(),
});
export type GetClProformaLinkParams = z.infer<typeof GetClProformaLinkParamsSchema>;

export const VoidReceiptByCreditReceiptParamsSchema = z.object({
  FD_ID: z.number(),
  VOID_DATE: z.string().optional().default(moment().format('YYYY-MM-DD')),
  REASON: z.string().optional().default(''),
});
export type VoidReceiptByCreditReceiptParams = z.infer<typeof VoidReceiptByCreditReceiptParamsSchema>;
