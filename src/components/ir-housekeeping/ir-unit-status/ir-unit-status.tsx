import { IInspectionMode } from '@/models/housekeeping';
import { HouseKeepingService } from '@/services/housekeeping';
import housekeeping_store from '@/stores/housekeeping.store';
import { Component, Event, EventEmitter, Host, h } from '@stencil/core';

import { t } from '@/services/locale/t';
@Component({
  tag: 'ir-unit-status',
  styleUrl: 'ir-unit-status.css',
  scoped: true,
})
export class IrUnitStatus {
  private housekeepingService = new HouseKeepingService();
  @Event() resetData: EventEmitter<null>;

  async handleSelectChange(e: CustomEvent) {
    try {
      e.stopPropagation();
      e.stopImmediatePropagation();
      const window = e.detail;
      let mode: IInspectionMode;
      if (window === '') {
        mode = {
          is_active: false,
          window: -1,
        };
      } else {
        mode = {
          is_active: true,
          window: +window,
        };
      }
      await this.housekeepingService.setExposedInspectionMode(housekeeping_store.default_properties.property_id, mode);
      this.resetData.emit(null);
    } catch (error) {
      console.error(error);
    }
  }
  render() {
    return (
      <Host class="card p-1">
        <ir-title label={t('Lcz_RoomOrUnitStatus', { fallback: 'Room or Unit Status' })}></ir-title>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>{t('Lcz_Status', { fallback: 'Status' })}</th>
                <th class={'text-center'}>{t('Lcz_Code', { fallback: 'Code' })}</th>
                <th>{t('Lcz_Action', { fallback: 'Action' })}</th>
              </tr>
            </thead>
            <tbody>
              {housekeeping_store.hk_criteria.statuses?.map(status => (
                <tr key={status.code}>
                  <td>
                    <div class="status-container">
                      <span class={`circle ${status.style.shape} ${status.style.color}`}></span>
                      <p>{status.description}</p>
                    </div>
                  </td>
                  <td>{status.code}</td>
                  <td>
                    <div class="action-container">
                      <p class={'m-0'}>{status.action}</p>
                      {status.code === 'VAC' && (
                        <div>
                          <ir-select
                            selectedValue={status.inspection_mode.is_active ? status.inspection_mode?.window.toString() : ''}
                            firstOption={t('Lcz_No', { fallback: 'No' })}
                            onSelectChange={this.handleSelectChange.bind(this)}
                            data={Array.from(Array(7 + 1), (_, i) => i).map(i => {
                              const text =
                                i === 0
                                  ? t('Lcz_YesOnTheSameDay', { fallback: 'Yes on the same day' })
                                  : i === 1
                                    ? t('Lcz_DayPrior', { params: [i.toString()] })
                                    : t('Lcz_DaysPrior', { params: [i.toString()] });
                              return {
                                text,
                                value: i.toString(),
                              };
                            })}
                          ></ir-select>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Host>
    );
  }
}
