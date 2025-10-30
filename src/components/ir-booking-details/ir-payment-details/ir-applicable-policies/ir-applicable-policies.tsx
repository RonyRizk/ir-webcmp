import { Booking, Bracket } from '@/models/booking.dto';
import { Component, Event, EventEmitter, Host, Prop, State, Watch, h } from '@stencil/core';
import { CancellationStatement } from '../../types';
import moment, { Moment } from 'moment';
import { formatAmount } from '@/utils/utils';
import calendar_data from '@/stores/calendar-data';
import { IPaymentAction } from '@/services/payment.service';
import locales from '@/stores/locales.store';
import { HelpDocButton } from '@/components/HelpButton';
import { ApplicablePoliciesService } from '@/services/applicable-policies.service';
import { BookingService } from '@/services/booking.service';

@Component({
  tag: 'ir-applicable-policies',
  styleUrl: 'ir-applicable-policies.css',
  scoped: true,
})
export class IrApplicablePolicies {
  @Prop() booking: Booking;
  @Prop() propertyId: number;
  @Prop() language: string = 'en';

  @State() cancellationStatements: CancellationStatement[] = [];
  @State() isLoading: boolean = false;
  @State() guaranteeAmount: number;

  @Event() generatePayment: EventEmitter<IPaymentAction>;

  private shouldShowCancellationBrackets: boolean = true;
  private applicablePoliciesService = new ApplicablePoliciesService(new BookingService());

  componentWillLoad() {
    this.loadApplicablePolicies();
  }

  @Watch('booking')
  handleBookingChange() {
    this.loadApplicablePolicies();
  }
  private async loadApplicablePolicies() {
    this.isLoading = true;
    try {
      this.applicablePoliciesService.booking = this.booking;
      const { cancellationStatements, guaranteeAmount } = await this.applicablePoliciesService.fetchGroupedApplicablePolicies({
        language: this.language,
      });

      this.guaranteeAmount = guaranteeAmount;
      this.cancellationStatements = [...cancellationStatements];
    } catch (error) {
      console.error(error);
    } finally {
      this.isLoading = false;
    }
  }
  private formatPreviousBracketDueOn(d1: Moment, d2: Moment) {
    if (d1.isSame(d2, 'year')) {
      return d1.format('MMM DD');
    }

    return d1.format('MMM DD, YYYY');
  }

  private getBracketLabelsAndArrowState({ bracket, index, brackets, checkInDate }: { index: number; bracket: Bracket; brackets: Bracket[]; checkInDate: string }): {
    leftLabel: string | null;
    showArrow: boolean;
    rightLabel: string | null;
  } {
    // Validate inputs
    if (!bracket || !brackets || index < 0 || index >= brackets.length) {
      return { leftLabel: null, rightLabel: null, showArrow: false };
    }

    // Parse dates with validation
    const bookedOnDate = moment(this.booking.booked_on.date, 'YYYY-MM-DD');
    const bracketDueDate = moment(bracket.due_on, 'YYYY-MM-DD');

    if (!bookedOnDate.isValid() || !bracketDueDate.isValid()) {
      console.warn('Invalid date encountered in getBracketLabelsAndArrowState');
      return { leftLabel: null, rightLabel: null, showArrow: false };
    }

    // Single bracket case
    if (brackets.length === 1) {
      return this.handleSingleBracket(bracketDueDate, checkInDate);
    }

    // Multiple brackets case
    const _brackets = this.handleMultipleBrackets(bracket, index, brackets, checkInDate);

    return _brackets;
  }

  private handleSingleBracket(
    bracketDueDate: moment.Moment,
    checkInDate: string,
  ): {
    leftLabel: string | null;
    showArrow: boolean;
    rightLabel: string | null;
  } {
    const momentCheckInDate = moment(checkInDate, 'YYYY-MM-DD');
    if (bracketDueDate.isSame(momentCheckInDate, 'days')) {
      return {
        leftLabel: `${momentCheckInDate.format('MMM DD')} onwards`,
        showArrow: false,
        rightLabel: '',
      };
    }
    return {
      leftLabel: bracketDueDate.format('MMM DD'),
      showArrow: true,
      rightLabel: moment(checkInDate, 'YYYY-MM-DD').format('MMM DD, YYYY'),
    };
  }

