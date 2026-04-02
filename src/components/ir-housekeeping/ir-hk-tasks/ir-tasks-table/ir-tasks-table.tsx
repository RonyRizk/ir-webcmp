import { Component, Element, Event, EventEmitter, Host, Listen, Prop, State, Watch, h } from '@stencil/core';
import { Task } from '@/models/housekeeping';
import moment from 'moment';
import housekeeping_store from '@/stores/housekeeping.store';
import locales from '@/stores/locales.store';
import { HouseKeepingService } from '@/services/housekeeping.service';
import { IToast } from '@components/ui/ir-toast/toast';
import { isRequestPending } from '@/stores/ir-interceptor.store';
import {
  hkTasksStore,
  toggleTaskSelection,
  selectAllTasks,
  clearSelectedTasks,
  getCheckableTasks,
  isAllTasksSelected,
  updateSorting,
  getPaginatedTasks,
  getMobileTasks,
  updateTasks,
} from '@/stores/hk-tasks.store';
import calendar_data from '@/stores/calendar-data';

@Component({
  tag: 'ir-tasks-table',
  styleUrls: ['ir-tasks-table.css', '../../../../common/table.css'],
  scoped: true,
})
export class IrTasksTable {
  @Element() el: HTMLIrTasksTableElement;
  @Prop({ mutable: true }) tasks: Task[] = [];

  @State() pendingChange: { task: Task; hkmId: number } | null = null;
  @State() selectRevertKey = 0;

  @Event({ bubbles: true, composed: true }) animateCleanedButton: EventEmitter<null>;
  @Event({ bubbles: true, composed: true }) rowSelectChange: EventEmitter<Task[]>;
  @Event({ bubbles: true, composed: true }) sortingChanged: EventEmitter<{ field: string; direction: 'ASC' | 'DESC' }>;
  @Event({ bubbles: true, composed: true }) skipSelectedTask: EventEmitter<Task>;
  @Event({ bubbles: true, composed: true }) toast: EventEmitter<IToast>;

  private houseKeepingService = new HouseKeepingService();
  private dialog: HTMLIrDialogElement;

  componentWillLoad() {
    if (this.tasks && this.tasks.length > 0) {
      updateSorting('date', 'ASC');
    }
  }

  /**
   * Sorts the tasks by the given key. If no direction is provided,
   * it toggles between ascending and descending.
   */
  private handleSort(key: string) {
    let newDirection = hkTasksStore.sorting.direction;
    // If we're clicking the same column, flip the direction. If a new column, default to ASC.
    if (hkTasksStore.sorting.field === key) {
      newDirection = hkTasksStore.sorting.direction === 'ASC' ? 'DESC' : 'ASC';
    } else {
      newDirection = 'ASC';
    }
    updateSorting(key, newDirection);
    this.sortingChanged.emit({ field: key, direction: newDirection });
  }

  @Listen('clearSelectedHkTasks', { target: 'body' })
  handleClearSelectedHkTasks(e: CustomEvent) {
    e.stopImmediatePropagation();
    e.stopPropagation();
    clearSelectedTasks();
  }

  @Watch('tasks')
  handleTasksChange(newTasks: Task[]) {
    if (newTasks?.length) {
      clearSelectedTasks();
    }
  }

  /**
   * Helper to toggle selection for a single row.
   */
  private toggleSelection(task: Task) {
    toggleTaskSelection(task);
    this.emitSelectedTasks();
  }
  private emitSelectedTasks() {
    this.rowSelectChange.emit(hkTasksStore.selectedTasks);
  }

  /**
   * Checks if every row is selected.
   */
  private get allSelected(): boolean {
    return isAllTasksSelected();
  }

  /**
   * Toggles selection on all visible tasks at once.
   */
  private toggleSelectAll() {
    if (this.allSelected) {
      clearSelectedTasks();
    } else {
      selectAllTasks(getCheckableTasks());
      this.animateCleanedButton.emit(null);
    }
    this.emitSelectedTasks();
  }

  /**
   * Determines if a task is checkable.
   */
  private isCheckable(task: Task): boolean {
    return moment(task.date, 'YYYY-MM-DD').isSameOrBefore(moment(), 'days');
  }

  /**
   * Determines if a task is skippable.
   */
  private isSkippable(task: Task): boolean {
    const isTodayTask = moment().isSame(moment(task.date, 'YYYY-MM-DD'), 'date');
    return isTodayTask && task.status.code === 'IH';
  }

