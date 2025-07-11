import { Component, h, Prop, EventEmitter, Event, Listen, State, Element, Watch, Host, Fragment } from '@stencil/core';
import { _getDay } from '../functions';
import { Booking, IUnit, IVariations, Occupancy, Room } from '@/models/booking.dto';
import { TIglBookPropertyPayload } from '@/models/igl-book-property';
import { formatName } from '@/utils/booking';
import axios from 'axios';
import locales from '@/stores/locales.store';
import calendar_data, { isSingleUnit } from '@/stores/calendar-data';
import { colorVariants } from '@/components/ui/ir-icons/icons';
import { formatAmount } from '@/utils/utils';
import { IEntries } from '@/models/IBooking';
//TODO revert back to the room cmp with adults
@Component({
  tag: 'ir-room',
  styleUrl: 'ir-room.css',
  scoped: true,
})
export class IrRoom {
  @Element() element: HTMLIrRoomElement;
  // Room Data
  @Prop() booking: Booking;
  @Prop() bookingIndex: number;
  @Prop() isEditable: boolean;
  @Prop() room: Room;
  // Meal Code names
  @Prop() mealCodeName: string;
  @Prop() myRoomTypeFoodCat: string;
  // Currency
  @Prop() currency: string = 'USD';
  @Prop() language: string = 'en';
  @Prop() legendData;
  @Prop() roomsInfo;
  @Prop() bedPreferences: IEntries[];
  // Booleans Conditions
  @Prop() hasRoomEdit: boolean = false;
  @Prop() hasRoomDelete: boolean = false;
  @Prop() hasRoomAdd: boolean = false;
  @Prop() hasCheckIn: boolean = false;
  @Prop() hasCheckOut: boolean = false;

  @State() collapsed: boolean = false;
  @State() item: Room;
  @State() isLoading: boolean = false;
  @State() isModelOpen: boolean = false;

  // Event Emitters
  @Event({ bubbles: true, composed: true }) deleteFinished: EventEmitter<string>;
  @Event({ bubbles: true, composed: true }) pressCheckIn: EventEmitter;
  @Event({ bubbles: true, composed: true }) pressCheckOut: EventEmitter;
  @Event({ bubbles: true, composed: true }) editInitiated: EventEmitter<TIglBookPropertyPayload>;

  private modal: HTMLIrModalElement;

  componentWillLoad() {
    if (this.booking) {
      this.item = this.booking.rooms[this.bookingIndex];
    }
  }

  @Watch('booking')
  handlebookingChange() {
    this.item = this.booking.rooms[this.bookingIndex];
  }

