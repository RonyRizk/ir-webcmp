import { Component, Host, Prop, h } from '@stencil/core';

@Component({
  tag: 'ir-empty-state',
  styleUrl: 'ir-empty-state.css',
  shadow: true,
})
export class IrEmptyState {
  @Prop() message: string = 'No records found';
  @Prop() showIcon: boolean = true;
  render() {
    return (
      <Host>
        <slot name="icon">
          {this.showIcon && (
            <div class={'icon_container'}>
              <wa-icon name="ban" style={{ transform: 'rotate(90deg)' }}></wa-icon>
            </div>
          )}
        </slot>
        <p part="message" class={`message ${this.showIcon ? '' : '--secondary'}`}>
          {this.message}
        </p>
        <slot></slot>
      </Host>
    );
  }
}
