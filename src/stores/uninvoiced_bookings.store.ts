import { createStore } from '@stencil/store';
import moment from 'moment';
import { ICriteriaChannel, ICriteriaStatuses, ICriteriaTypes } from '@/models/IrBookingListing';
import { UninvoicedBookingRow } from '@/components/ir-uninvoiced-bookings/types';

export interface UninvoicedBookingsFilters {
  from: string;
  to: string;
  source: string;
}

export interface UninvoicedBookingsTablePagination {
  currentPage: number;
  pageSize: number;
}

export interface UninvoicedBookingsStore {
  filters: UninvoicedBookingsFilters;
  rows: UninvoicedBookingRow[];
  totalCount: number;
  channels: ICriteriaChannel[];
  statuses: ICriteriaStatuses[];
  types: ICriteriaTypes[];
  isLoading: boolean;
  tablePagination: UninvoicedBookingsTablePagination;
}

const initialState: UninvoicedBookingsStore = {
  filters: {
    from: moment().subtract(30, 'days').format('YYYY-MM-DD'),
    to: moment().format('YYYY-MM-DD'),
    source: '',
  },
  rows: [],
  totalCount: 0,
  channels: [],
  statuses: [],
  types: [],
  isLoading: false,
  tablePagination: {
    currentPage: 1,
    pageSize: 20,
  },
};

export const { state: uninvoiced_bookings, onChange: onUninvoicedBookingsChange } = createStore<UninvoicedBookingsStore>(initialState);

export function updateUninvoicedBookingsFilters(filters: Partial<UninvoicedBookingsFilters>) {
  uninvoiced_bookings.filters = { ...uninvoiced_bookings.filters, ...filters };
}

export function setUninvoicedBookingsCriteria(criteria: { channels: ICriteriaChannel[]; statuses: ICriteriaStatuses[]; types: ICriteriaTypes[] }) {
  uninvoiced_bookings.channels = criteria.channels ?? [];
  uninvoiced_bookings.statuses = criteria.statuses ?? [];
  uninvoiced_bookings.types = criteria.types ?? [];
}

export function setUninvoicedBookingsTablePage(page: number) {
  uninvoiced_bookings.tablePagination = { ...uninvoiced_bookings.tablePagination, currentPage: page };
}

export function setUninvoicedBookingsTablePageSize(pageSize: number) {
  uninvoiced_bookings.tablePagination = { ...uninvoiced_bookings.tablePagination, pageSize, currentPage: 1 };
}

export default uninvoiced_bookings;
