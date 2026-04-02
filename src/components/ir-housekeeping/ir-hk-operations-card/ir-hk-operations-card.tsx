import { RoomService } from '@/services/room.service';
import { PropertyService } from '@/services/property.service';
import { HouseKeepingService } from '@/services/housekeeping.service';
import calendar_data from '@/stores/calendar-data';
import housekeeping_store from '@/stores/housekeeping.store';
import { isRequestPending } from '@/stores/ir-interceptor.store';
import locales from '@/stores/locales.store';
import { Component, Event, EventEmitter, Host, Prop, State, h } from '@stencil/core';
import { IToast } from '@components/ui/ir-toast/toast';
import { IEntries } from '@/models/IBooking';

@Component({
  tag: 'ir-hk-operations-card',
  styleUrl: 'ir-hk-operations-card.css',
  scoped: true,
})
export class IrHkOperationsCard {
  @Prop() frequencies: IEntries[] = [];
  @State() hkTasks: Array<{ name: string; frequency: string }> = [
    { name: '', frequency: '' },
    { name: '', frequency: '' },
  ];
  @State() selectedCleaningFrequency: string = null;

  @Event() toast: EventEmitter<IToast>;

  private roomService = new RoomService();
  private propertyService = new PropertyService();
  private houseKeepingService = new HouseKeepingService();
  private dialog: HTMLIrDialogElement;

  componentWillLoad() {
    const criteria = housekeeping_store.hk_criteria;
    this.hkTasks = [
      { name: criteria?.t1_config?.label ?? '', frequency: criteria?.t1_config?.freq ?? '' },
      { name: criteria?.t2_config?.label ?? '', frequency: criteria?.t2_config?.freq ?? '' },
    ];
    this.selectedCleaningFrequency = (calendar_data.cleaning_frequency ?? criteria?.cleaning_frequencies?.[0])?.code ?? null;
  }

  private async saveAutomaticCheckInCheckout(e: Event) {
    e.stopImmediatePropagation();
    e.stopPropagation();
    const target = e.target as HTMLSelectElement;
    const flag = target.value === 'auto';
    try {
      await this.roomService.SetAutomaticCheckInOut({
        property_id: housekeeping_store.default_properties.property_id,
        flag,
      });
      this.toast.emit({ position: 'top-right', title: 'Saved Successfully', description: '', type: 'success' });
    } catch (error) {
      console.log(error);
    }
  }

  private async saveCleaningFrequency() {
    try {
      await this.propertyService.setExposedCleaningFrequency({
        property_id: housekeeping_store.default_properties.property_id,
        code: this.selectedCleaningFrequency,
      });
      calendar_data.cleaning_frequency = { code: this.selectedCleaningFrequency, description: '' };
      this.toast.emit({ position: 'top-right', title: 'Saved Successfully', description: '', type: 'success' });
      this.dialog.closeModal();
    } catch (error) {
      console.log(error);
    }
  }

  private async saveHkTasks() {
    const [t1, t2] = this.hkTasks;
    try {
      await this.houseKeepingService.setHKTaskLabels({
        property_id: housekeeping_store.default_properties.property_id,
        t1_label: t1.name,
        t1_freq: t1.frequency,
        t2_label: t2.name,
        t2_freq: t2.frequency,
      });
      this.toast.emit({ position: 'top-right', title: 'Saved Successfully', description: '', type: 'success' });
    } catch (error) {
      console.log(error);
    }
  }

