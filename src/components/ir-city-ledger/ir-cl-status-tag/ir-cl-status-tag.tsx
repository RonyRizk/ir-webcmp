import { Component, Host, Prop, h } from '@stencil/core';
import type { FolioRow } from '../ir-city-ledger-folio/types';
import type { FiscalDocument } from '@/services/city-ledger';
import type WaTag from '@awesome.me/webawesome/dist/components/tag/tag';

type ResolvedStatus = { label: string; variant: WaTag['variant']; showLock: boolean };

const FD_VARIANT_MAP: Record<string, WaTag['variant']> = {
  PAID: 'success',
  ISSUED: 'brand',
  SENT: 'brand',
  DRAFT: 'neutral',
  PARTIAL: 'warning',
  VOID: 'danger',
};

function isFolioRow(tx: FolioRow | FiscalDocument): tx is FolioRow {
  return 'status' in tx && tx.status != null && typeof (tx as any).status === 'object';
}

function resolveStatus(tx: FolioRow | FiscalDocument): ResolvedStatus {
  if (isFolioRow(tx)) {
    return {
      label: tx.status.label,
      variant: tx.status.variant as WaTag['variant'],
      showLock: tx.status.id === 'billed',
    };
  }
  return {
    label: tx.FD_STATUS_NAME ?? tx.FD_STATUS_CODE ?? '',
    variant: FD_VARIANT_MAP[tx.FD_STATUS_CODE?.toUpperCase() ?? ''] ?? 'neutral',
    showLock: false,
  };
}

@Component({
  tag: 'ir-cl-status-tag',
  styleUrl: 'ir-cl-status-tag.css',
  scoped: true,
})
export class IrClStatusTag {
  @Prop() transaction!: FolioRow | FiscalDocument;
  @Prop() size: 'default' | 'extra-small' = 'extra-small';

  render() {
    if (!this.transaction) return null;
    const { label, variant, showLock } = resolveStatus(this.transaction);
    return (
      <Host>
        <wa-tag size={'small'} className={`${this.size === 'default' ? '' : 'cl-status-tag__xs'}`} variant={variant}>
          {label}
          {showLock && <wa-icon name="lock"></wa-icon>}
        </wa-tag>
      </Host>
    );
  }
}
