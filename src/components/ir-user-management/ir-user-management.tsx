import ApiClient from '@/models/ApiClient';
import { User } from '@/models/Users';
import { BookingService } from '@/services/booking-service/booking.service';
import { SetupService, getEntryValue } from '@/services/setup';
import { RoomService } from '@/services/room.service';
import { UserService } from '@/services/user.service';
import { Component, Host, Listen, Prop, State, Watch, h } from '@stencil/core';
import { AllowedUser } from './types';
import { realtimeService, type RealtimeReason } from '@/services/realtime/realtime.service';
import { LocaleController } from '@/services/locale/locale.controller';
import { LanguageSync } from '@/services/locale/language-sync';
import { SCREEN_TABLES } from '@/services/locale/screen-tables';

import { t } from '@/services/locale/t';
@Component({
  tag: 'ir-user-management',
  styleUrl: 'ir-user-management.css',
  scoped: true,
})
export class IrUserManagement {
  @Prop() language: string = '';
  @Prop() baseUrl: string;
  @Prop() ticket: string;
  @Prop() propertyid: number;
  @Prop() p: string;
  @Prop() isSuperAdmin: boolean = true;
  @Prop() userTypeCode: string | number;
  @Prop() baseUserTypeCode: string | number;
  @Prop() userId: string | number;

  @State() currentTrigger: any = null;
  @State() user: User = null;

  @State() isLoading = true;
  @State() users: User[] = [];
  @State() property_id: number;
  @State() allowedUsersTypes: AllowedUser[] = [];

  private ApiClient = new ApiClient();
  private roomService = new RoomService();
  private userService = new UserService();
  private bookingService = new BookingService();
  private setupService = new SetupService();

  private userTypes: Map<number | string, string> = new Map();
  private unsubscribeRealtime: (() => void) | null = null;

  private superAdminId = '5';

  /** Re-runs init when the language changes so server-localized data follows. */
  private languageSync = new LanguageSync(SCREEN_TABLES.userManagement, () => this.initializeApp());

  componentWillLoad() {
    if (this.baseUrl) {
      this.ApiClient.setBaseUrl(this.baseUrl);
    }
    if (this.ticket) {
      this.ApiClient.setApiClient(this.ticket);
      this.initializeApp();
    }
  }

  componentDidLoad() {
    this.languageSync.connect();
  }

  @Watch('ticket')
  ticketChanged(newValue: string, oldValue: string) {
    if (newValue === oldValue) {
      return;
    }
    this.ApiClient.setApiClient(this.ticket);
    this.initializeApp();
  }

  @Listen('resetData')
  async handleResetData(e: CustomEvent) {
    e.stopImmediatePropagation();
    e.stopPropagation();
    await this.fetchUsers();
  }

  private async initializeApp() {
    try {
      if (this.baseUrl) {
        this.ApiClient.setBaseUrl(this.baseUrl);
      }
      this.isLoading = true;
      // Started first: it seeds `LocaleController.language` from the host prop synchronously,
      // so the requests below are built with the right language on first mount.
      const localeReady = LocaleController.load({ language: this.language, tables: SCREEN_TABLES.userManagement });
      let propertyId = this.propertyid;
      if (!this.propertyid && !this.p) {
        throw new Error('Property ID or username is required');
      }
      // let roomResp = null;
      if (!propertyId) {
        console.log(propertyId);
        const propertyData = await this.roomService.getExposedProperty({
          id: 0,
          aname: this.p,
          language: LocaleController.language,
          is_backend: true,
          include_units_hk_status: true,
        });
        // roomResp = propertyData;
        propertyId = propertyData.My_Result.id;
      }
      this.property_id = propertyId;
      const requests = [this.fetchUserTypes(), this.fetchUsers(), localeReady];
      if (this.propertyid) {
        requests.push(
          this.roomService.getExposedProperty({
            id: this.propertyid,
            language: LocaleController.language,
            is_backend: true,
            include_units_hk_status: true,
          }),
        );
      }

      await Promise.all(requests);
      // initializeApp re-runs on a language switch — don't stack subscriptions.
      this.unsubscribeRealtime?.();
      this.unsubscribeRealtime = realtimeService.subscribe(this.property_id, async msg => {
        await this.handleSocketMessage(msg.reason, msg.payload);
      });
    } catch (error) {
      console.log(error);
    } finally {
      this.isLoading = false;
    }
  }

