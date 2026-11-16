import { Component, Host, h, Prop, State, Event, EventEmitter } from '@stencil/core';
import { SetupService, getSetupEntryLabel } from '@/services/setup';
import { SetupEntries } from '@/models/IBooking';
import { t } from '@/services/locale/t';
import { formatDate } from '@/utils/date';
@Component({
  tag: 'igl-block-dates-view',
  styleUrl: 'igl-block-dates-view.css',
  scoped: true,
})
export class IglBlockDatesView {
  @Prop() defaultData: { [key: string]: any };
  @Prop() fromDate: string;
  @Prop() toDate: string;
  @Prop({ mutable: true }) entryDate: string;
  @Prop() entryHour: number;
  @Prop() isEventHover: boolean = false;
  @Prop() entryMinute: number;
  @State() renderAgain: boolean = false;

  @Event() dataUpdateEvent: EventEmitter<{ [key: string]: any }>;

  private blockDatesData: { [key: string]: any } = {
    RELEASE_AFTER_HOURS: 0,
    OPTIONAL_REASON: '',
    OUT_OF_SERVICE: false,
  }; // Change of property name might require updates in booking-event-hover
  private releaseList: SetupEntries[] = [];
  private setupService: SetupService = new SetupService();

  async componentWillLoad() {
    try {
      this.releaseList = await this.setupService.getBlockedInfo();
      if (this.defaultData) {
        this.blockDatesData = { ...this.defaultData };
      } else {
        this.blockDatesData.RELEASE_AFTER_HOURS = parseInt(this.releaseList[0].CODE_NAME);
        this.emitData();
      }
    } catch (error) {
      // toastr.error(error);
    }
  }

  private handleOptionalReason(event: Event) {
    this.blockDatesData.OPTIONAL_REASON = (event.target as HTMLInputElement).value;
    this.emitData();
  }

  private handleReleaseAfterChange(evt: Event) {
    if (this.entryDate) this.entryDate = undefined;
    this.blockDatesData.RELEASE_AFTER_HOURS = parseInt((evt.target as HTMLInputElement).value);
    this.renderPage();
    this.emitData();
  }

  /**
   * Switches between the two ways a block resolves: auto-release after a period, or out-of-service (manual release).
   * The `wa-select` / `wa-input` for the auto-release branch live inside the radio group, so their bubbled `change`
   * events reach this handler too — ignore anything that isn't the radio group or a radio.
   */
  private handleModeChange(evt: Event) {
    const target = evt.target as HTMLElement;
    if (!target || (target.tagName !== 'WA-RADIO-GROUP' && target.tagName !== 'WA-RADIO')) {
      return;
    }
    const outOfService = (target as unknown as { value: string }).value === 'oos';
    this.blockDatesData.OUT_OF_SERVICE = outOfService;
    if (outOfService) {
      this.blockDatesData.OPTIONAL_REASON = '';
      this.blockDatesData.RELEASE_AFTER_HOURS = 0;
    }
    this.renderPage();
    this.emitData();
  }

  private emitData() {
    this.dataUpdateEvent.emit({
      key: 'blockDatesData',
      data: { ...this.blockDatesData },
    });
  }

  private getReleaseHoursString() {
    let dt = this.entryDate ? new Date(this.entryDate) : new Date();
    if (this.entryDate && this.entryHour && this.entryMinute) {
      dt.setHours(this.entryHour, this.entryMinute, 0, 0);
    } else {
      dt.setHours(dt.getHours() + this.blockDatesData.RELEASE_AFTER_HOURS, dt.getMinutes(), 0, 0);
    }

    return formatDate(dt, 'MMM D, HH:mm');
  }

  private renderPage() {
    this.renderAgain = !this.renderAgain;
  }

  render() {
    const { OUT_OF_SERVICE, OPTIONAL_REASON, RELEASE_AFTER_HOURS } = this.blockDatesData;
    const releaseValue = String(Number(RELEASE_AFTER_HOURS) || 0);
    const releaseHours = Number(RELEASE_AFTER_HOURS) || 0;

    return (
      <Host>
        <div class="block-dates">
          <ir-date-view format={'weekday-medium'} from_date={this.fromDate} to_date={this.toDate} showDateDifference={false}></ir-date-view>

          <wa-radio-group class="block-dates__mode" size="m" orientation="vertical" value={OUT_OF_SERVICE ? 'oos' : 'auto'} onchange={evt => this.handleModeChange(evt)}>
            <wa-radio value="auto">{t('Lcz_Reason', { fallback: 'Reason' })}</wa-radio>

            {!OUT_OF_SERVICE && (
              <div class="block-dates__fields">
                <wa-select class="block-dates__select" size="s" value={releaseValue} defaultValue={releaseValue} onchange={evt => this.handleReleaseAfterChange(evt)}>
                  <wa-icon slot="start" name="clock"></wa-icon>
                  {releaseHours > 0 && (
                    <span slot="end" class="block-dates__release-on">
                      {t('Lcz_On', { fallback: 'On' })} {this.getReleaseHoursString()}
                    </span>
                  )}
                  {this.releaseList.map(releaseItem => {
                    const value = Number(releaseItem.CODE_NAME) || 0;
                    return (
                      <wa-option value={String(value)}>
                        {value === 0
                          ? t('Lcz_NotAutomaticRelease', { fallback: 'Not automatic release' })
                          : t('Lcz_AutomaticReleaseIn', { fallback: 'Automatic release in %1', params: [getSetupEntryLabel(releaseItem)] })}
                      </wa-option>
                    );
                  })}
                </wa-select>

                <wa-input
                  class="block-dates__reason"
                  size="s"
                  placeholder={t('Lcz_OptionalReason', { fallback: 'Optional reason' })}
                  value={OPTIONAL_REASON}
                  oninput={event => this.handleOptionalReason(event)}
                >
                  <wa-icon slot="start" name="comment" label={t('Lcz_OptionalReason', { fallback: 'Optional reason' })}></wa-icon>
                </wa-input>
              </div>
            )}

            <wa-radio value="oos">{t('Lcz_OutOfservice', { fallback: 'Out of service' })}</wa-radio>
          </wa-radio-group>
        </div>
      </Host>
    );
  }
}
