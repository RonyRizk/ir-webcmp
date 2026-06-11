import axios from 'axios';
import {
  AllocateCLCreditParamsSchema,
  CLAgencyContextSchema,
  GetCLAgingReportParamsSchema,
  GetCLStatementParamsSchema,
  IssueManualCLTxParamsSchema,
  SyncBookingToCityLedgerParamsSchema,
  ToggleCLTxHoldParamsSchema,
  TransferCLTransactionsParamsSchema,
  IssueFiscalDocumentParamsSchema,
  VoidInvoiceByCreditNoteParamsSchema,
  GetFiscalDocumentsParamsSchema,
  IssueInvoiceFromDraftParamsSchema,
  DeleteDraftFiscalDocumentParamsSchema,
  FetchCLParamsSchema,
  PrintClFiscalDocumentParamsSchema,
  PrintClStatementParamsSchema,
  PrintClProformaParamsSchema,
  GetClProformaLinkParamsSchema,
  VoidReceiptByCreditReceiptParamsSchema,
  type CLAccountBalance,
  type AllocateCLCreditParams,
  type FetchCLParams,
  type FetchCLResult,
  type GetCLAccountBalanceParams,
  type GetCLAccountOverviewParams,
  type GetCLAgingReportParams,
  type GetCLStatementParams,
  type GetCLUnallocatedTransactionsParams,
  type IssueManualCLTxParams,
  type SyncBookingToCityLedgerParams,
  type ToggleCLTxHoldParams,
  type TransferCLTransactionsParams,
  type CLStatements,
  type IssueFiscalDocumentParams,
  type VoidInvoiceByCreditNoteParams,
  type CLAccountOverview,
  type GetFiscalDocumentsParams,
  type IssueInvoiceFromDraftParams,
  type DeleteDraftFiscalDocumentParams,
  type PrintClFiscalDocumentParams,
  type PrintClStatementParams,
  type PrintClProformaParams,
  type FiscalDocuments,
  type ClTx,
  type FiscalDocument,
  type GetClProformaLinkParams,
  type VoidReceiptByCreditReceiptParams,
} from './types';
import { downloadFile } from '@/utils/utils';

export * from './types';

export class CityLedgerService {
  public async fetchCL(params: FetchCLParams): Promise<FetchCLResult> {
    const payload = FetchCLParamsSchema.parse(params);
    const { data } = await axios.post('/Fetch_CL', payload);

    if (data.ExceptionMsg !== '') throw new Error(data.ExceptionMsg);

    if (payload.is_export_to_excel && data.My_Params_Fetch_CL.Link_excel) {
      downloadFile(data.My_Params_Fetch_CL.Link_excel);
    }
    return data.My_Result;
  }

  public async printClFiscalDocument(params: PrintClFiscalDocumentParams): Promise<string> {
    const payload = PrintClFiscalDocumentParamsSchema.parse(params);
    const { data } = await axios.post('/Print_CL_Fiscal_Document', payload);
    if (data.ExceptionMsg !== '') throw new Error(data.ExceptionMsg);
    return data.My_Result;
  }

  public async getClProformaLink(params: GetClProformaLinkParams): Promise<string> {
    const payload = GetClProformaLinkParamsSchema.parse(params);
    const { data } = await axios.post('/Get_CL_Proforma_Link', payload);
    if (data.ExceptionMsg !== '') throw new Error(data.ExceptionMsg);
    return data.My_Result;
  }

  public async printClProforma(params: PrintClProformaParams): Promise<string> {
    const payload = PrintClProformaParamsSchema.parse(params);
    const { data } = await axios.post('/Print_CL_Proforma', payload);
    if (data.ExceptionMsg !== '') throw new Error(data.ExceptionMsg);
    return data.My_Result;
  }

  public async printClStatement(params: PrintClStatementParams): Promise<string> {
    const payload = PrintClStatementParamsSchema.parse(params);
    const { data } = await axios.post('/Print_CL_Statement', payload);
    if (data.ExceptionMsg !== '') throw new Error(data.ExceptionMsg);
    return data.My_Result;
  }

  public async toggleCLTxHold(params: ToggleCLTxHoldParams) {
    const payload = ToggleCLTxHoldParamsSchema.parse(params);
    const { data } = await axios.post('/Toggle_CL_Tx_Hold', payload);
    if (data.ExceptionMsg !== '') throw new Error(data.ExceptionMsg);
    return data.My_Result;
  }

  public async handleCityLedgerTransaction(params: Record<string, unknown>) {
    const { data } = await axios.post('/Handle_City_Ledger_Transaction', params);
    if (data.ExceptionMsg !== '') throw new Error(data.ExceptionMsg);
    return data.My_Result;
  }

  public async syncBookingToCityLedger(params: SyncBookingToCityLedgerParams) {
    const payload = SyncBookingToCityLedgerParamsSchema.parse(params);
    const { data } = await axios.post('/Sync_Booking_To_City_Ledger', payload);
    if (data.ExceptionMsg !== '') throw new Error(data.ExceptionMsg);
    return data.My_Result;
  }

