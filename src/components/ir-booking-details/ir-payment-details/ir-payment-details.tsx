import { Component, h, Prop, State, Event, EventEmitter, Fragment, Watch, Listen } from '@stencil/core';
import { _formatDate } from '../functions';
import { Booking, IDueDate, IPayment } from '@/models/booking.dto';
import { BookingService } from '@/services/booking.service';
import moment from 'moment';
import { PaymentService, IPaymentAction } from '@/services/payment.service';
import { colorVariants } from '@/components/ui/ir-icons/icons';
import { isRequestPending } from '@/stores/ir-interceptor.store';
import { formatAmount } from '@/utils/utils';
import locales from '@/stores/locales.store';
import { IToast } from '@/components/ir-toast/toast';

@Component({
  styleUrl: 'ir-payment-details.css',
  tag: 'ir-payment-details',
  scoped: true,
})
export class IrPaymentDetails {
  @Prop({ mutable: true }) bookingDetails: Booking;
  @Prop() paymentActions: IPaymentAction[];

  @State() newTableRow: boolean = false;

  @State() collapsedPayment: boolean = false;
  @State() collapsedGuarantee: boolean = false;

  @State() flag: boolean = false;

  @State() confirmModal: boolean = false;
  @State() toBeDeletedItem: IPayment;

  @State() paymentDetailsUrl: string = '';
  @State() paymentExceptionMessage: string = '';
  @State() modal_mode: 'delete' | 'save' | null = null;
  @State() itemToBeAdded: IPayment;

  @Event({ bubbles: true }) resetBookingData: EventEmitter<null>;
  @Event({ bubbles: true }) resetExposedCancelationDueAmount: EventEmitter<null>;
  @Event({ bubbles: true }) toast: EventEmitter<IToast>;

  private paymentService = new PaymentService();
  private bookingService = new BookingService();
  private paymentBackground = 'white';
  private hasAgentWithCode001: boolean;

  @Listen('generatePayment')
  handlePaymentGeneration(e: CustomEvent) {
    const value = e.detail;
    this.newTableRow = true;
    this.itemToBeAdded = { ...this.itemToBeAdded, amount: value.amount, date: value.due_on };
    this.paymentBackground = 'rgba(250, 253, 174)';
  }
  async componentWillLoad() {
    try {
      const hasAgent = this.bookingDetails.agent && this.bookingDetails.extras?.find(e => e.key === 'agent_payment_mode');
      this.hasAgentWithCode001 = hasAgent?.value === '001';
      this.initializeItemToBeAdded();
    } catch (error) {
      if (this.bookingDetails.guest.cci) {
        return;
      }
      if (!this.bookingDetails.is_direct && this.bookingDetails.channel_booking_nbr) {
        this.paymentExceptionMessage = error;
      }
    }
  }
  initializeItemToBeAdded() {
    this.itemToBeAdded = {
      id: -1,
      date: moment().format('YYYY-MM-DD'),
      amount: null,
      currency: this.bookingDetails.currency,
      designation: '',
      reference: '',
    };
    this.paymentBackground = 'white';
  }

  async _processPaymentSave() {
    if (this.itemToBeAdded.amount === null) {
      this.toast.emit({
        type: 'error',
        title: locales.entries.Lcz_EnterAmount,
        description: '',
        position: 'top-right',
      });
      return;
    }
    if (Number(this.itemToBeAdded.amount) > Number(this.bookingDetails.financial.due_amount)) {
      this.modal_mode = 'save';
      this.openModal();
      return;
    }
    this._handleSave();
  }

