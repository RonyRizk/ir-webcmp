import { Component, Host, Prop, h } from '@stencil/core';
import moment from 'moment';
import { MealCountDaySummary } from '@/services/meal-report/types';
import { flexRender, useTable } from '@/utils/useTable';
import { createColumnHelper, getCoreRowModel } from '@tanstack/table-core';

@Component({
  tag: 'ir-meal-count-summary',
  styleUrls: ['ir-meal-count-summary.css'],
  scoped: true,
})
export class IrMealCountSummary {
  @Prop() mealCountSummary: MealCountDaySummary[] = [];

  private columnHelper = createColumnHelper<MealCountDaySummary>();

  private mealMeta: Record<string, { label: string; icon: string; color: string }> = {
    breakfast: { label: 'Breakfast', icon: 'mug-saucer', color: 'var(--wa-color-brand-fill-loud)' },
    lunch: { label: 'Lunch', icon: 'utensils', color: 'var(--wa-color-success-fill-loud)' },
    dinner: { label: 'Dinner', icon: 'moon', color: 'var(--wa-color-warning-fill-loud)' },
  };

  private renderMealHeader = (key: string) => {
    const m = this.mealMeta[key];
    return (
      <span class="meal-count__group-title">
        <wa-icon name={m.icon} class="meal-count__group-icon" style={{ color: m.color }}></wa-icon>
        <span>{m.label}</span>
      </span>
    );
  };

  private columns = [
    this.columnHelper.accessor('Date', {
      header: 'Date',
      cell: info => <span class="meal-count__date">{moment(info.getValue()).format('ddd, MMM DD')}</span>,
    }),
    this.columnHelper.group({
      id: 'breakfast',
      header: () => this.renderMealHeader('breakfast'),

      columns: [this.columnHelper.accessor('Breakfast_Ad', { header: 'Ad' }), this.columnHelper.accessor('Breakfast_Ch', { header: 'Ch' })],
    }),
    this.columnHelper.group({
      id: 'lunch',
      header: () => this.renderMealHeader('lunch'),
      columns: [this.columnHelper.accessor('Lunch_Ad', { header: 'Ad' }), this.columnHelper.accessor('Lunch_Ch', { header: 'Ch' })],
    }),
    this.columnHelper.group({
      id: 'dinner',
      header: () => this.renderMealHeader('dinner'),
      columns: [this.columnHelper.accessor('Dinner_Ad', { header: 'Ad' }), this.columnHelper.accessor('Dinner_Ch', { header: 'Ch' })],
    }),
  ];

  private isAdultCol = (id: string) => id.endsWith('_Ad');
  private isChildCol = (id: string) => id.endsWith('_Ch');

  render() {
    const list = this.mealCountSummary ?? [];

    if (list.length === 0) {
      return (
        <Host>
          <div class="meal-count__empty">
            <ir-empty-state message="No summary data available for the current filters."></ir-empty-state>
          </div>
        </Host>
      );
    }

    const table = useTable<MealCountDaySummary>({
      data: list,
      columns: this.columns,
      getCoreRowModel: getCoreRowModel(),
    });

    const headerGroups = table.getHeaderGroups();
    const depth = headerGroups.length;

    const totals = {
      Breakfast_Ad: list.reduce((s, d) => s + (d.Breakfast_Ad || 0), 0),
      Breakfast_Ch: list.reduce((s, d) => s + (d.Breakfast_Ch || 0), 0),
      Lunch_Ad: list.reduce((s, d) => s + (d.Lunch_Ad || 0), 0),
      Lunch_Ch: list.reduce((s, d) => s + (d.Lunch_Ch || 0), 0),
      Dinner_Ad: list.reduce((s, d) => s + (d.Dinner_Ad || 0), 0),
      Dinner_Ch: list.reduce((s, d) => s + (d.Dinner_Ch || 0), 0),
    };

    const dataCellClass = (id: string) => ({
      'meal-count__cell': true,
      'meal-count__cell--ad': this.isAdultCol(id),
      'meal-count__cell--ch': this.isChildCol(id),
      'meal-count__cell--primary': this.isAdultCol(id),
      'meal-count__cell--muted': this.isChildCol(id),
    });

    return (
      <Host>
        <div class="table--container">
          <table class="table data-table meal-count__table mb-0">
            <colgroup>
              <col class="meal-count__col--date" />
              <col class="meal-count__col--num" span={5} />
              <col class="meal-count__col--flex" />
            </colgroup>
            <thead>
              {headerGroups.map((headerGroup, groupIndex) => (
                <tr key={headerGroup.id}>
                  {groupIndex === 0 && <th></th>}
                  {headerGroup.headers.map(header => {
                    if (header.isPlaceholder) return null;
                    const isLeaf = header.subHeaders.length === 0;
                    const rowSpan = isLeaf ? depth - groupIndex : 1;
                    const isGroupHeader = !isLeaf;
                    const id = header.column.id;
                    return (
                      <th
                        key={header.id}
                        colSpan={header.colSpan}
                        rowSpan={rowSpan}
                        class={{
                          'cell--align-start': id === 'Date',
                          'meal-count__group-header': isGroupHeader,
                          'meal-count__sub-header': isLeaf && id !== 'Date',
                          'meal-count__subhead--ad': this.isAdultCol(id),
                          'meal-count__subhead--ch': this.isChildCol(id),
                        }}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
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
                    <td key={cell.id} class={cell.column.id === 'Date' ? { 'cell--align-start': true, 'meal-count__cell': true } : dataCellClass(cell.column.id)}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr class="meal-count__total-row">
                <td class="cell--align-start meal-count__total-label">Total</td>
                <td class="meal-count__cell--ad meal-count__total-value">{totals.Breakfast_Ad}</td>
                <td class="meal-count__cell--ch meal-count__total-muted">{totals.Breakfast_Ch}</td>
                <td class="meal-count__cell--ad meal-count__total-value">{totals.Lunch_Ad}</td>
                <td class="meal-count__cell--ch meal-count__total-muted">{totals.Lunch_Ch}</td>
                <td class="meal-count__cell--ad meal-count__total-value">{totals.Dinner_Ad}</td>
                <td class="meal-count__cell--ch meal-count__total-muted">{totals.Dinner_Ch}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Host>
    );
  }
}
