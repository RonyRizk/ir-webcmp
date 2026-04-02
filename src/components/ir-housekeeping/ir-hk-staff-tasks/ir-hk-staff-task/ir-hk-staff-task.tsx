import { Task } from '@/models/housekeeping';
import { Component, Event, EventEmitter, Host, Prop, h } from '@stencil/core';

@Component({
  tag: 'ir-hk-staff-task',
  styleUrl: 'ir-hk-staff-task.css',
  scoped: true,
})
export class IrHkStaffTask {
  @Prop() task: Task;
  @Prop({ reflect: true }) future: boolean = false;

  @Event() taskClick: EventEmitter<Task>;

  private badgeVariant(code: string) {
    if (code === 'CLN') return 'danger';
    if (code === 'T1') return 'success';
    return 'brand';
  }

  private unitNameSizeClass(name: string) {
    if (name.length <= 4) return 'unit-label__name--lg';
    if (name.length <= 10) return 'unit-label__name--md';
    return 'unit-label__name--sm';
  }

  private get guests() {
    return [
      { label: 'adults', count: this.task.adult },
      { label: 'children', count: this.task.child },
      { label: 'infant', count: this.task.infant },
    ].filter(g => g.count > 0);
  }

  render() {
    return (
      <Host class={{ 'staff-task--future': this.future }}>
        <button onClick={() => this.taskClick.emit(this.task)} class="staff-task__button" disabled={this.future}>
          <wa-card class="staff-task__card">
            <div class="unit-label">
              <span class={`unit-label__name ${this.unitNameSizeClass(this.task.unit.name)}`}>{this.task.unit.name}</span>
            </div>
            {/* Main content */}
            <div class="task-content">
              {!this.future && (
                <div class="task-status">
                  <span class="task-status__label">{this.task.status.description}</span>
                  <span class="task-status__hint">{this.task.hint}</span>
                </div>
              )}

              {/* Task type badges */}
              <div class="task-badges">
                {[this.task, ...(this.task.extra_task ?? [])].map(t => (
                  <wa-badge key={t.task_type.code} variant={this.badgeVariant(t.task_type.code)} appearance="filled">
                    {t.task_type.description}
                  </wa-badge>
                ))}
              </div>

              {!this.future && this.guests.length > 0 && (
                <div class="task-guests" style={{ paddingLeft: '1px' }}>
                  {this.guests.map(g => (
                    <div key={g.label} class="task-guest">
                      <span class="task-guest__count">{g.count}</span>
                      {g.label === 'adults' ? (
                        <wa-icon name="person" class="task-guest__label"></wa-icon>
                      ) : g.label === 'children' ? (
                        <wa-icon name="child" class="task-guest__label"></wa-icon>
                      ) : (
                        <wa-icon name="baby-carriage" class="task-guest__label"></wa-icon>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {!this.future && (
              <div class="task-action">
                <wa-icon name="broom"></wa-icon>
              </div>
            )}
          </wa-card>
        </button>
      </Host>
    );
  }
}
