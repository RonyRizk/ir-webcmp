import { Component, Event, EventEmitter, Prop, h } from '@stencil/core';
import { CleanTaskEvent, Task } from '@/models/housekeeping';
import { toggleTaskSelection } from '@/stores/hk-tasks.store';
import housekeeping_store from '@/stores/housekeeping.store';
import locales from '@/stores/locales.store';

@Component({
  tag: 'ir-tasks-card',
  styleUrls: ['ir-tasks-card.css'],
  scoped: true,
})
export class IrTasksCard {
  @Prop() task: Task;
  @Prop() isCheckable: boolean;
  @Prop() isSkippable: boolean;

  @Event() cleanSelectedTask: EventEmitter<CleanTaskEvent>;
  @Event() skipSelectedTask: EventEmitter<Task>;
  @Event() assignHousekeeper: EventEmitter<{ task: Task; hkm_id: number }>;

  // private taskBadges() {
  //   const config = [
  //     { code: 'CLN', variant: 'danger', label: 'CL' },
  //     { code: 'T1', variant: 'success', label: 'T1' },
  //     { code: 'T2', variant: 'brand', label: 'T2' },
  //   ] as const;
  //   const presentCodes = new Set([this.task.task_type?.code, ...(this.task.extra_task?.map(et => et.task_type?.code) ?? [])]);
  //   return config.map(({ code, variant, label }) => (
  //     <wa-badge key={code} variant={variant} appearance="filled" style={{ opacity: presentCodes.has(code) ? '1' : '0' }}>
  //       {label}
  //     </wa-badge>
  //   ));
  // }

  private taskTypeBadge(code: 'CLN' | 'T1' | 'T2') {
    const config = {
      CLN: { variant: 'danger', label: 'CL' },
      T1: { variant: 'success', label: 'T1' },
      T2: { variant: 'brand', label: 'T2' },
    } as const;
    const { variant, label } = config[code] ?? { variant: 'neutral', label: code };
    return (
      <wa-badge variant={variant} appearance="filled">
        {label}
      </wa-badge>
    );
  }

  private get guests() {
    return [
      { count: this.task.adult, icon: 'person', label: 'Ad' },
      { count: this.task.child, icon: 'child', label: 'Ch' },
      { count: this.task.infant, icon: 'baby', label: 'In' },
    ].filter(g => g.count > 0);
  }

  render() {
    return (
      <wa-card class="task-card">
        <div class="task-card__body">
          {/* Left: unit + meta */}
          <div class="task-card__unit">
            <span class="task-card__unit-name">{this.task.unit.name}</span>
            <div class="task-card__meta">
              <span class="task-card__status">{this.task.status.description}</span>
              {this.task.hint && <span class="task-card__sep">·</span>}
              {this.task.hint && <span class="task-card__hint">{this.task.hint}</span>}
              {/* <span class="task-card__sep">·</span> */}
              {/* <span class="task-card__date">{this.task.formatted_date}</span> */}
            </div>
          </div>

          {/* Task type badges */}
          <div class="task-card__badges">
            {this.taskTypeBadge(this.task.task_type?.code)}
            {this.task.extra_task?.map(et => this.taskTypeBadge(et.task_type?.code))}
          </div>

          {/* Guests */}
          {this.guests.length > 0 && (
            <div class="task-card__guests">
              {this.guests.map(g => (
                <div class="task-card__guest">
                  <wa-icon name={g.icon} class="task-card__guest-icon" style={{ fontSize: `${Math.min(0.75 + g.count * 0.15, 1.4)}rem` }}></wa-icon>
                  <span class="task-card__guest-count">{g.count}</span>
                </div>
              ))}
            </div>
          )}

          {/* Housekeeper assignment */}
          <div class="task-card__assign">
            {/* <wa-icon name="user-group" class="task-card__assign-icon"></wa-icon> */}
            <wa-select
              label="Housekeeper"
              class="task-card__hk-select"
              size="small"
              placeholder="Unassigned"
              value={this.task.hkm_id ? String(this.task.hkm_id) : '0'}
              defaultValue={this.task.hkm_id ? String(this.task.hkm_id) : '0'}
              onchange={e => {
                const hkm_id = Number((e.target as HTMLSelectElement).value);
                this.assignHousekeeper.emit({ task: this.task, hkm_id });
              }}
            >
              <wa-option value="0">{locales.entries.Lcz_Unassigned}</wa-option>
              {housekeeping_store.hk_criteria?.housekeepers
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name))
                .map(hk => (
                  <wa-option key={hk.id} value={String(hk.id)}>
                    {hk.name}
                  </wa-option>
                ))}
            </wa-select>
          </div>

          {/* Actions */}
          <div class="task-card__actions">
            {this.isSkippable && (
              <ir-custom-button variant="neutral" appearance="outlined" onClickHandler={() => this.skipSelectedTask.emit(this.task)}>
                Skip
              </ir-custom-button>
            )}
            {this.isCheckable && (
              <div class="task-card__clean-group">
                <ir-custom-button
                  variant="brand"
                  appearance="filled"
                  onClickHandler={() => {
                    toggleTaskSelection(this.task);
                    this.cleanSelectedTask.emit({ task: this.task, status: '004' });
                  }}
                >
                  Clean & Inspect
                </ir-custom-button>
                <ir-custom-button
                  variant="brand"
                  appearance="accent"
                  onClickHandler={() => {
                    toggleTaskSelection(this.task);
                    this.cleanSelectedTask.emit({ task: this.task, status: '001' });
                  }}
                >
                  Clean
                </ir-custom-button>
              </div>
            )}
          </div>
        </div>
      </wa-card>
    );
  }
}
