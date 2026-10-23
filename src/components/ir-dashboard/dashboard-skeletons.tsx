import { FunctionalComponent, h } from '@stencil/core';

/*
 * Placeholders for the dashboard parts that load after first paint. They render inside
 * ir-dashboard's scope, so their styles live in `ir-dashboard.css`.
 */

/** Stand-in for a summary card's count. */
export const CountSkeleton: FunctionalComponent = () => <wa-skeleton effect="pulse" class="dashboard-skeleton dashboard-skeleton--count" aria-hidden="true"></wa-skeleton>;

/** How a column's cells are drawn: one or two text lines, a balance pill, or an action button. */
export type CellShape = 'text' | 'stacked' | 'pill' | 'action';

/** Mirrors the booking tables' shared columns: Booking#, Booked by / Guest, Unit, Dates, Balance. */
const COLUMN_SHAPES: CellShape[] = ['stacked', 'stacked', 'text', 'stacked', 'pill'];

/** Bar widths (%) cycled across cells so the rows read as text, not as a grid of identical blocks. */
const WIDTHS = [72, 54, 88, 63, 80, 47, 69, 92, 58];

const width = (row: number, column: number, line = 0) => `${WIDTHS[(row * 3 + column * 2 + line) % WIDTHS.length]}%`;

const Cell: FunctionalComponent<{ shape: CellShape; row: number; column: number }> = ({ shape, row, column }) => {
  switch (shape) {
    case 'stacked':
      return (
        <div class="dashboard-table-skeleton__cell">
          <wa-skeleton effect="pulse" class="dashboard-skeleton" style={{ inlineSize: width(row, column) }}></wa-skeleton>
          <wa-skeleton effect="pulse" class="dashboard-skeleton dashboard-skeleton--meta" style={{ inlineSize: width(row, column, 1) }}></wa-skeleton>
        </div>
      );
    case 'pill':
      return (
        <div class="dashboard-table-skeleton__cell dashboard-table-skeleton__cell--center">
          <wa-skeleton effect="pulse" class="dashboard-skeleton dashboard-skeleton--pill"></wa-skeleton>
        </div>
      );
    case 'action':
      return (
        <div class="dashboard-table-skeleton__cell dashboard-table-skeleton__cell--end">
          <wa-skeleton effect="pulse" class="dashboard-skeleton dashboard-skeleton--action"></wa-skeleton>
        </div>
      );
    default:
      return (
        <div class="dashboard-table-skeleton__cell">
          <wa-skeleton effect="pulse" class="dashboard-skeleton" style={{ inlineSize: width(row, column) }}></wa-skeleton>
        </div>
      );
  }
};

/**
 * Stand-in for a panel's booking table, laid out like the real one: a header row of short labels over
 * rows whose cells match the real columns' shapes. Renders more rows than fit; they fade out towards the bottom instead of ending on a hard edge.
 */
export const TableSkeleton: FunctionalComponent<{ rows?: number; extraColumn?: CellShape; withoutBalance?: boolean }> = ({ rows = 16, extraColumn, withoutBalance }) => {
  const baseShapes = withoutBalance ? COLUMN_SHAPES.slice(0, -1) : COLUMN_SHAPES;
  const shapes = extraColumn ? [...baseShapes, extraColumn] : baseShapes;
  return (
    <div class="dashboard-table-skeleton" aria-busy="true" aria-hidden="true" data-extra-column={extraColumn} data-without-balance={withoutBalance ? '' : undefined}>
      <div class="dashboard-table-skeleton__head">
        {shapes.map(shape => (
          <div class={{ 'dashboard-table-skeleton__cell': true, 'dashboard-table-skeleton__cell--center': shape === 'pill' }}>
            {shape !== 'action' && <wa-skeleton effect="pulse" class="dashboard-skeleton dashboard-skeleton--label"></wa-skeleton>}
          </div>
        ))}
      </div>
      <div class="dashboard-table-skeleton__body">
        {Array.from({ length: rows }, (_, row) => (
          <div class="dashboard-table-skeleton__row">
            {shapes.map((shape, column) => (
              <Cell shape={shape} row={row} column={column} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
