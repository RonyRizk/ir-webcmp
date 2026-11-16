import { Booking } from '@/models/booking.dto';
import { ExposedBookingsParams, IExposedBookingsCriteria } from '@/services/booking-listing/types';
import { createStore } from '@stencil/store';
import moment from 'moment';

export { ExposedBookingsParamsSchema } from '@/services/booking-listing/types';
export type { ExposedBookingsParams } from '@/services/booking-listing/types';

interface PaginationRange {
  from: number;
  to: number;
}

export interface BookingListingPagination {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  pageSize: number;
  showing: PaginationRange;
}

export interface IBookingListingStore extends IExposedBookingsCriteria {
  ApiClient: string;
  userSelection: ExposedBookingsParams;
  bookings: Booking[];
  download_url: string | null;
  rowCount: number;
  pagination: BookingListingPagination;
}

const initialState: IBookingListingStore = {
  channels: [],
  settlement_methods: [],
  statuses: [],
  types: [],
  ApiClient: '',
  rowCount: 10,
  bookings: [],
  balance_filter: [],
  pagination: {
    currentPage: 1,
    totalPages: 0,
    totalRecords: 0,
    pageSize: 10,
    showing: {
      from: 0,
      to: 0,
    },
  },
  userSelection: {
    from: moment().add(-7, 'days').format('YYYY-MM-DD'),
    to: moment().format('YYYY-MM-DD'),
    channel: '',
    balance_filter: null,
    property_id: null,
    start_row: 0,
    end_row: 20,
    total_count: 0,
    filter_type: null,
    name: '',
    book_nbr: '',
    booking_status: '',
    affiliate_id: 0,
    is_mpo_managed: false,
    is_mpo_used: false,
    is_for_mobile: false,
    is_combined_view: false,
    is_to_export: false,
  },
  download_url: null,
};

export const { state: booking_listing, onChange: onBookingListingChange } = createStore<IBookingListingStore>(initialState);
export function initializeUserSelection() {
  //booking_listing.channels[0].name
  booking_listing.userSelection = {
    ...booking_listing.userSelection,
    channel: '',
    booking_status: booking_listing.statuses[0].code,
    filter_type: booking_listing.types[0].id,
    book_nbr: '',
    name: '',
    from: moment().add(-7, 'days').format('YYYY-MM-DD'),
    to: moment().format('YYYY-MM-DD'),
    start_row: 0,
    end_row: booking_listing.rowCount,
    balance_filter: booking_listing.balance_filter[0].value,
  };
}
export function updateUserSelections(params: Partial<ExposedBookingsParams>) {
  booking_listing.userSelection = {
    ...booking_listing.userSelection,
    ...params,
  };
}
export function updateUserSelection(key: keyof ExposedBookingsParams, value: any) {
  booking_listing.userSelection = {
    ...booking_listing.userSelection,
    [key]: value,
  };
}

const clamp = (value: number, min: number, max: number) => {
  return Math.min(Math.max(value, min), max);
};

const calculateShowing = (page: number, pageSize: number, totalRecords: number): PaginationRange => {
  if (totalRecords === 0) {
    return { from: 0, to: 0 };
  }

  const startRow = (page - 1) * pageSize;
  return {
    from: startRow + 1,
    to: Math.min(startRow + pageSize, totalRecords),
  };
};

const calculateTotalPages = (totalRecords: number, pageSize: number) => {
  if (totalRecords === 0) {
    return 0;
  }
  return Math.ceil(totalRecords / pageSize);
};

const getRowBounds = (page: number, pageSize: number) => {
  const startRow = (page - 1) * pageSize;
  return {
    startRow,
    endRow: startRow + pageSize,
  };
};

export function updatePaginationFromSelection(selection: ExposedBookingsParams) {
  const nextPageSize = selection.end_row - selection.start_row || booking_listing.pagination.pageSize || booking_listing.rowCount;
  const totalRecords = selection.total_count;
  const totalPages = calculateTotalPages(totalRecords, nextPageSize);
  const currentPage = totalPages === 0 ? 1 : Math.floor(selection.start_row / nextPageSize) + 1;

  booking_listing.rowCount = nextPageSize;
  booking_listing.pagination = {
    ...booking_listing.pagination,
    pageSize: nextPageSize,
    currentPage,
    totalPages,
    totalRecords,
    showing: calculateShowing(currentPage, nextPageSize, totalRecords),
  };
}

export function setPaginationPage(page: number) {
  const pageSize = booking_listing.pagination.pageSize || booking_listing.rowCount;
  const totalPages = booking_listing.pagination.totalPages || Math.max(calculateTotalPages(booking_listing.pagination.totalRecords, pageSize), 1);
  const nextPage = clamp(page, 1, Math.max(totalPages, 1));
  const { startRow, endRow } = getRowBounds(nextPage, pageSize);

  updateUserSelections({
    start_row: startRow,
    end_row: endRow,
  });

  booking_listing.pagination = {
    ...booking_listing.pagination,
    currentPage: nextPage,
    showing: calculateShowing(nextPage, pageSize, booking_listing.pagination.totalRecords),
  };
  return { startRow, endRow };
}

export function setPaginationPageSize(pageSize: number) {
  const normalizedPageSize = Math.max(pageSize, 1);
  booking_listing.rowCount = normalizedPageSize;
  const totalRecords = booking_listing.pagination.totalRecords;
  const totalPages = calculateTotalPages(totalRecords, normalizedPageSize);
  const nextPage = totalPages === 0 ? 1 : clamp(booking_listing.pagination.currentPage, 1, Math.max(totalPages, 1));
  const { startRow, endRow } = getRowBounds(nextPage, normalizedPageSize);

  booking_listing.pagination = {
    ...booking_listing.pagination,
    pageSize: normalizedPageSize,
    currentPage: nextPage,
    totalPages,
    showing: calculateShowing(nextPage, normalizedPageSize, totalRecords),
  };

  updateUserSelections({
    start_row: startRow,
    end_row: endRow,
  });
  return { startRow, endRow };
}
export default booking_listing;
