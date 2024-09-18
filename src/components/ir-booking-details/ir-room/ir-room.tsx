import { Component, h, Prop, EventEmitter, Event, Listen, State, Element, Watch, Host, Fragment } from '@stencil/core';
import { _formatAmount, _formatDate, _getDay } from '../functions';
import { Booking, IUnit, Room } from '../../../models/booking.dto';
import { TIglBookPropertyPayload } from '../../../models/igl-book-property';
import { formatName } from '../../../utils/booking';
import { IrModal } from '@/components/ir-modal/ir-modal';
import axios from 'axios';
import { ILocale } from '@/stores/locales.store';
import calendar_data from '@/stores/calendar-data';
import { colorVariants } from '@/components/ui/ir-icons/icons';

@Component({
  tag: 'ir-room',
  styleUrl: 'ir-room.css',
  scoped: true,
})
export class IrRoom {
  // Room Data
  @Prop() bookingEvent: Booking;
  @Prop() bookingIndex: number;
  @Prop() isEditable: boolean;
  // Meal Code names
  @Prop() mealCodeName: string;
  @Prop() myRoomTypeFoodCat: string;
  // Currency
  @Prop() currency: string = 'USD';
  @Prop() legendData;
  @Prop() roomsInfo;
  @State() collapsed: boolean = false;
  @Prop() defaultTexts: ILocale;
  @Prop() ticket;

  // Booleans Conditions
  @Prop() hasRoomEdit: boolean = false;
  @Prop() hasRoomDelete: boolean = false;
  @Prop() hasRoomAdd: boolean = false;
  @Prop() hasCheckIn: boolean = false;
  @Prop() hasCheckOut: boolean = false;
  @Element() element: any;
  // Event Emitters
  @Event({ bubbles: true, composed: true }) deleteFinished: EventEmitter<string>;
  @Event({ bubbles: true, composed: true }) pressCheckIn: EventEmitter;
  @Event({ bubbles: true, composed: true }) pressCheckOut: EventEmitter;
  @Event({ bubbles: true, composed: true }) editInitiated: EventEmitter<TIglBookPropertyPayload>;
  @State() item: Room;
  @State() isLoading: boolean = false;
  @State() isModelOpen: boolean = false;
  private modal: IrModal;
  irModalRef: HTMLIrModalElement;
  componentWillLoad() {
    if (this.bookingEvent) {
      this.item = this.bookingEvent.rooms[this.bookingIndex];
    }
  }
  @Watch('bookingEvent')
  handleBookingEventChange() {
    this.item = this.bookingEvent.rooms[this.bookingIndex];
  }
  componentDidLoad() {
    this.modal = this.element.querySelector('ir-modal');
  }
  @Listen('clickHanlder')
  handleClick(e) {
    let target = e.target;
    if (target.id == 'checkin') {
      this.pressCheckIn.emit(this.item);
    } else if (target.id == 'checkout') {
      this.pressCheckOut.emit(this.item);
    }
  }

