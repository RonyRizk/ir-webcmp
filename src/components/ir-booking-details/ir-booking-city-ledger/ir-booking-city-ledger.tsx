import { Component, Event, EventEmitter, Host, Prop, State, h } from '@stencil/core';
import { Booking } from '@/models/booking.dto';
import { IEntries } from '@/models/IBooking';
import { CityLedgerService } from '@/services/city-ledger';
import type { ServiceCategoryOption } from '@/components/ir-city-ledger/ir-city-ledger-folio/ir-city-ledger-transaction-drawer/ir-city-ledger-transaction-form/ir-city-ledger-transaction-form.schema';
import { FolioRow, mapClTxToFolioRow } from '@/components/ir-city-ledger/ir-city-ledger-folio/types';
import moment from 'moment';
import calendar_data from '@/stores/calendar-data';
import Token from '@/models/Token';
import { actionableClTypes } from '@/services/city-ledger.service';
import { formatAmount } from '@/utils/utils';

@Component({
  tag: 'ir-booking-city-ledger',
  styleUrls: ['ir-booking-city-ledger.css'],
  scoped: true,
})
export class IrBookingCityLedger {
  private cityLedgerService = new CityLedgerService();
  private tokenService = new Token();

  /** Booking object; component is hidden when booking.agent is null. */
  @Prop() booking: Booking;

  /** Active language code. */
  @Prop() language: string = 'en';

  /** Service-category entries used to populate the transaction form. */
  @Prop() svcCategories: IEntries[] = [];

  /** Folio rows fetched by the parent. */
  @Prop() folioRows: FolioRow[] = [];

  /** Loading state driven by the parent fetch. */
  @Prop() isLoading: boolean = false;

  /** Error message driven by the parent fetch. */
  @Prop() error: string | null = null;

  /** Emitted when a mutation (delete / save) completes so the parent can re-fetch. */
  @Event({ bubbles: true }) clRefreshNeeded: EventEmitter<void>;

  @State() private drawerOpen: boolean = false;
  @State() private deleteTarget: FolioRow | null = null;
  @State() private isDeleting: boolean = false;
  @State() private editingRow: FolioRow | null = null;

  private async handleDelete() {
    const row = this.deleteTarget;
    if (!row) return;
    this.isDeleting = true;
    try {
      await this.cityLedgerService.issueManualCLTx({
        CL_TX_ID: row._raw.CL_TX_ID,
        AGENCY_ID: this.booking.agent.id,
        SERVICE_DATE: row._raw.SERVICE_DATE,
        CL_TX_TYPE_CODE: row._raw.CL_TX_TYPE_CODE ?? '',
        DESCRIPTION: row._raw.DESCRIPTION,
        DEBIT: row._raw.DEBIT,
        CREDIT: row._raw.CREDIT,
        CURRENCY_ID: row._raw.CURRENCY_ID,
        PAY_METHOD_CODE: row._raw.PAY_METHOD_CODE ?? '',
        EXTERNAL_REF: row._raw.EXTERNAL_REF ?? '',
        IS_DELETE: true,
      });
      this.deleteTarget = null;
      this.clRefreshNeeded.emit();
    } catch (err) {
      console.error('[ir-booking-city-ledger] delete failed:', err);
    } finally {
      this.isDeleting = false;
    }
  }

  private get serviceCategoryOptions(): ServiceCategoryOption[] {
    return this.svcCategories.map(s => ({ id: s.CODE_NAME, label: s.CODE_VALUE_EN }));
  }

  private get bookingOptions() {
    return this.booking?.booking_nbr ? [{ id: this.booking.booking_nbr, label: `#${this.booking.booking_nbr}` }] : [];
  }

