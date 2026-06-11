import { Component, Event, EventEmitter, Host, Prop, State, Watch, h } from '@stencil/core';
import { v4 } from 'uuid';
import moment from 'moment';
import { realtimeService, type RealtimeReason } from '@/services/realtime/realtime.service';
import type { ServiceCategoryOption } from './ir-city-ledger-transaction-drawer/ir-city-ledger-transaction-form/ir-city-ledger-transaction-form.schema';
import { type FolioFilters, type FolioRow, type FolioSummary, mapClTxToFolioRow } from './types';
import type { ICurrency } from '@/models/property';
import { CityLedgerService, type ClTx } from '@/services/city-ledger';
import calendar_data from '@/stores/calendar-data';
import { Agent } from '@/services/agents/type';

@Component({
  tag: 'ir-city-ledger-folio',
  styleUrl: 'ir-city-ledger-folio.css',
  scoped: true,
})
export class IrCityLedgerFolio {
  @Prop() agent: Agent | null = null;
  @Prop() propertyId: number;
  @Prop() ticket: string;
  @Prop() language: string = 'en';
  @Prop() serviceCategoryOptions: ServiceCategoryOption[] = [];
  @Prop() currencies: ICurrency[] = [];

  @State() private isTransactionOpen: boolean = false;
  @State() private editingTransaction: ClTx | null = null;
  @State() private deleteTarget: ClTx | null = null;
  @State() private isDeleting: boolean = false;
  @State() private filters: FolioFilters = {};
  @State() private data: FolioRow[] = [];
  @State() private isLoading: boolean = false;
  @State() private hasFetched: boolean = false;
  @State() private startingBalance: number = 0;
  @State() private closingBalance: number = 0;
  @State() private totalCount: number = 0;
  @State() private pageIndex: number = 0;
  @State() private pageSize: number = 25;
  @State() private isFetchingExcel: boolean = false;

  @Event() folioSummaryUpdate: EventEmitter<FolioSummary>;

  private cityLedgerService = new CityLedgerService();
  private unsubscribeRealtime: (() => void) | null = null;
  private clLockingPending = new Map<number, boolean>();
  private clLockingTimer: ReturnType<typeof setTimeout> | null = null;

  componentDidLoad() {
    this.unsubscribeRealtime = realtimeService.subscribe(this.propertyId, async msg => {
      await this.handleFolioMessage(msg.reason, msg.payload);
    });
  }

  disconnectedCallback() {
    this.unsubscribeRealtime?.();
    this.unsubscribeRealtime = null;
    if (this.clLockingTimer !== null) {
      clearTimeout(this.clLockingTimer);
      this.clLockingTimer = null;
    }
  }

