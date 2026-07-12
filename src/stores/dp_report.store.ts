import { createStore } from '@stencil/store';
import moment from 'moment';
import { DpReportRow } from '@/components/ir-dp-report/types';
import { DpReportSummary } from '@/services/dp-report/types';

export interface DpReportFilters {
  from: string;
  to: string;
}

export interface DpReportTablePagination {
  currentPage: number;
  pageSize: number;
}

export interface IDpReportStore {
  filters: DpReportFilters;
  rows: DpReportRow[];
  summary: DpReportSummary;
  isLoading: boolean;
  tablePagination: DpReportTablePagination;
}

const initialState: IDpReportStore = {
  filters: {
    from: moment().add(-14, 'days').format('YYYY-MM-DD'),
    to: moment().format('YYYY-MM-DD'),
  },
  rows: [],
  summary: {
    avg_gain: 0,
    avg_loss: 0,
    bookings_above_base: 0,
    bookings_below_base: 0,
    total_bookings: 0,
    total_profit: 0,
  },
  isLoading: false,
  tablePagination: {
    currentPage: 1,
    pageSize: 20,
  },
};

export const { state: dp_report, onChange: onDpReportChange } = createStore<IDpReportStore>(initialState);

export function updateDpReportFilters(filters: Partial<DpReportFilters>) {
  dp_report.filters = { ...dp_report.filters, ...filters };
}

export function setDpReportTablePage(page: number) {
  dp_report.tablePagination = { ...dp_report.tablePagination, currentPage: page };
}

export function setDpReportTablePageSize(pageSize: number) {
  dp_report.tablePagination = { ...dp_report.tablePagination, pageSize, currentPage: 1 };
}

export default dp_report;
