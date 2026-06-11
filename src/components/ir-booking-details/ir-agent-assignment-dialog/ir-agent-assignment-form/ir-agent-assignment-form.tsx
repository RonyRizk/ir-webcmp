import { Component, Host, h } from '@stencil/core';

@Component({
  tag: 'ir-agent-assignment-form',
  styleUrl: 'ir-agent-assignment-form.css',
  scoped: true,
})
export class IrAgentAssignmentForm {
  render() {
    return (
      <Host>
        <slot></slot>
      </Host>
    );
  }
}