  async _handleSave() {
    this.paymentBackground = 'white';
    try {
      await this.paymentService.AddPayment(this.itemToBeAdded, this.bookingDetails.booking_nbr);
      this.initializeItemToBeAdded();
      this.resetBookingData.emit(null);
      this.resetExposedCancelationDueAmount.emit(null);
    } catch (error) {
      console.log(error);
    }
  }
  handlePaymentInputChange(key: keyof IPayment, value: any, event?: InputEvent) {
    this.paymentBackground = 'white';
    if (key === 'amount') {
      if (!isNaN(value) || value === '') {
        if (value === '') {
          this.itemToBeAdded = { ...this.itemToBeAdded, [key]: null };
        } else {
          this.itemToBeAdded = { ...this.itemToBeAdded, [key]: parseFloat(value) };
        }
      } else if (event && event.target) {
        let inputElement = event.target as HTMLInputElement;
        let inputValue = inputElement.value;
        inputValue = inputValue.replace(/[^\d-]|(?<!^)-/g, '');
        inputElement.value = inputValue;
      }
    } else {
      this.itemToBeAdded = { ...this.itemToBeAdded, [key]: value };
    }
  }
  async cancelPayment() {
    try {
      await this.paymentService.CancelPayment(this.toBeDeletedItem.id);
      const newPaymentArray = this.bookingDetails.financial.payments.filter((item: IPayment) => item.id !== this.toBeDeletedItem.id);
      this.bookingDetails = { ...this.bookingDetails, financial: { ...this.bookingDetails.financial, payments: newPaymentArray } };
      this.confirmModal = !this.confirmModal;
      this.resetBookingData.emit(null);
      this.resetExposedCancelationDueAmount.emit(null);
      this.toBeDeletedItem = null;
      this.modal_mode = null;
    } catch (error) {
      console.log(error);
    }
  }
  async handleConfirmModal(e: CustomEvent) {
    this.paymentBackground = 'white';
    e.stopImmediatePropagation();
    e.stopPropagation();
    if (this.modal_mode === 'delete') {
      await this.cancelPayment();
    } else {
      await this._handleSave();
    }
  }
  openModal() {
    const modal: any = document.querySelector('.delete-record-modal');
    modal.openModal();
  }
  async handleCancelModal(e: CustomEvent) {
    e.stopImmediatePropagation();
    e.stopPropagation();
    try {
      this.paymentBackground = 'white';
      if (this.modal_mode === 'save') {
        this.initializeItemToBeAdded();
      }
    } catch (error) {
      console.log(error);
    }
  }
  @Watch('bookingDetails')
  handleBookingDetails() {
    if (this.newTableRow) {
      this.newTableRow = false;
    }
  }
  handleDateChange(
    e: CustomEvent<{
      start: moment.Moment;
      end: moment.Moment;
    }>,
  ) {
    this.handlePaymentInputChange('date', e.detail.end.format('YYYY-MM-DD'));
  }
  _renderTableRow(item: IPayment, rowMode: 'add' | 'normal' = 'normal') {
    return (
      <Fragment>
        <tr>
          <td class={'border payments-height border-light border-bottom-0 text-center'}>
            {rowMode === 'normal' ? (
              <span class="sm-padding-left">{_formatDate(item.date)}</span>
            ) : (
              <ir-date-picker
                date={this.itemToBeAdded?.date ? new Date(this.itemToBeAdded.date) : new Date()}
                minDate={moment().add(-2, 'months').startOf('month').format('YYYY-MM-DD')}
                singleDatePicker
                autoApply
                onDateChanged={this.handleDateChange.bind(this)}
              ></ir-date-picker>
            )}
          </td>
          <td class={'border payments-height border-light border-bottom-0 text-center '}>
            {rowMode === 'normal' ? (
              <span class="sm-padding-right">{formatAmount(this.bookingDetails.currency.symbol, item.amount)}</span>
            ) : (
              <input
                type="text"
                class="border-0 text-center form-control py-0 m-0 w-100"
                value={this.itemToBeAdded.amount}
                onBlur={e => {
                  (e.target as HTMLInputElement).value = Number(this.itemToBeAdded.amount).toFixed(2);
                }}
                onInput={event => this.handlePaymentInputChange('amount', +(event.target as HTMLInputElement).value, event)}
              ></input>
            )}
          </td>
          <td class={'border payments-height border-light border-bottom-0 text-center'}>
            {rowMode === 'normal' ? (
              <span class="sm-padding-left">{item.designation}</span>
            ) : (
              <input
                class="border-0 w-100 form-control py-0 m-0"
                onInput={event => this.handlePaymentInputChange('designation', (event.target as HTMLInputElement).value)}
                type="text"
              ></input>
            )}
          </td>
          <td rowSpan={2} class={'border payments-height border-light border-bottom-0 text-center'}>
            <div class={'payment-actions'}>
              {rowMode === 'add' && (
                <ir-button
                  variant="icon"
                  icon_name="save"
                  style={colorVariants.secondary}
                  isLoading={rowMode === 'add' && isRequestPending('/Do_Payment')}
                  class={'m-0'}
                  onClickHandler={() => {
                    this._processPaymentSave();
                  }}
                ></ir-button>
              )}
              <ir-button
                variant="icon"
                icon_name="trash"
                style={colorVariants.danger}
                isLoading={this.toBeDeletedItem?.id === item?.id && isRequestPending('/Cancel_Payment')}
                onClickHandler={
                  rowMode === 'add'
                    ? () => {
                        this.newTableRow = false;
                        this.initializeItemToBeAdded();
                      }
                    : () => {
                        this.modal_mode = 'delete';
                        this.toBeDeletedItem = item;
                        this.openModal();
                      }
                }
              ></ir-button>
            </div>
          </td>
        </tr>
        <tr>
          <td colSpan={3} class={'border border-light payments-height border-bottom-0 text-center'}>
            {rowMode === 'normal' ? (
              <span class="sm-padding-left ">{item.reference}</span>
            ) : (
              <input
                class="border-0 w-100  form-control py-0 m-0"
                onKeyPress={event => {
                  if (event.key === 'Enter') {
                    this.newTableRow = false;
                    this._handleSave();
                  }
                }}
                onInput={event => this.handlePaymentInputChange('reference', (event.target as HTMLInputElement).value)}
                type="text"
              ></input>
            )}
          </td>
        </tr>
      </Fragment>
    );
  }

