import { type RowData, type TableOptions, type TableOptionsResolved, type TableState, type Updater, createTable } from '@tanstack/table-core';

export const flexRender = <TProps extends object>(comp: any, props: TProps) => {
  if (typeof comp === 'function') {
    return comp(props);
  }
  return comp;
};

export const useTable = <TData extends RowData>(options: TableOptions<TData>) => {
  // Compose in the generic options to the user options
  const resolvedOptions: TableOptionsResolved<TData> = {
    state: {}, // Dummy state
    onStateChange: () => {}, // noop
    renderFallbackValue: null,
    ...options,
  };

  // Create a new table
  const table = createTable<TData>(resolvedOptions);

  // Manage table state locally and always include feature defaults (e.g. columnPinning).
  let tableState: TableState = {
    ...table.initialState,
    ...(options.state ?? {}),
  };

  const applyOptions = () => {
    table.setOptions(prev => ({
      ...prev,
      ...options,
      state: {
        ...tableState,
        ...(options.state ?? {}),
      },
      onStateChange: (updater: Updater<TableState>) => {
        tableState = typeof updater === 'function' ? updater(tableState) : updater;
        applyOptions();
        options.onStateChange?.(tableState);
      },
    }));
  };

  applyOptions();

  return table;
};
