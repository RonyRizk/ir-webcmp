import { Component, Host, Listen, Prop, State, h } from '@stencil/core';
import { FdTypes } from '@/types/enums';
import type { GuestDocumentPreviewRequest } from './types';
import { PropertyService } from '@/services/property';

/**
 * Guest Fiscal Document Preview
 *
 * Self-contained, window-event-driven preview for guest documents — the guest
 * counterpart to `ir-cl-fiscal-document-preview`. It listens for
 * `guestDocumentPreview`, fetches the invoice / credit-note PDF via
 * `BookingService.printInvoice`, and renders it in a preview dialog
 * (same flow as `ir-guest-billing`).
 */
@Component({
  tag: 'ir-guest-document-preview',
  styleUrl: 'ir-guest-document-preview.css',
  scoped: true,
})
export class IrGuestDocumentPreview {
  @Prop() ticket: string;
  @Prop() propertyId: number;

  @State() private pdfUrl: string | null = null;
  @State() private isLoading: boolean = false;
  @State() private request: GuestDocumentPreviewRequest;

  private readonly modes: Record<GuestDocumentPreviewRequest['fdTypeCode'], string> = {
    [FdTypes.Invoice]: 'invoice',
    [FdTypes.Receipt]: 'receipt',
    [FdTypes.CreditNote]: 'creditnote',
    [FdTypes.Proforma]: 'proforma',
  };

  private propertyService = new PropertyService();

  @Listen('guestDocumentPreview', { target: 'window' })
  async handlePreviewRequest(event: CustomEvent<GuestDocumentPreviewRequest>) {
    event.stopImmediatePropagation();
    event.stopPropagation();
    this.request = event.detail ?? ({} as GuestDocumentPreviewRequest);
    const { documentNumber, fdTypeCode, bookingNumber, autoDownload, extras } = this.request;
    if (!documentNumber) return;

    this.isLoading = true;
    try {
      const url = await this.propertyService.printGuestFolioDoc({
        property_id: this.propertyId,
        booking_nbr: bookingNumber,
        reference: documentNumber,
        mode: this.modes[fdTypeCode],
        extras,
      });
      if (url) {
        this.pdfUrl = url;
        if (autoDownload) {
          this.handleDownload();
        }
      }
    } catch (err) {
      console.error('[ir-guest-document-preview] printInvoice error:', err);
    } finally {
      this.isLoading = false;
    }
  }

  private resetPreview() {
    this.pdfUrl = null;
  }

  private renderBody() {
    if (this.pdfUrl) {
      return <ir-pdf-viewer class="guest-document-preview__pdf-viewer" src={this.pdfUrl}></ir-pdf-viewer>;
    }
    return (
      <div class="guest-document-preview__pdf-loader">
        <ir-spinner></ir-spinner>
      </div>
    );
  }

  private getDialogLabel(): string {
    if (!this.request) return 'Preview';
    const typeLabel = this.getTypeLabel(this.request.fdTypeCode);
    return this.request.documentNumber ? `${typeLabel} #${this.request.creditNoteDocNumber ?? this.request.documentNumber}` : typeLabel;
  }

  private getTypeLabel(fdTypeCode: string): string {
    switch (fdTypeCode) {
      case FdTypes.Invoice:
        return 'Invoice';
      case FdTypes.Draft:
        return 'Draft Invoice';
      case FdTypes.CreditNote:
        return 'Credit Note';
      case FdTypes.DebitNote:
        return 'Debit Note';
      case FdTypes.Receipt:
        return 'Receipt';
      case FdTypes.Proforma:
        return 'Proforma Invoice';
      default:
        return 'Document';
    }
  }

  private async handleDownload() {
    if (!this.pdfUrl) return;
    const blob = await fetch(this.pdfUrl).then(r => r.blob());
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = `${this.request.documentNumber}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
  }

  render() {
    const isOpen = this.pdfUrl !== null || this.isLoading;
    return (
      <Host>
        <ir-preview-screen-dialog
          open={isOpen}
          label={this.getDialogLabel()}
          action="print"
          hideDefaultAction={true}
          onOpenChanged={e => {
            if (!e.detail) {
              e.stopImmediatePropagation();
              e.stopPropagation();
              this.resetPreview();
            }
          }}
        >
          {this.pdfUrl && (
            <ir-custom-button slot="header-actions" size="m" variant="neutral" appearance="plain" onClickHandler={() => this.handleDownload()}>
              <wa-icon name="download" style={{ fontSize: '1.2rem' }} label="Download PDF"></wa-icon>
            </ir-custom-button>
          )}
          {this.renderBody()}
        </ir-preview-screen-dialog>
      </Host>
    );
  }
}
