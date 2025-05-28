import { Component, Event, EventEmitter, Listen, Prop, State, Watch, h } from '@stencil/core';
import { Task } from '@/models/housekeeping';
import moment from 'moment';
import housekeeping_store from '@/stores/housekeeping.store';
import locales from '@/stores/locales.store';

@Component({
  tag: 'ir-tasks-table',
  styleUrls: ['ir-tasks-table.css', '../../../../common/table.css'],
  scoped: true,
})
export class IrTasksTable {
  @Prop({ mutable: true }) tasks: Task[] = [];

  /**
   * Tracks which task IDs are currently selected via checkboxes.
   */
  @State() selectedIds: Task['id'][] = [];

  /**
   * Controls whether the "Confirm Clean" modal is shown.
   */
  @State() showConfirmModal: boolean = false;

  /**
   * The key we are sorting by (e.g., "date", "unit", "status", "housekeeper").
   */
  @State() sortKey: string = 'date';

  /**
   * The sort direction: ASC or DESC.
   */
  @State() sortDirection: 'ASC' | 'DESC' = 'ASC';
  @State() checkableTasks: Task[] = [];

  @Event({ bubbles: true, composed: true }) animateCleanedButton: EventEmitter<null>;
  @Event({ bubbles: true, composed: true }) rowSelectChange: EventEmitter<Task[]>;
  @Event({ bubbles: true, composed: true }) sortingChanged: EventEmitter<{ field: string; direction: 'ASC' | 'DESC' }>;

  componentWillLoad() {
    this.sortTasks('date', 'ASC');
    if (this.tasks) {
      this.assignCheckableTasks();
    }
  }

  /**
   * Sorts the tasks by the given key. If no direction is provided,
   * it toggles between ascending and descending.
   */
  private handleSort(key: string) {
    let newDirection = this.sortDirection;
    // If we're clicking the same column, flip the direction. If a new column, default to ASC.
    if (this.sortKey === key) {
      newDirection = this.sortDirection === 'ASC' ? 'DESC' : 'ASC';
    } else {
      newDirection = 'ASC';
    }
    this.sortingChanged.emit({ field: key, direction: newDirection });
    this.sortTasks(key, newDirection);
  }

  @Listen('clearSelectedHkTasks', { target: 'body' })
  handleClearSelectedHkTasks(e: CustomEvent) {
    e.stopImmediatePropagation();
    e.stopPropagation();
    this.selectedIds = [];
  }

  @Watch('tasks')
  handleTasksChange(newTasks: Task[]) {
    if (newTasks?.length) {
      this.selectedIds = [];
      this.assignCheckableTasks();
    }
  }
  /**
   * Helper to sort tasks array in state.
   */
  /**
   * Sorts the tasks by the given key in ASC or DESC order.
   * If values for `key` are duplicates, it sorts by `date` ascending.
   * If `date` is also the same, it finally sorts by `unit.name` ascending.
   */
  private sortTasks(key: string, direction: 'ASC' | 'DESC') {
    const sorted = [...this.tasks].sort((a, b) => {
      // Primary comparison: a[key] vs b[key]
      let aPrimary = a[key];
      let bPrimary = b[key];
      if (key === 'status') {
        aPrimary = a[key].description;
        bPrimary = b[key].description;
      }

      if (aPrimary < bPrimary) {
        return direction === 'ASC' ? -1 : 1;
      }
      if (aPrimary > bPrimary) {
        return direction === 'ASC' ? 1 : -1;
      }

      // First tiebreaker: compare by date (always ascending)
      if (a.date < b.date) return -1;
      if (a.date > b.date) return 1;

      // Second tiebreaker: compare by unit.name (always ascending)
      if (a.unit?.name < b.unit?.name) return -1;
      if (a.unit?.name > b.unit?.name) return 1;

      return 0;
    });

    // Update component state
    this.tasks = sorted;
    this.sortKey = key;
    this.sortDirection = direction;
  }

  /**
   * Helper to toggle selection for a single row.
   */
  private toggleSelection(id: Task['id']) {
    if (this.selectedIds.includes(id)) {
      this.selectedIds = this.selectedIds.filter(item => item !== id);
    } else {
      this.selectedIds = [...this.selectedIds, id];
      this.animateCleanedButton.emit(null);
    }
    this.emitSelectedTasks();
  }

  private emitSelectedTasks() {
    if (this.tasks.length === 0) {
      return;
    }
    const filteredTasks = this.tasks.filter(t => this.selectedIds.includes(t.id));
    this.rowSelectChange.emit(filteredTasks);
  }

  /**
   * Checks if every row is selected.
   */
  private get allSelected(): boolean {
    return this.checkableTasks.length > 0 && this.selectedIds.length === this.checkableTasks.length;
  }

  /**
   * Toggles selection on all visible tasks at once.
   */
  private toggleSelectAll() {
    if (this.allSelected) {
      this.selectedIds = [];
    } else {
      this.selectedIds = this.checkableTasks.map(t => t.id);
      this.animateCleanedButton.emit(null);
    }
    this.emitSelectedTasks();
  }

