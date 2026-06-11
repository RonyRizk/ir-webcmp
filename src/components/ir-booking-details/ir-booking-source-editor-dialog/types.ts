export interface AssignableItem {
  key: string;
  label: string;
  type: 'room' | 'pickup' | 'extra';
  // Room-specific
  ratePlanShortName?: string;
  isNonRefundable?: boolean;
  unitName?: string;
  fromDate?: string;
  toDate?: string;
  // Extra-specific
  price?: number;
  currencySymbol?: string;
}
