import { Component, h, Prop, Fragment } from '@stencil/core';
import { _getDay } from '../../functions';
import { Booking, Room } from '@/models/booking.dto';
import locales from '@/stores/locales.store';
import calendar_data from '@/stores/calendar-data';
import { formatAmount } from '@/utils/utils';
import { ClTx } from '@/services/city-ledger/types';
import { mapClTxToFolioRow } from '@/components/ir-city-ledger/ir-city-ledger-folio/types';
import { SvcCategory } from '@/types/enums';

@Component({
  tag: 'ir-room-breakdown',
  styleUrl: 'ir-room-breakdown.css',
  scoped: true,
})
export class IrRoomBreakdown {
  @Prop() room: Room;
  @Prop() booking: Booking;
  @Prop() currency: string = 'USD';
  @Prop() clTransactions: ClTx[] = [];

  private get acmTxByDate(): Map<string, ClTx> {
    return new Map(this.clTransactions.filter(tx => tx.CATEGORY === SvcCategory.Accommodation && tx.BSA_REF === this.room.identifier).map(tx => [tx.SERVICE_DATE, tx]));
  }

  private getSmokingLabel() {
    if (this.booking.is_direct) {
      if (!this.room.smoking_option) {
        return null;
      }
      const currRT = calendar_data.roomsInfo.find(rt => rt.id === this.room.roomtype.id);
      if (currRT) {
        const smoking_option = currRT['smoking_option']?.allowed_smoking_options;
        if (smoking_option) {
          return smoking_option.find(s => s.code === this.room.smoking_option)?.description;
        }
        return null;
      }
      return null;
    }
    return this.room.ota_meta?.smoking_preferences;
  }

  render() {
    return (
      <div class="booking-room__details-container">
        <div class="booking-room__breakdown-row">
          <div class="booking-room__breakdown-table">
            <table>
              {this.room.days.length > 0 &&
                (() => {
                  const acmTxByDate = this.acmTxByDate;
                  return this.room.days.map(room => {
                    const tx = acmTxByDate.get(room.date);
                    return (
                      <tr>
                        <td class="booking-room__cell booking-room__cell--right booking-room__cell--pad-right">{_getDay(room.date)}</td>
                        <td class="booking-room__cell booking-room__cell--right">{formatAmount(this.currency, room.amount)}</td>
                        {room.cost > 0 && room.cost !== null && (
                          <td class="booking-room__cell booking-room__cell--left booking-room__cell--pad-left night-cost">{formatAmount(this.currency, room.cost)}</td>
                        )}
                        <td class="booking-room__cell booking-room__cell--pad-left">
                          {tx && <ir-cl-status-tag transaction={{ _rowId: '', ...mapClTxToFolioRow(tx), balance: 0 }} size="extra-small"></ir-cl-status-tag>}
                        </td>
                      </tr>
                    );
                  });
                })()}
              <tr class={''}>
                <th class="booking-room__cell booking-room__cell--right booking-room__cell--pad-right subtotal_row">{locales.entries.Lcz_SubTotal}</th>
                <th class="booking-room__cell booking-room__cell--right subtotal_row">{formatAmount(this.currency, this.room.total)}</th>
                {this.room.gross_cost > 0 && this.room.gross_cost !== null && (
                  <th class="booking-room__cell booking-room__cell--right booking-room__cell--pad-left night-cost">{formatAmount(this.currency, this.room.cost)}</th>
                )}
              </tr>
              {this.booking.is_direct ? (
                <Fragment>
                  {(() => {
                    const filtered_data = calendar_data.taxes.filter(tx => tx.pct > 0 && tx.is_exlusive);
                    return filtered_data.map(d => {
                      const amount = d.is_exlusive
                        ? // Tax is added on top
                          this.room.total * d.pct
                        : // Tax is included in total → extract it
                          this.room.total - this.room.total / (1 + d.pct);

                      return (
                        <tr>
                          <td class="booking-room__cell booking-room__cell--right booking-room__cell--pad-right">
                            <span class={'booking-room__cell-tax-name'}>
                              {d.is_exlusive ? locales.entries.Lcz_Excluding : locales.entries.Lcz_Including} {d.name} ({d.pct}%)
                            </span>
                          </td>
                          <td class="booking-room__cell booking-room__cell--right">{formatAmount(this.currency, amount / 100)}</td>
                          {this.room.gross_cost > 0 && this.room.gross_cost !== null && (
                            <td class="booking-room__cell booking-room__cell--right booking-room__cell--pad-left night-cost">
                              {formatAmount(this.currency, (this.room.cost * d.pct) / 100)}
                            </td>
                          )}
                        </tr>
                      );
                    });
                  })()}
                  {this.room.inclusive_taxes?.CALCULATED_INCLUSIVE_TAXES?.map(d => (
                    <tr>
                      <td class="booking-room__cell booking-room__cell--right booking-room__cell--pad-right">
                        <span class={'booking-room__cell-tax-name'}>
                          {locales.entries.Lcz_Including} {d.TAX_NAME} ({d.TAX_PCT * 100}%)
                        </span>
                      </td>
                      <td class="booking-room__cell booking-room__cell--right">{formatAmount(this.currency, d.CALCULATED_VALUE)}</td>
                    </tr>
                  ))}
                </Fragment>
              ) : (
                <Fragment>
                  {(() => {
                    const filtered_data = this.room.ota_taxes.filter(tx => tx.amount > 0);
                    return filtered_data.map(d => {
                      return (
                        <tr>
                          <td class="booking-room__cell booking-room__cell--right booking-room__cell--pad-right">
                            <span class={'booking-room__cell-tax-name'}>
                              {d.is_exlusive ? locales.entries.Lcz_Excluding : locales.entries.Lcz_Including} {d.name}
                            </span>
                          </td>
                          <td class="booking-room__cell booking-room__cell--right">
                            {d.currency.symbol}
                            {d.amount}
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </Fragment>
              )}
            </table>
          </div>
        </div>
        <ir-label labelText={`${locales.entries.Lcz_SmokingOptions}:`} display="inline" content={this.getSmokingLabel()}></ir-label>
        {this.booking.is_direct && (
          <Fragment>
            {this.room.rateplan.cancelation && (
              <ir-label labelText={`${locales.entries.Lcz_Cancellation}:`} display="inline" content={this.room.rateplan.cancelation || ''} renderContentAsHtml></ir-label>
            )}
            {this.room.rateplan.guarantee && (
              <ir-label labelText={`${locales.entries.Lcz_Guarantee}:`} display="inline" content={this.room.rateplan.guarantee || ''} renderContentAsHtml></ir-label>
            )}
          </Fragment>
        )}
        {this.room.ota_meta && (
          <div>
            <ir-label labelText={`${locales.entries.Lcz_MealPlan}:`} display="inline" content={this.room.ota_meta.meal_plan}></ir-label>
            <ir-label labelText={`${locales.entries.Lcz_Policies}:`} display="inline" content={this.room.ota_meta.policies}></ir-label>
          </div>
        )}
      </div>
    );
  }
}