  @Listen('clickHandler')
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
      EMAIL: this.booking.guest.email,
      PHONE: this.booking.guest.mobile,
      REFERENCE_TYPE: '',
      FROM_DATE: this.booking.from_date,
      TO_DATE: this.booking.to_date,
      TITLE: `${locales.entries.Lcz_EditBookingFor} ${this.item?.roomtype?.name} ${(this.item?.unit as IUnit)?.name || ''}`,
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
      ARRIVAL: this.booking.arrival,
      ARRIVAL_TIME: this.booking.arrival.description,
      BOOKING_NUMBER: this.booking.booking_nbr,
      cancelation: this.item.rateplan.cancelation,
      channel_booking_nbr: this.booking.channel_booking_nbr,
      CHILDREN_COUNT: this.item.rateplan.selected_variation.child_nbr,
      COUNTRY: this.booking.guest.country_id,
      ENTRY_DATE: this.booking.from_date,
      FROM_DATE_STR: this.booking.format.from_date,
      guarantee: this.item.rateplan.guarantee,
      GUEST: this.booking.guest as any,
      IDENTIFIER: this.item.identifier,
      is_direct: this.booking.is_direct,
      IS_EDITABLE: this.booking.is_editable,
      NO_OF_DAYS: this.item.days.length,
      NOTES: this.booking.remark,
      origin: this.booking.origin,
      POOL: this.item['assigned_units_pool'],
      PR_ID: (this.item.unit as IUnit)?.id,
      RATE: this.item.total,
      RATE_PLAN: this.item.rateplan.name,
      RATE_PLAN_ID: this.item.rateplan.id,
      RATE_TYPE: this.item.roomtype.id,
      ROOMS: this.booking.rooms,
      SOURCE: this.booking.source,
      SPLIT_BOOKING: false,
      STATUS: 'IN-HOUSE',
      TO_DATE_STR: this.booking.format.to_date,
      TOTAL_PRICE: this.booking.total,
      legendData: this.legendData,
      roomsInfo: this.roomsInfo,
      roomName: (this.item.unit as IUnit)?.name || '',
      PICKUP_INFO: this.booking.pickup_info,
      booking: this.booking,
      currentRoomType: this.item,
    });
  }
  handleDeleteClick() {
    this.modal.openModal();
  }
  private async deleteRoom() {
    try {
      this.isLoading = true;
      let oldRooms = [...this.booking.rooms];
      oldRooms = oldRooms.filter(room => room.identifier !== this.item.identifier);

      const body = {
        assign_units: true,
        check_in: true,
        is_pms: true,
        is_direct: true,
        booking: {
          booking_nbr: this.booking.booking_nbr,
          from_date: this.booking.from_date,
          to_date: this.booking.to_date,
          remark: this.booking.remark,
          property: this.booking.property,
          source: this.booking.source,
          currency: this.booking.currency,
          arrival: this.booking.arrival,
          guest: this.booking.guest,
          rooms: oldRooms,
        },
      };
      console.log('body:', body);

      const { data } = await axios.post(`/DoReservation`, body);
      if (data.ExceptionMsg !== '') {
        throw new Error(data.ExceptionMsg);
      }
      this.modal.closeModal();
      this.deleteFinished.emit(this.item.identifier);
    } catch (error) {
    } finally {
      this.isLoading = false;
    }
  }

  private formatVariation({ adult_nbr, child_nbr }: IVariations, { infant_nbr }: Occupancy) {
    const adultCount = adult_nbr > 0 ? adult_nbr : 0;
    const childCount = child_nbr > 0 ? child_nbr : 0;
    const infantCount = infant_nbr > 0 ? infant_nbr : 0;

    const adultLabel = adultCount > 1 ? locales.entries.Lcz_Adults.toLowerCase() : locales.entries.Lcz_Adult.toLowerCase();
    const childLabel = childCount > 1 ? locales.entries.Lcz_Children.toLowerCase() : locales.entries.Lcz_Child.toLowerCase();
    const infantLabel = infantCount > 1 ? locales.entries.Lcz_Infants.toLowerCase() : locales.entries.Lcz_Infant.toLowerCase();

    const parts = [];
    if (adultCount > 0) {
      parts.push(`${adultCount} ${adultLabel}`);
    }
    if (childCount > 0) {
      parts.push(`${childCount} ${childLabel}`);
    }
    if (infantCount > 0) {
      parts.push(`${infantCount} ${infantLabel}`);
    }

    return parts.join('&nbsp&nbsp&nbsp&nbsp');
  }

  private getSmokingLabel() {
    if (this.booking.is_direct) {
      if (!this.item.smoking_option) {
        return null;
      }
      const currRT = calendar_data.roomsInfo.find(rt => rt.id === this.item.roomtype.id);
      if (currRT) {
        const smoking_option = currRT['smoking_option']?.allowed_smoking_options;
        if (smoking_option) {
          return smoking_option.find(s => s.code === this.item.smoking_option)?.description;
        }
        return null;
      }
      return null;
    }
    return this.item.ota_meta?.smoking_preferences;
  }

  private getBedName() {
    if (this.booking.is_direct) {
      const bed = this.bedPreferences.find(p => p.CODE_NAME === this.item?.bed_preference?.toString());
      if (!bed) {
        return;
      }
      return bed[`CODE_VALUE_${this.language}`] ?? bed.CODE_VALUE_EN;
    }
    return this.item.ota_meta?.bed_preferences;
  }
  render() {
    const bed = this.getBedName();
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
          onClickHandler={() => {
            this.collapsed = !this.collapsed;
          }}
          style={{ '--icon-size': '1.6rem' }}
        ></ir-button>

        <div class="flex-fill m-0 ">
          <div class="d-flex align-items-start justify-content-between sm-mb-1">
            <p class="m-0 p-0">
              <span class="m-0 p-0" style={{ fontWeight: '600' }}>
                {this.myRoomTypeFoodCat || ''}{' '}
              </span>{' '}
              {this.mealCodeName} {this.item.rateplan.is_non_refundable && ` - ${locales.entries.Lcz_NonRefundable}`}{' '}
            </p>
            {/*this.item.My_Room_type.My_Room_type_desc[0].CUSTOM_TXT || ''*/}
            <div class="d-flex m-0 p-0 align-items-center room_actions_btns">
              <span class="p-0 m-0 font-weight-bold">{formatAmount(this.currency, this.item['gross_total'])}</span>
              {this.hasRoomEdit && this.isEditable && (
                <ir-button
                  id={`roomEdit-${this.item.identifier}`}
                  variant="icon"
                  icon_name="edit"
                  // class="mx-1"
                  style={colorVariants.secondary}
                  onClickHandler={this.handleEditClick.bind(this)}
                ></ir-button>
              )}
              {this.hasRoomDelete && this.isEditable && (
                <ir-button
                  variant="icon"
                  onClickHandler={this.handleDeleteClick.bind(this)}
                  id={`roomDelete-${this.item.identifier}`}
                  icon_name="trash"
                  style={colorVariants.danger}
                ></ir-button>
              )}
            </div>
          </div>
          <div class="d-flex align-items-center sm-mb-1">
            <ir-date-view class="mr-1" from_date={this.item.from_date} to_date={this.item.to_date} showDateDifference={false}></ir-date-view>
            {this.hasCheckIn && <ir-button id="checkin" class="mr-1" btn_color="info" size="sm" text="Check in"></ir-button>}
            {this.hasCheckOut && <ir-button id="checkout" btn_color="info" size="sm" text="Check out"></ir-button>}
          </div>
          {!isSingleUnit(this.item.roomtype.id) && calendar_data.is_frontdesk_enabled && this.item.unit && (
            <div class={'d-flex justify-content-end'}>
              <span class={`light-blue-bg ${this.hasCheckIn || this.hasCheckOut ? 'mr-2' : ''} `}>{(this.item.unit as IUnit).name}</span>
            </div>
          )}

          <div class="d-flex align-items-center" style={{ gap: '0.5rem' }}>
            <span>{`${this.item.guest.first_name || ''} ${this.item.guest.last_name || ''}`}</span>
            {/* {this.item.rateplan.selected_variation.adult_nbr > 0 && <span> {this.item.rateplan.selected_variation.adult_child_offering}</span>} */}
            {this.item.rateplan.selected_variation.adult_nbr > 0 && <span innerHTML={this.formatVariation(this.item.rateplan.selected_variation, this.item.occupancy)}> </span>}
            {bed && <span>({bed})</span>}
          </div>
          <div class="collapse" id={`roomCollapse-${this.item.identifier?.split(' ').join('')}`}>
            <div class="d-flex sm-mb-1 sm-mt-1">
              <div class=" sm-padding-top">
                <p class="sm-padding-right" style={{ fontWeight: '600' }}>{`${locales.entries.Lcz_Breakdown}:`}</p>
              </div>
              <div class={'flex-fill'}>
                <table>
                  {this.item.days.length > 0 &&
                    this.item.days.map(item => {
                      return (
                        <tr>
                          <td class={'pr-2 text-right'}>{_getDay(item.date)}</td>
                          <td class="text-right">{formatAmount(this.currency, item.amount)}</td>
                          {item.cost > 0 && item.cost !== null && <td class="pl-2 text-left night-cost">{formatAmount(this.currency, item.cost)}</td>}
                        </tr>
                      );
                    })}
                  <tr class={''}>
                    <th class="text-right pr-2 subtotal_row">{locales.entries.Lcz_SubTotal}</th>
                    <th class="text-right subtotal_row">{formatAmount(this.currency, this.item.total)}</th>
                    {this.item.gross_cost > 0 && this.item.gross_cost !== null && <th class="pl-2 text-right night-cost">{formatAmount(this.currency, this.item.cost)}</th>}
                  </tr>
                  {this.booking.is_direct ? (
                    <Fragment>
                      {(() => {
                        const filtered_data = calendar_data.taxes.filter(tx => tx.pct > 0);
                        return filtered_data.map(d => {
                          return (
                            <tr>
                              <td class="text-right pr-2">
                                {d.is_exlusive ? locales.entries.Lcz_Excluding : locales.entries.Lcz_Including} {d.name} ({d.pct}%)
                              </td>
                              <td class="text-right">{formatAmount(this.currency, (this.item.total * d.pct) / 100)}</td>
                              {this.item.gross_cost > 0 && this.item.gross_cost !== null && (
                                <td class="pl-2 text-right night-cost">{formatAmount(this.currency, (this.item.cost * d.pct) / 100)}</td>
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
                                {d.is_exlusive ? locales.entries.Lcz_Excluding : locales.entries.Lcz_Including} {d.name}
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
            <ir-label labelText={`${locales.entries.Lcz_SmokingOptions}:`} display="inline" content={this.getSmokingLabel()}></ir-label>
            {this.booking.is_direct && (
              <Fragment>
                {this.item.rateplan.cancelation && (
                  <ir-label labelText={`${locales.entries.Lcz_Cancellation}:`} display="inline" content={this.item.rateplan.cancelation || ''} renderContentAsHtml></ir-label>
                )}
                {this.item.rateplan.guarantee && (
                  <ir-label labelText={`${locales.entries.Lcz_Guarantee}:`} display="inline" content={this.item.rateplan.guarantee || ''} renderContentAsHtml></ir-label>
                )}
              </Fragment>
            )}
            {this.item.ota_meta && (
              <div>
                <ir-label labelText={`${locales.entries.Lcz_MealPlan}:`} display="inline" content={this.item.ota_meta.meal_plan}></ir-label>
                <ir-label labelText={`${locales.entries.Lcz_Policies}:`} display="inline" content={this.item.ota_meta.policies}></ir-label>
              </div>
            )}
            {/* {this.booking.is_direct && <ir-label labelText={`${locales.entries.Lcz_MealPlan}:`} content={this.mealCodeName}></ir-label>} */}
          </div>
        </div>
        <ir-modal
          autoClose={false}
          ref={el => (this.modal = el)}
          isLoading={this.isLoading}
          onConfirmModal={this.deleteRoom.bind(this)}
          iconAvailable={true}
          icon="ft-alert-triangle danger h1"
          leftBtnText={locales.entries.Lcz_Cancel}
          rightBtnText={locales.entries.Lcz_Delete}
          leftBtnColor="secondary"
          rightBtnColor="danger"
          modalTitle={locales.entries.Lcz_Confirmation}
          modalBody={`${locales.entries['Lcz_AreYouSureDoYouWantToRemove ']} ${this.item.roomtype.name} ${this.item.unit ? (this.item.unit as IUnit).name : ''} ${
            locales.entries.Lcz_FromThisBooking
          }`}
        ></ir-modal>
      </Host>
    );
  }
}
