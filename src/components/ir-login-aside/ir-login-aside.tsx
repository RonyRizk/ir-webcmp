import { Component, h, Prop } from '@stencil/core';
import type { TLocaleEntries } from '@/stores/locales.store';

export type LoginAsideView = 'image' | 'calendar' | 'dynamic-pricing' | 'showcase';

@Component({
  tag: 'ir-login-aside',
  styleUrl: 'ir-login-aside.css',
  shadow: false,
})
export class IrLoginAside {
  /** Which aside content to render. */
  @Prop() view: LoginAsideView = 'calendar';

  /** Image URL, used when `view` is `image`. */
  @Prop({ attribute: 'image-src' }) imageSrc: string;

  /** Alternative text for the image. Empty means decorative. */
  @Prop({ attribute: 'image-alt' }) imageAlt: string = '';

  /**
   * Host-provided `Lcz_*` translations, passed through to every view that shows copy. Each label
   * comes from the `locales` store when it has the key, then from these entries, then English.
   */
  @Prop() localeEntries: TLocaleEntries | null = null;

  render() {
    if (this.view === 'calendar') {
      return <ir-login-aside-calendar localeEntries={this.localeEntries}></ir-login-aside-calendar>;
    }
    if (this.view === 'dynamic-pricing') {
      return <ir-login-aside-dynamic-pricing localeEntries={this.localeEntries}></ir-login-aside-dynamic-pricing>;
    }
    if (this.view === 'showcase') {
      return <ir-login-aside-showcase localeEntries={this.localeEntries}></ir-login-aside-showcase>;
    }
    return <ir-login-aside-image imageSrc={this.imageSrc} imageAlt={this.imageAlt}></ir-login-aside-image>;
  }
}
