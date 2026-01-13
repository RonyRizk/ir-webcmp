import locales from '@/stores/locales.store';
import { Component, Event, EventEmitter, Fragment, Host, Prop, State, Watch, h } from '@stencil/core';

import moment from 'moment';
import { IToast } from '@components/ui/ir-toast/toast';
import { User } from '@/models/Users';
import { UserService } from '@/services/user.service';
import { _formatTime } from '@/components/ir-booking-details/functions';
import { isRequestPending } from '@/stores/ir-interceptor.store';
import { AllowedUser } from '../types';
import { SystemService } from '@/services/system.service';

@Component({
  tag: 'ir-user-management-table',
  styleUrls: ['ir-user-management-table.css', '../../../common/table.css'],
  scoped: true,
})
export class IrUserManagementTable {
  @Prop() users: User[] = [];
  @Prop() isSuperAdmin: boolean;
  @Prop() userTypes: Map<string | number, string> = new Map();
  @Prop() userTypeCode: string | number;
  @Prop() haveAdminPrivileges: boolean;
  @Prop() superAdminId = '5';
  @Prop() allowedUsersTypes: AllowedUser[] = [];
  @Prop() baseUserTypeCode: string | number;
  @Prop() property_id: number;

  @State() currentTrigger: any = null;
  @State() user: User = null;
  @State() modalType: 'verify' | 'delete';

  //Permissions
  @State() canDelete: boolean;
  @State() canEdit: boolean;
  @State() canCreate: boolean;

  @Event() toast: EventEmitter<IToast>;
  @Event() resetData: EventEmitter<null>;

  private dialogRef: HTMLIrDialogElement;
  private userService = new UserService();
  private systemService = new SystemService();

  componentWillLoad() {
    this.assignPermissions();
  }

  @Watch('haveAdminPrivileges')
  handleChange(n: boolean, o: boolean) {
    if (n !== o) {
      this.assignPermissions();
    }
  }

  private assignPermissions() {
    this.canCreate = this.haveAdminPrivileges;
    this.canDelete = this.haveAdminPrivileges;
    this.canEdit = true;
  }

  private async handleUserActiveChange(e: CustomEvent, user: User) {
    e.stopImmediatePropagation();
    e.stopPropagation();
    const res = await this.verifyAdminAction({ type: 'user', mode: 'update', user });
    if (res === 'cancelled') {
      return;
    }
    await this.userService.handleExposedUser({
      email: user.email,
      id: user.id,
      is_active: (e.target as HTMLInputElement).checked,
      mobile: user.mobile,
      password: user.password,
      type: user.type,
      username: user.username,
      base_user_type_code: this.baseUserTypeCode,
      property_id: this.property_id,
    });
    this.toast.emit({
      position: 'top-right',
      title: 'Saved Successfully',
      description: '',
      type: 'success',
    });
  }
  private async executeUserAction(e: CustomEvent) {
    try {
      e.stopImmediatePropagation();
      e.stopPropagation();
      await this.userService.handleExposedUser({
        email: this.user.email,
        id: this.user.id,
        is_active: this.user.is_active,
        is_email_verified: this.modalType === 'verify' ? false : this.user.is_email_verified,
        mobile: this.user.mobile,
        password: this.user.password,
        type: this.user.type,
        username: this.user.username,
        is_to_remove: this.modalType === 'delete',
      });
      this.resetData.emit(null);
    } finally {
      this.dialogRef.closeModal();
    }
  }
  // private async sendVerificationEmail(user: User) {
  //   try {
  //     console.log(user);
  //     await this.userService.sendVerificationEmail();
  //     this.toast.emit({
  //       position: 'top-right',
  //       title: `We've sent a verification email to ${this.maskEmail(user.email)}.`,
  //       description: '',
  //       type: 'success',
  //     });
  //   } catch (error) {
  //     console.log(error);
  //   }
  // }

  private openModal(user: User, type: 'verify' | 'delete') {
    if (!this.dialogRef || !user) {
      return;
    }
    this.user = user;
    this.modalType = type;
    this.dialogRef.openModal();
  }

  private maskEmail(email: string): string {
    if (!email || !email.includes('@')) return '';

    const [localPart, domain] = email.split('@');
    const visible = localPart.slice(0, 1); // show only the first letter
    const masked = '*'.repeat(Math.max(localPart.length - 1, 1)); // mask rest

    return `${visible}${masked}@${domain}`;
  }

