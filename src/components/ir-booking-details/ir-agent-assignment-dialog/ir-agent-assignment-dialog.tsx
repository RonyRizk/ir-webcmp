import { Component, Host, h } from '@stencil/core';

@Component({
  tag: 'ir-agent-assignment-dialog',
  styleUrl: 'ir-agent-assignment-dialog.css',
  scoped: true,
})
export class IrAgentAssignmentDialog {
  render() {
    return (
      <Host>
        <slot></slot>
      </Host>
    );
  }
}
