import { THKUser } from '@/models/housekeeping';
import locales from '@/stores/locales.store';
import { Component, Event, EventEmitter, h, Prop, State } from '@stencil/core';

@Component({
  tag: 'ir-hk-user-drawer',
  styleUrl: 'ir-hk-user-drawer.css',
  scoped: true,
})
export class IrHkUserDrawer {
  @State() isLoading: boolean = false;
  @Prop() open: boolean = false;
  @Prop() isEdit: boolean = false;
  @Prop() user: THKUser | null = null;
  @Event() closeSideBar: EventEmitter<null>;

  private readonly formId = 'hk-user-drawer-form';

  render() {
    return (
      <ir-drawer
        open={this.open}
        onDrawerHide={() => {
          this.closeSideBar.emit(null);
        }}
        label={this.isEdit ? locales.entries.Lcz_EditHousekeeperProfile : locales.entries.Lcz_CreateHousekeeperProfile}
      >
        {this.open && (
          <ir-hk-user-drawer-form
            onLoadingChanged={e => {
              e.stopImmediatePropagation();
              e.stopPropagation();
              this.isLoading = e.detail;
            }}
            isEdit={this.isEdit}
            user={this.user}
            formId={this.formId}
          ></ir-hk-user-drawer-form>
        )}
        <div slot="footer" class="ir__drawer-footer">
          <ir-custom-button data-drawer="close" variant="neutral" size="medium" appearance="filled">
            Cancel
          </ir-custom-button>
          <ir-custom-button loading={this.isLoading} variant="brand" type="submit" form={this.formId} appearance="accent" size="medium">
            Save
          </ir-custom-button>
        </div>
      </ir-drawer>
    );
  }
}
