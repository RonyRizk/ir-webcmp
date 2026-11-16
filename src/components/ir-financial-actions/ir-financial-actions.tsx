import ApiClient from '@/models/ApiClient';
import { Component, Host, Listen, Prop, State, Watch, h } from '@stencil/core';
import { SidebarOpenEvent } from './types';
import { RoomService } from '@/services/room.service';
import { PaymentEntries } from '../ir-booking-details/types';
import { SetupService } from '@/services/setup';
import { LocaleController } from '@/services/locale/locale.controller';
import { LanguageSync } from '@/services/locale/language-sync';
import { SCREEN_TABLES } from '@/services/locale/screen-tables';

import { t } from '@/services/locale/t';
@Component({
  tag: 'ir-financial-actions',
  styleUrl: 'ir-financial-actions.css',
  scoped: true,
})
export class IrFinancialActions {
  @Prop() language: string = '';
  @Prop() ticket: string = '';
  @Prop() propertyid: number;
  @Prop() p: string;

  @State() isLoading: string;
  @State() isPageLoading: boolean = true;
  @State() property_id: number;
  @State() sideBarEvent: SidebarOpenEvent | null;

  private apiClientService = new ApiClient();
  private roomService = new RoomService();
  private setupService = new SetupService();
  private paymentEntries: PaymentEntries;

  /** Re-runs init when the language changes so server-localized data follows. */
  private languageSync = new LanguageSync(SCREEN_TABLES.financialActions, () => this.initializeApp());

  componentWillLoad() {
    if (this.ticket) {
      this.apiClientService.setApiClient(this.ticket);
      this.initializeApp();
    }
  }

  componentDidLoad() {
    this.languageSync.connect();
  }

  disconnectedCallback() {
    this.languageSync.disconnect();
  }

  @Watch('language')
  languageChanged(next: string, previous: string) {
    this.languageSync.propChanged(next, previous);
  }

  @Watch('ticket')
  ticketChanged(newValue: string, oldValue: string) {
    if (newValue === oldValue) {
      return;
    }
    this.apiClientService.setApiClient(this.ticket);
    this.initializeApp();
  }

  private handleSidebarClose = (e: CustomEvent) => {
    e.stopImmediatePropagation();
    e.stopPropagation();
    this.sideBarEvent = null;
  };

  private renderSidebarBody() {
    if (!this.sideBarEvent) {
      return;
    }

    switch (this.sideBarEvent.type) {
      case 'booking':
        return (
          <ir-booking-details
            slot="sidebar-body"
            hasPrint
            hasReceipt
            hasCloseButton
            onCloseSidebar={this.handleSidebarClose}
            is_from_front_desk
            propertyid={this.property_id}
            hasRoomEdit
            hasRoomDelete
            bookingNumber={this.sideBarEvent.payload.bookingNumber.toString()}
            ticket={this.ticket}
            language={this.language}
            hasRoomAdd
          ></ir-booking-details>
        );
      case 'payment':
        return (
          <ir-payment-folio
            booking={this.sideBarEvent.payload?.booking}
            bookingNumber={this.sideBarEvent.payload?.bookingNumber?.toString()}
            paymentEntries={this.paymentEntries}
            slot="sidebar-body"
            payment={this.sideBarEvent.payload.payment}
            mode={'new'}
            onCloseModal={this.handleSidebarClose}
          ></ir-payment-folio>
        );
      default:
        return null;
    }
  }
  @Listen('financialActionsOpenSidebar')
  handleOpenSidebar(e: CustomEvent<SidebarOpenEvent>) {
    e.stopImmediatePropagation();
    e.stopPropagation();
    this.sideBarEvent = e.detail;
  }
  private async getFinancialAction(isExportToExcel: boolean = false) {
    console.log(isExportToExcel);
  }
  private async initializeApp() {
    this.isPageLoading = true;

    try {
      // Started first: it seeds `LocaleController.language` from the host prop synchronously,
      // so the requests below are built with the right language on first mount.
      const localeReady = LocaleController.load({ language: this.language, tables: SCREEN_TABLES.financialActions });
      let propertyId = this.propertyid;
      if (!propertyId && !this.p) {
        throw new Error('Property ID or username is required');
      }
      if (!propertyId) {
        const propertyData = await this.roomService.getExposedProperty({
          id: 0,
          aname: this.p,
          language: LocaleController.language,
          is_backend: true,
          include_units_hk_status: true,
        });
        propertyId = propertyData.My_Result.id;
      }

      this.property_id = propertyId;

      const requests: Promise<any>[] = [this.setupService.getPaymentEntries(), this.getFinancialAction(), localeReady];
      if (propertyId) {
        requests.push(
          this.roomService.getExposedProperty({
            id: propertyId,
            language: LocaleController.language,
            is_backend: true,
            include_units_hk_status: true,
          }),
        );
      }

      const [paymentEntries] = await Promise.all(requests);
      this.paymentEntries = paymentEntries;
    } catch (error) {
      console.log(error);
    } finally {
      this.isPageLoading = false;
    }
  }
  render() {
    if (this.isPageLoading) {
      return <ir-loading-screen></ir-loading-screen>;
    }
    return (
      <Host>
        <ir-toast></ir-toast>
        <ir-interceptor></ir-interceptor>
        <section class="p-2 d-flex flex-column" style={{ gap: '1rem' }}>
          <div class="d-flex align-items-center justify-content-between">
            <h3 class="mb-1 mb-md-0">{t('Lcz_PaymentActions', { fallback: 'Payment Actions' })}</h3>
            <ir-button
              size="sm"
              btn_color="outline"
              isLoading={this.isLoading === 'export'}
              text={t('Lcz_Export', { fallback: 'Export' })}
              onClickHandler={async e => {
                e.stopImmediatePropagation();
                e.stopPropagation();
                await this.getFinancialAction(true);
              }}
              btnStyle={{ height: '100%' }}
              iconPosition="right"
              icon_name="file"
              icon_style={{ '--icon-size': '14px' }}
            ></ir-button>
          </div>
          {/* <ir-financial-summary
          previousDateGroupedPayments={this.previousDateGroupedPayments}
          groupedPayments={this.groupedPayment}
          paymentEntries={this.paymentEntries}
        ></ir-financial-summary> */}
          <div class="financial-actions__meta">
            <ir-financial-filters isLoading={this.isLoading === 'filter'}></ir-financial-filters>
            <ir-financial-table class={'financial-actions__table card  w-100'}></ir-financial-table>
          </div>
        </section>
        <ir-sidebar
          sidebarStyles={{
            width: this.sideBarEvent?.type === 'booking' ? '80rem' : 'var(--sidebar-width,40rem)',
            background: this.sideBarEvent?.type === 'booking' ? 'var(--ir-color-muted-background,#f2f3f8)' : 'white',
          }}
          open={Boolean(this.sideBarEvent)}
          showCloseButton={false}
          onIrSidebarToggle={this.handleSidebarClose}
        >
          {this.renderSidebarBody()}
        </ir-sidebar>
      </Host>
    );
  }
}