  private taskBadges(task: Task) {
    const config = [
      { code: 'CLN', variant: 'danger', label: 'CL' },
      { code: 'T1', variant: 'success', label: 'T1' },
      { code: 'T2', variant: 'brand', label: 'T2' },
    ] as const;
    const presentCodes = new Set([task.task_type?.code, ...(task.extra_task?.map(et => et.task_type?.code) ?? [])]);
    return config.map(({ code, variant, label }) => (
      <wa-badge key={code} variant={variant} appearance="filled" style={{ opacity: presentCodes.has(code) ? '1' : '0' }}>
        {label}
      </wa-badge>
    ));
  }

  private getHousekeeperName(hkmId: number): string {
    if (!hkmId) {
      return locales.entries.Lcz_Unassigned;
    }
    return housekeeping_store?.hk_criteria?.housekeepers?.find(h => h.id === hkmId)?.name ?? locales.entries.Lcz_Unassigned;
  }

  private async confirmOwnershipChange() {
    if (!this.pendingChange) {
      return;
    }
    const { task, hkmId } = this.pendingChange;
    try {
      const buildAssignment = (task: Task) => {
        return {
          PR_ID: task.unit.id,
          DATE: task.date,
          HK_TASK_TYPE_CODE: task.task_type.code,
          HKM_ID: hkmId === 0 ? null : hkmId,
        };
      };
      await this.houseKeepingService.overrideHKTaskOwnership({
        property_id: calendar_data.property.id,
        is_to_remove: hkmId === 0,
        assignments: [buildAssignment(task), ...(task.extra_task ?? []).map(buildAssignment)],
      });
      // Update the task locally in the store
      const updatedTasks = hkTasksStore.tasks.map(t => (t.id === task.id ? { ...t, hkm_id: hkmId, housekeeper: hkmId ? this.getHousekeeperName(hkmId) : null } : t));
      updateTasks(updatedTasks);
      this.toast.emit({ position: 'top-right', title: 'Saved Successfully', description: '', type: 'success' });
    } catch (error) {
      console.error(error);
    } finally {
      this.pendingChange = null;
      this.dialog.closeModal();
    }
  }

