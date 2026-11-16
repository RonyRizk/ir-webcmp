import { Component, Host, Prop, h } from '@stencil/core';
import type { IProperty } from '@/models/property';
import moment from 'moment';
import { t } from '@/services/locale/t';
import { formatDate } from '@/utils/date';

const DATE_DISPLAY = 'MMM DD, YYYY';

@Component({
  tag: 'ir-cl-document-header',
  styleUrl: 'ir-cl-document-header.css',
  shadow: true,
})
export class IrClDocumentHeader {
  @Prop() documentType: 'invoice' | 'receipt' | 'creditnote' | 'debitnote' | 'statement' = 'invoice';
  /** Property whose branding and details appear on the right side. */
  @Prop() property: IProperty;

  /** Optional document reference number shown in the meta block. */
  @Prop() documentNumber?: string;

  /** Name of the agent/company to bill to. */
  @Prop() agentName?: string;

  private get primaryContact() {
    return this.property?.contacts?.find(c => c.type === 'marketing') ?? this.property?.contacts?.[0];
  }

  private get documentTitle(): string {
    switch (this.documentType) {
      case 'invoice':
        return t('Lcz_DocumentTypeInvoice', { fallback: 'Invoice' });
      case 'receipt':
        return t('Lcz_DocumentTypeReceipt', { fallback: 'Receipt' });
      case 'creditnote':
        return t('Lcz_DocumentTypeCreditNote', { fallback: 'Credit Note' });
      case 'debitnote':
        return t('Lcz_DocumentTypeDebitNote', { fallback: 'Debit Note' });
      case 'statement':
        return t('Lcz_DocumentTypeStatement', { fallback: 'account statement' });
      default:
        return '';
    }
  }

  render() {
    const p = this.property;
    const logo = p?.space_theme?.logo;
    const propertyLocation = [p?.city?.['name'] ?? null, p?.country?.name ?? null].filter(f => f !== null).join(', ');

    return (
      <Host>
        <header class="invoice__header">
          <h3 class="invoice__title">{this.documentTitle}</h3>
          <section class="invoice__layout">
            <div class="invoice__column invoice__column--details">
              <div class="invoice__details">
                {this.documentNumber && (
                  <div class="invoice__meta-row">
                    <span class="invoice__meta-label">{t('Lcz_DocumentNumberLabel', { fallback: 'Document #' })}</span>
                    <span class="invoice__meta-value">{this.documentNumber}</span>
                  </div>
                )}
                <div class="invoice__meta-row">
                  <span class="invoice__meta-label">{t('Lcz_DateLabel', { fallback: 'Date' })}</span>
                  <span class="invoice__meta-value">{formatDate(moment(), DATE_DISPLAY)}</span>
                </div>
              </div>
              {this.agentName && (
                <section class="bill-to-section" aria-label={t('Lcz_BillTo', { fallback: 'Bill to' })}>
                  <h4 class="section-heading">{t('Lcz_BillTo', { fallback: 'Bill To' })}</h4>
                  <div class="bill-to">
                    <p class="bill-to__name">{this.agentName}</p>
                  </div>
                </section>
              )}
            </div>
            <div class="invoice__column invoice__column--property">
              <div class="property-overview" aria-label={t('Lcz_PropertyOverviewAria', { fallback: 'Property overview' })}>
                {logo && <img src={logo} alt={p?.name} class="property-logo" />}
                <div class="property-overview__text">
                  <p class="property-overview__name">{p?.name}</p>
                  {propertyLocation && <p class="property-overview__location">{propertyLocation}</p>}
                  {p?.address && <p class="property-overview__location">{p.address}</p>}
                  {p?.phone && <p class="property-overview__location">{p.phone}</p>}
                  {this.primaryContact?.email && <p class="property-overview__location">{this.primaryContact.email}</p>}
                  {p?.tax_nbr && (
                    <p class="property-overview__location">
                      {t('Lcz_TaxRegPrefix', { fallback: 'Tax Reg:' })} {p.tax_nbr}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>
        </header>
      </Host>
    );
  }
}
