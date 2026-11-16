import { Component, Host, h } from '@stencil/core';
import { t } from '@/services/locale/t';

@Component({
  tag: 'ir-new-badge',
  styleUrl: 'ir-new-badge.css',
  shadow: true,
})
export class IrNewBadge {
  render() {
    return (
      <Host>
        <span class="new-badge">{t('Lcz_New', { fallback: 'new' })}</span>
      </Host>
    );
  }
}
