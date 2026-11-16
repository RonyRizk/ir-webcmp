import { Component, Prop, State, Watch, h } from '@stencil/core';
import ApiClient from '@/models/ApiClient';
import moment from 'moment';
import { PropertyService } from '@/services/property';
import { RoomService } from '@/services/room.service';
import { SetupService } from '@/services/setup';
import { FdTypes } from '@/types/enums';
import type { SetupEntries } from '@/models/property';
import type { UnifiedFolioTargetType } from '@/services/property/types';
import type { PaginationChangeEvent } from '../ir-pagination/ir-pagination';
import { FiscalDocumentFilters, FiscalDocumentRow, FiscalFolioType } from './types';
import { LocaleController } from '@/services/locale/locale.controller';
import { LanguageSync } from '@/services/locale/language-sync';
import { SCREEN_TABLES } from '@/services/locale/screen-tables';
import { t } from '@/services/locale/t';

/** Selectable page sizes for the fiscal-documents list. */
const PAGE_SIZES = [20, 50, 100];

@Component({
  tag: 'ir-fiscal-documents',
  styleUrl: 'ir-fiscal-documents.css',
  scoped: true,
})
export class IrFiscalDocuments {
  @Prop() ticket: string;
  @Prop() baseurl: string;
  @Prop() language: string = 'en';
  @Prop() propertyid: number;
  /** Property username (aname). When provided without `propertyid`, the id is resolved from it. */
  @Prop() p: string;

  @State() filters: FiscalDocumentFilters = {
    fromDate: undefined,
    toDate: undefined,
    docNumber: '',
    taxableOnly: false,
    type: 'all',
    proformaOnly: false,
    folioType: 'all',
    agentId: null,
    guestId: null,
    searchBy: 'doc_nbr',
  };

  @State() private isPageLoading: boolean = true;
  @State() private property_id: number;
  /** `_FD_TYPE` setup entries — used to display the document type in the table. */
  @State() private fdTypes: SetupEntries[] = [];

  @State() private rows: FiscalDocumentRow[] = [];
  @State() private isLoading: 'search' | 'export' = null;
  @State() private hasFetched: boolean = false;

  // Server-side pagination state.
  @State() private pageSize: number = PAGE_SIZES[0];
  @State() private currentPage: number = 1;
  @State() private totalRows: number = 0;

  /** Booking number whose details drawer is currently open. */
  @State() private selectedBookingNumber: string | null = null;

  private apiClientService = new ApiClient();
  private propertyService = new PropertyService();
  private roomService = new RoomService();
  private setupService = new SetupService();

  /** Re-runs init when the language changes so server-localized data follows. */
  private languageSync = new LanguageSync(SCREEN_TABLES.fiscalDocuments, () => this.init());

  componentWillLoad() {
    if (this.baseurl) {
      this.apiClientService.setBaseUrl(this.baseurl);
    }
    if (this.ticket) {
      this.apiClientService.setApiClient(this.ticket);
      this.init();
    }
  }

  componentDidLoad() {
    this.languageSync.connect();
  }

  disconnectedCallback() {
    this.languageSync.disconnect();
  }

  @Watch('language')
  languageChanged(next: string, previous: string) {
    this.languageSync.propChanged(next, previous);
  }

  @Watch('ticket')
  handleTicketChange(newValue: string, oldValue: string) {
    if (newValue === oldValue) return;
    if (this.baseurl) {
      this.apiClientService.setBaseUrl(this.baseurl);
    }
    this.apiClientService.setApiClient(this.ticket);
    this.init();
  }

  /**
   * Page bootstrap: resolves the property id (from `propertyid`, or from the
   * aname `p` when only that is provided), then fetches the remaining setup in
   * parallel — the `_FD_TYPE` entries and the exposed property.
   */
  private async init() {
    this.isPageLoading = true;
    try {
      // Started first: it seeds `LocaleController.language` from the host prop synchronously,
      // so the requests below are built with the right language on first mount.
      const localeReady = LocaleController.load({ language: this.language, tables: SCREEN_TABLES.fiscalDocuments });
      let propertyId = this.propertyid;
      if (!propertyId && !this.p) {
        throw new Error('Property ID or username (p) is required');
      }

      // The aname → id lookup must resolve first because every other request
      // needs a numeric property id. It also loads the property into the store.
      if (!propertyId) {
        const propertyData = await this.roomService.getExposedProperty({
          id: 0,
          aname: this.p,
          language: LocaleController.language,
          is_backend: true,
        });
        propertyId = propertyData.My_Result.id;
      }
      this.property_id = propertyId;

      // Remaining setup — all in parallel. The property is only fetched here
      // when we didn't already load it through the aname lookup above.
      const requests: Promise<any>[] = [this.setupService.getSetupEntriesByTableName('_FD_TYPE'), localeReady];
      if (this.propertyid) {
        requests.push(
          this.roomService.getExposedProperty({
            id: propertyId,
            language: LocaleController.language,
            is_backend: true,
          }),
        );
      }
      const [fdTypes] = await Promise.all(requests);
      this.fdTypes = fdTypes ?? [];
    } catch (error) {
      console.error('[ir-fiscal-documents] init error:', error);
    } finally {
      this.isPageLoading = false;
    }
  }

