import { Component, Fragment, h, Listen, Prop, State } from '@stencil/core';
import { TTabsState } from './nav-types';
import { ICurrency, IExposedLanguages } from '@/models/common';
import app_store from '@/stores/app.store';

@Component({
  tag: 'ir-nav',
  styleUrl: 'ir-nav.css',
  shadow: true,
})
export class IrNav {
  @Prop() currencies: ICurrency[];
  @Prop() languages: IExposedLanguages[];
  @Prop() logo: string;
  @Prop() website: string;
  @State() currentPage: TTabsState = null;

  private dialogRef: HTMLIrDialogElement;
  private sheetRef: HTMLIrSheetElement;

  handleButtonClick(e: CustomEvent, page: TTabsState) {
    e.stopImmediatePropagation();
    e.stopPropagation();
    this.currentPage = page;
    setTimeout(() => {
      this.dialogRef.openModal();
    }, 50);
  }
  @Listen('closeDialog')
  handleCloseDialog(e: CustomEvent) {
    e.stopImmediatePropagation();
    e.stopPropagation();
    this.dialogRef.closeModal();
  }
  renderDialogBody() {
    switch (this.currentPage) {
      case 'language':
        return <ir-language-picker slot="modal-body" currencies={this.currencies} languages={this.languages}></ir-language-picker>;
      case 'auth':
        return <ir-auth slot="modal-body"></ir-auth>;
      case 'booking_code':
        return <ir-booking-code slot="modal-body"></ir-booking-code>;
      default:
        return null;
    }
  }
  renderLocationField(fieled: string | null, withComma: boolean = true) {
    if (!fieled) {
      return '';
    }
    return withComma ? `, ${fieled}` : fieled;
  }
  render() {
    return (
      <Fragment>
        <nav class="w-full bg-white">
          <div class="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 lg:px-0">
            <div class="flex items-center space-x-4 ">
              <a aria-label="home" href={`${this.website?.replace('www.', 'https://')}`}>
                <img src={this.logo} alt="logo" class="h-10 w-auto  object-fill"></img>
              </a>
              <div class="hidden md:block">
                <h3 class="text-lg font-medium">{app_store.property?.name}</h3>
                <p class="flex items-center text-sm text-slate-700">
                  {this.renderLocationField(app_store.property?.country.name, false)}
                  {this.renderLocationField(app_store.property?.city.name)}
                  {this.renderLocationField(app_store.property?.area)}
                  {this.renderLocationField(app_store.property?.postal)}
                  {/* <a
                  class="button-link"
                  href={`http://maps.google.com/maps?q=${app_store.property?.location.latitude},${app_store.property?.location.longitude}`}
                  target="_blank"
                >
                  {' '}
                  - See map
                </a> */}
                </p>
              </div>
            </div>

            <div class="md:hidden">
              <ir-button variants="icon" onClick={() => this.sheetRef.openSheet()}>
                <p slot="btn-icon" class="sr-only">
                  burger menu
                </p>
                <ir-icons slot="btn-icon" name="burger_menu"></ir-icons>
              </ir-button>
            </div>

            <ul class="hidden items-center gap-2 md:flex">
              <li>
                <ir-button variants="outline" haveLeftIcon>
                  <p slot="left-icon" class="sr-only">
                    home
                  </p>
                  <ir-icons slot="left-icon" name="home" svgClassName="h-4 w-4"></ir-icons>
                </ir-button>
              </li>
              <li>
                <ir-button variants="outline" label="Booking code" name="booking_code" onButtonClick={e => this.handleButtonClick(e, 'booking_code')}></ir-button>
              </li>
              <li>
                <ir-button variants="outline" label="Cur / Flag" name="language" onButtonClick={e => this.handleButtonClick(e, 'language')}></ir-button>
              </li>
              <li>
                <ir-button variants="outline" label="Sign in" name="auth" onButtonClick={e => this.handleButtonClick(e, 'auth')}></ir-button>
              </li>
            </ul>
          </div>
        </nav>
        <ir-sheet ref={el => (this.sheetRef = el)}>
          <ul slot="sheet-content" class="flex  flex-col gap-2 p-4 py-6 md:hidden">
            <li>
              <ir-button class="w-full" buttonClassName="justify-start" variants="ghost" label="Home" name="home"></ir-button>
            </li>
            <li>
              <ir-button
                class="w-full"
                buttonClassName="justify-start"
                variants="ghost"
                label="Booking code"
                name="booking_code"
                onButtonClick={e => this.handleButtonClick(e, 'booking_code')}
              ></ir-button>
            </li>
            <li>
              <ir-button
                class="w-full"
                buttonClassName="justify-start"
                variants="ghost"
                label="Cur / Flag"
                name="language"
                onButtonClick={e => this.handleButtonClick(e, 'language')}
              ></ir-button>
            </li>
            <li>
              <ir-button
                class="w-full"
                buttonClassName="justify-start"
                variants="ghost"
                label="Sign in"
                name="auth"
                onButtonClick={e => this.handleButtonClick(e, 'auth')}
              ></ir-button>
            </li>
          </ul>
        </ir-sheet>
        <ir-dialog ref={el => (this.dialogRef = el)}>{this.renderDialogBody()}</ir-dialog>
      </Fragment>
    );
  }
}