  private getFolioSocketHandlers(): Partial<Record<RealtimeReason, (payload: any) => Promise<void>>> {
    // ─── Fill in once the server REASON string(s) and payload shape are known ───
    //
    // Relevance check (inline in each case):
    //   agent:  tx.AGENCY_ID !== this.agent?.id → return
    //   dates:  tx.SERVICE_DATE outside [filters.fromDate … filters.toDate] → return
    //
    // Running balance helper (inline in each case):
    //   let running = this.startingBalance;
    //   rows = rows.map(r => {
    //     running += (r.debit ?? 0) - (r.credit ?? 0);
    //     return { ...r, balance: running, _raw: { ...r._raw, RUNNING_BALANCE: running } };
    //   });
    //
    // return {
    //   'CL_TX_ADDED': async payload => {
    //     const tx = payload as ClTx;
    //     // relevance check...
    //     const row: FolioRow = { ...mapClTxToFolioRow(tx), _rowId: v4() };
    //     let running = this.startingBalance;
    //     this.data = [...this.data, row].map(r => {
    //       running += (r.debit ?? 0) - (r.credit ?? 0);
    //       return { ...r, balance: running, _raw: { ...r._raw, RUNNING_BALANCE: running } };
    //     });
    //   },
    //   'CL_TX_UPDATED': async payload => {
    //     const tx = payload as ClTx;
    //     // relevance check...
    //     const updated = this.data.map(r => (r._raw.CL_TX_ID === tx.CL_TX_ID ? { ...mapClTxToFolioRow(tx), _rowId: r._rowId } : r));
    //     let running = this.startingBalance;
    //     this.data = updated.map(r => {
    //       running += (r.debit ?? 0) - (r.credit ?? 0);
    //       return { ...r, balance: running, _raw: { ...r._raw, RUNNING_BALANCE: running } };
    //     });
    //   },
    //   'CL_TX_DELETED': async payload => {
    //     const id = (payload as { CL_TX_ID: number }).CL_TX_ID;
    //     const filtered = this.data.filter(r => r._raw.CL_TX_ID !== id);
    //     let running = this.startingBalance;
    //     this.data = filtered.map(r => {
    //       running += (r.debit ?? 0) - (r.credit ?? 0);
    //       return { ...r, balance: running, _raw: { ...r._raw, RUNNING_BALANCE: running } };
    //     });
    //   },
    // };
    return {
      CL_TX_LOCKING: async payload => {
        const tx = payload as ClTx;
        if (tx.TRAVEL_AGENCY_ID !== this.agent?.id) return;
        this.clLockingPending.set(tx.CL_TX_ID, tx.IS_LOCKED);
        if (this.clLockingTimer !== null) clearTimeout(this.clLockingTimer);
        this.clLockingTimer = setTimeout(() => {
          this.clLockingTimer = null;
          this.applyClLockingUpdates();
        }, 150);
      },
      CL_TX_HOLD_TOGGLED: async payload => {
        const { cl_tx_id, agency_id, is_hold } = payload as { cl_tx_id: number; agency_id: number; is_hold: boolean };
        if (agency_id !== this.agent?.id) return;
        this.data = this.data.map(r => {
          if (r._raw.CL_TX_ID !== cl_tx_id) return r;
          const updatedTx: ClTx = { ...r._raw, IS_HOLD: is_hold };
          return { ...mapClTxToFolioRow(updatedTx), _rowId: r._rowId };
        });
      },
      CL_TX_CREATED: async payload => {
        const tx = payload as ClTx;
        if (tx.TRAVEL_AGENCY_ID !== this.agent?.id) return;
        const row: FolioRow = { ...mapClTxToFolioRow(tx), _rowId: v4() };
        let running = this.startingBalance;
        this.data = [...this.data, row].map(r => {
          running += (r.debit ?? 0) - (r.credit ?? 0);
          return { ...r, balance: running, _raw: { ...r._raw, RUNNING_BALANCE: running } };
        });
        this.totalCount += 1;
      },
    };
  }

  private async handleFolioMessage(reason: RealtimeReason, payload: unknown): Promise<void> {
    const handler = this.getFolioSocketHandlers()[reason];
    if (!handler) return;
    await handler(payload);
  }

  private applyClLockingUpdates(): void {
    const pending = this.clLockingPending;
    this.clLockingPending = new Map();
    this.data = this.data.map(r => {
      const isLocked = pending.get(r._raw.CL_TX_ID);
      if (isLocked === undefined) return r;
      return { ...mapClTxToFolioRow({ ...r._raw, IS_LOCKED: isLocked }), _rowId: r._rowId };
    });
  }

  private async handleDelete() {
    const tx = this.deleteTarget;
    if (!tx) return;
    this.isDeleting = true;
    try {
      await this.cityLedgerService.issueManualCLTx({
        CL_TX_ID: tx.CL_TX_ID,
        AGENCY_ID: this.agent.id,
        SERVICE_DATE: tx.SERVICE_DATE,
        CL_TX_TYPE_CODE: tx.CL_TX_TYPE_CODE ?? '',
        DESCRIPTION: tx.DESCRIPTION,
        DEBIT: tx.DEBIT,
        CREDIT: tx.CREDIT,
        CURRENCY_ID: tx.CURRENCY_ID,
        PAY_METHOD_CODE: tx.PAY_METHOD_CODE ?? '',
        EXTERNAL_REF: tx.EXTERNAL_REF ?? '',
        IS_DELETE: true,
      });
      this.deleteTarget = null;
      await this.fetchFolioData();
    } catch (error) {
      console.error('Failed to delete city ledger entry', error);
    } finally {
      this.isDeleting = false;
    }
  }

  @Watch('agentId')
  handleAgentIdChange(newValue: number | null, oldValue: number | null) {
    if (newValue !== oldValue) {
      this.clearData();
    }
  }

