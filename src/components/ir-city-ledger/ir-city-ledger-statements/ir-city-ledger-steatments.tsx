import { ICurrency } from '@/models/property';
import { CityLedgerService, type CLStatements, type FiscalDocument } from '@/services/city-ledger';
import calendar_data from '@/stores/calendar-data';
import { Component, Event, EventEmitter, Host, Prop, State, Watch, h } from '@stencil/core';
import type { StatementFilters } from './ir-city-ledger-statements-filter/ir-city-ledger-statements-filter';
import moment from 'moment';
import { FdTypes } from '@/types/enums';

@Component({
  tag: 'ir-city-ledger-statements',
  styleUrl: 'ir-city-ledger-statements.css',
  scoped: true,
})
export class IrCityLedgerStatements {
  @Prop() agentId: number | null = null;
  @Prop() agentName: string = '';
  @Prop() currencySymbol: string = '$';
  @Prop() currencies: ICurrency[] = [];
  @Prop() ticket: string;
  @Prop() propertyId: number;
  @Prop() initialFilters: StatementFilters;

  @Event() clStmtFiltersChange: EventEmitter<StatementFilters>;

  @State() private filters: StatementFilters = { fromDate: null, toDate: null };

  componentWillLoad() {
    if (this.initialFilters?.fromDate || this.initialFilters?.toDate) {
      this.filters = { ...this.initialFilters };
    }
  }
  @State() private statement: CLStatements | null = null;
  @State() private rows: FiscalDocument[] = [];
  @State() private isLoading: boolean = false;
  @State() private hasFetched: boolean = false;
  @State() private printFilters: StatementFilters | null = null;
  @State() private isFetchingPdf: boolean = false;
  @State() private pdfUrl: string | null = null;

  private cityLedgerService = new CityLedgerService();

  @Watch('agentId')
  handleAgentIdChange() {
    this.statement = null;
    this.rows = [];
    this.hasFetched = false;
    this.filters = { fromDate: null, toDate: null };
    this.printFilters = null;
    this.pdfUrl = null;
  }

  @Watch('printFilters')
  async handlePrintFiltersChange(next: StatementFilters | null) {
    if (!next?.fromDate || !next?.toDate || !this.agentId) {
      this.pdfUrl = null;
      return;
    }
    this.isFetchingPdf = true;
    try {
      const url = await this.cityLedgerService.printClStatement({
        agency_id: String(this.agentId),
        from_date: next.fromDate,
        to_date: next.toDate,
      });
      this.pdfUrl = url;
    } catch (err) {
      console.error('[ir-city-ledger-statements] printClStatement error:', err);
    } finally {
      this.isFetchingPdf = false;
    }
  }

  private async handleDownload() {
    if (!this.pdfUrl) return;
    const blob = await fetch(this.pdfUrl).then(r => r.blob());
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    const from = this.printFilters?.fromDate ?? '';
    const to = this.printFilters?.toDate ?? '';
    a.download = `Statement_${from}_${to}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
  }

  private async fetchStatement(filters: StatementFilters) {
    if (!this.agentId || !filters.fromDate || !filters.toDate) return;

    const currencyId = calendar_data?.property?.currency?.id;
    if (!currencyId) return;

    this.isLoading = true;
    try {
      const [result, fiscalDocuments] = await Promise.all([
        this.cityLedgerService.getCLStatement({
          AGENCY_ID: this.agentId,
          CURRENCY_ID: currencyId,
          START_DATE: filters.fromDate,
          END_DATE: filters.toDate,
        }),
        this.cityLedgerService.getFiscalDocuments({
          AGENCY_ID: this.agentId,
          START_DATE: filters.fromDate,
          END_DATE: filters.toDate,
          LIST_FD_TYPE_CODE: [FdTypes.CreditReceipt, FdTypes.CreditNote, FdTypes.DebitNote, FdTypes.Invoice, FdTypes.Receipt],
        }),
      ]);
      this.statement = result ?? null;
      this.rows = fiscalDocuments ?? [];
    } catch (err) {
      console.error('[ir-city-ledger-statements] getCLStatement error:', err);
    } finally {
      this.isLoading = false;
      this.hasFetched = true;
    }
  }

  private getPrintLabel(): string {
    if (!this.printFilters?.fromDate || !this.printFilters?.toDate) return 'Statement Preview';
    return `Statement - ${moment(this.printFilters.fromDate).format('MMM DD, YYYY')} to ${moment(this.printFilters.toDate).format('MMM DD, YYYY')}`;
  }

  render() {
    return (
      <Host>
        <section class="cl-statements" aria-label="City ledger statements">
          <ir-city-ledger-statements-filter
            initialFromDate={this.filters.fromDate}
            initialToDate={this.filters.toDate}
            onFiltersChange={e => {
              this.filters = e.detail;
              this.clStmtFiltersChange.emit(e.detail);
            }}
            onCreateStatement={e => {
              this.filters = e.detail;
              this.clStmtFiltersChange.emit(e.detail);
              this.fetchStatement(e.detail);
            }}
            onPrintStatement={e => (this.printFilters = e.detail)}
          ></ir-city-ledger-statements-filter>

          <ir-city-ledger-statements-table
            rows={this.rows}
            startingBalance={this.statement?.STARTING_BALANCE ?? 0}
            endingBalance={this.statement?.ENDING_BALANCE ?? 0}
            currencySymbol={this.currencySymbol}
            currencies={this.currencies}
            isLoading={this.isLoading}
            hasFetched={this.hasFetched}
            fromDate={this.filters.fromDate}
            toDate={this.filters.toDate}
            agentId={this.agentId}
          ></ir-city-ledger-statements-table>
        </section>

        <ir-preview-screen-dialog
          hideDefaultAction
          open={this.printFilters !== null}
          label={this.getPrintLabel()}
          onOpenChanged={e => {
            if (!e.detail) {
              this.printFilters = null;
              this.pdfUrl = null;
            }
          }}
        >
          <div slot="header-actions">
            {this.pdfUrl && (
              <ir-custom-button size="m" variant="neutral" appearance="plain" onClickHandler={() => this.handleDownload()}>
                <wa-icon name="download" label="Download PDF"></wa-icon>
              </ir-custom-button>
            )}
          </div>
          {this.printFilters &&
            (this.isFetchingPdf ? (
              <div class="preview-loading">
                <ir-spinner></ir-spinner>
              </div>
            ) : (
              <div class="preview-body">
                <ir-pdf-viewer src={this.pdfUrl}></ir-pdf-viewer>
              </div>
            ))}
        </ir-preview-screen-dialog>
      </Host>
    );
  }
}
