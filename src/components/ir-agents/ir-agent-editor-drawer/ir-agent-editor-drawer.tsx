import { Component, Event, EventEmitter, Host, Prop, State, h } from '@stencil/core';
import { v4 } from 'uuid';
import type { Agent } from '@/services/agents/type';
import { ICountry } from '@/models/IBooking';
import { AgentSetupEntries } from '../types';

@Component({
  tag: 'ir-agent-editor-drawer',
  styleUrl: 'ir-agent-editor-drawer.css',
  scoped: true,
})
export class IrAgentEditorDrawer {
  @Prop({ reflect: true }) open: boolean = false;
  @Prop() agent?: Agent;
  @Prop() countries: ICountry[];
  @Prop() setupEntries: AgentSetupEntries;

  @State() currentTab: 'profile' | 'contract' = 'profile';
  @State() loading: string;

  @Event() agentEditorClose: EventEmitter<void>;

  private baseId = `agent-form__id-${v4()}`;

  private handleDrawerClose(e: CustomEvent<{ source: Element }>) {
    e.stopImmediatePropagation();
    e.stopPropagation();
    if (!e.detail) {
      return;
    }
    this.currentTab = 'profile';
    this.agentEditorClose.emit();
  }

  // private handleTabChange(e: CustomEvent<{ name: String }>) {
  //   this.currentTab = (e.detail.name.toString() ?? 'profile') as 'profile' | 'contract';
  // }

  render() {
    const isEditMode = this.agent?.id !== -1;
    return (
      <Host data-testid="agent-editor-drawer">
        <ir-drawer
          class="agent__drawer"
          style={{ '--ir-drawer-width': '60rem' }}
          label={isEditMode ? 'Edit Agent' : 'New Agent'}
          open={this.open}
          data-testid="agent-editor-drawer-container"
          onDrawerHide={e => this.handleDrawerClose(e)}
        >
          {this.open && (
            // <wa-tab-group class="agent-form__tab-group" activation='manual' active={this.currentTab.toString()} onwa-tab-show={e => this.handleTabChange(e)}>
            //   <wa-tab panel="profile" >Profile</wa-tab>
            //   <wa-tab disabled={!isEditMode} panel="contract">Contract</wa-tab>
            //   <wa-tab-panel name="profile" active={this.currentTab === "profile"}>
            //     {this.currentTab === 'profile' && <ir-agent-profile formId={formId} agent={this.agent}></ir-agent-profile>}
            //   </wa-tab-panel>
            //   <wa-tab-panel name="contract" active={this.currentTab === "contract"}>
            //     {this.currentTab === 'contract' && <ir-agent-contract formId={formId} agent={this.agent}></ir-agent-contract>}
            //   </wa-tab-panel>
            // </wa-tab-group>
            <ir-agent-editor-form
              onCloseDrawer={e => {
                e.stopImmediatePropagation();
                e.stopPropagation();
                this.agentEditorClose.emit();
              }}
              onLoadingChanged={e => {
                e.stopImmediatePropagation();
                e.stopPropagation();
                this.loading = e.detail;
              }}
              setupEntries={this.setupEntries}
              countries={this.countries}
              agent={this.agent}
              formId={this.baseId}
              data-testid="agent-editor-form"
            ></ir-agent-editor-form>
          )}
          <div slot="footer" class="ir__drawer-footer" data-testid="agent-editor-drawer-footer">
            <ir-custom-button size="medium" data-drawer="close" appearance="filled" variant="neutral" data-testid="agent-editor-cancel-button">
              Cancel
            </ir-custom-button>
            <ir-custom-button
              loading={this.loading === (this.agent?.id === -1 ? 'save&close' : 'save')}
              type="submit"
              form={this.baseId}
              size="medium"
              value={this.agent?.id === -1 ? 'save&close' : 'save'}
              appearance={this.agent?.id === -1 ? 'accent' : 'outlined'}
              variant="brand"
              data-testid="agent-editor-save-button"
            >
              Save
            </ir-custom-button>
            {this.agent?.id !== -1 && (
              <ir-custom-button
                loading={this.loading === 'save&close'}
                type="submit"
                form={this.baseId}
                size="medium"
                value="save&close"
                appearance="accent"
                variant="brand"
                data-testid="agent-editor-save-button"
              >
                Save & Close
              </ir-custom-button>
            )}
          </div>
        </ir-drawer>
      </Host>
    );
  }
}
