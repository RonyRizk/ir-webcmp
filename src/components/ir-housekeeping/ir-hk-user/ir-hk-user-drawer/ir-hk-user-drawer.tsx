import { THKUser } from '@/models/housekeeping';
import { Component, Event, EventEmitter, h, Prop, State } from '@stencil/core';

import { t } from '@/services/locale/t';
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
        label={
          this.isEdit ? t('Lcz_EditHousekeeperProfile', { fallback: 'Edit Housekeeper Profile' }) : t('Lcz_CreateHousekeeperProfile', { fallback: 'Create housekeeper profile' })
        }
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
          <ir-custom-button data-drawer="close" variant="neutral" size="m" appearance="filled">
            {t('Lcz_Cancel', { fallback: 'Cancel' })}
          </ir-custom-button>
          <ir-custom-button loading={this.isLoading} variant="brand" type="submit" form={this.formId} appearance="accent" size="m">
            {t('Lcz_Save', { fallback: 'Save' })}
          </ir-custom-button>
        </div>
      </ir-drawer>
    );
  }
}