  render() {
    const haveManyHousekeepers = housekeeping_store?.hk_criteria?.housekeepers?.length > 1;
    const tasks = getPaginatedTasks();
    const mobileTasks = getMobileTasks();
    const housekeepers = housekeeping_store?.hk_criteria?.housekeepers ?? [];
    const pendingHkName = this.pendingChange ? this.getHousekeeperName(this.pendingChange.hkmId) : '';
    return (
      <Host>
        <section class="mobile-tasks-container">
          <wa-card>
            <ir-tasks-header></ir-tasks-header>
          </wa-card>
          {mobileTasks?.length === 0 && <p class="empty-msg">{locales.entries.Lcz_NoTasksFound}</p>}
          {(() => {
            const groups: { date: string; formattedDate: string; tasks: typeof mobileTasks }[] = [];
            for (const task of mobileTasks) {
              const last = groups[groups.length - 1];
              if (last && last.date === task.date) {
                last.tasks.push(task);
              } else {
                groups.push({ date: task.date, formattedDate: task.formatted_date, tasks: [task] });
              }
            }
            return groups.map(group => (
              <div key={group.date} class="mobile-date-group">
                <p class="mobile-date-label">{group.formattedDate}</p>
                {group.tasks.map(task => {
                  const isCheckable = this.isCheckable(task);
                  const isSkippable = this.isSkippable(task);
                  return <ir-tasks-card task={task} isSkippable={isSkippable} key={task.id} isCheckable={isCheckable}></ir-tasks-card>;
                })}
              </div>
            ));
          })()}
          <ir-tasks-table-pagination></ir-tasks-table-pagination>
        </section>
        <wa-card class="table-container">
          <ir-tasks-header></ir-tasks-header>
          <div class="table--container">
            <table class="table data-table" data-testid="hk_tasks_table">
              <thead class="table-header">
                <tr>
                  <th class={'task-row'}>
                    <wa-checkbox
                      indeterminate={hkTasksStore.selectedTasks.length > 0 && hkTasksStore.selectedTasks.length < getCheckableTasks().length}
                      checked={this.allSelected}
                      defaultChecked={this.allSelected}
                      onchange={() => this.toggleSelectAll()}
                    ></wa-checkbox>
                  </th>
                  <th class="">{locales.entries.Lcz_Period}</th>
                  <th class="">
                    {this.tasks.length > 1 && this.tasks.length + ' '}
                    {locales.entries.Lcz_Unit}
                  </th>
                  <th class="sortable" onClick={() => this.handleSort('status')}>
                    <div class="th-sort-inner">
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
                  <th class=" text-left">{locales.entries.Lcz_Hint}</th>
                  <th class=" text-left">Tasks</th>
                  <th class="text-left">{locales.entries.Lcz_A}d</th>
                  <th class="text-left">{locales.entries.Lcz_C}h</th>
                  <th class="text-left text-left">{locales.entries.Lcz_I}n</th>
                  {haveManyHousekeepers && (
                    <th class="sortable" onClick={() => this.handleSort('housekeeper')}>
                      <div class="th-sort-inner">
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
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {tasks.length === 0 && (
                  <tr class="ir-table-row">
                    <td colSpan={9}>
                      <div class="table-empty-state">
                        <span>{locales.entries.Lcz_NoTasksFound}</span>
                      </div>
                    </td>
                  </tr>
                )}
                {tasks?.map(task => {
                  const isSelected = hkTasksStore.selectedTasks.some(t => t.id === task.id);
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
                        this.toggleSelection(task);
                      }}
                      class={{ 'selected': isSelected, '--clickable': isCheckable, 'task-table-row ir-table-row ': true }}
                      key={task.id}
                    >
                      <td class="task-row ">
                        {isCheckable && (
                          <wa-checkbox
                            checked={isSelected}
                            defaultChecked={isSelected}
                            onchange={() => {
                              if (!isCheckable) {
                                return;
                              }
                              this.toggleSelection(task);
                            }}
                          ></wa-checkbox>
                        )}
                      </td>
                      <td class="task-row ">{task.formatted_date}</td>
                      <td class="task-row ">
                        <span class={{ 'highlighted-unit': task.is_highlight }}>{task.unit.name}</span>
                      </td>
                      <td class="task-row  text-left">{task.status.description}</td>
                      <td class="task-row  text-left">{task.hint}</td>
                      <td class="task-row  text-left">
                        <div class="th-sort-inner">{this.taskBadges(task)}</div>
                      </td>
                      <td class="task-row text-left">{task.adult}</td>
                      <td class="task-row text-left">{task.child}</td>
                      <td class="task-row text-left">{task.infant}</td>
                      {haveManyHousekeepers && (
                        <td class="task-row " style={{ textAlign: 'start' }} onClick={(e: MouseEvent) => e.stopPropagation()}>
                          <wa-select
                            key={`${task.id}-${this.selectRevertKey}`}
                            class="hk-owner-select"
                            size="small"
                            value={String(task.hkm_id ?? 0)}
                            defaultValue={String(task.hkm_id ?? 0)}
                            onchange={(e: Event) => {
                              e.stopPropagation();
                              const hkmId = Number((e.target as HTMLSelectElement).value);
                              this.pendingChange = { task, hkmId };
                              this.dialog.openModal();
                            }}
                          >
                            <wa-option value="0">{locales.entries.Lcz_Unassigned}</wa-option>
                            {housekeepers
                              .filter(housekeeper => housekeeper.is_active)
                              .map(housekeeper => (
                                <wa-option key={housekeeper.id} value={String(housekeeper.id)}>
                                  {housekeeper.name}
                                </wa-option>
                              ))}
                          </wa-select>
                        </td>
                      )}
                      <td>
                        {this.isSkippable(task) && (
                          <ir-custom-button
                            onClick={e => {
                              e.stopPropagation();
                            }}
                            variant="brand"
                            appearance="outlined"
                            onClickHandler={() => {
                              this.skipSelectedTask.emit(task);
                            }}
                          >
                            Skip
                          </ir-custom-button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div class="data-table--pagination ">
            <ir-tasks-table-pagination></ir-tasks-table-pagination>
          </div>
        </wa-card>

        <ir-dialog ref={el => (this.dialog = el)} label={locales.entries.Lcz_Confirmation} lightDismiss={false}>
          <span>
            {locales.entries.Lcz_Assign} <strong>{this.pendingChange?.task?.unit?.name}</strong> {'to'} <strong>{pendingHkName}</strong>?
          </span>
          <div slot="footer" class="hk-dialog-footer">
            <ir-custom-button
              size="medium"
              appearance="filled"
              variant="neutral"
              onClickHandler={() => {
                this.pendingChange = null;
                this.selectRevertKey++;
                this.dialog.closeModal();
              }}
            >
              {locales.entries.Lcz_Cancel}
            </ir-custom-button>
            <ir-custom-button
              size="medium"
              appearance="accent"
              variant="brand"
              loading={isRequestPending('/Override_HK_Task_Ownership')}
              onClickHandler={() => this.confirmOwnershipChange()}
            >
              {locales.entries.Lcz_Confirm}
            </ir-custom-button>
          </div>
        </ir-dialog>
      </Host>
    );
  }
}