  getDateStr(date, locale = 'default') {
    return date.getDate() + ' ' + date.toLocaleString(locale, { month: 'short' }) + ' ' + date.getFullYear();
  }
  handleEditClick() {
    this.editInitiated.emit({
      event_type: 'EDIT_BOOKING',
      ID: this.item['assigned_units_pool'],
      NAME: formatName(this.item.guest.first_name, this.item.guest.last_name),
      EMAIL: this.bookingEvent.guest.email,
      PHONE: this.bookingEvent.guest.mobile,
      REFERENCE_TYPE: '',
      FROM_DATE: this.bookingEvent.from_date,
      TO_DATE: this.bookingEvent.to_date,
      TITLE: `${this.defaultTexts.entries.Lcz_EditBookingFor} ${this.item?.roomtype?.name} ${(this.item?.unit as IUnit)?.name || ''}`,
      defaultDateRange: {
        dateDifference: this.item.days.length,
        fromDate: new Date(this.item.from_date + 'T00:00:00'),
        fromDateStr: this.getDateStr(new Date(this.item.from_date + 'T00:00:00')),
        toDate: new Date(this.item.to_date + 'T00:00:00'),
        toDateStr: this.getDateStr(new Date(this.item.to_date + 'T00:00:00')),
        message: '',
      },
      bed_preference: this.item.bed_preference,
      adult_child_offering: this.item.rateplan.selected_variation.adult_child_offering,
      ADULTS_COUNT: this.item.rateplan.selected_variation.adult_nbr,
      ARRIVAL: this.bookingEvent.arrival,
      ARRIVAL_TIME: this.bookingEvent.arrival.description,
      BOOKING_NUMBER: this.bookingEvent.booking_nbr,
      cancelation: this.item.rateplan.cancelation,
      channel_booking_nbr: this.bookingEvent.channel_booking_nbr,
      CHILDREN_COUNT: this.item.rateplan.selected_variation.child_nbr,
      COUNTRY: this.bookingEvent.guest.country_id,
      ENTRY_DATE: this.bookingEvent.from_date,
      FROM_DATE_STR: this.bookingEvent.format.from_date,
      guarantee: this.item.rateplan.guarantee,
      GUEST: this.bookingEvent.guest,
      IDENTIFIER: this.item.identifier,
      is_direct: this.bookingEvent.is_direct,
      IS_EDITABLE: this.bookingEvent.is_editable,
      NO_OF_DAYS: this.item.days.length,
      NOTES: this.bookingEvent.remark,
      origin: this.bookingEvent.origin,
      POOL: this.item['assigned_units_pool'],
      PR_ID: (this.item.unit as IUnit)?.id,
      RATE: this.item.total,
      RATE_PLAN: this.item.rateplan.name,
      RATE_PLAN_ID: this.item.rateplan.id,
      RATE_TYPE: this.item.roomtype.id,
      ROOMS: this.bookingEvent.rooms,
      SOURCE: this.bookingEvent.source,
      SPLIT_BOOKING: false,
      STATUS: 'IN-HOUSE',
      TO_DATE_STR: this.bookingEvent.format.to_date,
      TOTAL_PRICE: this.bookingEvent.total,
      legendData: this.legendData,
      roomsInfo: this.roomsInfo,
      roomName: (this.item.unit as IUnit)?.name || '',
      PICKUP_INFO: this.bookingEvent.pickup_info,
    });
  }
  handleDeleteClick() {
    this.modal.openModal();
  }
  async deleteRoom() {
    try {
      this.isLoading = true;
      let oldRooms = [...this.bookingEvent.rooms];
      oldRooms = oldRooms.filter(room => room.identifier !== this.item.identifier);

      const body = {
        assign_units: true,
        check_in: true,
        is_pms: true,
        is_direct: true,
        booking: {
          booking_nbr: this.bookingEvent.booking_nbr,
          from_date: this.bookingEvent.from_date,
          to_date: this.bookingEvent.to_date,
          remark: this.bookingEvent.remark,
          property: this.bookingEvent.property,
          source: this.bookingEvent.source,
          currency: this.bookingEvent.currency,
          arrival: this.bookingEvent.arrival,
          guest: this.bookingEvent.guest,
          rooms: oldRooms,
        },
      };
      console.log('body:', body);

      const { data } = await axios.post(`/DoReservation?Ticket=${this.ticket}`, body);
      if (data.ExceptionMsg !== '') {
        throw new Error(data.ExceptionMsg);
      }
      this.irModalRef.closeModal();
      this.deleteFinished.emit(this.item.identifier);
    } catch (error) {
    } finally {
      this.isLoading = false;
    }
  }
  render() {
    return (
      <Host class="p-1 d-flex m-0">
        <ir-button
          variant="icon"
          id="drawer-icon"
          data-toggle="collapse"
          data-target={`#roomCollapse-${this.item.identifier?.split(' ').join('')}`}
          aria-expanded={this.collapsed ? 'true' : 'false'}
          aria-controls="myCollapse"
          class="mr-1"
          icon_name={this.collapsed ? 'closed_eye' : 'open_eye'}
          onClickHanlder={() => {
            this.collapsed = !this.collapsed;
          }}
          style={{ '--icon-size': '1.6rem' }}
        ></ir-button>

        <div class="flex-fill m-0 ">
          <div class="d-flex align-items-start justify-content-between sm-mb-1">
            <p class="m-0 p-0">
              <strong class="m-0 p-0">{this.myRoomTypeFoodCat || ''} </strong> {this.mealCodeName}{' '}
              {this.item.rateplan.is_non_refundable && ` - ${this.defaultTexts.entries.Lcz_NonRefundable}`}{' '}
            </p>
            {/*this.item.My_Room_type.My_Room_type_desc[0].CUSTOM_TXT || ''*/}
            <div class="d-flex m-0 p-0 align-items-center room_actions_btns">
              <span class="p-0 m-0 font-weight-bold">{_formatAmount(this.item['gross_total'], this.currency)}</span>
              {this.hasRoomEdit && this.isEditable && (
                <ir-button
                  id={`roomEdit-${this.item.identifier}`}
                  variant="icon"
                  icon_name="edit"
                  // class="mx-1"
                  style={colorVariants.secondary}
                  onClickHanlder={this.handleEditClick.bind(this)}
                ></ir-button>
              )}
              {this.hasRoomDelete && this.isEditable && (
                <ir-button
                  variant="icon"
                  onClickHanlder={this.handleDeleteClick.bind(this)}
                  id={`roomDelete-${this.item.identifier}`}
                  icon_name="trash"
                  style={colorVariants.danger}
                ></ir-button>
              )}
            </div>
          </div>
          <div class="d-flex align-items-center sm-mb-1">
            <ir-date-view class="mr-1" from_date={this.item.from_date} to_date={this.item.to_date} showDateDifference={false}></ir-date-view>
            {this.hasCheckIn && <ir-button id="checkin" icon="" class="mr-1" btn_color="info" size="sm" text="Check in"></ir-button>}
            {this.hasCheckOut && <ir-button id="checkout" icon="" btn_color="info" size="sm" text="Check out"></ir-button>}
          </div>
          <div class={'d-flex justify-content-end'}>
            {calendar_data.is_frontdesk_enabled && this.item.unit && (
              <span class={`light-blue-bg ${this.hasCheckIn || this.hasCheckOut ? 'mr-2' : ''} `}>{(this.item.unit as IUnit).name}</span>
            )}
          </div>

          <div>
            <span class="mr-1">{`${this.item.guest.first_name || ''} ${this.item.guest.last_name || ''}`}</span>
            {this.item.rateplan.selected_variation.adult_nbr > 0 && <span> {this.item.rateplan.selected_variation.adult_child_offering}</span>}
          </div>
          <div class="collapse" id={`roomCollapse-${this.item.identifier?.split(' ').join('')}`}>
            <div class="d-flex sm-mb-1 sm-mt-1">
              <div class=" sm-padding-top">
                <strong class="sm-padding-right">{`${this.defaultTexts.entries.Lcz_Breakdown}:`}</strong>
              </div>
              <div class={'flex-fill'}>
                <table>
                  {this.item.days.length > 0 &&
                    this.item.days.map(item => {
                      return (
                        <tr>
                          <td class={'pr-2 text-right'}>{_getDay(item.date)}</td>
                          <td class="text-right">{_formatAmount(item.amount, this.currency)}</td>
                          {item.cost > 0 && item.cost !== null && <td class="pl-2 text-left night-cost">{_formatAmount(item.cost, this.currency)}</td>}
                        </tr>
                      );
                    })}
                  <tr class={''}>
                    <th class="text-right pr-2 subtotal_row">{this.defaultTexts.entries.Lcz_SubTotal}</th>
                    <th class="text-right subtotal_row">{_formatAmount(this.item.total, this.currency)}</th>
                    {this.item.gross_cost > 0 && this.item.gross_cost !== null && <th class="pl-2 text-right night-cost">{_formatAmount(this.item.cost, this.currency)}</th>}
                  </tr>
                  {this.bookingEvent.is_direct ? (
                    <Fragment>
                      {(() => {
                        const filtered_data = calendar_data.taxes.filter(tx => tx.pct > 0);
                        return filtered_data.map(d => {
                          return (
                            <tr>
                              <td class="text-right pr-2">
                                {d.is_exlusive ? this.defaultTexts.entries.Lcz_Excluding : this.defaultTexts.entries.Lcz_Including} {d.name} ({d.pct}%)
                              </td>
                              <td class="text-right">{_formatAmount((this.item.total * d.pct) / 100, this.currency)}</td>
                              {this.item.gross_cost > 0 && this.item.gross_cost !== null && (
                                <td class="pl-2 text-right night-cost">{_formatAmount((this.item.cost * d.pct) / 100, this.currency)}</td>
                              )}
                            </tr>
                          );
                        });
                      })()}
                    </Fragment>
                  ) : (
                    <Fragment>
                      {(() => {
                        const filtered_data = this.item.ota_taxes.filter(tx => tx.amount > 0);
                        return filtered_data.map(d => {
                          return (
                            <tr>
                              <td class="text-right pr-2">
                                {d.is_exlusive ? this.defaultTexts.entries.Lcz_Excluding : this.defaultTexts.entries.Lcz_Including} {d.name}
                              </td>
                              <td class="text-right">
                                {d.currency.symbol}
                                {d.amount}
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </Fragment>
                  )}
                </table>
              </div>
            </div>
            <div class="sm-mb-1" innerHTML={this.item.rateplan.cancelation || ''}></div>
            <div class="sm-mb-1" innerHTML={this.item.rateplan.guarantee || ''}></div>
            {/* <ir-label label="PrePayment:" value={this.item.My_Room_type.My_Translated_Prepayment_Policy || ''}></ir-label>
            <ir-label label="Smoking Preference:" value={this.item.My_Room_type.My_Translated_Cancelation_Policy || ''}></ir-label> */}
            {this.bookingEvent.is_direct && <ir-label label={`${this.defaultTexts.entries.Lcz_MealPlan}:`} value={this.mealCodeName}></ir-label>}
            {/* <ir-label label={`${this.defaultTexts.entries.Lcz_SpecialRate}:`} value="Non-refundable"></ir-label> */}
          </div>
        </div>
        <ir-modal
          autoClose={false}
          ref={el => (this.irModalRef = el)}
          isLoading={this.isLoading}
          onConfirmModal={this.deleteRoom.bind(this)}
          iconAvailable={true}
          icon="ft-alert-triangle danger h1"
          leftBtnText={this.defaultTexts.entries.Lcz_Cancel}
          rightBtnText={this.defaultTexts.entries.Lcz_Delete}
          leftBtnColor="secondary"
          rightBtnColor="danger"
          modalTitle={this.defaultTexts.entries.Lcz_Confirmation}
          modalBody={`${this.defaultTexts.entries['Lcz_AreYouSureDoYouWantToRemove ']} ${this.item.roomtype.name} ${this.item.unit ? (this.item.unit as IUnit).name : ''} ${
            this.defaultTexts.entries.Lcz_FromThisBooking
          }`}
        ></ir-modal>
      </Host>
    );
  }
}
