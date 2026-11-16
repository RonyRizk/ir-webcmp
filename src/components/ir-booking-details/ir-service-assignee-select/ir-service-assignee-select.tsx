import { Component, Event, EventEmitter, Host, Prop, h } from '@stencil/core';
import { t } from '@/services/locale/t';

@Component({
  tag: 'ir-service-assignee-select',
  styleUrl: 'ir-service-assignee-select.css',
  scoped: true,
})
export class IrServiceAssigneeSelect {
  /**
   * The agent to assign the service to.
   */
  @Prop() agent: { id: number; name: string; code: string } | null;

  /**
   * Currently selected service assignee type.
   */
  @Prop() assigneeType: 'agent' | 'guest' = 'agent';

  /**
   * Label displayed above the assignment selector.
   */
  @Prop() label: string;

  /**
   * Emits when the service assignee changes.
   */
  @Event() assignmentChange: EventEmitter<'agent' | 'guest'>;

  render() {
    return (
      <Host>
        <wa-radio-group
          onchange={e => this.assignmentChange.emit((e.target as any).value)}
          defaultValue={this.assigneeType}
          value={this.assigneeType}
          size="s"
          label={this.label || t('Lcz_AssignToFolio', { fallback: 'Assign to folio' })}
          orientation="vertical"
        >
          <wa-radio value="agent" appearance="button">
            {t('Lcz_Agent', { fallback: 'Agent' })}: {this.agent?.name}
          </wa-radio>
          <wa-radio value="guest" appearance="button">
            {t('Lcz_Guest', { fallback: 'Guest' })}
          </wa-radio>
        </wa-radio-group>
      </Host>
    );
  }
}