  private clearData() {
    this.data = [];
    this.hasFetched = false;
    this.startingBalance = 0;
    this.closingBalance = 0;
    this.totalCount = 0;
    this.pageIndex = 0;
  }

  // private sortFolioRows(rows: FolioRow[]): FolioRow[] {
  //   const roomRows = rows.filter(r => r.docNumber !== null);
  //   const standaloneRows = rows.filter(r => r.docNumber === null);

  //   const groups = new Map<string, FolioRow[]>();
  //   for (const row of roomRows) {
  //     const key = `${row.bookingNumber}__${row.docNumber}`;
  //     if (!groups.has(key)) groups.set(key, []);
  //     groups.get(key)!.push(row);
  //   }

  //   for (const group of groups.values()) {
  //     group.sort((a, b) => a.serviceDate.localeCompare(b.serviceDate));
  //   }

  //   const slots: { anchorDate: string; rows: FolioRow[] }[] = [];
  //   for (const row of standaloneRows) {
  //     slots.push({ anchorDate: row.serviceDate, rows: [row] });
  //   }
  //   for (const group of groups.values()) {
  //     slots.push({ anchorDate: group[0].serviceDate, rows: group });
  //   }

  //   slots.sort((a, b) => a.anchorDate.localeCompare(b.anchorDate));
  //   return slots.flatMap(slot => slot.rows);
  // }
  private async fetchCl(withExport: boolean = false) {
    try {
      this.isFetchingExcel = withExport;
      if (!this.agent?.id || (!this.filters?.fromDate && !this.filters?.toDate)) return;

      const effectiveFrom = this.filters.fromDate ? this.filters.fromDate : moment(this.filters.toDate).subtract(5, 'years').format('YYYY-MM-DD');
      const effectiveTo = this.filters.toDate ? this.filters.toDate : moment(this.filters.fromDate).add(5, 'years').format('YYYY-MM-DD');

      const startRow = this.pageIndex * this.pageSize;

      const statusParams = (() => {
        switch (this.filters?.status) {
          case 'billed':
            return { IS_LOCKED: true, IS_HOLD: null };
          case 'held':
            return { IS_LOCKED: null, IS_HOLD: true };
          case 'unbilled':
            return { IS_LOCKED: false, IS_HOLD: false };
          case 'unbilled&checkedOut':
            return { IS_LOCKED: false, IS_HOLD: false, IS_CHECKED_OUT_ONLY: true };
          default:
            return { IS_LOCKED: null, IS_HOLD: null };
        }
      })();

      return await this.cityLedgerService.fetchCL({
        AGENCY_ID: this.agent?.id,
        START_DATE: effectiveFrom,
        END_DATE: effectiveTo,
        START_ROW: startRow,
        END_ROW: startRow + this.pageSize - 1,
        SEARCH_QUERY: this.filters.search || null,
        ...statusParams,
        is_export_to_excel: withExport,
      });
    } catch (error) {
    } finally {
      this.isFetchingExcel = false;
    }
  }

  private async fetchFolioData() {
    if (!this.agent?.id || (!this.filters?.fromDate && !this.filters?.toDate)) return;

    const effectiveFrom = this.filters.fromDate ? this.filters.fromDate : moment(this.filters.toDate).subtract(5, 'years').format('YYYY-MM-DD');
    const effectiveTo = this.filters.toDate ? this.filters.toDate : moment(this.filters.fromDate).add(5, 'years').format('YYYY-MM-DD');

    try {
      this.isLoading = true;

      const currencyId = calendar_data?.property?.currency?.id;

      const [result, statement] = await Promise.all([
        this.fetchCl(),
        this.cityLedgerService.getCLStatement({
          AGENCY_ID: this.agent?.id,
          CURRENCY_ID: currencyId,
          START_DATE: effectiveFrom,
          END_DATE: effectiveTo,
        }),
      ]);

      const txList: ClTx[] = result?.My_Cl_tx ?? [];
      this.totalCount = result?.TOTAL_COUNT ?? 0;

      const startingBal = statement?.STARTING_BALANCE ?? 0;
      this.startingBalance = startingBal;
      this.closingBalance = statement?.ENDING_BALANCE ?? 0;

      let totalDebits = 0;
      let totalCredits = 0;
      let unbilledCount = 0;

      const mappedRows: FolioRow[] = txList.map((tx: ClTx) => {
        const mapped = mapClTxToFolioRow(tx);
        totalDebits += tx.DEBIT || 0;
        totalCredits += tx.CREDIT || 0;
        if (mapped.status.label === 'Unbilled') unbilledCount++;
        return { ...mapped, _rowId: v4() };
      });

      this.data = mappedRows;

      this.folioSummaryUpdate.emit({
        startingBalance: startingBal,
        totalDebits,
        totalCredits,
        currentBalance: this.closingBalance,
        unbilledCount,
      });
    } catch (error) {
      console.error('Failed to fetch city ledger folio', error);
      this.data = [];
    } finally {
      this.isLoading = false;
      this.hasFetched = true;
    }
  }