  private handleMultipleBrackets(
    bracket: Bracket,
    index: number,
    brackets: Bracket[],
    checkInDate: string,
  ): {
    leftLabel: string | null;
    showArrow: boolean;
    rightLabel: string | null;
  } {
    const bracketDueDate = moment(bracket.due_on, 'YYYY-MM-DD');
    const momentCheckInDate = moment(checkInDate, 'YYYY-MM-DD');

    // First bracket
    if (index === 0) {
      const nextBracket = brackets[index + 1];
      if (!nextBracket) {
        return { leftLabel: null, rightLabel: null, showArrow: false };
      }

      let nextBracketDueDate = moment(nextBracket.due_on, 'YYYY-MM-DD');
      if (!nextBracketDueDate.isValid()) {
        return { leftLabel: null, rightLabel: null, showArrow: false };
      }
      if (bracket.amount === 0) {
        nextBracketDueDate = nextBracketDueDate.clone().add(-1, 'days');
      }

      return {
        leftLabel: 'Until',
        showArrow: false,
        rightLabel: nextBracketDueDate.isSame(momentCheckInDate, 'dates')
          ? nextBracketDueDate.clone().add(-1, 'days').format('MMM DD, YYYY')
          : nextBracketDueDate.format('MMM DD, YYYY'),
      };
    }

    if (moment(bracket.due_on, 'YYYY-MM-DD').isSameOrAfter(momentCheckInDate, 'days')) {
      return {
        leftLabel: `${momentCheckInDate.format('MMM DD')} onwards`,
        showArrow: false,
        rightLabel: '',
      };
    }

    // Last bracket
    if (index === brackets.length - 1) {
      return {
        leftLabel: bracketDueDate.clone().format('MMM DD'),
        showArrow: true,
        rightLabel: moment(checkInDate).format('MMM DD, YYYY'),
      };
    }

    // Middle brackets
    const nextBracket = brackets[index + 1];
    if (!nextBracket) {
      return { leftLabel: null, rightLabel: null, showArrow: false };
    }

    const nextBracketDueDate = moment(nextBracket.due_on, 'YYYY-MM-DD');
    if (!nextBracketDueDate.isValid()) {
      return { leftLabel: null, rightLabel: null, showArrow: false };
    }

    // Calculate the end of current bracket period (day before next bracket starts)
    const periodEndDate = nextBracketDueDate.isAfter(momentCheckInDate, 'days') ? momentCheckInDate : nextBracketDueDate.clone();
    const haveSameDays = bracketDueDate.isSame(periodEndDate.clone().add(-1, 'days'), 'days');
    return {
      leftLabel: this.formatPreviousBracketDueOn(bracketDueDate, periodEndDate),
      showArrow: !haveSameDays,
      rightLabel: haveSameDays ? '' : periodEndDate.add(-1, 'days').format('MMM DD, YYYY'),
    };
  }
  private generateCancellationStatement() {
    const label = 'if cancelled today';
    const { cancelation_penality_as_if_today } = this.booking.financial;
    if (cancelation_penality_as_if_today === 0) {
      if (this.booking.financial.collected > 0) {
        return `No refund ${label}`;
      }
      return `No payment required ${label}`;
    }
    return `${cancelation_penality_as_if_today < 0 ? 'Refund' : 'Charge'} ${formatAmount(calendar_data.currency.symbol, Math.abs(cancelation_penality_as_if_today))} ${label}`;
  }

  private _getCurrentBracket(brackets: Bracket[]): moment.Moment | null {
    if (!Array.isArray(brackets) || brackets.length === 0) return null;

    const today = moment().startOf('day');

    // Parse + validate + sort ascending by due_on
    const parsed = brackets
      .map(b => ({ b, date: moment(b.due_on, 'YYYY-MM-DD', true).startOf('day') }))
      .filter(x => x.date.isValid())
      .sort((a, b) => a.date.valueOf() - b.date.valueOf());

    if (parsed.length === 0) return null;

    // If today is before the first due date → return first bracket (closest upcoming)
    if (today.isBefore(parsed[0].date, 'day')) {
      return parsed[0].date;
    }

    // Find i such that date[i] <= today < date[i+1] → return date[i]
    for (let i = 0; i < parsed.length - 1; i++) {
      const cur = parsed[i].date;
      const next = parsed[i + 1].date;
      if (today.isSameOrAfter(cur, 'day') && today.isBefore(next, 'day')) {
        return cur;
      }
    }

    // If today is on/after the last due date → return last bracket
    return parsed[parsed.length - 1].date;
  }

