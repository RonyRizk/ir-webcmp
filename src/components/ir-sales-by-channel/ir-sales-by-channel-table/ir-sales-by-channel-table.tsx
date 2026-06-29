import { Component, Prop, State, Watch, h } from '@stencil/core';
import { ChannelReportResult, SalesByChannelMode } from '../types';
import { formatAmount } from '@/utils/utils';
import type { AllowedProperties } from '@/services/property/types';

@Component({
  tag: 'ir-sales-by-channel-table',
  styleUrls: ['ir-sales-by-channel-table.css', '../../../common/table.css'],
  scoped: true,
})
export class IrSalesByChannelTable {
  @Prop() records: ChannelReportResult;
  @Prop() allowedProperties: AllowedProperties;
  @Prop() mode: SalesByChannelMode;
  @State() visibleCount: number = 10;
  @State() properties: Map<number, string> = new Map();

  componentWillLoad() {
    this.setupProperties();
  }

  @Watch('allowedProperties')
  handlePropertiesChange() {
    this.setupProperties();
  }

  private setupProperties() {
    const map: Map<number, string> = new Map();
    for (const property of this.allowedProperties) {
      map.set(property.id, property.name);
    }
    this.properties = new Map(map);
  }

  private handleLoadMore = () => {
    this.visibleCount = Math.min(this.visibleCount + 10, this.records.length);
  };

  render() {
    const records = this.records ?? [];
    const visibleRecords = records.slice(0, this.visibleCount);
    const isSingleProperty = this.mode === 'property';

    if (records.length === 0) {
      return (
        <wa-card class="channel-table__card">
          <div class="channel-table__empty-wrapper">
            <ir-empty-state message="No sales data found."></ir-empty-state>
          </div>
        </wa-card>
      );
    }

    return (
      <wa-card class="channel-table__card">
        <div class="channel-table__scroll">
          <table class="table data-table" data-testid="hk_tasks_table">
            <thead class="table-header">
              <tr>
                <th class="cell--left">Source</th>
                <th class="cell--center">Room nights</th>
                <th class="cell--right">Room Revenue</th>
                <th class={`sales-by-channel-table__progress-col ${!isSingleProperty ? 'single' : ''}`}></th>
              </tr>
            </thead>
            <tbody>
              {visibleRecords.map(record => {
                const mainPercentage = `${parseFloat(record.PCT.toString()).toFixed(2)}%`;
                const secondaryPercentage = record.last_year ? `${parseFloat(record.last_year.PCT.toString()).toFixed(2)}%` : null;

                return (
                  <tr data-testid="record_row" class={{ 'task-table-row ir-table-row': true }}>
                    <td class="cell--left">
                      <div class="cell-stack --source">
                        <img class="booked-by-source__logo" id={`source-logo__`} src={record.SOURCE_ICON} alt={record.SOURCE} />
                        <p>{record.SOURCE}</p>
                        {/* {record.last_year?.SOURCE && <p class="value--previous">{record.last_year.SOURCE}</p>} */}
                      </div>
                    </td>
                    <td class="cell--center">
                      <div class="cell-stack">
                        <p class={record.last_year?.NIGHTS ? 'value--primary' : ''}>{record.NIGHTS}</p>
                        {record.last_year?.NIGHTS && <p class="value--previous">{record.last_year.NIGHTS}</p>}
                      </div>
                    </td>
                    <td class="cell--right">
                      <div class="cell-stack">
                        <p class={record.last_year?.REVENUE ? 'value--primary' : ''}>{formatAmount(record.currency, record.REVENUE)}</p>
                        {record.last_year?.REVENUE && <p class="value--previous">{formatAmount(record.currency, record.last_year.REVENUE)}</p>}
                      </div>
                    </td>
                    <td class={`sales-by-channel-table__progress-col ${!isSingleProperty ? 'single' : ''}`}>
                      {isSingleProperty && (
                        <div class="cell-stack">
                          <div class="occ-row">
                            <span class="occ-label">{mainPercentage}</span>
                            <wa-progress-bar class="occ-bar" value={parseFloat(record.PCT.toString())}></wa-progress-bar>
                          </div>
                          {record.last_year?.PCT && (
                            <div class="occ-row">
                              <span class="occ-label">{secondaryPercentage}</span>
                              <wa-progress-bar class="occ-bar occ-bar--previous" value={parseFloat(record.last_year.PCT.toString())}></wa-progress-bar>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {isSingleProperty && (
              <tfoot>
                <tr style={{ fontSize: '12px' }}>
                  <td colSpan={3}></td>
                  <td class="legend-cell">
                    <div class="legend-row">
                      <div class="legend-item">
                        <div class="legend-dot legend-dot--current"></div>
                        <p>Selected period</p>
                      </div>
                      <div class="legend-item">
                        <div class="legend-dot legend-dot--previous"></div>
                        <p>Previous year</p>
                      </div>
                    </div>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
          {this.visibleCount < records.length && (
            <div class="channel-table__load-more">
              <ir-custom-button variant="neutral" appearance="outlined" size="s" onClickHandler={this.handleLoadMore}>
                Load More
              </ir-custom-button>
            </div>
          )}
        </div>
      </wa-card>
    );
  }
}
