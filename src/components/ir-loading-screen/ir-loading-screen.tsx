import { Component, Prop, h } from '@stencil/core';

@Component({
  tag: 'ir-loading-screen',
  styleUrl: 'ir-loading-screen.css',
  scoped: true,
})
export class IrLoadingScreen {
  @Prop() message: string = '';
  render() {
    return (
      <div class="loader__container" data-testid="loading-screen">
        {/* <span class="loader"></span> */}
        <wa-spinner style={{ fontSize: '2.5rem' }}></wa-spinner>
        {/* {this.message && <p class={'m-0'}>{this.message}</p>} */}
      </div>
    );
  }
}
