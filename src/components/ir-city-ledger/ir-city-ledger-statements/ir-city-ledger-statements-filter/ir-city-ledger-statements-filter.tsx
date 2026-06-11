import { Component, Event, EventEmitter, Prop, State, h } from '@stencil/core';
import moment from 'moment';
import { z } from 'zod';

export interface StatementFilters {
  fromDate: string | null;
  toDate: string | null;
}

@Component({
  tag: 'ir-city-ledger-statements-filter',
  styleUrl: 'ir-city-ledger-statements-filter.css',
  scoped: true,
})
export class IrCityLedgerStatementsFilter {
  @Prop() initialFromDate: string | null = null;
  @Prop() initialToDate: string | null = null;

  @State() fromDate: string | null = null;
  @State() toDate: string | null = null;

  @Event() filtersChange: EventEmitter<StatementFilters>;

  componentWillLoad() {
    this.fromDate = this.initialFromDate;
    this.toDate = this.initialToDate;
  }
  @Event() createStatement: EventEmitter<StatementFilters>;
  @Event() printStatement: EventEmitter<StatementFilters>;

  render() {
    const canCreate = !!(this.fromDate && this.toDate);

    return (
      <form
        onSubmit={e => {
          e.preventDefault();
          if (canCreate) this.createStatement.emit({ fromDate: this.fromDate, toDate: this.toDate });
        }}
      >
        <div class="stmt-filters">
          <ir-validator
            schema={z.object({
              fromDate: z.string().nonempty(),
              toDate: z.string().nonempty(),
            })}
            value={{
              fromDate: this.fromDate,
              toDate: this.toDate,
            }}
            class="stmt-filters__left"
          >
            <ir-date-range-filter
              class="stmt-filters__date-picker"
              maxDate={moment().format('YYYY-MM-DD')}
              fromDate={this.fromDate}
              toDate={this.toDate}
              onDatesChanged={e => {
                this.fromDate = e.detail.from ?? null;
                this.toDate = e.detail.to ?? null;
                this.filtersChange.emit({ fromDate: this.fromDate, toDate: this.toDate });
              }}
            ></ir-date-range-filter>
          </ir-validator>

          <div class="stmt-filters__right">
            <ir-custom-button variant="brand" type="submit">
              Create Statement
            </ir-custom-button>
            <ir-custom-button
              variant="brand"
              appearance="outlined"
              disabled={!canCreate}
              onClickHandler={() => {
                if (canCreate) {
                  this.printStatement.emit({ fromDate: this.fromDate, toDate: this.toDate });
                }
              }}
            >
              Print
            </ir-custom-button>
          </div>
        </div>
      </form>
    );
  }
}
