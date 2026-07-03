export const ClTxTypeCode = {
  Payment: 'PAY',
  OpeningBalance: 'OB',
  Adjustment: 'ADJ',
  CreditNote: 'CN',
  DebitNote: 'DN',
  StandardChargeDebit: 'DB',
  Discount: 'DSC',
  CancellationPenalty: 'CPN',
  AdjustmentCredit: 'ADJC',
} as const;

export const TaxationStrategies = {
  Normal: '000',
  Cumulative: '001',
} as const;

export const PayTypes = {
  Payment: '001',
  Discount: '009',
  Refund: '010',
  CancellationAdjustment: '012',
  CancellationPenalty: '013',
  CreditReceipt: '014',
} as const;

export const FdTypes = {
  AdjustmentCredit: 'ADJC',
  Draft: 'DFT',
  Invoice: 'INV',
  CreditNote: 'CN',
  DebitNote: 'DN',
  Receipt: 'REC',
  Proforma: 'PRF',
  CreditReceipt: 'CREC',
} as const;

export const PayStatus = {
  Normal: '001',
  Void: '002',
};

export const HbPreference = {
  Dinner: '001',
  Lunch: '002',
} as const;

export const InvoiceableItemReason = {
  AlreadyInvoiced: '001',
  NotCheckedOutYet: '002',
  PickupCancellationPolicy: '003',
} as const;

export const PayMethodCode = {
  Cash: '001',
  OTAVirtualCard: '002',
  Online: '003',
  ManualCard: '004',
  MoneyTransfer: '005',
  BankDeposit: '006',
  BankTransfer: '007',
  BankCheck: '008',
  BankCash: '009',
} as const;

export const VatIncludedCodes = {
  NotApplicable: '002',
  Inclusive: '001',
  Exclusive: '000',
} as const;

export const ChargeSource = {
  ACCOMMODATION: 0,
  PICKUP: 1,
  EXTRA_SERVICE: 2,
} as const;

export const FdStatus = {
  Sent: 'SENT',
  Viewed: 'VIEWED',
  Paid: 'PAID',
  Partial: 'PARTIAL',
  Issued: 'ISSUED',
  Voided: 'VOIDED',
} as const;

export const InOut = {
  NotSet: '000',
  CheckedIn: '001',
  CheckedOut: '002',
} as const;