  private bookingGuarantee() {
    if (this.bookingDetails.is_direct && !this.bookingDetails.guest.cci) {
      return null;
    }
    return (
      <div>
        <div class="d-flex align-items-center">
          <span class="mr-1 font-medium">
            {locales.entries.Lcz_BookingGuarantee} {this.hasAgentWithCode001 && `(${locales.entries.Lcz_OnCredit})`}
          </span>
          <ir-button
            id="drawer-icon"
            data-toggle="collapse"
            data-target={`.guarrantee`}
            aria-expanded={this.collapsedGuarantee ? 'true' : 'false'}
            aria-controls="myCollapse"
            class="sm-padding-right pointer"
            variant="icon"
            icon_name="credit_card"
            onClickHandler={async () => {
              if (!this.bookingDetails.is_direct && this.bookingDetails.channel_booking_nbr && !this.bookingDetails.guest.cci) {
                this.paymentDetailsUrl = await this.bookingService.getPCICardInfoURL(this.bookingDetails.booking_nbr);
              }
              this.collapsedGuarantee = !this.collapsedGuarantee;
            }}
          ></ir-button>
        </div>
        <div class="collapse guarrantee ">
          {this.bookingDetails.guest.cci ? (
            [
              <div>
                {this.bookingDetails?.guest?.cci && 'Card:'} <span>{this.bookingDetails?.guest?.cci?.nbr || ''}</span> {this.bookingDetails?.guest?.cci?.expiry_month && 'Expiry: '}
                <span>
                  {' '}
                  {this.bookingDetails?.guest?.cci?.expiry_month || ''} {this.bookingDetails?.guest?.cci?.expiry_year && '/' + this.bookingDetails?.guest?.cci?.expiry_year}
                </span>
              </div>,
              <div>
                {this.bookingDetails?.guest?.cci.holder_name && 'Name:'} <span>{this.bookingDetails?.guest?.cci?.holder_name || ''}</span>{' '}
                {this.bookingDetails?.guest?.cci?.cvc && '- CVC:'} <span> {this.bookingDetails?.guest?.cci?.cvc || ''}</span>
              </div>,
            ]
          ) : this.paymentDetailsUrl ? (
            <iframe src={this.paymentDetailsUrl} width="100%" class="iframeHeight" frameborder="0" name="payment"></iframe>
          ) : (
            <div class="text-center">{this.paymentExceptionMessage}</div>
          )}
        </div>
      </div>
    );
  }

  _renderDueDate(item: IDueDate) {
    return (
      <tr>
        <td class={'pr-1'}>{_formatDate(item.date)}</td>
        <td class={'pr-1'}>{formatAmount(this.bookingDetails.currency.symbol, item.amount)}</td>
        <td class={'pr-1'}>{item.description}</td>
        <td class="collapse font-size-small roomName">{item.room}</td>
      </tr>
    );
  }

