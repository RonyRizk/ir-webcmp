import { IrComboboxSelectEventDetail } from '@/components';
import { Debounce } from '@/decorators/debounce';
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

  private tokenService = new Token();
  private bookingListingService = new BookingListingService();

  @Event({ bubbles: true, composed: true, eventName: 'combobox-select' }) comboboxSelect: EventEmitter<IrComboboxSelectEventDetail>;
  autoCompleteRef: HTMLIrAutocompleteElement;

  componentWillLoad() {
    document.addEventListener('keydown', this.focusInput);
    this.detectShortcutHint();
    if (this.ticket) {
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
      // this.pickerInputRef?.focusInput();
      console.log(this.autoCompleteRef);
      this.autoCompleteRef.focusInput();
    }
  };
  @Debounce(300)
  private async fetchBookings(event: CustomEvent<string>) {
    // throw new Error('Method not implemented.');
    event.stopImmediatePropagation();
    event.stopPropagation();
    const value = event.detail;
    this.autoCompleteRef.hide();
    if (!value) {
      return;
    }
    const isNumber = /^(?:-?\d+|.{3}-.*)$/.test(value);
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
    this.autoCompleteRef.show();
    this.isLoading = false;
  }
  private handleComboboxSelect(event: CustomEvent<string>): void {
    event.stopImmediatePropagation();
    event.stopPropagation();
    this.comboboxSelect.emit({
      item: {
        label: '',
        value: event.detail,
      },
    });
  }
  render() {
    return (
      <Host>
        <ir-autocomplete
          class="pms-search__autocomplete"
          placeholder="Search"
          ref={el => (this.autoCompleteRef = el)}
          onCombobox-change={event => this.handleComboboxSelect(event as CustomEvent<string>)}
          onText-change={event => this.fetchBookings(event as CustomEvent<string>)}
          pill
          appearance="filled"
        >
          <wa-icon name="magnifying-glass" slot="start"></wa-icon>
          <div slot="end" class="pms-autocomplete__end-slot">
            {this.isLoading && <wa-spinner></wa-spinner>}
            {this.shortcutHint && <span>{this.shortcutHint}</span>}
          </div>
          {this.bookings?.length === 0 && !this.isLoading && (
            <div class="pms-search__empty" role="status" aria-live="polite">
              <wa-icon name="circle-info" aria-hidden="true"></wa-icon>
              <div class="pms-search__empty-content">
                <div class="pms-search__empty-title">No results found</div>
              </div>
            </div>
          )}
          {this.bookings.map(b => {
            const label = `${b.booking_nbr}  ${b.guest.first_name} ${b.guest.last_name}`;
            return (
              <ir-autocomplete-option class="pms-search__autocomplete-option" value={b.booking_nbr} label={label}>
                <img slot="start" class="pms-search__option-icon" src={b.origin.Icon} alt={b.origin.Label} />
                <div class="pms-search__option">
                  <p class="pms-search__option-bookings">
                    <span class="pms-search__option-booking">{b.booking_nbr}</span>
                    {b.channel_booking_nbr && <span class="pms-search__option-channel-booking">{b.channel_booking_nbr}</span>}
                  </p>
                  <span class="pms-search__option-label">
                    {b.guest.first_name} {b.guest.last_name}
                  </span>
                </div>
                <ir-booking-status-tag slot="end" class="pms-search__option-status" status={b.status}></ir-booking-status-tag>
              </ir-autocomplete-option>
            );
          })}
        </ir-autocomplete>
      </Host>
    );
  }
}
