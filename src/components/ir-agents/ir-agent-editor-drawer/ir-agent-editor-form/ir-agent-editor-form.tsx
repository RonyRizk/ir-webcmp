import { Component, Event, EventEmitter, Listen, Prop, h } from '@stencil/core';
import { AgentSchema, type Agent } from '@/services/agents/type';
import { ICountry } from '@/models/IBooking';
import { AgentSetupEntries } from '../../types';
import { AgentsService } from '@/services/agents/agents.service';
import { getFormSubmitter } from '@/utils/utils';

@Component({
  tag: 'ir-agent-editor-form',
  styleUrl: 'ir-agent-editor-form.css',
  scoped: true,
})
export class IrAgentEditorForm {
  @Prop({ mutable: true }) agent: Agent;
  @Prop() formId: string;
  @Prop() countries: ICountry[];
  @Prop() setupEntries: AgentSetupEntries;

  @Event() upsertAgent: EventEmitter<Agent>;
  @Event() closeDrawer: EventEmitter<void>;
  @Event() loadingChanged: EventEmitter<string>;

  private agentService = new AgentsService();

  @Listen('agentFieldChanged')
  handleAgentFieldChange(e: CustomEvent<Partial<Agent>>) {
    e.stopImmediatePropagation();
    e.stopPropagation();
    const agent = this.agent || ({} as Agent);
    this.agent = { ...agent, ...e.detail };
  }

  private async saveOrEditAgent(submitter: string) {
    try {
      this.loadingChanged.emit(submitter);
      AgentSchema.parse(this.agent);
      await this.agentService.handleExposedAgent({ agent: this.agent });
      this.upsertAgent.emit(this.agent);
      if (submitter === 'save&close') {
        this.closeDrawer.emit();
      }
    } catch (error) {
      console.error(error);
    } finally {
      this.loadingChanged.emit(null);
    }
  }

  render() {
    return (
      <form
        autoComplete={this.formId}
        // autoComplete="off"
        id={this.formId}
        onSubmit={e => {
          e.preventDefault();

          this.saveOrEditAgent(getFormSubmitter(e));
        }}
        class="agent-editor__content"
      >
        <ir-agent-profile setupEntries={this.setupEntries} countries={this.countries} class={'agent-editor__profile'} agent={this.agent}></ir-agent-profile>
        <ir-agent-contract setupEntries={this.setupEntries} class={'agent-editor__contract'} agent={this.agent}></ir-agent-contract>
      </form>
    );
  }
}
