import { Component, h, Prop, State } from '@stencil/core';
import { _formatTime } from '../../functions';
import locales from '@/stores/locales.store';
import { IPmsLog } from '@/models/booking.dto';
import { isRequestPending } from '@/stores/ir-interceptor.store';
import { BookingService } from '@/services/booking-service/booking.service';

@Component({
  tag: 'ir-pms-logs',
  styleUrl: 'ir-pms-logs.css',
  scoped: true,
})
export class IrPmsLogs {
  @Prop() bookingNumber: string;

  @State() pmsLogs: IPmsLog;
  @State() error: string;

  private bookingService = new BookingService();
  private userTypeCode;

  componentWillLoad() {
    this.init();
    const UserInfo_b = JSON.parse(localStorage.getItem('UserInfo_b'));
    if (UserInfo_b) {
      this.userTypeCode = UserInfo_b.USER_TYPE_CODE;
    }
  }

  private async init() {
    try {
      this.pmsLogs = await this.bookingService.fetchPMSLogs(this.bookingNumber);
    } catch (error) {
      console.error(error);
    }
  }

  render() {
    return (
      <div class="">
        {isRequestPending('/Get_Exposed_PMS_Logs') ? (
          <div class={'d-flex align-items-center justify-content-center dialog-container-height'}>
            <ir-spinner></ir-spinner>
          </div>
        ) : (
          <div class={'dialog-container-height'}>
            <div class="d-flex align-items-center " style={{ paddingBottom: '0.5rem' }}>
              <p class="list-title p-0 m-0">{locales.entries.Lcz_SentAt}:</p>
              {this.pmsLogs?.sent_date ? (
                <p class="list-item">
                  {this.pmsLogs?.sent_date} {_formatTime(this.pmsLogs?.sent_hour.toString(), this.pmsLogs?.sent_minute.toString())}
                </p>
              ) : (
                <p class={`list-item ${this.pmsLogs?.sent_date ? 'green' : 'red'}`}>{this.pmsLogs?.is_acknowledged ? locales.entries.Lcz_YES : locales.entries.Lcz_NO}</p>
              )}
            </div>
            <div class="d-flex align-items-center p-0 m-0">
              <p class="list-title p-0 m-0">{locales.entries.Lcz_Acknowledged}</p>
              <div class="d-flex align-items-center" style={{ gap: '1rem' }}>
                <p class={`list-item  ${this.pmsLogs?.is_acknowledged ? 'green' : 'red'}`}>{this.pmsLogs?.is_acknowledged ? locales.entries.Lcz_YES : locales.entries.Lcz_NO}</p>
                {!this.pmsLogs?.is_acknowledged && this.userTypeCode === '1' && (
                  <ir-custom-button
                    variant="brand"
                    loading={isRequestPending('/Ack_Exposed_Revision')}
                    onClickHandler={async e => {
                      e.stopImmediatePropagation();
                      e.stopPropagation();
                      const data = await this.bookingService.ackExposedRevision({
                        revision_id: this.pmsLogs?.revision_id,
                      });
                      this.error = data.ExceptionMsg;
                    }}
                  >
                    Acknowledge
                  </ir-custom-button>
                )}
              </div>
            </div>
            {this.error && (
              <wa-callout size="small" appearance="filled-outlined" variant="danger">
                {this.error}
              </wa-callout>
            )}
          </div>
        )}
      </div>
    );
  }
}
