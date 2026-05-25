import { Component, Host, h, Prop, State, Event, EventEmitter } from '@stencil/core';
import { mealReportStore, updateMealGuestPreference } from '../../stores/meal-report.store';
import { MealReportService } from '../../services/meal-report/meal-report.service';

@Component({
  tag: 'ir-meal-guest-list',
  styleUrls: ['ir-meal-guest-list.css', '../../common/table.css'],
  scoped: true,
})
export class IrMealGuestList {
  @Prop() propertyid: number;
  @Prop() ticket: string;

  @State() showConfirm: boolean = false;
  @State() pendingUpdate: { room_identifier: string; code: string; guestName: string } | null = null;
  @State() renderKey: number = 0;

  @Event() preferenceChanged: EventEmitter<void>;

  private mealReportService = new MealReportService();

  handlePreferenceClick(entry: any, code: string) {
    if (entry.hb_preference_code === code) return;
    
    this.pendingUpdate = {
        room_identifier: entry.room_identifier,
        code,
        guestName: `${entry.guest.first_name} ${entry.guest.last_name}`
    };
    this.showConfirm = true;
  }

  cancelUpdate() {
    this.showConfirm = false;
    this.pendingUpdate = null;
    this.renderKey++;
  }

  async confirmUpdate() {
    if (!this.pendingUpdate) return;

    try {
      await this.mealReportService.setHBPreference({
        property_id: this.propertyid,
        room_identifier: this.pendingUpdate.room_identifier,
        code: this.pendingUpdate.code,
      });
      updateMealGuestPreference(this.pendingUpdate.room_identifier, this.pendingUpdate.code);
      this.preferenceChanged.emit();
    } catch (error) {
      console.error('Update Preference Error:', error);
    } finally {
        this.showConfirm = false;
        this.pendingUpdate = null;
    }
  }

  render() {
    const list = mealReportStore.guestList;

    if (!list || list.length === 0) {
      return (
        <div class="text-center p-4 text-muted border-0 bg-white">
          <p class="mb-0 small">No guests found for current filters.</p>
        </div>
      );
    }

    const totalAdults = list.reduce((sum, item) => sum + item.occupancy.adult_nbr, 0);
    const totalChildren = list.reduce((sum, item) => sum + item.occupancy.children_nbr, 0);

    return (
      <Host>
        <div class="table-container p-0 m-0 table-responsive" key={this.renderKey.toString()}>
          <table class="table align-middle mb-0">
            <thead>
              <tr class="table-header">
                <th class="ps-4 text-start" style={{ textTransform: 'none', width: '80px' }}>Unit</th>
                <th class="text-start" style={{ textTransform: 'none', width: '200px' }}>Guest name</th>
                <th class="text-center" style={{ textTransform: 'none', width: '100px' }}>Ad - Ch</th>
                <th class="text-start" style={{ textTransform: 'none', width: '120px' }}>Source</th>
                <th class="text-start" style={{ textTransform: 'none', width: '150px' }}>Rate plan</th>
                <th class="text-start" style={{ textTransform: 'none', width: '160px' }}>Preference</th>
              </tr>
            </thead>
            <tbody>
              {list.map(entry => (
                <tr class="ir-table-row">
                  <td class="ps-4 text-start" style={{ width: '80px' }}>
                    <span class="text-dark small">{entry.unit.name}</span>
                  </td>
                  <td class="text-start" style={{ width: '200px' }}>
                    <div class="d-flex align-items-center">
                        <span class="text-truncate" style={{maxWidth: '180px', fontWeight: '400'}} title={`${entry.guest.first_name} ${entry.guest.last_name}`}>{entry.guest.first_name} {entry.guest.last_name}</span>
                        {entry.is_arriving_today && <wa-tag size="small" variant="brand" pill class="ms-2" style={{fontSize: '9px'}}>ARR</wa-tag>}
                    </div>
                  </td>
                  <td class="text-center" style={{ width: '100px' }}>{entry.occupancy.adult_nbr} - {entry.occupancy.children_nbr}</td>
                  <td class="text-muted text-start" style={{ width: '120px' }}>{entry.source?.Label}</td>
                  <td class="text-truncate text-muted text-start" style={{ maxWidth: '150px', width: '150px' }} title={entry.rate_plan.name}>{entry.rate_plan.short_name}</td>
                  <td class="text-start" style={{ width: '160px' }}>
                    <div class="d-flex align-items-center">
                        <select
                          class="form-select form-select-sm border-0 bg-light py-1 px-2 rounded"
                          style={{ width: '140px', fontSize: '11px', cursor: 'pointer' }}
                          onInput={e => this.handlePreferenceClick(entry, (e.target as HTMLSelectElement).value)}
                        >
                          {mealReportStore.setupEntries.hb_preference.map(pref => (
                            <option value={pref.CODE_NAME} selected={entry.hb_preference_code === pref.CODE_NAME}>
                              {pref.CODE_VALUE_EN}
                            </option>
                          ))}
                        </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr class="total-row border-top-2" style={{ backgroundColor: '#f8f9fa' }}>
                <td class="ps-4" style={{ width: '100px' }}></td>
                <td class="text-end fw-bold small text-uppercase py-3">Total</td>
                <td class="text-center fw-bold text-primary py-3" style={{ fontSize: '14px', width: '100px' }}>
                    <div>{totalAdults} - {totalChildren}</div>
                    <div class="extra-small text-muted font-weight-normal" style={{ fontSize: '10px', marginTop: '-4px' }}>Ad - Ch</div>
                </td>
                <td colSpan={3} class="text-muted small align-middle ps-3 py-3">
                    <div class="d-flex align-items-center gap-2">
                        <span>{list.length} Units</span>
                        <span class="text-neutral-300">|</span>
                        <span>{totalAdults + totalChildren} Guests</span>
                    </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <wa-dialog
          label="Confirm preference change"
          open={this.showConfirm}
          onwa-after-hide={() => this.cancelUpdate()}
        >
          {this.pendingUpdate && (
            <p>
              Are you sure you want to change the meal preference for <strong>{this.pendingUpdate.guestName}</strong>?
            </p>
          )}
          <div slot="footer" class="d-flex gap-2 justify-content-end">
            <wa-button variant="neutral" onClick={() => this.cancelUpdate()}>
                Cancel
            </wa-button>
            <wa-button variant="brand" onClick={() => this.confirmUpdate()}>
                Confirm
            </wa-button>
          </div>
        </wa-dialog>
      </Host>
    );
  }
}
