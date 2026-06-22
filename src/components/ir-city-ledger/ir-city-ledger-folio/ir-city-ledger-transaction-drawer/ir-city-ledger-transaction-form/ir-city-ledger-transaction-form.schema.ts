import moment from 'moment';
import { z } from 'zod';
import { ClTxTypeCode } from '@/types/enums';
import type { ClTx } from '@/services/city-ledger';

export type TransactionType = (typeof ClTxTypeCode)[keyof typeof ClTxTypeCode];

export const TRANSACTION_TYPE_RATES: Record<TransactionType, 'CR' | 'DB' | 'CR|DB'> = {
  [ClTxTypeCode.OpeningBalance]: 'CR|DB',
  [ClTxTypeCode.Payment]: 'CR',
  [ClTxTypeCode.StandardChargeDebit]: 'DB',
  [ClTxTypeCode.Adjustment]: 'CR|DB',
  [ClTxTypeCode.CreditNote]: 'CR',
  [ClTxTypeCode.DebitNote]: 'DB',
  [ClTxTypeCode.AdjustmentCredit]: 'CR',
  [ClTxTypeCode.Discount]: 'CR',
  [ClTxTypeCode.CancellationPenalty]: 'DB',
};

export const ENTRY_TYPES = ['CR', 'DB'] as const;
export type EntryType = (typeof ENTRY_TYPES)[number];

export interface PaymentTypeOption {
  code: string;
  description: string;
  operation: EntryType;
}

export interface PaymentMethodOption {
  code: string;
  description: string;
  operation?: string | null;
}

export const LINK_TYPES = ['INVOICE', 'BOOKING', 'NONE'] as const;
export type LinkType = (typeof LINK_TYPES)[number];

export const ADJUSTMENT_REASONS = ['ROUNDING_DIFFERENCE', 'GOODWILL_CREDIT', 'PRICE_MATCH', 'COMMISSION_CORRECTION', 'DISCOUNT_CORRECTION'] as const;
export type AdjustmentReason = (typeof ADJUSTMENT_REASONS)[number];

export interface TaxOption {
  id: string;
  label: string;
}

export interface LinkedOption {
  id: string;
  label: string;
}

export interface ServiceCategoryOption {
  id: string;
  label: string;
}

export const CREDIT_NOTE_MODES = ['cancel-invoice', 'goodwill'] as const;
export type CreditNoteMode = (typeof CREDIT_NOTE_MODES)[number];

export interface CityLedgerTransactionFormDraft {
  transactionType: TransactionType;
  date: string;
  amount: string;
  taxId: string;
  reference: string;
  notes: string;
  entryType?: EntryType | '';
  isCutover: boolean;
  payment_type?: PaymentTypeOption | null;
  payment_method?: PaymentMethodOption | null;
  designation?: string;
  invoiceId?: string;
  onAccount: boolean;
  serviceCategoryId?: string;
  linkType?: LinkType;
  linkedId?: string;
  reason?: AdjustmentReason | '';
  generatesFiscalDocument?: boolean;
  creditNoteMode?: CreditNoteMode;
}

const DATE_FORMAT = 'YYYY-MM-DD';

const dateSchema = z
  .string()
  .refine(value => moment(value, DATE_FORMAT, true).isValid(), 'Date must be in YYYY-MM-DD format.')
  .refine(value => {
    const valueDate = moment(value, DATE_FORMAT, true).startOf('day');
    const minimumAllowedDate = moment().startOf('day').subtract(12, 'months');
    return !valueDate.isBefore(minimumAllowedDate);
  }, 'Date cannot be older than 12 months from today.');

const commonFieldsSchema = z.object({
  date: dateSchema,
  amount: z.coerce.number().gt(0, 'Amount must be greater than 0.'),
  taxId: z.string().min(1, 'Tax selection is required.'),
  reference: z.string().optional(),
  notes: z.string().max(500).optional(),
});

const openingBalanceSchema = commonFieldsSchema.extend({
  transactionType: z.literal(ClTxTypeCode.OpeningBalance),
  entryType: z.enum(ENTRY_TYPES),
  isCutover: z.boolean(),
});

const paymentTypeSchema = z.object({
  code: z.string().min(3).max(4),
  description: z.string(),
  operation: z.enum(ENTRY_TYPES),
});

const paymentMethodSchema = z.object({
  code: z.string().min(3).max(4),
  description: z.string(),
  operation: z.string().optional().nullable(),
});

const paymentSchema = commonFieldsSchema.extend({
  transactionType: z.literal(ClTxTypeCode.Payment),
  payment_type: paymentTypeSchema.nullable().optional(),
  payment_method: paymentMethodSchema.nullable().optional(),
  designation: z.string().optional(),
  invoiceId: z.string().optional(),
  onAccount: z.boolean(),
});

const manualChargeSchema = commonFieldsSchema.extend({
  transactionType: z.literal(ClTxTypeCode.StandardChargeDebit),
  serviceCategoryId: z.string().optional(),
});

