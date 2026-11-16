import { Component, Event, EventEmitter, Fragment, Host, Prop, State, Watch, h } from '@stencil/core';

import moment from 'moment';
import { User } from '@/models/Users';
import { UserService } from '@/services/user.service';
import { _formatTime } from '@/components/ir-booking-details/functions';
import { isRequestPending } from '@/stores/ir-interceptor.store';
import { AllowedUser } from '../types';
import { SystemService } from '@/services/system.service';
import { showToast } from '@/utils/utils';
import { formatDate } from '@/utils/date';

import { t } from '@/services/locale/t';
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
    showToast({
      position: 'top-right',
      title: t('Lcz_SavedSuccessfully', { fallback: 'Saved Successfully' }),
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
  //     showToast({
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
                <th class="ir-text-start">{t('Lcz_Username', { fallback: 'Username' })}</th>
                <th class="ir-text-start">{t('Lcz_Email', { fallback: 'Email' })}</th>
                <th class="ir-text-start">{t('Lcz_Mobile', { fallback: 'Mobile' })}</th>
                <th class="ir-text-start">{t('Lcz_Role', { fallback: 'Role' })}</th>
                <th class="ir-text-start small" style={{ fontWeight: 'bold' }}>
                  <p class="m-0 p-0 ">{t('Lcz_CreatedAt', { fallback: 'Created at' })}</p>
                  <p class="m-0 p-0">{t('Lcz_LastSignedIn', { fallback: 'Last signed in' })}</p>
                </th>
                {/* <th class="ir-text-start">Created at</th> */}
                {this.haveAdminPrivileges && <th>{t('Lcz_Active', { fallback: 'Active' })}</th>}
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
                      <wa-tooltip for="new-user-btn">{t('Lcz_CreateUser', { fallback: 'Create user' })}</wa-tooltip>
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
                        <span style={{ marginInlineStart: '0.5rem', color: `var(--wa-color-${user.is_email_verified ? 'success' : 'danger'}-fill-loud)` }} class={`small`}>
                          {user.is_email_verified ? t('Lcz_Verified', { fallback: 'Verified' }) : t('Lcz_NotVerified', { fallback: 'Not verified' })}
                        </span>
                      )}
                    </td>
                    <td>{user.mobile ?? t('Lcz_NotAvailable', { fallback: 'N/A' })}</td>
                    <td>{user.type.toString() === this.superAdminId ? t('Lcz_SuperAdmin', { fallback: 'Super admin' }) : this.userTypes.get(user.type.toString())}</td>
                    <td class="small">
                      <p class="m-0 p-0">
                        {new Date(user.created_on).getFullYear() === 1900 || !user.created_on
                          ? t('Lcz_NotAvailable', { fallback: 'N/A' })
                          : formatDate(user.created_on, 'DD-MMM-YYYY')}
                      </p>
                      <p class={`m-0 p-0`} style={{ color: isLastSignInOld ? 'var(--wa-color-danger-fill-loud)' : '' }}>
                        {latestSignIn && new Date(latestSignIn.date).getFullYear() > 1900
                          ? formatDate(latestSignIn.date, 'DD-MMM-YYYY') + ' ' + _formatTime(latestSignIn.hour.toString(), latestSignIn.minute.toString())
                          : t('Lcz_NotAvailable', { fallback: 'N/A' })}
                      </p>
                    </td>
                    {/* <td>{new Date(user.created_on).getFullYear() === 1900 || !user.created_on ? 'N/A' : formatDate(user.created_on, 'DD-MMM-YYYY')}</td> */}
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
                            btn_styles={'px-0 m-0 ir-text-start'}
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
                              <wa-tooltip for={`edit-user-${user.id}`}>{t('Lcz_EditUser', { fallback: 'Edit user' })}</wa-tooltip>
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
                              <wa-tooltip for={`delete-user-${user.id}`}>{t('Lcz_DeleteUser', { fallback: 'Delete user' })}</wa-tooltip>
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
          label={t('Lcz_Alert', { fallback: 'Alert' })}
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
              ? t('Lcz_AreYouSureDeleteUser', { params: [this.user?.username ?? ''], fallback: 'Are you sure you want to delete %1?' })
              : t('Lcz_AreYouSureUnverifyEmail', { params: [this.maskEmail(this.user?.email)], fallback: 'Are you sure you want to unverify %1?' })}
          </span>
          <div slot="footer" class="ir-dialog__footer">
            <ir-custom-button data-dialog="close" size="m" appearance="filled">
              {t('Lcz_Cancel', { fallback: 'Cancel' })}
            </ir-custom-button>
            <ir-custom-button
              size="m"
              loading={isRequestPending('/Handle_Exposed_User')}
              appearance="accent"
              variant={this.modalType === 'verify' ? 'brand' : 'danger'}
              onClickHandler={this.executeUserAction.bind(this)}
            >
              {this.modalType === 'verify' ? t('Lcz_Confirm', { fallback: 'Confirm' }) : t('Lcz_Delete', { fallback: 'Delete' })}
            </ir-custom-button>
          </div>
        </ir-dialog>
      </Host>
    );
  }
}
