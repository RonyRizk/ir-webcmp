import { ArchivedTask } from '@/models/housekeeping';
import { HouseKeepingService } from '@/services/housekeeping';
import calendar_data from '@/stores/calendar-data';
import housekeeping_store from '@/stores/housekeeping.store';
import { isRequestPending } from '@/stores/ir-interceptor.store';
import { downloadFile } from '@/utils/utils';
import { Component, Event, EventEmitter, Host, Listen, Prop, State, h } from '@stencil/core';
import moment from 'moment';
import { v4 } from 'uuid';

import { t } from '@/services/locale/t';
import { formatDate } from '@/utils/date';
export type ArchivesFilters = {
  from_date: string;
  to_date: string;
  filtered_by_hkm?: number[];
  filtered_by_unit?: number[];
};

@Component({
  tag: 'ir-hk-archive-drawer',
  styleUrl: 'ir-hk-archive-drawer.css',
  scoped: true,
})
export class IrHkArchiveDrawer {
  @Prop() propertyId: string | number;
  @Prop() language: string = 'en';
  @Prop() ticket: string;
  @Prop() open: boolean = false;

  @State() filters: ArchivesFilters = {
    from_date: null,
    to_date: null,
    filtered_by_hkm: [],
    filtered_by_unit: [],
  };
  @State() data: (ArchivedTask & { id: string })[] = [];
  @State() isLoading: 'search' | 'excel' | null = null;
  @State() fetchedData: boolean = false;
  @State() selectedBooking: number | string | null = null;

  @Event() drawerClosed: EventEmitter<void>;

  private readonly minSelectableDate = moment().subtract(90, 'days').format('YYYY-MM-DD');
  private readonly maxSelectableDate = moment().format('YYYY-MM-DD');
  private houseKeepingService = new HouseKeepingService();
  private units: { id: number; name: string }[] = [];

  componentWillLoad() {
    this.setUpUnits();
  }

  @Listen('closeSideBar')
  handleCloseBookingDetails(e: CustomEvent) {
    e.stopImmediatePropagation();
    e.stopPropagation();
    this.selectedBooking = null;
  }

  private setUpUnits() {
    const units: { id: number; name: string }[] = [];
    calendar_data.roomsInfo.forEach(r => {
      r.physicalrooms.forEach(room => {
        units.push({ id: room.id, name: room.name });
      });
    });
    this.units = units;
  }

  private updateFilters(props: Partial<ArchivesFilters>) {
    this.filters = { ...this.filters, ...props };
  }

  private async getArchivedTasks(export_to_excel: boolean = false) {
    const res = await this.houseKeepingService.getArchivedHKTasks({
      property_id: Number(this.propertyId),
      ...this.filters,
      is_export_to_excel: export_to_excel,
    });
    this.data = [...(res?.tasks || [])].map(t => ({ ...t, id: v4() }));
    this.fetchedData = true;
    return { tasks: res?.tasks, url: res?.url };
  }

  private async searchArchive() {
    try {
      this.isLoading = 'search';
      await this.getArchivedTasks();
    } catch (error) {
      console.log(error);
    } finally {
      this.isLoading = null;
    }
  }

  private async exportArchive() {
    try {
      this.isLoading = 'excel';
      const { url } = await this.getArchivedTasks(true);
      downloadFile(url);
    } catch (error) {
      console.log(error);
    } finally {
      this.isLoading = null;
    }
  }

