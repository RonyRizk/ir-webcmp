import { Booking } from '@/models/booking.dto';
import { Agent } from '@/services/agents/type';
import { Currency } from '@/models/property';
import locales from '@/stores/locales.store';
import { formatAmount } from '@/utils/utils';
import { Component, Prop, h } from '@stencil/core';
import { isAgentMode } from '../../functions';
import { ClTx } from '@/services/city-ledger/types';
import { ClTxTypeCode } from '@/types/enums';

@Component({
  tag: 'ir-payment-summary',
  styleUrl: 'ir-payment-summary.css',
  scoped: true,
})
export class IrPaymentSummary {
  @Prop() totalCost: number;
  @Prop() balance: number;
  @Prop() collected: number;
  @Prop() currency: Currency;
  @Prop() isBookingCancelled: boolean;
  @Prop() isAllServicesAgentOwned: boolean;
  @Prop() booking: Booking;
  @Prop() agent: Agent;
  @Prop() clTransactions: ClTx[] = [];

  private allowedClOps = new Set([ClTxTypeCode.Adjustment, ClTxTypeCode.StandardChargeDebit, ClTxTypeCode.CancellationPenalty, ClTxTypeCode.Discount]);

  private shouldShowTotalCost(): boolean {
    return this.totalCost > 0 && this.totalCost !== null;
  }

  private get agentTotal() {
    return (
      (this.booking.agent_financial.gross_total ?? 0) +
      this.clTransactions.reduce((prev, curr) => {
        if (this.allowedClOps.has(curr.CL_TX_TYPE_CODE as any) && curr.CATEGORY === null) {
          return prev + curr.DEBIT - curr.CREDIT;
        }
        return prev;
      }, 0)
    );
  }

  private get guestTotal() {
    return (
      (this.booking.guest_financial.gross_total ?? 0) +
      this.booking.financial.payments.reduce((prev, curr) => {
        if (curr.is_city_ledger) {
          return prev;
        }
        return prev + (curr.payment_type.operation === 'CR' ? (curr.payment_type.code === '009' ? curr.amount * -1 : 0) : curr.amount);
      }, 0)
    );
  }

  private get bookingTotal() {
    return this.agentTotal + this.guestTotal;
  }

  render() {
    if (isAgentMode(this.agent)) {
      return (
        <div class="ps-layout">
          <div class="ps-cols">
            {!this.isAllServicesAgentOwned && (
              <div class="ps-col ">
                <div class="ps-stacked">
                  <span class="ps-stacked__label">Guest Balance:</span>
                  <span class="ps-stacked__value ps-stacked__value--danger">{formatAmount(this.currency.symbol, this.booking?.guest_financial?.due_amount)}</span>
                </div>
                <div class="ps-stacked ">
                  <span class="ps-stacked__label">Guest Collected:</span>
                  <span class="ps-stacked__value">{formatAmount(this.currency.symbol, this.booking.guest_financial?.collected)}</span>
                </div>
              </div>
            )}
            <div class="ps-col">
              <div class="ps-stacked --stacked-right">
                <span class="ps-stacked__label ps-stacked__value">Booking Total:</span>
                <span class="ps-stacked__value">{formatAmount(this.currency.symbol, this.bookingTotal ?? 0)}</span>
              </div>
              <div class="ps-stacked --stacked-right">
                <span class="ps-stacked__label">Agent Total:</span>
                <span class="ps-stacked__value">{formatAmount(this.currency.symbol, this.agentTotal)}</span>
              </div>
            </div>
          </div>

          {/* <div class="ps-grand-total">
            <span class="ps-grand-total__label">Grand Total</span>
            <span class="ps-grand-total__value">{formatAmount(this.currency.symbol, this.booking.financial?.gross_total ?? 0)}</span>
          </div> */}
        </div>
      );
    }

    return (
      // <div class="ps-layout">
      //   {this.shouldShowTotalCost() && (
      //     <div class="ps-row">
      //       <span class="ps-row__label">{locales.entries.Lcz_TotalCost}</span>
      //       <span class="ps-row__value">{formatAmount(this.currency.symbol, this.totalCost)}</span>
      //     </div>
      //   )}
      //   <div class="ps-row">
      //     <span class="ps-row__label">{locales.entries.Lcz_Balance}</span>
      //     <span class="ps-row__value ps-row__value--danger">{formatAmount(this.currency.symbol, this.balance)}</span>
      //   </div>
      //   {!this.isBookingCancelled && (
      //     <div class="ps-row">
      //       <span class="ps-row__label">{locales.entries.Lcz_Collected}</span>
      //       <span class="ps-row__value">{formatAmount(this.currency.symbol, this.collected)}</span>
      //     </div>
      //   )}

      //   <div class="ps-grand-total">
      //     <span class="ps-grand-total__label">Grand Total</span>
      //     <span class="ps-grand-total__value">{formatAmount(this.currency.symbol, this.booking.financial?.gross_total ?? 0)}</span>
      //   </div>
      // </div>
      <div class="ps-layout">
        <div class="ps-cols">
          <div class="ps-col ">
            <div class="ps-stacked ">
              <span class="ps-stacked__label">{locales.entries.Lcz_Balance}:</span>
              <span class="ps-stacked__value ps-stacked__value--danger">{formatAmount(this.currency.symbol, this.balance)}</span>
            </div>
            <div class="ps-stacked">
              <span class="ps-stacked__label">{locales.entries.Lcz_Collected}:</span>
              <span class="ps-stacked__value">{formatAmount(this.currency.symbol, this.collected)}</span>
            </div>
          </div>

          <div class="ps-col">
            {this.shouldShowTotalCost() && (
              <div class="ps-stacked --stacked-right">
                <span class="ps-stacked__label ps-stacked__value">{locales.entries.Lcz_TotalCost}</span>
                <span class="ps-stacked__value">{formatAmount(this.currency.symbol, this.totalCost)}</span>
              </div>
            )}
            <div class="ps-stacked --stacked-right">
              <span class="ps-stacked__label ps-stacked__value">Grand Total:</span>
              <span class="ps-stacked__value">{formatAmount(this.currency.symbol, this.booking.financial?.gross_total ?? 0)}</span>
            </div>
          </div>
        </div>

        {/* <div class="ps-grand-total">
        <span class="ps-grand-total__label">Grand Total</span>
        <span class="ps-grand-total__value">{formatAmount(this.currency.symbol, this.booking.financial?.gross_total ?? 0)}</span>
      </div> */}
      </div>
    );
  }
}
