import { IrComboboxSelectEventDetail } from '@/components';
import { Booking } from '@/models/booking.dto';
import ApiClient from '@/models/ApiClient';
import { BookingListingService } from '@/services/booking-listing';
import { Component, Event, EventEmitter, Host, Prop, State, Watch, h } from '@stencil/core';
import { Subject, Subscription } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, filter, from, of, switchMap, tap } from 'rxjs';
import { formatBookingNumber } from '@/utils/number';
import { toLatinDigits } from '@/utils/date';
import { t } from '@/services/locale/t';
import { LocaleController } from '@/services/locale/locale.controller';
import { SCREEN_TABLES } from '@/services/locale/screen-tables';
import { LanguageSync } from '@/services/locale/language-sync';

@Component({
  tag: 'ir-pms-search',
  styleUrl: 'ir-pms-search.css',
  shadow: true,
})
export class IrPmsSearch {
  @Prop() propertyid: string;
  @Prop() ticket: string;
  @Prop() language: string = 'en';

  @State() shortcutHint: string | null = null;
  @State() bookings: Booking[] = [];
  @State() isLoading: boolean;

  private apiClientService = new ApiClient();
  private bookingListingService = new BookingListingService();
  private search$ = new Subject<string>();
  private subscription: Subscription;
  /** Results were fetched in the old language; drop them so the next search refetches in the new one. */
  private languageSync = new LanguageSync(SCREEN_TABLES.pmsSearch, () => {
    this.bookings = [];
    this.autoCompleteRef?.hide();
  });

  @Event({ bubbles: true, composed: true, eventName: 'combobox-select' }) comboboxSelect: EventEmitter<IrComboboxSelectEventDetail>;
  autoCompleteRef: HTMLIrAutocompleteElement;

  componentWillLoad() {
    document.addEventListener('keydown', this.focusInput);
    this.detectShortcutHint();
    if (this.ticket) {
      this.apiClientService.setApiClient(this.ticket);
    }
    LocaleController.load({ language: this.language, tables: SCREEN_TABLES.pmsSearch });

    this.subscription = this.search$
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        filter(value => value.length >= 2),
        tap(() => {
          this.isLoading = true;
          this.autoCompleteRef?.hide();
        }),
        switchMap(value => {
          const isNumber = /^(?:-?\d+|.{3}-.*)$/.test(value);
          return from(
            this.bookingListingService.getExposedBookings(
              {
                book_nbr: isNumber ? value : null,
                name: isNumber ? null : value,
                property_id: Number(this.propertyid),
                filter_type: 1,
                from: null,
                to: null,
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
                language: LocaleController.language,
              },
              { skipStore: true },
            ),
          ).pipe(catchError(() => of([] as Booking[])));
        }),
      )
      .subscribe(bookings => {
        this.bookings = bookings.filter(Boolean);
        this.isLoading = false;
        this.autoCompleteRef?.show();
      });
  }

  componentDidLoad() {
    this.languageSync.connect();
  }

  disconnectedCallback() {
    document.removeEventListener('keydown', this.focusInput);
    this.subscription?.unsubscribe();
    this.languageSync.disconnect();
  }

  @Watch('language')
  languageChanged(next: string, previous: string) {
    this.languageSync.propChanged(next, previous);
  }

  @Watch('ticket')
  handleTicketChange(newValue: string, oldValue: string) {
    console.log(this.ticket);
    if (newValue !== oldValue && newValue) {
      this.apiClientService.setApiClient(this.ticket);
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
  private fetchBookings(event: CustomEvent<string>) {
    event.stopImmediatePropagation();
    event.stopPropagation();
    // Booking numbers typed in Arabic-Indic digits must reach the API (and the isNumber check) as Latin.
    const value = toLatinDigits(event.detail ?? '');
    if (!value) {
      this.bookings = [];
      this.autoCompleteRef?.hide();
      return;
    }
    this.search$.next(value);
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
          placeholder={t('Lcz_BookingOrGuestNamePlaceholder', { fallback: 'Booking# or guest name' })}
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
          {(this.bookings ?? [])?.length === 0 && !this.isLoading && (
            <div class="pms-search__empty" role="status" aria-live="polite">
              <wa-icon name="circle-info" aria-hidden="true"></wa-icon>
              <div class="pms-search__empty-content">
                <div class="pms-search__empty-title">{t('Lcz_NoResultsFound', { fallback: 'No results found' })}</div>
              </div>
            </div>
          )}
          {(this.bookings ?? [])?.map(b => {
            if (!b) {
              return null;
            }
            const label = `${b?.booking_nbr}  ${b?.guest?.first_name} ${b?.guest?.last_name}`;
            return (
              <ir-autocomplete-option class="pms-search__autocomplete-option" value={b.booking_nbr} label={label}>
                <img slot="start" class="pms-search__option-icon" src={b.origin.Icon} alt={b.origin.Label} />
                <div class="pms-search__option">
                  <p class="pms-search__option-bookings">
                    <span class="pms-search__option-booking">{formatBookingNumber(b.booking_nbr)}</span>
                    {b.channel_booking_nbr && <span class="pms-search__option-channel-booking">{formatBookingNumber(b.channel_booking_nbr)}</span>}
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
