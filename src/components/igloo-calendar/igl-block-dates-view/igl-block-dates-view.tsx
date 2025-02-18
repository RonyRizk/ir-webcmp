import { Component, Host, h, Prop, State, Event, EventEmitter } from '@stencil/core';
import { BookingService } from '@/services/booking.service';
import { IEntries } from '@/models/IBooking';
import locales from '@/stores/locales.store';

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
  private releaseList: IEntries[] = [];
  private bookingService: BookingService = new BookingService();

  async componentWillLoad() {
    try {
      this.releaseList = await this.bookingService.getBlockedInfo();
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

  handleOptionalReason(event) {
    this.blockDatesData.OPTIONAL_REASON = event.target.value;
    this.emitData();
  }

  handleReleaseAfterChange(evt) {
    if (this.entryDate) this.entryDate = undefined;
    this.blockDatesData.RELEASE_AFTER_HOURS = parseInt(evt.target.value);
    this.renderPage();
    this.emitData();
  }

  emitData() {
    this.dataUpdateEvent.emit({
      key: 'blockDatesData',
      data: { ...this.blockDatesData },
    });
  }

  getReleaseHoursString() {
    // console.log("entry date", this.entryDate);
    // console.log("blocked date data", this.blockDatesData);
    let dt = this.entryDate ? new Date(this.entryDate) : new Date();
    if (this.entryDate && this.entryHour && this.entryMinute) {
      dt.setHours(this.entryHour, this.entryMinute, 0, 0);
    } else {
      dt.setHours(dt.getHours() + this.blockDatesData.RELEASE_AFTER_HOURS, dt.getMinutes(), 0, 0);
    }

    return dt.toLocaleString('default', { month: 'short' }) + ' ' + dt.getDate() + ', ' + this.formatNumber(dt.getHours()) + ':' + this.formatNumber(dt.getMinutes());
  }
  formatNumber(value: number) {
    return value < 10 ? `0${value}` : value;
  }
  handleOutOfService(evt) {
    this.blockDatesData.OUT_OF_SERVICE = evt.target.checked;
    if (this.blockDatesData.OUT_OF_SERVICE) {
      this.blockDatesData.OPTIONAL_REASON = '';
      this.blockDatesData.RELEASE_AFTER_HOURS = 0;
    }
    this.renderPage();
    this.emitData();
  }

  renderPage() {
    this.renderAgain = !this.renderAgain;
  }

  render() {
    console.log({ fromDate: this.fromDate, toDate: this.toDate });
    return (
      <Host>
        <div class={`m-0 p-0 mb-1`}>
          <div class="text-left p-0">
            <ir-date-view from_date={this.fromDate} dateOption="YYYY-MM-DD" showDateDifference={false} to_date={this.toDate}></ir-date-view>
          </div>
        </div>
        <div class={` mb-1 text-left ${this.isEventHover && 'p-0'}`}>
          <div class="mb-1 ">
            <label class="p-0 text-bold-700 font-medium-1 m-0 align-middle">{locales.entries.Lcz_Reason}:</label>
            <div class="p-0 m-0 pr-1  controlContainer checkBoxContainer d-inline-block align-middle">
              <input class="form-control" type="checkbox" checked={this.blockDatesData.OUT_OF_SERVICE} id="userinput6" onChange={event => this.handleOutOfService(event)} />
            </div>
            <span class="align-middle out-of-service-label">{locales.entries.Lcz_OutOfservice}</span>
          </div>
          {!this.blockDatesData.OUT_OF_SERVICE ? (
            <div>
              <div class="mb-1 d-flex  align-items-center">
                <span class="align-middle">{locales.entries.Lcz_Or} </span>
                <div class="d-inline-flex col pr-0 align-middle">
                  <input
                    class="form-control"
                    type="text"
                    placeholder={locales.entries.Lcz_OptionalReason}
                    id="optReason"
                    value={this.blockDatesData.OPTIONAL_REASON}
                    onInput={event => this.handleOptionalReason(event)}
                  />
                </div>
              </div>
              <div class="mb-1 w-100 pr-0 ">
                <span class="text-bold-700 font-medium-1">{locales.entries.Lcz_AutomaticReleaseIn}: </span>
                <div class="d-inline-block">
                  <select class="form-control input-sm" id="zSmallSelect" onChange={evt => this.handleReleaseAfterChange(evt)}>
                    {this.releaseList.map(releaseItem => (
                      <option value={+releaseItem.CODE_NAME} selected={Number(this.blockDatesData.RELEASE_AFTER_HOURS) == Number(releaseItem.CODE_NAME)}>
                        {releaseItem.CODE_VALUE_EN}
                      </option>
                    ))}
                  </select>
                </div>
                {this.blockDatesData.RELEASE_AFTER_HOURS ? (
                  <div class="d-inline-block releaseTime">
                    <em>
                      {locales.entries.Lcz_On} {this.getReleaseHoursString()}
                    </em>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </Host>
    );
  }
}