const adjustmentSchema = commonFieldsSchema.extend({
  transactionType: z.literal(ClTxTypeCode.Adjustment),
  entryType: z.enum(ENTRY_TYPES),
  linkType: z.enum(LINK_TYPES),
  linkedId: z.string().optional(),
  reason: z.enum(ADJUSTMENT_REASONS).optional(),
});

const creditNoteSchema = commonFieldsSchema.extend({
  transactionType: z.literal(ClTxTypeCode.CreditNote),
  creditNoteMode: z.enum(CREDIT_NOTE_MODES),
  invoiceId: z.string().optional(),
  generatesFiscalDocument: z.literal(true),
  amount: z.coerce.number().optional(),
  taxId: z.string().optional(),
});

const debitNoteSchema = commonFieldsSchema.extend({
  transactionType: z.literal(ClTxTypeCode.DebitNote),
  invoiceId: z.string().min(1, 'Invoice is required for debit note.'),
  generatesFiscalDocument: z.literal(true),
});

const discountSchema = commonFieldsSchema.extend({
  transactionType: z.literal(ClTxTypeCode.Discount),
});

const cancellationPenaltySchema = commonFieldsSchema.extend({
  transactionType: z.literal(ClTxTypeCode.CancellationPenalty),
});

export const cityLedgerTransactionSchema = z
  .discriminatedUnion('transactionType', [
    openingBalanceSchema,
    paymentSchema,
    manualChargeSchema,
    adjustmentSchema,
    creditNoteSchema,
    debitNoteSchema,
    discountSchema,
    cancellationPenaltySchema,
  ])
  .superRefine((data, ctx) => {
    if (data.transactionType === ClTxTypeCode.Payment && data.onAccount && data.invoiceId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['invoiceId'],
        message: 'Invoice must be empty when payment is marked as on account.',
      });
    }
    if (data.transactionType === ClTxTypeCode.Adjustment && data.linkType === 'NONE' && data.linkedId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['linkedId'],
        message: 'linkedId must be empty when link type is NONE.',
      });
    }
    if (data.transactionType === ClTxTypeCode.CreditNote && data.creditNoteMode === 'cancel-invoice' && !data.invoiceId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['invoiceId'],
        message: 'Invoice is required when cancelling an invoice.',
      });
    }
  });

export type CityLedgerTransactionPayload = z.infer<typeof cityLedgerTransactionSchema>;

export const DATE_INPUT_FORMAT = DATE_FORMAT;

const todayDate = () => moment().format(DATE_FORMAT);

const conditionalDefaultsByType = (transactionType: TransactionType): Partial<CityLedgerTransactionFormDraft> => {
  switch (transactionType) {
    case ClTxTypeCode.OpeningBalance:
      return {
        entryType: '',
        isCutover: false,
      };
    case ClTxTypeCode.Payment:
      return {
        payment_method: null,
        designation: undefined,
        invoiceId: undefined,
        onAccount: true,
      };
    case ClTxTypeCode.StandardChargeDebit:
      return {
        serviceCategoryId: undefined,
      };
    case ClTxTypeCode.Adjustment:
      return {
        entryType: '',
        linkType: 'NONE',
        linkedId: undefined,
      };
    case ClTxTypeCode.CreditNote:
      return {
        invoiceId: undefined,
        generatesFiscalDocument: true,
        creditNoteMode: 'cancel-invoice' as CreditNoteMode,
      };
    case ClTxTypeCode.DebitNote:
      return {
        invoiceId: undefined,
        generatesFiscalDocument: true,
      };
    default:
      return {};
  }
};

export const createInitialTransactionFormDraft = (transactionType: TransactionType = ClTxTypeCode.Payment): CityLedgerTransactionFormDraft => ({
  transactionType,
  date: moment().format(DATE_FORMAT),
  amount: '',
  taxId: 'N/A',
  reference: '',
  notes: '',
  entryType: '',
  isCutover: false,
  payment_type: null,
  payment_method: null,
  designation: undefined,
  invoiceId: undefined,
  onAccount: false,
  serviceCategoryId: undefined,
  linkType: 'NONE',
  linkedId: undefined,
  reason: '',
  generatesFiscalDocument: transactionType === ClTxTypeCode.CreditNote || transactionType === ClTxTypeCode.DebitNote,
  ...conditionalDefaultsByType(transactionType),
});

export const resetDraftForTransactionType = (nextType: TransactionType, current: CityLedgerTransactionFormDraft): CityLedgerTransactionFormDraft => ({
  ...createInitialTransactionFormDraft(nextType),
  transactionType: nextType,
  date: current.date || todayDate(),
  amount: current.amount,
  taxId: current.taxId || 'N/A',
  reference: current.reference || '',
});