  private async handleSocketMessage(reason: RealtimeReason, result: unknown) {
    const reasonHandlers: Partial<Record<RealtimeReason, (payload: unknown) => any>> = {
      EMAIL_VERIFIED: this.updateUserVerificationStatus,
    };
    const handler = reasonHandlers[reason];
    if (handler) {
      await handler.call(this, result);
    }
  }

  public updateUserVerificationStatus(result: { id: string | number }) {
    const users = [...this.users];
    const idx = users.findIndex(u => u.id === result.id);
    if (idx === -1) {
      console.warn(`User ${result.id} not found`);
      return;
    }
    users[idx] = {
      ...users[idx],
      is_email_verified: true,
    };
    this.users = users;
  }

  private async fetchUsers() {
    const users = await this.userService.getExposedPropertyUsers({ property_id: this.propertyid });
    this.users = [...users].sort((u1: User, u2: User) => {
      const priority = (u: User) => {
        const t = u.type.toString();
        if (t === this.superAdminId) return 0;
        if (t === '17') return 1;
        return 2;
      };
      //sort by priority
      const p1 = priority(u1),
        p2 = priority(u2);
      if (p1 !== p2) {
        return p1 - p2;
      }
      // //sort by user id
      // if (p1 === 1) {
      //   const id1 = u1.id.toString(),
      //     id2 = u2.id.toString(),
      //     me = this.userId.toString();
      //   if (id1 === me) return -1; // u1 is me → goes before u2
      //   if (id2 === me) return 1; // u2 is me → u1 goes after
      // }

      // 3) sort by username
      return u1.username.localeCompare(u2.username);
    });
  }
  private async fetchUserTypes() {
    const res = await Promise.all([this.setupService.getSetupEntriesByTableName('_USER_TYPE'), this.bookingService.getLov()]);
    const allowedUsers = res[1]?.My_Result?.allowed_user_types;
    // Fresh collections on every run: this re-runs on a language switch, and the children only re-render on a new reference.
    const allowedUsersTypes: AllowedUser[] = [];
    const userTypes = new Map<number | string, string>();
    for (const e of res[0]) {
      const value = getEntryValue({ entry: e, language: LocaleController.language });
      if (allowedUsers.find(f => f.code === e.CODE_NAME)) {
        allowedUsersTypes.push({ code: e.CODE_NAME, value });
      }
      userTypes.set(e.CODE_NAME.toString(), value);
    }
    this.allowedUsersTypes = allowedUsersTypes;
    this.userTypes = userTypes;
  }
  disconnectedCallback() {
    this.unsubscribeRealtime?.();
    this.unsubscribeRealtime = null;
    this.languageSync.disconnect();
  }

  @Watch('language')
  languageChanged(next: string, previous: string) {
    this.languageSync.propChanged(next, previous);
  }
  render() {
    if (this.isLoading) {
      return (
        <Host>
          <ir-toast></ir-toast>
          <ir-interceptor></ir-interceptor>
          <ir-loading-screen></ir-loading-screen>
        </Host>
      );
    }
    return (
      <Host>
        <ir-toast></ir-toast>
        <ir-interceptor suppressToastEndpoints={['/Change_User_Pwd', '/Handle_Exposed_User']}></ir-interceptor>
        <section class="p-2 d-flex flex-column" style={{ gap: '1rem' }}>
          {/* <div class="d-flex  pb-2 align-items-center justify-content-between">
            <h3 class="mb-1 mb-md-0">{t('Lcz_ExtranetUsers', { fallback: 'Extranet Users' })}</h3>
          </div> */}
          <h3 class="page-title">{t('Lcz_ExtranetUsers', { fallback: 'Extranet Users' })}</h3>
          <div class="" style={{ gap: '1rem' }}>
            <ir-user-management-table
              property_id={this.property_id}
              baseUserTypeCode={this.baseUserTypeCode}
              allowedUsersTypes={this.allowedUsersTypes}
              userTypeCode={this.userTypeCode}
              haveAdminPrivileges={[this.superAdminId, '17'].includes(this.userTypeCode?.toString())}
              userTypes={this.userTypes}
              isSuperAdmin={this.userTypeCode?.toString() === this.superAdminId}
              users={this.users}
            ></ir-user-management-table>
          </div>
        </section>
      </Host>
    );
  }
}
