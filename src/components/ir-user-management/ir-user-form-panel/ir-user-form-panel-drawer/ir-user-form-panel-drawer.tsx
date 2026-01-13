import { User } from '@/models/Users';
import { Component, Event, EventEmitter, h, Prop } from '@stencil/core';
import { AllowedUser } from '../../types';
import locales from '@/stores/locales.store';
import { isRequestPending } from '@/stores/ir-interceptor.store';

@Component({
  tag: 'ir-user-form-panel-drawer',
  styleUrl: 'ir-user-form-panel-drawer.css',
  scoped: true,
})
export class IrUserFormPanelDrawer {
  @Prop({ reflect: true }) open: boolean;
  @Prop() user: User;
  @Prop() userTypes = Map<number | string, string>;
  @Prop() isEdit: boolean = false;
  @Prop() language: string = 'en';
  @Prop() property_id: number;
  @Prop() haveAdminPrivileges: boolean;
  @Prop() superAdminId: string = '5';
  @Prop() userTypeCode: string | number;
  @Prop() allowedUsersTypes: AllowedUser[] = [];
  @Prop() baseUserTypeCode: string | number;

  @Event() closeSideBar: EventEmitter<void>;

  render() {
    const formId = `user-form-${this.user?.id}`;
    return (
      <ir-drawer
        onDrawerHide={e => {
          e.stopImmediatePropagation();
          e.stopPropagation();
          if (!e.detail) {
            return;
          }
          this.closeSideBar.emit(null);
        }}
        label={this.isEdit ? this.user.username : 'Create New User'}
        open={this.open}
      >
        {this.open && (
          <ir-user-form-panel
            user={this.user}
            userTypes={this.userTypes}
            isEdit={this.isEdit}
            language={this.language}
            property_id={this.property_id}
            haveAdminPrivileges={this.haveAdminPrivileges}
            superAdminId={this.superAdminId}
            userTypeCode={this.userTypeCode}
            allowedUsersTypes={this.allowedUsersTypes}
            baseUserTypeCode={this.baseUserTypeCode}
            formId={formId}
          ></ir-user-form-panel>
        )}
        <div slot="footer" class={'ir__drawer-footer'}>
          <ir-custom-button data-testid="cancel" onClickHandler={() => this.closeSideBar.emit(null)} class="flex-fill" appearance="filled" variant="neutral" size="medium">
            {locales?.entries?.Lcz_Cancel}
          </ir-custom-button>
          <ir-custom-button form={formId} loading={isRequestPending('/Handle_Exposed_User')} data-testid="save" size="medium" class="flex-fill" type="submit" variant="brand">
            {locales?.entries?.Lcz_Save}
          </ir-custom-button>
        </div>
      </ir-drawer>
    );
  }
}