export const buildTransactionPayloadInput = (draft: CityLedgerTransactionFormDraft): Record<string, unknown> => {
  const basePayload: Record<string, unknown> = {
    transactionType: draft.transactionType,
    date: draft.date,
    amount: draft.amount,
    taxId: draft.taxId,
    reference: draft.reference || undefined,
  };

  switch (draft.transactionType) {
    case ClTxTypeCode.OpeningBalance:
      return {
        ...basePayload,
        entryType: draft.entryType,
        isCutover: draft.isCutover,
      };
    case ClTxTypeCode.Payment:
      return {
        ...basePayload,
        payment_method: draft.payment_method,
        designation: draft.designation,
        invoiceId: draft.onAccount ? undefined : draft.invoiceId,
        onAccount: draft.onAccount,
      };
    case ClTxTypeCode.StandardChargeDebit:
      return {
        ...basePayload,
        serviceCategoryId: draft.serviceCategoryId,
      };
    case ClTxTypeCode.Adjustment:
      return {
        ...basePayload,
        entryType: draft.entryType,
        linkType: draft.linkType,
        linkedId: draft.linkType === 'NONE' ? undefined : draft.linkedId,
        reason: draft.reason || undefined,
      };
    case ClTxTypeCode.CreditNote:
      return {
        ...basePayload,
        creditNoteMode: draft.creditNoteMode ?? 'cancel-invoice',
        invoiceId: draft.creditNoteMode === 'goodwill' ? undefined : draft.invoiceId,
        generatesFiscalDocument: true,
      };
    case ClTxTypeCode.DebitNote:
      return {
        ...basePayload,
        invoiceId: draft.invoiceId,
        generatesFiscalDocument: true,
      };
    default:
      return basePayload;
  }
};

export const validateCityLedgerTransaction = (draft: CityLedgerTransactionFormDraft) => cityLedgerTransactionSchema.safeParse(buildTransactionPayloadInput(draft));

// ── Individual field schemas for ir-validator ────────────────────────────────
export const transactionTypeFieldSchema = z.enum(Object.values(ClTxTypeCode) as [TransactionType, ...TransactionType[]]);
export const dateFieldSchema = dateSchema;
export const amountFieldSchema = z.coerce.number().gt(0, 'Amount must be greater than 0.');
export const taxIdFieldSchema = z.string().min(1, 'Tax selection is required.');
export const entryTypeFieldSchema = z.enum(ENTRY_TYPES);
export const paymentTypeCodeFieldSchema = z.string().min(1, 'Payment type is required.');
export const paymentMethodCodeFieldSchema = z.string().min(1, 'Payment method is required.');
export const invoiceIdRequiredFieldSchema = z.string().min(1, 'Invoice is required.');
export const serviceCategoryFieldSchema = z.string().min(1, 'Service category is required.');
export const linkTypeFieldSchema = z.enum(LINK_TYPES);
export const reasonFieldSchema = z.enum(ADJUSTMENT_REASONS);

// ── Hydrate form draft from an existing ClTx row (edit mode) ─────────────────
export function hydrateFormDraftFromTx(tx: ClTx): CityLedgerTransactionFormDraft {
  const transactionType = (tx.CL_TX_TYPE_CODE ?? ClTxTypeCode.StandardChargeDebit) as TransactionType;
  const amount = tx.DEBIT > 0 ? tx.DEBIT : tx.CREDIT;
  const entryType: EntryType | '' = tx.CREDIT > 0 && tx.DEBIT === 0 ? 'CR' : tx.DEBIT > 0 && tx.CREDIT === 0 ? 'DB' : '';
  const taxId = tx.VAT_PERCENT > 0 ? String(tx.VAT_PERCENT) : 'N/A';

  const base: CityLedgerTransactionFormDraft = {
    ...createInitialTransactionFormDraft(transactionType),
    transactionType,
    date: tx.SERVICE_DATE ?? '',
    amount: amount > 0 ? String(amount) : '',
    taxId,
    reference: tx.EXTERNAL_REF ?? '',
    notes: '',
    entryType,
  };

  switch (transactionType) {
    case ClTxTypeCode.Payment:
      return {
        ...base,
        payment_method: tx.PAY_METHOD_CODE ? { code: tx.PAY_METHOD_CODE, description: tx.PAY_METHOD_CODE } : null,
        invoiceId: tx.FD_ID ? String(tx.FD_ID) : undefined,
        onAccount: !tx.FD_ID,
      };
    case ClTxTypeCode.StandardChargeDebit:
      return {
        ...base,
        serviceCategoryId: tx.CATEGORY ?? undefined,
      };
    case ClTxTypeCode.Adjustment:
      return {
        ...base,
        entryType,
        linkType: tx.FD_ID ? 'INVOICE' : tx.BH_ID ? 'BOOKING' : 'NONE',
        linkedId: tx.FD_ID ? String(tx.FD_ID) : tx.BH_ID ? String(tx.BH_ID) : undefined,
      };
    case ClTxTypeCode.CreditNote:
      return {
        ...base,
        invoiceId: tx.FD_ID ? String(tx.FD_ID) : undefined,
        creditNoteMode: tx.FD_ID ? 'cancel-invoice' : 'goodwill',
        generatesFiscalDocument: true,
      };
    case ClTxTypeCode.DebitNote:
      return {
        ...base,
        invoiceId: tx.FD_ID ? String(tx.FD_ID) : undefined,
        generatesFiscalDocument: true,
      };
    default:
      return base;
  }
}
