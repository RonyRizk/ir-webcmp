import { Component, Event, EventEmitter, Method, Prop, State, h } from '@stencil/core';
import { IHouseKeepers } from '@/models/housekeeping';
import { HouseKeepingService } from '@/services/housekeeping.service';
import housekeeping_store from '@/stores/housekeeping.store';
import locales from '@/stores/locales.store';

@Component({
  tag: 'ir-hk-delete-dialog',
  styleUrl: 'ir-hk-delete-dialog.css',
  shadow: false,
})
export class IrHkDeleteDialog {
  @Prop() user: IHouseKeepers;

  @State() isOpen: boolean = false;
  @State() selectedId: string = '';
  @State() isConfirming: boolean = false;

  @Event() modalClosed: EventEmitter<null>;
  @Event() resetData: EventEmitter<string>;

  private housekeepingService = new HouseKeepingService();

  @Method()
  async openModal() {
    this.isOpen = true;
  }

  @Method()
  async closeModal() {
    this.isOpen = false;
    this.modalClosed.emit(null);
  }

  private async handleConfirm() {
    try {
      this.isConfirming = true;
      if (this.selectedId === '') {
        await this.housekeepingService.editExposedHKM(this.user, true);
      } else {
        const newAssignedUnits = this.user.assigned_units.map(u => ({ hkm_id: +this.selectedId, is_to_assign: true, unit_id: u.id }));
        await this.housekeepingService.manageExposedAssignedUnitToHKM(housekeeping_store.default_properties.property_id, newAssignedUnits);
        const { assigned_units, is_soft_deleted, is_active, ...user } = this.user;
        await this.housekeepingService.editExposedHKM(user, true);
      }
      this.resetData.emit(null);
    } catch (error) {
      console.error(error);
    } finally {
      this.isConfirming = false;
      this.closeModal();
    }
  }

  render() {
    if (!this.user) return;
    const hasAssignedUnits = this.user.assigned_units.length > 0;
    const label = hasAssignedUnits ? locales.entries.Lcz_AssignUnitsTo : locales.entries.Lcz_ConfirmDeletion;
    return (
      <ir-dialog lightDismiss={false} label={label} open={this.isOpen} onIrDialogHide={() => this.closeModal()}>
        {!hasAssignedUnits && (
          <p class="delete-modal__description">
            Are you sure you want to permanently delete <strong>{this.user.name}</strong>? This action cannot be undone.
          </p>
        )}
        {hasAssignedUnits && (
          <wa-select size="small" defaultValue={this.selectedId} value={this.selectedId} onchange={e => (this.selectedId = (e.target as HTMLSelectElement).value)}>
            <wa-option value="">{locales.entries.Lcz_nobody}</wa-option>
            {housekeeping_store.hk_criteria.housekeepers
              .filter(hk => hk.id !== this.user.id)
              .map(m => ({ value: m.id.toString(), text: m.name }))
              .sort((a, b) => a.text.toLowerCase().localeCompare(b.text.toLowerCase()))
              .map(m => (
                <wa-option key={m.value} value={m.value}>
                  {m.text}
                </wa-option>
              ))}
          </wa-select>
        )}

        <div slot="footer" class="delete-modal__footer">
          <ir-custom-button variant="neutral" appearance="filled" size="medium" onClickHandler={() => this.closeModal()}>
            {locales.entries.Lcz_Cancel}
          </ir-custom-button>
          <ir-custom-button variant="danger" appearance="accent" size="medium" loading={this.isConfirming} onClickHandler={() => this.handleConfirm()}>
            {locales.entries.Lcz_Confirm}
          </ir-custom-button>
        </div>
      </ir-dialog>
    );
  }
}