  private targetTypeFromFolio(folioType: FiscalFolioType): UnifiedFolioTargetType | null {
    if (folioType === 'agent') return 'AGENT';
    if (folioType === 'guest') return 'GUEST';
    return null;
  }

  private resolveFdTypeCode(filters: FiscalDocumentFilters): string | null {
    if (filters.proformaOnly) return FdTypes.Proforma;
    if (filters.type && filters.type !== 'all') return filters.type;
    return null;
  }

  private async fetchFiscalDocuments(filters: FiscalDocumentFilters) {
    if (!filters.fromDate && !filters.toDate) return;

    this.isLoading = this.filters?.export ? 'export' : 'search';
    const effectiveFrom = filters.fromDate ? filters.fromDate : moment(filters.toDate).subtract(5, 'years').format('YYYY-MM-DD');
    const effectiveTo = filters.toDate ? filters.toDate : moment(filters.fromDate).add(5, 'years').format('YYYY-MM-DD');

    try {
      const { rows, total } = await this.propertyService.getUnifiedFolio({
        property_id: this.property_id,
        from_date: this.filters?.searchBy === 'booking_nbr' ? null : effectiveFrom,
        to_date: this.filters?.searchBy === 'booking_nbr' ? null : effectiveTo,
        target_type: this.targetTypeFromFolio(filters.folioType),
        doc_type: null,
        fd_type_code: this.resolveFdTypeCode(filters),
        doc_number: this.filters?.searchBy === 'doc_nbr' ? filters.docNumber || null : null,
        agent_id: this.filters?.agentId?.toString(),
        guest_id: this.filters?.guestId?.toString(),
        booking_number: this.filters?.searchBy === 'booking_nbr' ? this.filters.docNumber : null,
        page_index: this.currentPage - 1,
        page_size: this.pageSize,
        o_Total_Rows: null,
        is_export_to_excel: this.filters.export || false,
        Link_excel: '',
      });
      this.rows = rows;
      this.totalRows = total;
    } catch (err) {
      console.error('[ir-fiscal-documents] getUnifiedFolio error:', err);
      this.rows = [];
      this.totalRows = 0;
    } finally {
      this.isLoading = null;
      this.hasFetched = true;
    }
  }

  private handleApplyFilters(filters: FiscalDocumentFilters) {
    this.filters = filters;
    this.currentPage = 1;
    this.fetchFiscalDocuments(filters);
  }

  private handlePageChange(page: number) {
    if (page === this.currentPage) return;
    this.currentPage = page;
    this.fetchFiscalDocuments(this.filters);
  }

  private handlePageSizeChange(size: number) {
    if (size === this.pageSize) return;
    this.pageSize = size;
    this.currentPage = 1;
    this.fetchFiscalDocuments(this.filters);
  }

  render() {
    if (this.isPageLoading) {
      return <ir-loading-screen></ir-loading-screen>;
    }
    return (
      <ir-page label={t('Lcz_FiscalDocuments', { fallback: 'Fiscal Documents' })}>
        <ir-fiscal-documents-filters
          propertyId={this.property_id}
          loading={this.isLoading}
          filters={this.filters}
          onFilterChanged={e => (this.filters = { ...this.filters, ...e.detail })}
          onApplyFilters={e => this.handleApplyFilters(e.detail)}
        ></ir-fiscal-documents-filters>
        <ir-fiscal-documents-table
          rows={this.rows}
          taxableOnly={this.filters?.taxableOnly}
          isLoading={this.isLoading === 'search'}
          hasFetched={this.hasFetched}
          hasDates={!!(this.filters.fromDate && this.filters.toDate)}
          fromDate={this.filters.fromDate}
          toDate={this.filters.toDate}
          folioType={this.filters.folioType}
          agentId={this.filters.agentId}
          guestId={this.filters.guestId}
          ticket={this.ticket}
          propertyId={this.property_id}
          language={this.language}
          fdTypes={this.fdTypes}
          currentPage={this.currentPage}
          pageSize={this.pageSize}
          totalRecords={this.totalRows}
          pageSizes={PAGE_SIZES}
          onFetchRequested={() => this.fetchFiscalDocuments(this.filters)}
          onRequestPageChange={(e: CustomEvent<PaginationChangeEvent>) => this.handlePageChange(e.detail.currentPage)}
          onRequestPageSizeChange={(e: CustomEvent<PaginationChangeEvent>) => this.handlePageSizeChange(e.detail.pageSize)}
          onOpenBookingDetails={(e: CustomEvent<string>) => (this.selectedBookingNumber = e.detail)}
        ></ir-fiscal-documents-table>
        <ir-booking-details-drawer
          open={!!this.selectedBookingNumber}
          propertyId={this.property_id}
          bookingNumber={this.selectedBookingNumber}
          ticket={this.ticket}
          language={this.language}
          onBookingDetailsDrawerClosed={() => (this.selectedBookingNumber = null)}
        ></ir-booking-details-drawer>
        <ir-fiscal-document-preview
          mode="all"
          ticket={this.ticket}
          propertyId={this.property_id}
          onDocumentConverted={() => this.fetchFiscalDocuments(this.filters)}
        ></ir-fiscal-document-preview>
      </ir-page>
    );
  }
}