  /**
   * Assigns checkable tasks based on predefined criteria.
   *
   * This method filters tasks and determines which ones are eligible
   * to be selected using checkboxes. A task is considered "checkable"
   * if its date is today or earlier.
   *
   * The filtered tasks are stored in `this.checkableTasks`, ensuring
   * only relevant tasks can be interacted with by users.
   */
  private assignCheckableTasks() {
    const tasks = [];
    this.tasks.forEach(task => {
      if (this.isCheckable(task)) {
        tasks.push(task);
      }
    });
    this.checkableTasks = [...tasks];
  }

  /**
   * Determines if a task is checkable.
   *
   * A task is considered checkable if its date is today or any day before.
   * This prevents users from selecting tasks with future dates.
   *
   * @param {string} date - The task's date in 'YYYY-MM-DD' format.
   * @returns {boolean} - Returns `true` if the task's date is today or earlier, otherwise `false`.
   */
  private isCheckable(task: Task): boolean {
    // if (!task.hkm_id) {
    //   return false;
    // }
    return moment(task.date, 'YYYY-MM-DD').isSameOrBefore(moment(), 'days');
  }

  render() {
    const haveManyHousekeepers = housekeeping_store?.hk_criteria?.housekeepers?.length > 1;
    return (
      <div class="card table-container h-100 p-1 m-0 table-responsive">
        <table class="table" data-testid="hk_tasks_table">
          <thead class="table-header">
            <tr>
              <th class={'task-row'}>
                <ir-checkbox
                  indeterminate={this.selectedIds.length > 0 && this.selectedIds.length < this.checkableTasks.length}
                  checked={this.allSelected}
                  onCheckChange={() => this.toggleSelectAll()}
                ></ir-checkbox>
              </th>
              <th class="extra-padding">{locales.entries.Lcz_Period}</th>
              <th class="extra-padding">{locales.entries.Lcz_Unit}</th>
              <th class={'sortable extra-padding'} onClick={() => this.handleSort('status')}>
                <div class={'d-flex align-items-center'} style={{ gap: '0.5rem' }}>
                  <span>{locales.entries.Lcz_Status}</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="lucide lucide-arrow-up-down"
                  >
                    <path d="m21 16-4 4-4-4" />
                    <path d="M17 20V4" />
                    <path d="m3 8 4-4 4 4" />
                    <path d="M7 4v16" />
                  </svg>
                </div>
              </th>
              <th class="extra-padding">{locales.entries.Lcz_Hint}</th>
              <th class="text-left">{locales.entries.Lcz_A}</th>
              <th class="text-left">{locales.entries.Lcz_C}</th>
              <th class="text-left">{locales.entries.Lcz_I}</th>
              {haveManyHousekeepers && (
                <th style={{ textAlign: 'start' }} class={'sortable extra-padding'} onClick={() => this.handleSort('housekeeper')}>
                  <div class={'d-flex align-items-center'} style={{ gap: '0.5rem' }}>
                    <span>{locales.entries.Lcz_Housekeeper}</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      class="lucide lucide-arrow-up-down"
                    >
                      <path d="m21 16-4 4-4-4" />
                      <path d="M17 20V4" />
                      <path d="m3 8 4-4 4 4" />
                      <path d="M7 4v16" />
                    </svg>
                  </div>
                </th>
              )}
            </tr>
          </thead>

          <tbody>
            {this.tasks.length === 0 && (
              <tr class="ir-table-row">
                <td colSpan={9} class="text-center">
                  <div style={{ height: '300px' }} class="d-flex align-items-center justify-content-center">
                    <span> {locales.entries.Lcz_NoTasksFound}</span>
                  </div>
                </td>
              </tr>
            )}
            {this.tasks.map(task => {
              const isSelected = this.selectedIds.includes(task.id);
              const isCheckable = this.isCheckable(task);
              return (
                <tr
                  data-date={task.date}
                  data-testid={`hk_task_row`}
                  data-assigned={task.housekeeper ? 'true' : 'false'}
                  style={isCheckable && { cursor: 'pointer' }}
                  onClick={() => {
                    if (!isCheckable) {
                      return;
                    }
                    this.toggleSelection(task.id);
                  }}
                  class={{ 'selected': isSelected, 'task-table-row ir-table-row': true }}
                  key={task.id}
                >
                  <td class="task-row ">{isCheckable && <ir-checkbox checked={isSelected}></ir-checkbox>}</td>
                  <td class="task-row extra-padding">{task.formatted_date}</td>
                  <td class="task-row extra-padding">
                    <span class={{ 'highlighted-unit': task.is_highlight }}>{task.unit.name}</span>
                  </td>
                  <td class="task-row extra-padding">{task.status.description}</td>
                  <td class="task-row extra-padding">{task.hint}</td>
                  <td class="task-row text-left">{task.adult}</td>
                  <td class="task-row text-left">{task.child}</td>
                  <td class="task-row text-left">{task.infant}</td>
                  {haveManyHousekeepers && (
                    <td class="w-50 task-row extra-padding" style={{ textAlign: 'start' }}>
                      {task.housekeeper ?? locales.entries.Lcz_Unassigned}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }
}
