import { IHouseKeepers } from '@/models/housekeeping';
import { isRequestPending } from '@/stores/ir-interceptor.store';
import { Component, Event, EventEmitter, Prop, h } from '@stencil/core';

@Component({
  tag: 'ir-hk-unassigned-units-drawer',
  styleUrl: 'ir-hk-unassigned-units-drawer.css',
  scoped: true,
})
export class IrHkUnassignedUnitsDrawer {
  @Prop() open: boolean = false;
  @Prop() user: IHouseKeepers | null = null;

  @Event() closeSideBar: EventEmitter<null>;

  private readonly formId = 'hk-unassigned-units-drawer-form';
  render() {
    return (
      <ir-drawer
        label={!this.user ? 'Assingn Units' : `Assignment for ${this.user.name}`}
        onDrawerHide={e => {
          e.stopImmediatePropagation();
          e.stopPropagation();
          this.closeSideBar.emit(null);
        }}
        style={{ '--ir-drawer-width': 'max-content' }}
        open={this.open}
      >
        {this.open && <ir-hk-unassigned-units-drawer-form formId={this.formId} user={this.user}></ir-hk-unassigned-units-drawer-form>}
        <div slot="footer" class="ir__drawer-footer">
          <ir-custom-button data-drawer="close" variant="neutral" size="medium" appearance="filled">
            Cancel
          </ir-custom-button>
          <ir-custom-button loading={isRequestPending('/Manage_Exposed_Assigned_Unit_To_HKM')} variant="brand" type="submit" form={this.formId} appearance="accent" size="medium">
            Save
          </ir-custom-button>
        </div>
      </ir-drawer>
    );
  }
}
