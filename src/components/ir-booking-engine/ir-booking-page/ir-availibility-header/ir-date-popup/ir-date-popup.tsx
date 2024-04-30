import localization_store from '@/stores/app.store';
import { Component, Host, h, Element, Prop, Watch, State } from '@stencil/core';
import { addDays, format } from 'date-fns';
@Component({
  tag: 'ir-date-popup',
  styleUrl: 'ir-date-popup.css',
  shadow: true,
})
export class IrDatePopup {
  @Prop() dates: { start: Date | null; end: Date | null } = {
    start: null,
    end: null,
  };
  @State() isPopoverOpen = false;
  @Element() el: HTMLIrDatePopupElement;

  private popover: HTMLIrPopoverElement;
  private minDate: Date = addDays(new Date(), 0);

  @Watch('dates')
  handleDatesChange() {
    if (this.dates.end && this.isPopoverOpen) {
      this.popover.toggleVisibility();
    }
  }
  componentWillLoad() {
    this.minDate.setHours(0, 0, 0, 0);
  }
  dateTrigger() {
    return (
      <div class="popover-trigger w-full relative sm:w-fit" slot="trigger">
        <ir-icons name="calendar" svgClassName="size-[18px]"></ir-icons>
        <div class="flex-1 ">
          {/* <div>
            <p class="text-xs">Check in</p>
            <p class={'date'}>
              {this.dates.start ? format(this.dates.start, 'MMM dd', { locale: localization_store.selectedLocale }) : <span class="text-slate-500">Add date</span>}
            </p>
          </div>
          <div class="flex items-end  h-full">
            <ir-icons name="minus" svgClassName="h-3 w-5 md:w-3"></ir-icons>
          </div>
          <div>
            <p class="text-xs">Check out</p>
            <p class="date">{this.dates.end ? format(this.dates.end, 'MMM dd', { locale: localization_store.selectedLocale }) : <span class="text-slate-500">Add date</span>}</p>
          </div> */}
          <p class="label">Dates</p>
          <div class="dates">
            {this.dates.start ? format(this.dates.start, 'MMM dd', { locale: localization_store.selectedLocale }) : <span class="text-slate-500">Check in</span>}
            <span> - </span>
            {this.dates.end ? format(this.dates.end, 'MMM dd', { locale: localization_store.selectedLocale }) : <span class="text-slate-500">Check out</span>}
          </div>
        </div>
      </div>
    );
  }
  render() {
    return (
      <Host>
        <ir-popover placement="auto" ref={el => (this.popover = el)} onOpenChange={e => (this.isPopoverOpen = e.detail)}>
          {this.dateTrigger()}
          <div slot="popover-content" class="date-range-container p-2 sm:p-4 md:p-6 border-0 w-full shadow-none sm:border sm:w-auto sm:shadow-sm ">
            <ir-date-range fromDate={this.dates.start} toDate={this.dates.end} locale={localization_store.selectedLocale} maxSpanDays={5} minDate={this.minDate}></ir-date-range>
          </div>
        </ir-popover>
      </Host>
    );
  }
}
