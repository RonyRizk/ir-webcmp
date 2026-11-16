import { Component, Prop, State, Watch } from '@stencil/core';
import { IrOnlineResource } from '../../common/models';
import { onlineResources } from '../../common/ir.common.resources';

@Component({
  tag: 'ir-common',
  styleUrl: '../../global/app.css',
  shadow: false,
})
export class IrCommon {
  @Prop({ reflect: true }) extraResources: string = '';
  @Prop() disableResourceInjection: boolean;

  @State() resources: IrOnlineResource[] = onlineResources;
  componentWillLoad() {
    this.parseRefs();
  }

  componentDidLoad() {
    this.initializeStyles();
    this.loadArabicFont();
  }

  @Watch('extraResources')
  hrefsChanged() {
    this.parseRefs();
    this.initializeStyles();
  }

  private parseRefs() {
    if (this.disableResourceInjection) {
      return;
    }
    if (this.extraResources !== '') this.resources.push(JSON.parse(this.extraResources));
  }

  private appendTag(tagName: string, attributes: any) {
    const tag = document.createElement(tagName);
    const selectorParts = [];

    Object.keys(attributes).forEach(attr => {
      tag.setAttribute(attr, attributes[attr]);
      selectorParts.push(`[${attr}="${attributes[attr]}"]`);
    });

    const selector = `${tagName}${selectorParts.join('')}`;
    const existingTag = document.querySelector(selector);

    if (!existingTag) {
      document.head.appendChild(tag);
    }
  }

  private initializeStyles() {
    if (this.disableResourceInjection) {
      return;
    }
    this.resources.forEach(res => {
      if (res.isCSS) {
        this.appendTag('link', {
          href: res.link,
          rel: 'stylesheet',
          type: 'text/css',
        });
      }
      if (res.isJS) {
        this.appendTag('script', {
          src: res.link,
        });
      }
    });
  }

  private loadArabicFont() {
    this.appendTag('link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' });
    this.appendTag('link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' });
    this.appendTag('link', { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Cairo:wght@200..1000&display=swap' });

    const styleId = 'ir-arabic-font';
    if (document.getElementById(styleId)) {
      return;
    }
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `:lang(ar):not(i, [class^="la-"], [class*=" la-"], [class^="ft-"], [class*=" ft-"], [class^="fa-"], [class*=" fa-"]) { font-family: "Cairo", sans-serif !important; }`;
    document.head.appendChild(style);
  }

  render() {
    return null;
  }
}