  render() {
    if (this.isLoading) {
      return null;
    }
    const remainingGuaranteeAmount = this.booking.financial.collected - this.guaranteeAmount;
    return (
      <Host>
        {this.guaranteeAmount !== 0 && (
          <section>
            <div class="applicable-policies__guarantee">
              <div class="applicable-policies__guarantee-info">
                <p class="applicable-policies__guarantee-date">{moment(this.booking.booked_on.date, 'YYYY-MM-DD').format('MMM DD, YYYY')}</p>
                <p class="applicable-policies__guarantee-amount">
                  <span class="px-1">{formatAmount(calendar_data.currency.symbol, remainingGuaranteeAmount < 0 ? Math.abs(remainingGuaranteeAmount) : this.guaranteeAmount)}</span>
                </p>
                <p class="applicable-policies__guarantee-label">Guarantee {remainingGuaranteeAmount < 0 ? 'balance' : ''}</p>
              </div>
              {remainingGuaranteeAmount < 0 && (
                <div class="applicable-policies__guarantee-action">
                  <ir-button
                    btn_color="dark"
                    text="Pay"
                    size="sm"
                    onClickHandler={() => {
                      this.generatePayment.emit({
                        amount: Math.abs(remainingGuaranteeAmount),

                        currency: calendar_data.currency,
                        due_on: moment().format('YYYY-MM-DD'),
                        pay_type_code: null,
                        reason: '',
                        type: 'OVERDUE',
                      });
                    }}
                  ></ir-button>
                </div>
              )}
            </div>
          </section>
        )}
        <section>
          <div class="applicable-policies__container">
            <div class="d-flex align-items-center" style={{ gap: '0.5rem' }}>
              <p class="applicable-policies__title font-size-large p-0 m-0">Cancellation Schedule</p>
              <HelpDocButton message="Help" href="https://help.igloorooms.com/extranet/booking-details/guarantee-and-cancellation" />
            </div>
            <p class="applicable-policies__no-penalty">{this.generateCancellationStatement()}</p>
          </div>

          {this.cancellationStatements?.length > 0 && this.cancellationStatements.every(e => e.brackets.length > 0) && this.shouldShowCancellationBrackets && (
            <div class="applicable-policies__statements">
              {this.cancellationStatements?.map(statement => {
                const currentBracket = this._getCurrentBracket(statement.brackets);
                // const isTodaySameOrAfterCheckInDate = moment().isSameOrAfter(moment(statement.checkInDate, 'YYYY-MM-DD').add(1, 'days'));
                return (
                  <div class="applicable-policies__statement">
                    {this.cancellationStatements.length > 1 && (
                      <p class="applicable-policies__room">
                        <b>{statement.roomType.name}</b> {statement.ratePlan['short_name']} {statement.ratePlan.is_non_refundable ? ` - ${locales.entries.Lcz_NonRefundable}` : ''}
                      </p>
                    )}
                    <div class="applicable-policies__brackets">
                      {statement.brackets.map((bracket, idx) => {
                        const { leftLabel, rightLabel, showArrow } = this.getBracketLabelsAndArrowState({
                          index: idx,
                          bracket,
                          brackets: statement.brackets,
                          checkInDate: statement.checkInDate,
                        });
                        const isInCurrentBracket = moment(bracket.due_on, 'YYYY-MM-DD').isSame(currentBracket, 'date');

                        return (
                          <div class={{ 'applicable-policies__bracket': true, 'applicable-policies__highlighted-bracket': isInCurrentBracket }}>
                            <p class="applicable-policies__bracket-dates">
                              {leftLabel} {showArrow && <ir-icons name="arrow_right" class="applicable-policies__icon" style={{ '--icon-size': '0.875rem' }}></ir-icons>}{' '}
                              {rightLabel}
                            </p>
                            <p class="applicable-policies__amount">{formatAmount(calendar_data.currency.symbol, bracket.gross_amount)}</p>

                            <p class="applicable-policies__statement-text">{bracket.amount === 0 ? 'No penalty' : bracket.statement}</p>
                          </div>
                        );
                      })}
                    </div>
                    <div class="applicable-policies__brackets-table">
                      <table>
                        <tbody>
                          {statement.brackets.map((bracket, idx) => {
                            const { leftLabel, rightLabel, showArrow } = this.getBracketLabelsAndArrowState({
                              index: idx,
                              bracket,
                              brackets: statement.brackets,
                              checkInDate: statement.checkInDate,
                            });

                            const isInCurrentBracket = moment(bracket.due_on, 'YYYY-MM-DD').isSame(currentBracket, 'date');

                            return (
                              <tr class={{ 'applicable-policies__highlighted-bracket': isInCurrentBracket }}>
                                <td class="applicable-policies__bracket-dates">
                                  {leftLabel} {showArrow && <ir-icons name="arrow_right" class="applicable-policies__icon" style={{ '--icon-size': '0.875rem' }}></ir-icons>}{' '}
                                  {rightLabel}
                                </td>

                                <td class="applicable-policies__amount px-1">{formatAmount(calendar_data.currency.symbol, bracket.gross_amount)}</td>

                                <td class="applicable-policies__statement-text">{bracket.amount === 0 ? 'No penalty' : bracket.statement}</td>
                              </tr>
                            );
                          })}
                          {/*isTodaySameOrAfterCheckInDate && (
                            <tr class={{ 'applicable-policies__highlighted-bracket': true }}>
                              <td class="applicable-policies__bracket-dates">{moment(statement.checkInDate, 'YYYY-MM-DD').add(1, 'days').format('MMM DD')} onwards</td>

                              <td class="applicable-policies__amount px-1">{formatAmount(calendar_data.currency.symbol, statement.grossTotal)}</td>

                              <td class="applicable-policies__statement-text">100% of the total price</td>
                            </tr>
                          )*/}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </Host>
    );
  }
}
