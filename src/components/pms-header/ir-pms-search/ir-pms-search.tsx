import { IrComboboxSelectEventDetail } from '@/components';
import { Booking } from '@/models/booking.dto';
import Token from '@/models/Token';
import { BookingListingService } from '@/services/booking_listing.service';
import { Component, Event, EventEmitter, Host, Prop, State, Watch, h } from '@stencil/core';

@Component({
  tag: 'ir-pms-search',
  styleUrl: 'ir-pms-search.css',
  shadow: true,
})
export class IrPmsSearch {
  @Prop() propertyid: string;
  @Prop() ticket: string;

  @State() shortcutHint: string | null = null;
  @State() bookings: Booking[] = [];
  @State() isLoading: boolean;

  private pickerInputRef: HTMLIrPickerElement;

  private tokenService = new Token();
  private bookingListingService = new BookingListingService();

  @Event({ bubbles: true, composed: true, eventName: 'combobox-select' }) comboboxSelect: EventEmitter<IrComboboxSelectEventDetail>;

  componentWillLoad() {
    document.addEventListener('keydown', this.focusInput);
    this.detectShortcutHint();
    if (this.ticket) {
      console.log(this.ticket);
      this.tokenService.setToken(this.ticket);
    }
  }

  disconnectedCallback() {
    document.removeEventListener('keydown', this.focusInput);
  }

  @Watch('ticket')
  handleTicketChange(newValue: string, oldValue: string) {
    console.log(this.ticket);
    if (newValue !== oldValue && newValue) {
      this.tokenService.setToken(this.ticket);
    }
  }

  private detectShortcutHint() {
    // Hide on mobile / touch devices
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    if (isTouchDevice) {
      this.shortcutHint = null;
      return;
    }

    // Detect macOS
    const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform);

    this.shortcutHint = isMac ? '⌘ K' : 'Ctrl K';
  }

  private focusInput = (event: KeyboardEvent) => {
    const isK = event.key.toLowerCase() === 'k';
    const isCmdOrCtrl = event.metaKey || event.ctrlKey;

    if (isK && isCmdOrCtrl) {
      event.preventDefault();
      this.pickerInputRef?.focusInput();
    }
  };
  private async fetchBookings(event: CustomEvent<string>) {
    // throw new Error('Method not implemented.');
    event.stopImmediatePropagation();
    event.stopPropagation();
    const value = event.detail;
    const isNumber = !isNaN(Number(value));
    this.isLoading = true;
    this.bookings = await this.bookingListingService.getExposedBookings(
      {
        book_nbr: isNumber ? value : null,
        name: isNumber ? null : value,
        property_id: this.propertyid as any,
        filter_type: 1,
        from: '2026-01-01',
        to: '2026-01-08',
        balance_filter: '0',
        start_row: 0,
        end_row: 20,
        total_count: 0,
        booking_status: '',
        affiliate_id: 0,
        is_mpo_managed: false,
        is_mpo_used: false,
        is_for_mobile: false,
        is_combined_view: false,
        is_to_export: false,
        property_ids: null,
        channel: '',
      },
      { skipStore: true },
    );
    this.isLoading = false;
  }
  render() {
    return (
      <Host>
        <ir-picker
          loading={this.isLoading}
          onText-change={event => this.fetchBookings(event as CustomEvent<string>)}
          mode="select-async"
          ref={el => (this.pickerInputRef = el)}
          pill
          appearance="filled"
          onCombobox-select={event => this.handleComboboxSelect(event as CustomEvent<IrComboboxSelectEventDetail>)}
        >
          {this.shortcutHint && <span slot="end">{this.shortcutHint}</span>}
          {this.bookings.map(b => {
            const label = `${b.booking_nbr} ${b.guest.first_name} ${b.guest.last_name}`;
            return (
              <ir-picker-item value={b.booking_nbr} label={label}>
                {label}
              </ir-picker-item>
            );
          })}
        </ir-picker>
      </Host>
    );
  }
  private handleComboboxSelect(event: CustomEvent<IrComboboxSelectEventDetail>): void {
    event.stopImmediatePropagation();
    event.stopPropagation();
    this.comboboxSelect.emit(event.detail);
  }
}