  private async verifyAdminAction(params: { type: 'user'; mode: 'edit' | 'delete' | 'update' | 'create'; user: User | null }) {
    const res = await this.systemService.checkOTPNecessity({
      METHOD_NAME: 'Handle_Exposed_User',
    });
    if (res?.cancelled) {
      return 'cancelled';
    }
    const { mode, ...rest } = params;
    if (mode === 'edit' || mode === 'create') {
      this.currentTrigger = {
        ...rest,
        isEdit: mode === 'edit',
      };
    }
    return 'ok';
  }
  render() {
    return (
      <Host>
        <section class="table-container h-100  w-100 m-0 table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th class="text-left">{locales.entries.Lcz_Username ?? 'Username'}</th>
                <th class="text-left">{locales.entries.Lcz_Email}</th>
                <th class="text-left">{locales.entries.Lcz_Mobile ?? 'Mobile'}</th>
                <th class="text-left">{locales.entries.Lcz_Role}</th>
                <th class="text-left small" style={{ fontWeight: 'bold' }}>
                  <p class="m-0 p-0 ">{locales.entries.Lcz_CreatedAt}</p>
                  <p class="m-0 p-0">{locales.entries.Lcz_LastSignedIn}</p>
                </th>
                {/* <th class="text-left">Created at</th> */}
                {this.haveAdminPrivileges && <th>{locales.entries.Lcz_Active}</th>}
                {/* {this.haveAdminPrivileges && <th>Email verified</th>} */}

                <th class={'action-row'}>
                  {this.canCreate && (
                    <Fragment>
                      <ir-custom-button
                        appearance="plain"
                        variant="neutral"
                        id="new-user-btn"
                        onClickHandler={() => {
                          this.verifyAdminAction({
                            type: 'user',
                            mode: 'create',
                            user: null,
                          });
                        }}
                      >
                        <wa-icon name="plus" style={{ fontSize: '1.2rem' }}></wa-icon>
                      </ir-custom-button>
                      <wa-tooltip for="new-user-btn">{locales.entries.Lcz_CreateUser}</wa-tooltip>
                    </Fragment>
                  )}
                </th>
              </tr>
            </thead>
            <tbody>
              {this.users.map(user => {
                const isUserSuperAdmin = user.type.toString() === this.superAdminId;
                const latestSignIn = user.sign_ins ? user.sign_ins[0] : null;
                const latestSignInDate = latestSignIn ? moment(latestSignIn.date, 'YYYY-MM-DD') : null;
                const isLastSignInOld = latestSignInDate ? moment().diff(latestSignInDate, 'days') > 30 : false;
                return (
                  <tr key={user.id} class="ir-table-row">
                    <td>{user.username}</td>
                    <td>
                      {user.email}

                      {this.haveAdminPrivileges && (
                        <span style={{ marginLeft: '0.5rem', color: `var(--wa-color-${user.is_email_verified ? 'success' : 'danger'}-fill-loud)` }} class={`small`}>
                          {user.is_email_verified ? locales.entries.Lcz_Verified : locales.entries.Lcz_NotVerified}
                        </span>
                      )}
                    </td>
                    <td>{user.mobile ?? 'N/A'}</td>
                    <td>{user.type.toString() === this.superAdminId ? locales.entries.Lcz_SuperAdmin : this.userTypes.get(user.type.toString())}</td>
                    <td class="small">
                      <p class="m-0 p-0">
                        {new Date(user.created_on).getFullYear() === 1900 || !user.created_on ? 'N/A' : moment(user.created_on, 'YYYY-MM-DD').format('DD-MMM-YYYY')}
                      </p>
                      <p class={`m-0 p-0`} style={{ color: isLastSignInOld ? 'var(--wa-color-danger-fill-loud)' : '' }}>
                        {latestSignIn && new Date(latestSignIn.date).getFullYear() > 1900
                          ? moment(latestSignIn.date, 'YYYY-MM-DD').format('DD-MMM-YYYY') + ' ' + _formatTime(latestSignIn.hour.toString(), latestSignIn.minute.toString())
                          : 'N/A'}
                      </p>
                    </td>
                    {/* <td>{new Date(user.created_on).getFullYear() === 1900 || !user.created_on ? 'N/A' : moment(user.created_on, 'YYYY-MM-DD').format('DD-MMM-YYYY')}</td> */}
                    {this.haveAdminPrivileges && (
                      <td>
                        {this.haveAdminPrivileges && !this.isSuperAdmin && user.type.toString() === '17'
                          ? null
                          : !isUserSuperAdmin && (
                              <wa-switch onchange={e => this.handleUserActiveChange(e, user)} defaultChecked={user.is_active} checked={user.is_active}></wa-switch>
                            )}
                      </td>
                    )}
                    {/* {this.haveAdminPrivileges && (
                      <td>
                        {user.is_email_verified ? (
                          <p
                            // data-toggle="tooltip"
                            // data-placement="bottom"
                            data-testid="user-verification"
                            // title={user.is_email_verified ? '' : 'Click to resend verification email.'}
                            class={`m-0 p-0`}
                            //TODO add isRequestPending for when the request is sent the buttons should be disabled
                            // onClick={() => {
                            //   this.openModal(user, 'verify');
                            // }}
                          >
                            {user.is_email_verified ? 'Verified' : 'Not verified'}
                          </p>
                        ) : (
                          <ir-button
                            class="m-0 p-0"
                            onClickHandler={() => this.sendVerificationEmail(user)}
                            btn_styles={'px-0 m-0 text-left'}
                            labelStyle={{ padding: '0' }}
                            btnStyle={{ paddingHorizontal: '0', width: 'fit-content' }}
                            data-toggle="tooltip"
                            data-placement="bottom"
                            data-testid="user-verification"
                            title={user.is_email_verified ? '' : 'Click to resend verification email.'}
                            btn_color="link"
                            size="sm"
                            text="Not verified"
                          ></ir-button>
                        )}
                      </td>
                    )} */}
                    <td class={'action-row'}>
                      {(this.canEdit || this.canDelete) && ((!this.isSuperAdmin && !isUserSuperAdmin) || this.isSuperAdmin) && (
                        <div class="icons-container  d-flex align-items-center">
                          {this.canEdit && (
                            <Fragment>
                              <ir-custom-button
                                data-testid="edit"
                                onClickHandler={() => {
                                  this.verifyAdminAction({
                                    type: 'user',
                                    mode: 'edit',
                                    user,
                                  });
                                }}
                                appearance="plain"
                                variant="neutral"
                                id={`edit-user-${user.id}`}
                              >
                                <wa-icon name="edit" style={{ fontSize: '1.2rem' }}></wa-icon>
                              </ir-custom-button>
                              <wa-tooltip for={`edit-user-${user.id}`}>{locales.entries.Lcz_EditUser}</wa-tooltip>
                            </Fragment>
                          )}
                          {this.canDelete && !isUserSuperAdmin && (this.isSuperAdmin || user.type.toString() !== '17') && (
                            <Fragment>
                              <ir-custom-button
                                onClickHandler={async () => {
                                  const res = await this.verifyAdminAction({
                                    type: 'user',
                                    mode: 'delete',
                                    user,
                                  });
                                  if (res === 'cancelled') {
                                    return;
                                  }
                                  this.openModal(user, 'delete');
                                }}
                                data-testid="delete"
                                variant="danger"
                                appearance="plain"
                                id={`delete-user-${user.id}`}
                              >
                                <wa-icon name="trash-can" style={{ fontSize: '1.2rem' }}></wa-icon>
                              </ir-custom-button>
                              <wa-tooltip for={`delete-user-${user.id}`}>{locales.entries.Lcz_DeleteUser}</wa-tooltip>
                            </Fragment>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
        <ir-user-form-panel-drawer
          open={this.currentTrigger !== null && this.currentTrigger?.type !== 'delete'}
          property_id={this.property_id}
          baseUserTypeCode={this.baseUserTypeCode}
          superAdminId={this.superAdminId}
          allowedUsersTypes={this.allowedUsersTypes}
          userTypeCode={this.userTypeCode}
          haveAdminPrivileges={this.haveAdminPrivileges}
          onCloseSideBar={() => (this.currentTrigger = null)}
          slot="sidebar-body"
          user={this.currentTrigger?.user}
          isEdit={this.currentTrigger?.isEdit}
        ></ir-user-form-panel-drawer>
        <ir-dialog
          label={'Alert'}
          onIrDialogAfterHide={e => {
            e.stopImmediatePropagation();
            e.stopPropagation();
            this.user = null;
            this.modalType = null;
          }}
          ref={el => (this.dialogRef = el)}
        >
          <span>
            {this.modalType === 'delete'
              ? `${locales.entries.Lcz_AreYouSureToDelete} ${this.user?.username}?`
              : `${locales.entries.Lcz_AreYouSureToUnverify} ${this.maskEmail(this.user?.email)}`}
          </span>
          <div slot="footer" class="ir-dialog__footer">
            <ir-custom-button data-dialog="close" size="medium" appearance="filled">
              Cancel
            </ir-custom-button>
            <ir-custom-button
              size="medium"
              loading={isRequestPending('/Handle_Exposed_User')}
              appearance="accent"
              variant={this.modalType === 'verify' ? 'brand' : 'danger'}
              onClickHandler={this.executeUserAction.bind(this)}
            >
              {this.modalType === 'verify' ? locales.entries.Lcz_Confirm : locales.entries.Lcz_Delete}
            </ir-custom-button>
          </div>
        </ir-dialog>
      </Host>
    );
  }
}
