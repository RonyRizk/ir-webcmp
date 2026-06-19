import { Component, Host, Prop, State, h } from '@stencil/core';
import { MealGuestEntry } from '@/services/meal-report/types';
import { flexRender, useTable } from '@/utils/useTable';
import { type TableState, type Updater, createColumnHelper, getCoreRowModel } from '@tanstack/table-core';

@Component({
  tag: 'ir-meal-guest-list',
  styleUrls: ['ir-meal-guest-list.css'],
  scoped: true,
})
export class IrMealGuestList {
  @Prop() guestList: MealGuestEntry[] = [];

  @State() private tableState: Partial<TableState> = {};

  private columnHelper = createColumnHelper<MealGuestEntry>();

  private columns = [
    this.columnHelper.accessor(row => row.unit.name, {
      id: 'unit',
      header: 'Unit',
      enableSorting: false,
      cell: info => <span class="meal-guest-list__unit">{info.getValue()}</span>,
    }),
    this.columnHelper.accessor(row => `${row.guest.first_name} ${row.guest.last_name}`.trim(), {
      id: 'guest',
      header: 'Guest name',
      enableSorting: false,
      cell: info => (
        <div class="meal-guest-list__guest">
          <span>{info.getValue()}</span>
          {info.row.original.is_arriving_today && (
            <wa-badge variant="brand" appearance="filled" pill>
              Arriving today
            </wa-badge>
          )}
        </div>
      ),
    }),
    this.columnHelper.accessor(row => `${row.occupancy.adult_nbr} - ${row.occupancy.children_nbr}`, {
      id: 'occupancy',
      header: () => (
        <span>
          <span class="meal-guest-list__cell--ad">Ad</span>
          <span class="meal-guest-list__cell--ch">Ch</span>
        </span>
      ),
      enableSorting: false,
      cell: info => {
        const [ad, ch] = info.getValue().split(' - ');
        return (
          <span>
            <span class="meal-guest-list__cell--ad">{ad}</span>
            <span class="meal-guest-list__cell--ch">{ch}</span>
          </span>
        );
      },
    }),
    this.columnHelper.accessor(row => row.source?.Label ?? '', {
      id: 'source',
      header: 'Source',
      enableSorting: false,
      cell: info => <span class="meal-guest-list__muted">{info.getValue()}</span>,
    }),
    this.columnHelper.accessor(row => row.rate_plan?.short_name ?? '', {
      id: 'ratePlan',
      header: 'Rate plan',
      enableSorting: false,
      cell: info => <span class="meal-guest-list__muted">{info.getValue()}</span>,
    }),
  ];

  private onTableStateChange = (updater: Updater<TableState>) => {
    const next = typeof updater === 'function' ? updater(this.tableState as TableState) : updater;
    if (JSON.stringify(this.tableState) === JSON.stringify(next)) return;
    this.tableState = next;
  };

  render() {
    const list = this.guestList ?? [];

    if (list.length === 0) {
      return (
        <Host>
          <div class="meal-guest-list__empty">
            <ir-empty-state message="No guests found for the current filters."></ir-empty-state>
          </div>
        </Host>
      );
    }

    const table = useTable<MealGuestEntry>({
      data: list,
      columns: this.columns,
      state: this.tableState,
      onStateChange: this.onTableStateChange,
      getCoreRowModel: getCoreRowModel(),
      // getSortedRowModel: getSortedRowModel(),
    });

    const totalAdults = list.reduce((sum, item) => sum + (item.occupancy?.adult_nbr || 0), 0);
    const totalChildren = list.reduce((sum, item) => sum + (item.occupancy?.children_nbr || 0), 0);

    const isCentered = (id: string) => id === 'occupancy';

    return (
      <Host>
        <div class="table--container">
          <table class="table data-table  mb-0">
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => {
                    const canSort = header.column.getCanSort();

                    return (
                      <th
                        key={header.id}
                        class={{ 'sortable': canSort, 'cell__rate-plan': header.id === 'ratePlan', 'cell--align-center': isCentered(header.column.id) }}
                        onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                      >
                        <div class={{ 'meal-guest-list__th': false, 'meal-guest-list__th--center': isCentered(header.column.id) }}>
                          <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map(row => (
                <tr key={row.id} class="ir-table-row">
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} class={{ 'cell--align-center': isCentered(cell.column.id) }}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr class="meal-guest-list__total-row">
                <td></td>
                <td class="meal-guest-list__total-label">Total</td>
                <td class="meal-guest-list__total-value ">
                  <span>
                    <span class="meal-guest-list__cell--ad --total">{totalAdults}</span>
                    <span class="meal-guest-list__cell--ch --total">{totalChildren}</span>
                  </span>
                </td>
                <td colSpan={2} class="meal-guest-list__total-meta">
                  {/* {list.length} Units · {totalAdults + totalChildren} Guests */}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Host>
    );
  }
}