  render() {
    return (
      <Host>
        <ir-drawer
          open={this.open}
          label={t('Lcz_CleaningArchives90Days', { fallback: 'Cleaning Archives (90 days)' })}
          class="hk_archive__drawer"
          onDrawerHide={() => this.drawerClosed.emit()}
        >
          <div class="archive-content">
            <div class="filters">
              <div class="filters-row">
                <wa-select
                  size="s"
                  placeholder={t('Lcz_AllUnits', { fallback: 'All units' })}
                  onchange={(e: Event) => {
                    const val = (e.target as HTMLSelectElement).value;
                    this.updateFilters({ filtered_by_unit: val === '000' ? [] : [Number(val)] });
                  }}
                  defaultValue={'000'}
                >
                  <wa-option value="000">{t('Lcz_AllUnits', { fallback: 'All units' })}</wa-option>
                  {this.units
                    .slice()
                    .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))
                    .map(v => (
                      <wa-option value={v.id.toString()}>{v.name}</wa-option>
                    ))}
                </wa-select>
                {housekeeping_store?.hk_criteria?.housekeepers.length > 1 && (
                  <wa-select
                    size="s"
                    defaultValue={'000'}
                    placeholder={t('Lcz_Allhousekeepers', { fallback: 'All housekeepers' })}
                    onchange={(e: Event) => {
                      const val = (e.target as HTMLSelectElement).value;
                      this.updateFilters({ filtered_by_hkm: val === '000' ? [] : [Number(val)] });
                    }}
                  >
                    <wa-option value="000">{t('Lcz_Allhousekeepers', { fallback: 'All housekeepers' })}</wa-option>
                    {housekeeping_store.hk_criteria.housekeepers
                      .slice()
                      .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))
                      .map(v => (
                        <wa-option value={v.id.toString()}>{v.name}</wa-option>
                      ))}
                  </wa-select>
                )}
              </div>
              <div class="filters-row">
                <ir-date-range-filter
                  withClear={false}
                  selectionMode="auto"
                  maxDate={this.maxSelectableDate}
                  minDate={this.minSelectableDate}
                  fromDate={this.filters.from_date}
                  toDate={this.filters.to_date}
                  onDatesChanged={e => this.updateFilters({ from_date: e.detail.from, to_date: e.detail.to })}
                />
                <div class="filter-actions">
                  <ir-custom-button variant="neutral" appearance="outlined" loading={this.isLoading === 'search'} onClickHandler={() => this.searchArchive()}>
                    {t('Lcz_Search', { fallback: 'Search' })}
                  </ir-custom-button>
                  <ir-custom-button variant="neutral" appearance="outlined" loading={this.isLoading === 'excel'} onClickHandler={() => this.exportArchive()}>
                    <wa-icon name="download" slot="start"></wa-icon>
                    {t('Lcz_ExportToExcel', { fallback: 'Export' })}
                  </ir-custom-button>
                </div>
              </div>
            </div>
            {this.fetchedData && (
              <div class="results">
                {this.data?.length === 0 && !isRequestPending('/Get_Archived_HK_Tasks') ? (
                  <ir-empty-state message={t('Lcz_NoResultsFound', { fallback: 'No results found' })} />
                ) : (
                  <div class="table-wrapper">
                    <table class="table data-table">
                      <thead>
                        <tr>
                          <th>{t('Lcz_Period', { fallback: 'Period' })}</th>
                          <th>{t('Lcz_Housekeeper', { fallback: 'Housekeeper' })}</th>
                          <th>{t('Lcz_Unit', { fallback: 'Unit' })}</th>
                          <th>{t('Lcz_BookingNumber', { fallback: 'Booking #' })}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {this.data?.map(d => (
                          <tr key={d.id} class="ir-table-row">
                            <td>{formatDate(d.date, 'MMM DD, YYYY')}</td>
                            <td>{d.house_keeper}</td>
                            <td>
                              <ir-tooltip message={d.unit} customSlot containerStyle={{ width: 'fit-content' }}>
                                <span slot="tooltip-trigger" class="unit-name">
                                  {d.unit}
                                </span>
                              </ir-tooltip>
                            </td>
                            <td>
                              {d.booking_nbr ? (
                                <ir-custom-button link onClickHandler={() => (this.selectedBooking = d.booking_nbr)}>
                                  {d.booking_nbr.toString()}
                                </ir-custom-button>
                              ) : (
                                t('Lcz_WasVacant', { fallback: 'Was vacant' })
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </ir-drawer>
        {/* <ir-drawer open={!!this.selectedBooking} label="" onDrawerHide={() => (this.selectedBooking = null)}>
          {this.selectedBooking && (
            <ir-booking-details
              hasPrint
              hasReceipt
              hasCloseButton
              is_from_front_desk
              propertyid={Number(this.propertyId)}
              hasRoomEdit
              hasRoomDelete
              hasRoomAdd
              bookingNumber={this.selectedBooking?.toString()}
              language={this.language}
              ticket={this.ticket}
            ></ir-booking-details>
          )}
        </ir-drawer> */}
        <ir-booking-details-drawer
          open={!!this.selectedBooking}
          propertyId={Number(this.propertyId)}
          bookingNumber={this.selectedBooking?.toString()}
          ticket={this.ticket}
          language={this.language}
          onBookingDetailsDrawerClosed={() => (this.selectedBooking = null)}
        ></ir-booking-details-drawer>
      </Host>
    );
  }
}
