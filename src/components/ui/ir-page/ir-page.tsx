import { Component, h, Host, Prop } from '@stencil/core';

@Component({
  tag: 'ir-page',
  styleUrl: 'ir-page.css',
  shadow: true,
})
export class IrPage {
  @Prop() label: string;
  @Prop() description: string;
  /** Endpoints that show the embedded interceptor's full-page loader. Omit to keep the interceptor's default list. */
  @Prop() handledEndpoints?: string[];
  render() {
    return (
      <Host>
        <ir-interceptor {...(this.handledEndpoints ? { handledEndpoints: this.handledEndpoints } : {})}></ir-interceptor>
        <ir-toast></ir-toast>
        <main part="main" class="ir-page__container">
          <header part="header" class="tax-page__header">
            <slot name="heading">
              <div class="tax-page__heading">
                <h3 part="title" class="page-title">
                  {this.label}
                </h3>
                {this.description && (
                  <p part="description" class="page__description">
                    {this.description}
                    <slot name="page-description"></slot>
                  </p>
                )}
              </div>
            </slot>
            <slot name="page-header"></slot>
          </header>
          <div part="body" class={'page-body'}>
            <slot></slot>
          </div>
        </main>
      </Host>
    );
  }
}
