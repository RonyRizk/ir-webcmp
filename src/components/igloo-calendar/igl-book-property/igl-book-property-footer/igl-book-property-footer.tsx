import { Component, Event, EventEmitter, Fragment, Host, Prop, h } from '@stencil/core';
import { TPropertyButtonsTypes } from '../../../../models/igl-book-property';
import locales from '@/stores/locales.store';
import { isRequestPending } from '@/stores/ir-interceptor.store';
import { TIcons } from '@/components/ui/ir-icons/icons';
import calendar_data from '@/stores/calendar-data';
import moment from 'moment';

@Component({
  tag: 'igl-book-property-footer',
  styleUrl: 'igl-book-property-footer.css',
  scoped: true,
})
export class IglBookPropertyFooter {
  @Prop() eventType: string;
  @Prop() disabled: boolean = true;
  @Prop() page: string;
  @Prop({ reflect: true }) isEditOrAddRoomEvent: boolean;
  @Prop() dateRangeData: { [key: string]: any };
  @Prop() isLoading: string;

  @Event() buttonClicked: EventEmitter<{ key: TPropertyButtonsTypes }>;

  private isEventType(event: string) {
    return event === this.eventType;
  }
  private editNext(label) {
    if (this.isEventType('EDIT_BOOKING')) {
      if (label === 'Cancel') {
        return 'flex-fill';
      } else {
        return 'd-none d-md-block  flex-fill';
      }
    }
    return 'flex-fill';
  }

  private renderButton({
    label,
    type,
    disabled,
    icon_name,
    isLoading,
    icon_position = 'right',
  }: {
    type: TPropertyButtonsTypes;
    label: string;
    disabled?: boolean;
    icon_name?: TIcons;
    isLoading?: boolean;
    icon_position?: 'right' | 'left';
  }) {
    return (
      <div class={this.shouldRenderTwoButtons() ? ` ${this.editNext(label)}` : 'flex-fill'}>
        {/* <button class={`btn btn-${type === 'cancel' ? 'secondary' : 'primary'} full-width`} onClick={() => this.buttonClicked.emit({ key: type })} disabled={disabled}>
          {label}
        </button> */}
        <ir-button
          isLoading={isLoading}
          btn_color={type === 'cancel' || type === 'back' ? 'secondary' : 'primary'}
          text={label}
          btn_disabled={disabled}
          onClickHandler={() => {
            this.buttonClicked.emit({ key: type });
          }}
          class="full-width"
          btn_styles="justify-content-center"
          icon_name={icon_name}
          iconPosition={icon_position}
          style={{ '--icon-size': '1rem' }}
          icon_style={{ paddingBottom: '1.9px' }}
        ></ir-button>
      </div>
    );
  }

  private shouldRenderTwoButtons() {
    return this.isEventType('PLUS_BOOKING') || this.isEventType('ADD_ROOM') || this.isEventType('EDIT_BOOKING');
  }

  render() {
    if (this.page === 'page_one') {
      return (
        <Host>
          {/* <div class="d-flex justify-content-between gap-30 align-items-center full-width"> */}
          {this.isEventType('EDIT_BOOKING') ? (
            <Fragment>
              {this.renderButton({ type: 'cancel', label: locales.entries.Lcz_Cancel })}
              {this.shouldRenderTwoButtons() &&
                this.renderButton({
                  type: 'next',
                  label: `${locales.entries.Lcz_Next}`,
                  disabled: isRequestPending('/Get_Exposed_Booking_Availability'),
                  icon_name: 'angles_right',
                })}
            </Fragment>
          ) : (
            <Fragment>
              {this.renderButton({ type: 'cancel', label: locales.entries.Lcz_Cancel })}
              {this.shouldRenderTwoButtons() && this.renderButton({ type: 'next', label: `${locales.entries.Lcz_Next}`, icon_name: 'angles_right' })}
            </Fragment>
          )}
          {/* </div> */}
        </Host>
      );
    }
    const showBookAndCheckin = calendar_data.checkin_enabled && moment(new Date(this.dateRangeData?.fromDate)).isSame(new Date(), 'day');
    return (
      <Fragment>
        {this.isEditOrAddRoomEvent ? (
          <Fragment>
            {this.renderButton({ type: 'back', icon_position: 'left', label: locales.entries.Lcz_Back, icon_name: 'angles_left' })}
            {this.renderButton({ type: 'save', label: locales.entries.Lcz_Save, isLoading: this.isLoading === 'save' })}
          </Fragment>
        ) : (
          <Fragment>
            {this.renderButton({ type: 'back', icon_position: 'left', label: locales.entries.Lcz_Back, icon_name: 'angles_left' })}
            {this.renderButton({ type: 'book', label: locales.entries.Lcz_Book, isLoading: this.isLoading === 'book' })}
            {showBookAndCheckin && this.renderButton({ type: 'bookAndCheckIn', label: locales.entries.Lcz_BookAndChekcIn, isLoading: this.isLoading === 'bookAndCheckIn' })}
          </Fragment>
        )}
      </Fragment>
    );
  }
}
