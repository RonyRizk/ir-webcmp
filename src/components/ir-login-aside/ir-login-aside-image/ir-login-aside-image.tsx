import { Component, h, Prop } from '@stencil/core';

@Component({
  tag: 'ir-login-aside-image',
  styleUrl: 'ir-login-aside-image.css',
  shadow: false,
})
export class IrLoginAsideImage {
  /** Image URL rendered as the aside background. */
  @Prop({ attribute: 'image-src' }) imageSrc: string;

  /** Alternative text. Leave empty when the image is purely decorative. */
  @Prop({ attribute: 'image-alt' }) imageAlt: string = '';

  render() {
    return (
      <aside class="login-aside-image">
        {this.imageSrc && <img class="login-aside-image__img" src={this.imageSrc} alt={this.imageAlt} aria-hidden={this.imageAlt ? undefined : 'true'} decoding="async" />}
      </aside>
    );
  }
}
