import { Component, Host, Prop, h } from '@stencil/core';
import type { IProperty } from '@/models/property';
import moment from 'moment';

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
        return 'invoice';
      case 'receipt':
        return 'receipt';
      case 'creditnote':
        return 'credit note';
      case 'debitnote':
        return 'debit note';
      case 'statement':
        return 'account statement';
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
                    <span class="invoice__meta-label">Document #</span>
                    <span class="invoice__meta-value">{this.documentNumber}</span>
                  </div>
                )}
                <div class="invoice__meta-row">
                  <span class="invoice__meta-label">Date</span>
                  <span class="invoice__meta-value">{moment().format(DATE_DISPLAY)}</span>
                </div>
              </div>
              {this.agentName && (
                <section class="bill-to-section" aria-label="Bill to">
                  <h4 class="section-heading">Bill To</h4>
                  <div class="bill-to">
                    <p class="bill-to__name">{this.agentName}</p>
                  </div>
                </section>
              )}
            </div>
            <div class="invoice__column invoice__column--property">
              <div class="property-overview" aria-label="Property overview">
                {logo && <img src={logo} alt={p?.name} class="property-logo" />}
                <div class="property-overview__text">
                  <p class="property-overview__name">{p?.name}</p>
                  {propertyLocation && <p class="property-overview__location">{propertyLocation}</p>}
                  {p?.address && <p class="property-overview__location">{p.address}</p>}
                  {p?.phone && <p class="property-overview__location">{p.phone}</p>}
                  {this.primaryContact?.email && <p class="property-overview__location">{this.primaryContact.email}</p>}
                  {p?.tax_nbr && <p class="property-overview__location">Tax Reg: {p.tax_nbr}</p>}
                </div>
              </div>
            </div>
          </section>
        </header>
      </Host>
    );
  }
}
