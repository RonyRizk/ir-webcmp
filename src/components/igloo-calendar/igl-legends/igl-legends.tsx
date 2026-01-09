import { BookingColor } from '@/models/booking.dto';
import { PropertyService } from '@/services/property.service';
import calendar_data from '@/stores/calendar-data';
import locales from '@/stores/locales.store';
import { Component, Event, EventEmitter, Host, Prop, State, Watch, h } from '@stencil/core';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

@Component({
  tag: 'igl-legends',
  styleUrl: 'igl-legends.css',
  scoped: true,
})
export class IglLegends {
  @Prop() legendData: { [key: string]: any };

  @State() bookingColors: BookingColor[] = [];
  @State() saveState: SaveState = 'idle';
  @State() saveError?: string;
  @State() loadingIndex: number[] = [];

  @Event() optionEvent: EventEmitter<{ [key: string]: any }>;

  private propertyService = new PropertyService();
  private saveTimeout?: number;

  disconnectedCallback() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
  }

  @Watch('saveState')
  handleSaveStateChange(newValue: SaveState) {
    if (newValue === 'error' || newValue === 'idle') {
      this.loadingIndex = [];
    }
  }

  private handleOptionEvent(key, data = '') {
    this.optionEvent.emit({ key, data });
  }

  private syncCalendarExtra(colors: BookingColor[]) {
    const calendarExtra = calendar_data.property.calendar_extra ?? {};
    calendar_data.property.calendar_extra = {
      ...calendarExtra,
      booking_colors: colors.map(color => ({ ...color })),
    };
  }

  private get propertyId(): number | null {
    return calendar_data.property?.id ?? calendar_data.property.id ?? null;
  }

  private updateBookingColor(index: number, patch: Partial<BookingColor>) {
    const bookingColors = calendar_data.property.calendar_extra?.booking_colors.map((color, idx) => (idx === index ? { ...color, ...patch } : color));
    this.syncCalendarExtra(bookingColors);
    if (this.saveState === 'saved') {
      this.saveState = 'idle';
    }
  }

  private async persistBookingColors() {
    const propertyId = this.propertyId;
    if (!propertyId) {
      return;
    }

    if (this.saveState === 'saving') {
      return;
    }
    this.saveState = 'saving';
    this.saveError = undefined;

    try {
      await this.propertyService.setPropertyCalendarExtra({
        property_id: propertyId,
        value: JSON.stringify(calendar_data.property.calendar_extra),
      });
      this.saveState = 'saved';
      if (this.saveTimeout) {
        clearTimeout(this.saveTimeout);
      }
      this.saveTimeout = window.setTimeout(() => {
        this.saveState = 'idle';
        this.saveTimeout = undefined;
      }, 2000);
    } catch (error) {
      this.saveState = 'error';
      this.saveError = error instanceof Error ? error.message : String(error);
    }
  }

  private handleNameInput(index: number, value: string) {
    this.updateBookingColor(index, { name: value });
  }

  private handleBlur(index: number) {
    this.persistBookingColors();
    if (!this.loadingIndex.includes(index)) {
      this.loadingIndex = [...this.loadingIndex, index];
    }
  }

  private handleLoaderComplete(index: number) {
    this.loadingIndex = this.loadingIndex.filter(currentIndex => currentIndex !== index);
  }
  private updateLegend() {
    let newLegendArray = [...calendar_data.property.calendar_legends];
    //step 1: replace scheduled cleaning index 12 with dirty now index 11;
    let dirtyNow = newLegendArray[11];
    newLegendArray[11] = newLegendArray[12];
    newLegendArray[12] = dirtyNow;
    //step 2: move index 13 to index 7 and push the other 1 index lower;
    const splitBooking = newLegendArray[13];
    newLegendArray = newLegendArray.filter((_, i) => i !== 13);
    newLegendArray.splice(7, 0, splitBooking);
    return newLegendArray;
  }
  render() {
    const legend = this.updateLegend();
    return (
      <Host class="legendContainer text-left">
        <div class="fd-legend__header">
          <h2 class="fd-legend__title" id="legend-title">
            {locales.entries.Lcz_Legend}
          </h2>
          <ir-custom-button size="medium" onClickHandler={() => this.handleOptionEvent('closeSideMenu')} appearance="plain" variant="neutral">
            <wa-icon name="xmark" variant="solid" label="Close" aria-label="Close" role="img"></wa-icon>
          </ir-custom-button>
        </div>
        <section class="fd-legend__body">
          <div>
            {legend.map(legendInfo => {
              const stripeColor = calendar_data.colorsForegrounds[legendInfo?.color];
              return (
                <div class="fd-legend__row">
                  <div class={'fd-legend__shape'}>
                    {legendInfo.design === 'broom' ? (
                      <svg xmlns="http://www.w3.org/2000/svg" height="12" width="13.5" viewBox="0 0 576 512" style={{ display: 'block' }}>
                        <path
                          fill="var(--wa-color-text-normal,black)"
                          d="M566.6 54.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-192 192-34.7-34.7c-4.2-4.2-10-6.6-16-6.6c-12.5 0-22.6 10.1-22.6 22.6l0 29.1L364.3 320l29.1 0c12.5 0 22.6-10.1 22.6-22.6c0-6-2.4-11.8-6.6-16l-34.7-34.7 192-192zM341.1 353.4L222.6 234.9c-42.7-3.7-85.2 11.7-115.8 42.3l-8 8C76.5 307.5 64 337.7 64 369.2c0 6.8 7.1 11.2 13.2 8.2l51.1-25.5c5-2.5 9.5 4.1 5.4 7.9L7.3 473.4C2.7 477.6 0 483.6 0 489.9C0 502.1 9.9 512 22.1 512l173.3 0c38.8 0 75.9-15.4 103.4-42.8c30.6-30.6 45.9-73.1 42.3-115.8z"
                        />
                      </svg>
                    ) : legendInfo.design === 'check' ? (
                      <svg height={14} width={14} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                        <path
                          fill="green"
                          d="M530.8 134.1C545.1 144.5 548.3 164.5 537.9 178.8L281.9 530.8C276.4 538.4 267.9 543.1 258.5 543.9C249.1 544.7 240 541.2 233.4 534.6L105.4 406.6C92.9 394.1 92.9 373.8 105.4 361.3C117.9 348.8 138.2 348.8 150.7 361.3L252.2 462.8L486.2 141.1C496.6 126.8 516.6 123.6 530.9 134z"
                        />
                      </svg>
                    ) : (
                      <div
                        class={`legend_${legendInfo.design}  ${legendInfo.id === '3' ? 'pending' : ''} ${legendInfo.id === '1' ? 'in-house' : ''} ${
                          ['1', '7'].includes(legendInfo.id.toString()) ? `striped ${legendInfo.id.toString() === '1' ? 'vertical' : ''}` : ''
                        }`}
                        style={{ '--ir-skew-background': legendInfo.color, '--ir-event-bg-stripe-color': stripeColor?.stripe, 'backgroundColor': legendInfo.color }}
                      >
                        {legendInfo.id === '1' && '5'}
                      </div>
                    )}
                  </div>
                  <p class="fd-legend__row-title">{legendInfo.name}</p>
                </div>
              );
            })}
            <wa-divider></wa-divider>
            <h5 class="fd-legend__section-title">Use custom colors</h5>
            {calendar_data.property.calendar_extra?.booking_colors.map((legendInfo, index) => {
              const previewClass = `legend_${legendInfo.design}`;
              return (
                <div key={`legend_${index}`} class="fd-legend__row">
                  <div class={'fd-legend__shape'}>
                    <div class={previewClass} style={{ backgroundColor: legendInfo.color }}></div>
                  </div>
                  <wa-input
                    autocomplete="off"
                    class="legendTextarea border-0 m-0 p-0"
                    value={legendInfo.name}
                    size="small"
                    placeholder="Reason for this color"
                    onchange={event => {
                      this.handleNameInput(index, (event.target as HTMLInputElement).value);
                      this.handleBlur(index);
                    }}
                  >
                    {this.loadingIndex.includes(index) && (this.saveState === 'saving' || this.saveState === 'saved') ? (
                      <ir-success-loader slot="end" onLoaderComplete={() => this.handleLoaderComplete(index)}></ir-success-loader>
                    ) : null}
                  </wa-input>
                </div>
              );
            })}
          </div>
          <wa-divider></wa-divider>
          <div>
            <div class="legendCalendar">
              <div class="legendRow align-items-center">
                <div class="legendCal br-t br-s br-bt">
                  <strong>MAR 2022</strong>
                </div>
                <div class="hyphenLegend">{locales.entries.Lcz_MonthAndYear}</div>
              </div>
              <div class="legendRow">
                <div class="legendCal headerCell align-items-center br-s">
                  <wa-badge pill>3</wa-badge>
                </div>
                <div class="hyphenLegend">
                  <div>{locales.entries.Lcz_UnassignedUnits}</div>
                </div>
              </div>
              <div class="legendRow">
                <div class="legendCal dayTitle br-s">Fri 18</div>
                <div class="hyphenLegend">{locales.entries.Lcz_Date}</div>
              </div>
              <div class="legendRow">
                <div class="legendCal br-s br-bt dayCapacityPercent">15%</div>
                <div class="hyphenLegend">{locales.entries.Lcz_Occupancy}</div>
              </div>
              <div class="legendRow">
                <div class="legendCal br-s br-bt  font-weight-bold total-availability">20</div>
                <div class="hyphenLegend">{locales.entries.Lcz_TotalAvailability}</div>
              </div>
            </div>
          </div>
        </section>
      </Host>
    );
  }
}
