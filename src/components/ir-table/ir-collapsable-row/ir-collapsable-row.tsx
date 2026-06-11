import { flexRender } from '@/utils/useTable';
import { Component, Prop, State, h } from '@stencil/core';
import { Cell, Row } from '@tanstack/table-core';

@Component({
  tag: 'ir-collapsable-row',
  styleUrl: 'ir-collapsable-row.css',
  scoped: true,
})
export class IrCollapsableRow {
  @Prop() row: Row<any>;
  @State() isActive: boolean;
  private renderCell = (cell: Cell<any, unknown>) => {
    if (cell.getIsGrouped()) {
      return (
        <wa-button appearance="plain" size="small" class="group-expander" onClick={() => cell.row.toggleExpanded()}>
          <wa-icon style={{ fontSize: '0.875rem' }} slot="start" name={cell.row.getIsExpanded() ? 'chevron-down' : 'chevron-up'}></wa-icon>
          {flexRender(cell.column.columnDef.cell, cell.getContext())} <span slot="end">({cell.row.subRows.length})</span>
        </wa-button>
      );
    }

    if (cell.getIsAggregated()) {
      return flexRender(cell.column.columnDef.aggregatedCell ?? cell.column.columnDef.cell, cell.getContext());
    }

    if (cell.getIsPlaceholder()) {
      return null;
    }

    return flexRender(cell.column.columnDef.cell, cell.getContext());
  };
  render() {
    return [
      <tr>
        {this.row.getVisibleCells().map((cell, index) => (
          <td
            key={cell.id}
            class={{
              'text-right': ['debit', 'credit', 'balance'].includes(cell.column.id),
              'text-center': cell.column.id === 'actions',
              'sticky-column': cell.column.id === 'status',
              'input-column': ['debit', 'credit'].includes(cell.column.id),
              'grouped-cell': cell.getIsGrouped(),
            }}
          >
            <div class={{ 'd-flex align-items-center': true }}>
              {index === 0 && (
                <wa-button onClick={() => (this.isActive = !this.isActive)} size="small" appearance="plain">
                  <wa-icon name={this.isActive ? 'chevron-up' : 'chevron-down'}></wa-icon>
                </wa-button>
              )}
              {this.renderCell(cell)}
            </div>
          </td>
        ))}
      </tr>,
      ...(this.isActive
        ? [
            <tr>
              {this.row.getVisibleCells().map(cell => (
                <td
                  key={cell.id}
                  class={{
                    'text-right': ['debit', 'credit', 'balance'].includes(cell.column.id),
                    'text-center': cell.column.id === 'actions',
                    'sticky-column': cell.column.id === 'status',
                    'input-column': ['debit', 'credit'].includes(cell.column.id),
                    'grouped-cell': cell.getIsGrouped(),
                  }}
                >
                  ACM2 {this.renderCell(cell)}
                </td>
              ))}
            </tr>,
            <tr>
              {this.row.getVisibleCells().map(cell => (
                <td
                  key={cell.id}
                  class={{
                    'text-right': ['debit', 'credit', 'balance'].includes(cell.column.id),
                    'text-center': cell.column.id === 'actions',
                    'sticky-column': cell.column.id === 'status',
                    'input-column': ['debit', 'credit'].includes(cell.column.id),
                    'grouped-cell': cell.getIsGrouped(),
                  }}
                >
                  ACM3 {this.renderCell(cell)}
                </td>
              ))}
            </tr>,
          ]
        : []),
    ];
  }
}
