import { Component, Event, EventEmitter, Fragment, Host, Prop, h } from '@stencil/core';
import locales from '@/stores/locales.store';
import { RoomListItem } from '../types';

/**
 * The `.topLeftCell` sticky bar of `igl-cal-header`: unassigned-units / day-use-bookings buttons,
 * date navigation, rectifier and stop/open-sale buttons, and the room-search picker. `.topLeftCell`
 * is read directly by `igloo-calendar.tsx`'s drag-bounds calculation
 * (`document.querySelector('igl-cal-header .topLeftCell')`) — do not rename it.
 */
@Component({
  tag: 'igl-cal-header-toolbar',
  styleUrl: 'igl-cal-header-toolbar.css',
  scoped: true,
})
export class IglCalHeaderToolbar {
  @Prop() isVacationRental: boolean;
  @Prop() showDayUseButton: boolean;
  @Prop() minDate: string;
  @Prop() roomsList: RoomListItem[] = [];

  /** All toolbar-button actions, keyed the same way the existing `optionEvent` payload's `key` already is. */
  @Event() actionSelected: EventEmitter<{ key: string; data?: any }>;
  @Event() roomSelected: EventEmitter<{ roomId: number }>;

  private dateSelectRef: HTMLIrDateSelectElement;

  private handleAction(key: string, data: any = '') {
    this.actionSelected.emit({ key, data });
  }

  private handleDateSelect(event: CustomEvent) {
    if (Object.keys(event.detail).length > 0) {
      this.handleAction('calendar', event.detail);
    }
  }

  private handleScrollToRoom(roomId: number) {
    this.roomSelected.emit({ roomId });
  }

  render() {
    return (
      <Host>
        <div class="stickyCell align-items-center topLeftCell preventPageScroll">
          <div class="header__fd-actions">
            <div class="row justify-content-around no-gutters" style={{ gap: '0' }}>
              {!this.isVacationRental && (
                <Fragment>
                  <wa-tooltip trigger="hover" for="fd-unassigned-dates_btn">
                    {locales.entries.Lcz_UnassignedUnitsTooltip}
                  </wa-tooltip>
                  <ir-custom-button id="fd-unassigned-dates_btn" variant="neutral" appearance="plain" onClickHandler={() => this.handleAction('showAssigned')}>
                    <wa-icon
                      style={{ fontSize: '1.3rem' }}
                      name="list-ol"
                      label={locales.entries.Lcz_UnassignedUnitsTooltip}
                      aria-label={locales.entries.Lcz_UnassignedUnitsTooltip}
                    ></wa-icon>
                  </ir-custom-button>
                </Fragment>
              )}
              {this.showDayUseButton && (
                <Fragment>
                  <wa-tooltip trigger="hover" for="fd-day-use-bookings_btn">
                    {'Day use bookings'}
                  </wa-tooltip>
                  <ir-custom-button id="fd-day-use-bookings_btn" variant="neutral" appearance="plain" onClickHandler={() => this.handleAction('showDayUseBookings')}>
                    <wa-icon style={{ fontSize: '1.3rem' }} name="sun" label={'Day use'} aria-label={'Day use'}></wa-icon>
                  </ir-custom-button>
                </Fragment>
              )}
              <wa-tooltip trigger="hover" for="fd-dates-navigation_btn">
                {locales.entries.Lcz_Navigate}
              </wa-tooltip>
              <ir-date-select minDate={this.minDate} onDateChanged={evt => this.handleDateSelect(evt)} ref={el => (this.dateSelectRef = el)}>
                <ir-custom-button slot="trigger" id="fd-dates-navigation_btn" variant="neutral" appearance="plain" onClickHandler={() => this.handleAction('calendar')}>
                  <wa-icon
                    style={{ fontSize: '1.3rem' }}
                    name="calendar-days"
                    variant="regular"
                    label={locales.entries.Lcz_Navigate}
                    aria-label={locales.entries.Lcz_Navigate}
                  ></wa-icon>
                </ir-custom-button>
                <div class="fd-dates__actions">
                  <wa-divider></wa-divider>
                  <ir-custom-button
                    variant="neutral"
                    appearance="outlined"
                    onClickHandler={() => {
                      this.handleAction('gotoToday');
                      this.dateSelectRef.hide();
                    }}
                  >
                    Today
                  </ir-custom-button>
                </div>
              </ir-date-select>

              <wa-tooltip trigger="hover" for="fd-rectifier">
                Rectify or open availability
              </wa-tooltip>
              <ir-custom-button id="fd-rectifier" variant="neutral" appearance="plain" onClickHandler={() => this.handleAction('rectify')}>
                <wa-icon
                  style={{ fontSize: '1.3rem' }}
                  name="circle-check"
                  variant="regular"
                  label={'Rectify or open availability'}
                  aria-label={'Rectify or open availability'}
                ></wa-icon>
              </ir-custom-button>

              <Fragment>
                <wa-tooltip trigger="hover" for="fd-stop-open-sale_btn">
                  {locales.entries.Lcz_StopOpenSale}
                </wa-tooltip>
                <ir-custom-button id="fd-stop-open-sale_btn" variant="neutral" appearance="plain" onClickHandler={() => this.handleAction('bulk')}>
                  <wa-icon style={{ fontSize: '1.3rem' }} name="xmarks-lines" label={locales.entries.Lcz_StopOpenSale} aria-label={locales.entries.Lcz_StopOpenSale}></wa-icon>
                </ir-custom-button>
              </Fragment>
            </div>
            {this.roomsList.length >= 20 && (
              <div class="searchContiner">
                <ir-picker
                  size="s"
                  onCombobox-select={e => {
                    this.handleScrollToRoom(Number(e.detail.item.value));
                  }}
                >
                  {this.roomsList.map(room => (
                    <ir-picker-item label={room.name} value={String(room.id)}>
                      {room.name}
                    </ir-picker-item>
                  ))}
                </ir-picker>
              </div>
            )}
          </div>
        </div>
      </Host>
    );
  }
}