  private formatAmount(value: number): string {
    if (!value) return '—';
    return formatAmount(calendar_data.property?.currency?.symbol, value);
  }
  private rowHiddenCategories = new Set(['TBL_BSAD', 'TBL_BSP', 'TBL_BSE']);
  private get rows() {
    return this.folioRows?.filter(r => !this.rowHiddenCategories.has(r._raw.REL_ENTITY)) ?? [];
  }
  private renderRows() {
    if (this.rows.length === 0) {
      return (
        <div class="booking-city-ledger__empty-state">
          <ir-empty-state showIcon={false}></ir-empty-state>
        </div>
      );
    }
    return (
      <div class="folio-list">
        {this.rows.map(row => {
          const showDropdown = row.status.id !== 'billed' && row._raw.CATEGORY === null && actionableClTypes.has(row._raw.CL_TX_TYPE_CODE as any);

          return (
            <div key={row._rowId} class="folio-row">
              <div class="folio-row__header">
                <div class="folio-row__meta">
                  {/* <wa-tag size="s" variant={row.status.variant as any}>
                  {row.status.label}
                  {row.status.id === 'billed' && <wa-icon name="lock"></wa-icon>}
                </wa-tag> */}
                  {/* <ir-cl-status-tag transaction={{ _rowId: '', ...mapClTxToFolioRow(row._raw), balance: 0 }}></ir-cl-status-tag> */}
                  <span class="folio-row__date">{moment(row.serviceDate).format('MMM DD, YYYY')}</span>
                </div>
                <div class="folio-row__right">
                  <span class="folio-row__amount">
                    {row.debit !== null && <span class="is-debit">{row.debit ? this.formatAmount(row.debit) : ''}</span>}
                    {row.credit !== null && <span class="is-credit">{row.credit ? this.formatAmount(row.credit) : ''}</span>}
                  </span>
                  {showDropdown && (
                    <wa-dropdown
                      onwa-hide={e => {
                        e.stopImmediatePropagation();
                        e.stopPropagation();
                      }}
                      onwa-select={e => {
                        switch ((e.detail as any).item.value) {
                          case 'edit':
                            this.editingRow = row;
                            this.drawerOpen = true;
                            break;
                          case 'delete':
                            this.deleteTarget = row;
                            break;
                        }
                      }}
                    >
                      <wa-button size="s" class="folio-row__action-trigger" appearance="plain" slot="trigger">
                        <wa-icon name="ellipsis-vertical" class="folio-row__action-trigger-icon"></wa-icon>
                      </wa-button>

                      <wa-dropdown-item value="edit">
                        <wa-icon slot="icon" name="edit"></wa-icon>
                        Edit
                      </wa-dropdown-item>
                      <wa-dropdown-item value="delete" variant="danger">
                        <wa-icon slot="icon" name="trash"></wa-icon>
                        Delete
                      </wa-dropdown-item>
                    </wa-dropdown>
                  )}
                </div>
              </div>
              <div class={'folio-row-desc_row'}>
                {row.description && <p class="folio-row__desc">{row.description}</p>}
                <ir-cl-status-tag
                  style={{ marginRight: showDropdown ? '1.9rem' : '0' }}
                  transaction={{ _rowId: '', ...mapClTxToFolioRow(row._raw), balance: 0 }}
                ></ir-cl-status-tag>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  render() {
    if (!this.booking?.agent) {
      return <Host></Host>;
    }
    return (
      <Host>
        <wa-card class="booking-city-ledger__card">
          <div slot="header" class="booking-city-ledger__header-title">
            <p class="font-size-large p-0 m-0"> Agent Folio</p>
          </div>

          <wa-tooltip for="booking-city-ledger-add-btn">Add folio entry</wa-tooltip>
          <ir-custom-button
            slot="header-actions"
            id="booking-city-ledger-add-btn"
            size="s"
            variant="neutral"
            appearance="plain"
            onClickHandler={() => {
              this.editingRow = null;
              this.drawerOpen = true;
            }}
          >
            <wa-icon name="plus" style={{ fontSize: '1rem' }}></wa-icon>
          </ir-custom-button>

          {this.isLoading ? (
            <div class="booking-city-ledger__spinner-wrap">
              <ir-spinner></ir-spinner>
            </div>
          ) : this.error ? (
            <p class="booking-city-ledger__error">{this.error}</p>
          ) : (
            this.renderRows()
          )}
        </wa-card>

        <ir-city-ledger-transaction-drawer
          open={this.drawerOpen}
          drawerLabel={this.editingRow ? 'Edit Folio Entry' : 'New Folio Entry'}
          agent={this.booking.agent}
          booking={this.booking}
          transaction={this.editingRow?._raw ?? null}
          serviceCategoryOptions={this.serviceCategoryOptions}
          bookingOptions={this.bookingOptions}
          onCloseDrawer={() => {
            this.drawerOpen = false;
            this.editingRow = null;
          }}
          onTransactionSaved={() => {
            this.drawerOpen = false;
            this.editingRow = null;
            this.clRefreshNeeded.emit();
          }}
        ></ir-city-ledger-transaction-drawer>
        <ir-cl-fiscal-document-preview ticket={this.tokenService.getToken()} propertyId={calendar_data?.property?.id}></ir-cl-fiscal-document-preview>

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
            <ir-custom-button size="m" appearance="filled" variant="neutral" onClickHandler={() => (this.deleteTarget = null)}>
              Cancel
            </ir-custom-button>
            <ir-custom-button size="m" variant="danger" loading={this.isDeleting} onClickHandler={() => this.handleDelete()}>
              Delete
            </ir-custom-button>
          </div>
        </ir-dialog>
      </Host>
    );
  }
}