  public async issueManualCLTx(params: IssueManualCLTxParams): Promise<ClTx> {
    const payload = IssueManualCLTxParamsSchema.parse(params);
    const { data } = await axios.post('/Issue_Manual_CL_Tx', payload);
    if (data.ExceptionMsg !== '') throw new Error(data.ExceptionMsg);
    return data.My_Result;
  }

  public async allocateCLCredit(params: AllocateCLCreditParams) {
    const payload = AllocateCLCreditParamsSchema.parse(params);
    const { data } = await axios.post('/Allocate_CL_Credit', payload);
    if (data.ExceptionMsg !== '') throw new Error(data.ExceptionMsg);
    return data.My_Result;
  }

  public async getCLAccountBalance(params: GetCLAccountBalanceParams): Promise<CLAccountBalance> {
    const payload = CLAgencyContextSchema.parse(params);
    const { data } = await axios.post('/Get_CL_Account_Balance', payload);
    if (data.ExceptionMsg !== '') throw new Error(data.ExceptionMsg);
    return data.My_Result;
  }

  public async getCLUnallocatedTransactions(params: GetCLUnallocatedTransactionsParams) {
    const payload = CLAgencyContextSchema.parse(params);
    const { data } = await axios.post('/Get_CL_Unallocated_Transactions', payload);
    if (data.ExceptionMsg !== '') throw new Error(data.ExceptionMsg);
    return data.My_Result;
  }

  public async getCLAccountOverview(params: GetCLAccountOverviewParams): Promise<CLAccountOverview> {
    const payload = CLAgencyContextSchema.parse(params);
    const { data } = await axios.post('/Get_CL_Account_Overview', payload);
    if (data.ExceptionMsg !== '') throw new Error(data.ExceptionMsg);
    return data.My_Result;
  }

  public async getCLAgingReport(params: GetCLAgingReportParams) {
    const payload = GetCLAgingReportParamsSchema.parse(params);
    const { data } = await axios.post('/Get_CL_Aging_Report', payload);
    if (data.ExceptionMsg !== '') throw new Error(data.ExceptionMsg);
    return data.My_Result;
  }

  public async getCLStatement(params: GetCLStatementParams): Promise<CLStatements> {
    const payload = GetCLStatementParamsSchema.parse(params);
    const { data } = await axios.post('/Get_CL_Statement', payload);
    if (data.ExceptionMsg !== '') throw new Error(data.ExceptionMsg);
    return data.My_Result;
  }

  public async transferCLTransactions(params: TransferCLTransactionsParams) {
    const payload = TransferCLTransactionsParamsSchema.parse(params);
    const { data } = await axios.post('/Transfer_CL_Transactions', payload);
    if (data.ExceptionMsg !== '') throw new Error(data.ExceptionMsg);
    return data.My_Result;
  }

  public async issueFiscalDocument(params: IssueFiscalDocumentParams): Promise<FiscalDocument> {
    const payload = IssueFiscalDocumentParamsSchema.parse(params);
    const { data } = await axios.post('/Issue_Fiscal_Document', payload);
    if (data.ExceptionMsg !== '') throw new Error(data.ExceptionMsg);
    return data.My_Result;
  }

  public async voidInvoiceByCreditNote(params: VoidInvoiceByCreditNoteParams) {
    const payload = VoidInvoiceByCreditNoteParamsSchema.parse(params);
    const { data } = await axios.post('/Void_Invoice_By_Credit_Note', payload);
    if (data.ExceptionMsg !== '') throw new Error(data.ExceptionMsg);
    return data.My_Result;
  }

  public async voidReceiptByCreditReceipt(params: VoidReceiptByCreditReceiptParams) {
    const payload = VoidReceiptByCreditReceiptParamsSchema.parse(params);
    const { data } = await axios.post('/Void_Receipt_By_Credit_Receipt', payload);
    if (data.ExceptionMsg !== '') throw new Error(data.ExceptionMsg);
    return data.My_Result;
  }

  public async getFiscalDocuments(params: GetFiscalDocumentsParams): Promise<FiscalDocuments> {
    const payload = GetFiscalDocumentsParamsSchema.parse(params);
    const { data } = await axios.post('/Get_Fiscal_Documents', payload);
    if (data.ExceptionMsg !== '') throw new Error(data.ExceptionMsg);
    return data.My_Result?.My_Rows;
  }
  public async issueInvoiceFromDraft(params: IssueInvoiceFromDraftParams) {
    const payload = IssueInvoiceFromDraftParamsSchema.parse(params);
    const { data } = await axios.post('/Issue_Invoice_From_Draft', payload);
    if (data.ExceptionMsg !== '') throw new Error(data.ExceptionMsg);
    return data.My_Result;
  }

  public async deleteDraftFiscalDocument(params: DeleteDraftFiscalDocumentParams) {
    const payload = DeleteDraftFiscalDocumentParamsSchema.parse(params);
    const { data } = await axios.post('/Delete_Draft_Fiscal_Document', payload);
    if (data.ExceptionMsg !== '') throw new Error(data.ExceptionMsg);
    return data.My_Result;
  }
}