  render() {
    return (
      <Host>
        <wa-card class="">
          <div slot="header">
            <span class="ops-header__title">Operations Settings</span>
          </div>

          <div class="ops-settings">
            <div class="ops-setting-item">
              {/* <span class="ops-setting-item__icon">
                <wa-icon name="calendar-check"></wa-icon>
              </span> */}
              <div class="ops-setting-item__info">
                <span class="ops-setting-item__title">Automatic Check-in &amp; Check-out</span>
                <span class="ops-setting-item__subtitle">Process guests automatically based on property rules</span>
              </div>
              <div class="ops-setting-item__controls">
                <wa-select
                  size="small"
                  style={{ minWidth: '260px' }}
                  value={calendar_data.is_automatic_check_in_out ? 'auto' : 'manual'}
                  defaultValue={calendar_data.is_automatic_check_in_out ? 'auto' : 'manual'}
                  onchange={(e: Event) => this.saveAutomaticCheckInCheckout(e)}
                >
                  <wa-option value="auto">{locales.entries.Lcz_YesAsPerPropertyPolicy}</wa-option>
                  <wa-option value="manual">{locales.entries.Lcz_NoIWillDoItManually}</wa-option>
                </wa-select>
              </div>
            </div>
          </div>

          <div class="ops-tasks__header">
            <p class="ops-tasks__title">Recurring Tasks</p>
            <p class="ops-tasks__subtitle">Define your housekeeping tasks and frequency</p>
          </div>
          <div class="ops-tasks__list">
            {/* Cleaning — locked task, frequency is still configurable */}
            <div class="ops-task-row ops-task-row--locked">
              <wa-badge variant="danger" appearance="filled">
                CL
              </wa-badge>
              <span class="ops-task-locked-label">Cleaning</span>
              <wa-select
                class="ops-task-select"
                size="small"
                value={this.selectedCleaningFrequency}
                defaultValue={this.selectedCleaningFrequency}
                onchange={(e: Event) => {
                  e.stopImmediatePropagation();
                  e.stopPropagation();
                  this.selectedCleaningFrequency = (e.target as HTMLSelectElement).value;
                  this.dialog.openModal();
                }}
              >
                {housekeeping_store?.hk_criteria?.cleaning_frequencies.map(v => (
                  <wa-option key={v.code} value={v.code}>
                    {v.description}
                  </wa-option>
                ))}
              </wa-select>
              <span></span>
            </div>

            {/* T1 and T2 — configurable tasks */}
            {this.hkTasks.map((task, i) => (
              <div key={i} class="ops-task-row">
                <wa-badge variant={i === 0 ? 'success' : 'brand'} appearance="filled">
                  T{i + 1}
                </wa-badge>
                <ir-input
                  class="ops-task-input"
                  size="small"
                  placeholder={i === 0 ? 'Change sheets, ...' : 'Amenities refill, ...'}
                  maxlength={30}
                  value={task.name}
                  onChange={(e: InputEvent) => {
                    const updated = [...this.hkTasks];
                    updated[i] = { ...updated[i], name: (e.target as HTMLInputElement).value };
                    this.hkTasks = updated;
                    this.saveHkTasks();
                  }}
                ></ir-input>
                <wa-select
                  class="ops-task-select"
                  size="small"
                  value={task.frequency}
                  defaultValue={task.frequency}
                  placeholder="Frequency"
                  onchange={(e: Event) => {
                    const updated = [...this.hkTasks];
                    updated[i] = { ...updated[i], frequency: (e.target as HTMLSelectElement).value };
                    this.hkTasks = updated;
                    this.saveHkTasks();
                  }}
                >
                  {this.frequencies.map(f => (
                    <wa-option key={f.CODE_NAME} value={f.CODE_NAME}>
                      {f.CODE_VALUE_EN}
                    </wa-option>
                  ))}
                </wa-select>
                <wa-icon-button
                  class="ops-task-delete"
                  name="xmark"
                  label="Remove task"
                  onClick={() => {
                    const updated = [...this.hkTasks];
                    updated[i] = { name: '', frequency: '' };
                    this.hkTasks = updated;
                    this.saveHkTasks();
                  }}
                ></wa-icon-button>
              </div>
            ))}
          </div>
        </wa-card>

        <ir-dialog ref={el => (this.dialog = el)} label={locales.entries.Lcz_Confirmation} lightDismiss={false}>
          <span>This action will reschedule all cleaning tasks. Do you want to continue?</span>
          <div slot="footer" class="ir-dialog__footer">
            <ir-custom-button
              size="medium"
              appearance="filled"
              variant="neutral"
              onClickHandler={() => {
                this.selectedCleaningFrequency = (calendar_data.cleaning_frequency ?? housekeeping_store?.hk_criteria?.cleaning_frequencies?.[0])?.code ?? null;
                this.dialog.closeModal();
              }}
            >
              {locales.entries.Lcz_Cancel}
            </ir-custom-button>
            <ir-custom-button
              size="medium"
              appearance="filled"
              variant="brand"
              loading={isRequestPending('/Set_Exposed_Cleaning_Frequency')}
              onClickHandler={() => this.saveCleaningFrequency()}
            >
              {locales.entries.Lcz_Confirm}
            </ir-custom-button>
          </div>
        </ir-dialog>
      </Host>
    );
  }
}