  render() {
    if (!this.bookingDetails.financial) {
      return null;
    }

    return [
      <div class="card m-0">
        <div class="p-1">
          {this.bookingDetails.financial.gross_cost > 0 && this.bookingDetails.financial.gross_cost !== null && (
            <div class="mb-2 h4 total-cost-container">
              {locales.entries.Lcz_TotalCost}: <span>{formatAmount(this.bookingDetails.currency.symbol, this.bookingDetails.financial.gross_cost)}</span>
            </div>
          )}
          {/* TODO:IMPLEMENT THIS ON BOOKING ACTIONS */}
          <div class=" h4">
            Balance: <span class="danger font-weight-bold">{formatAmount(this.bookingDetails.currency.symbol, this.bookingDetails.financial.due_amount)}</span>
          </div>
          {/* <div class=" h4">
            {locales.entries.Lcz_DueBalance}:{' '}
            <span class="danger font-weight-bold">{formatAmount(this.bookingDetails.currency.symbol, this.bookingDetails.financial.due_amount)}</span>
          </div> */}
          {/* TODO:IMPLEMENT THIS ON BOOKING ACTIONS */}
          <div class="mb-2 h4">
            Collected:{' '}
            <span class="">
              {formatAmount(
                this.bookingDetails.currency.symbol,
                this.bookingDetails.financial.payments ? this.bookingDetails.financial.payments.reduce((prev, curr) => prev + curr.amount, 0) : 0,
              )}
            </span>
          </div>

          {this.bookingGuarantee()}
          {/* <div class="mt-2">
            <div>
              {this.bookingDetails.financial?.due_dates?.length > 0 && (
                <Fragment>
                  <div class="d-flex align-items-center">
                    <strong class="mr-1">{locales.entries.Lcz_PaymentDueDates}</strong>
                    <ir-button
                      id="drawer-icon"
                      data-toggle="collapse"
                      data-target={`.roomName`}
                      aria-expanded={this.collapsedPayment ? 'true' : 'false'}
                      aria-controls="myCollapse"
                      variant="icon"
                      icon_name={this.collapsedPayment ? 'closed_eye' : 'open_eye'}
                      onClickHandler={() => {
                        this.collapsedPayment = !this.collapsedPayment;
                      }}
                      style={{ '--icon-size': '1.5rem' }}
                    ></ir-button>
                  </div>

                  <table>{this.bookingDetails.financial.due_dates?.map(item => this._renderDueDate(item))}</table>
                </Fragment>
              )}
            </div>
          </div> */}
          {/* TODO:IMPLEMENT THIS ON BOOKING ACTIONS */}
          {this.paymentActions?.filter(pa => pa.amount !== 0).length > 0 && (
            <div class="payment_action_beta_container">
              <p class="beta">Beta</p>
              <ir-payment-actions paymentAction={this.paymentActions} booking={this.bookingDetails}></ir-payment-actions>
            </div>
          )}
          <div class="mt-2 d-flex  flex-column rounded payment-container">
            <div class="d-flex align-items-center justify-content-between">
              <span class={'font-medium'}>{locales.entries.Lcz_Payments} history</span>
              <ir-button
                id="add-payment"
                variant="icon"
                icon_name="square_plus"
                style={{ '--icon-size': '1.5rem' }}
                onClickHandler={() => {
                  this.newTableRow = true;
                }}
              ></ir-button>
            </div>
            <table class="mt-1" style={{ backgroundColor: this.paymentBackground }}>
              <thead>
                <tr>
                  <th class={'border border-light border-bottom-0 text-center payment_date'}>{locales.entries.Lcz_Dates}</th>
                  <th class={'border border-light border-bottom-0 text-center w-60'}>{locales.entries.Lcz_Amount}</th>
                  <th class={'border border-light border-bottom-0 text-center designation'}>{locales.entries.Lcz_Designation}</th>
                  <th class={'border border-light border-bottom-0 text-center action_icons'}>
                    <span class={'sr-only'}>payment actions</span>
                    {/* <ir-button
                      id="add-payment"
                      variant="icon"
                      icon_name="square_plus"
                      onClickHandler={() => {
                        this.newTableRow = true;
                      }}
                    ></ir-button> */}
                  </th>
                </tr>
              </thead>
              <tbody>
                {this.bookingDetails.financial.payments?.map((item: any) => this._renderTableRow(item))}
                {this.newTableRow ? this._renderTableRow(null, 'add') : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>,

      <ir-modal
        item={this.toBeDeletedItem}
        class={'delete-record-modal'}
        modalTitle={locales.entries.Lcz_Confirmation}
        modalBody={this.modal_mode === 'delete' ? locales.entries.Lcz_IfDeletedPermantlyLost : locales.entries.Lcz_EnteringAmountGreaterThanDue}
        iconAvailable={true}
        icon="ft-alert-triangle danger h1"
        leftBtnText={locales.entries.Lcz_Cancel}
        rightBtnText={this.modal_mode === 'delete' ? locales.entries.Lcz_Delete : locales.entries.Lcz_Confirm}
        leftBtnColor="secondary"
        rightBtnColor={this.modal_mode === 'delete' ? 'danger' : 'primary'}
        onConfirmModal={this.handleConfirmModal.bind(this)}
        onCancelModal={this.handleCancelModal.bind(this)}
      ></ir-modal>,
    ];
  }
}