  render() {
    return (
      <Host>
        {/* Filters */}
        <ir-city-ledger-folio-filters
          onFiltersChange={e => (this.filters = e.detail)}
          onApplyFilters={async e => {
            this.filters = e.detail;
            this.pageIndex = 0;
            await this.fetchFolioData();
          }}
          onAddEntry={() => {
            this.editingTransaction = null;
            this.isTransactionOpen = true;
          }}
          isExporting={this.isFetchingExcel}
          onExportFolio={() => {
            this.fetchCl(true);
          }}
        ></ir-city-ledger-folio-filters>

        {/* Table */}
        <ir-city-ledger-folio-table
          agentId={this.agent?.id}
          propertyId={this.propertyId}
          ticket={this.ticket}
          language={this.language}
          hideBalanceInfo={!!(this.filters.search || (this.filters.status && this.filters.status !== 'all'))}
          data={this.data}
          isLoading={this.isLoading}
          hasFetched={this.hasFetched}
          startingBalance={this.startingBalance}
          closingBalance={this.closingBalance}
          totalCount={this.totalCount}
          pageIndex={this.pageIndex}
          pageSize={this.pageSize}
          fromDate={this.filters?.fromDate}
          toDate={this.filters?.toDate}
          currencySymbol={calendar_data.property?.currency?.symbol}
          currencies={this.currencies}
          onPageChange={async e => {
            this.pageIndex = e.detail.pageIndex;
            this.pageSize = e.detail.pageSize;
            await this.fetchFolioData();
          }}
          onFetchRequested={async () => {
            this.pageIndex = 0;
            await this.fetchFolioData();
          }}
          onGenerateInvoice={e => console.log('Generate invoice for', e.detail)}
          onEditEntry={e => {
            this.editingTransaction = e.detail;
            this.isTransactionOpen = true;
          }}
          onDeleteEntry={e => {
            this.deleteTarget = e.detail;
          }}
        ></ir-city-ledger-folio-table>

        <ir-dialog
          label="Delete Entry"
          open={!!this.deleteTarget}
          onIrDialogHide={e => {
            e.stopImmediatePropagation();
            e.stopPropagation();
            if (!this.isDeleting) this.deleteTarget = null;
          }}
        >
          <p>Are you sure you want to delete this entry? This action cannot be undone.</p>
          <div slot="footer" class="ir-dialog__footer">
            <ir-custom-button size="medium" appearance="filled" variant="neutral" onClickHandler={() => (this.deleteTarget = null)}>
              Cancel
            </ir-custom-button>
            <ir-custom-button size="medium" variant="danger" loading={this.isDeleting} onClickHandler={() => this.handleDelete()}>
              Delete
            </ir-custom-button>
          </div>
        </ir-dialog>

        <ir-city-ledger-transaction-drawer
          open={this.isTransactionOpen}
          serviceCategoryOptions={this.serviceCategoryOptions}
          agent={this.agent}
          transaction={this.editingTransaction}
          drawerLabel={this.editingTransaction ? 'Edit Entry' : 'New Entry'}
          onTransactionSaved={() => {
            this.fetchFolioData();
          }}
          onCloseDrawer={() => {
            this.isTransactionOpen = false;
            this.editingTransaction = null;
          }}
        ></ir-city-ledger-transaction-drawer>
      </Host>
    );
  }
}
