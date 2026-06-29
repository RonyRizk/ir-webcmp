import { Component, Event, EventEmitter, Host, Listen, Prop, State, h } from '@stencil/core';
import type { ClFiscalDocumentPreviewRequest } from './types';
import { FdTypes } from '@/types/enums';
import { CityLedgerService } from '@/services/city-ledger';

@Component({
  tag: 'ir-cl-fiscal-document-preview',
  styleUrl: 'ir-cl-fiscal-document-preview.css',
  shadow: false,
})
export class IrClFiscalDocumentPreview {
  @Prop() ticket: string;
  @Prop() propertyId: number;

  @State() request: (ClFiscalDocumentPreviewRequest & { url: string }) | null = null;
  @State() private showConvertDialog: boolean = false;
  @State() private isConverting: boolean = false;
  @State() private isFetching: boolean = false;

  @Event({ bubbles: true, composed: true }) documentConverted: EventEmitter<void>;

  private cityLedgerService = new CityLedgerService();

  @Listen('clFiscalDocumentPreview', { target: 'window' })
  async handlePreviewRequest(event: CustomEvent<ClFiscalDocumentPreviewRequest>) {
    event.stopImmediatePropagation();
    event.stopPropagation();
    if (event.detail.url) {
      this.request = { ...event.detail, url: event.detail.url };
      return;
    }
    this.request = { ...event.detail, url: null };
    this.isFetching = true;
    try {
      let url: string;
      if (event.detail.fdTypeCode === FdTypes.Proforma) {
        url = await this.cityLedgerService.getClProformaLink({
          FD_ID: this.request.fdId,
        });
      } else {
        url = await this.cityLedgerService.printClFiscalDocument({
          doc_number: this.request.documentNumber,
        });
      }
      this.request = { ...this.request, url };
    } finally {
      this.isFetching = false;
    }
    // if (event.detail.autoPrint) {
    //   window.print();
    // }
  }

  private getDialogLabel(): string {
    if (!this.request) return 'Preview';
    const typeLabel = this.getTypeLabel(this.request.fdTypeCode);
    return this.request.documentNumber ? `${typeLabel} #${this.request.documentNumber}` : typeLabel;
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

  @Listen('clPreviewReady')
  handleClPreviewReady(event: CustomEvent) {
    event.stopPropagation();
    if (this.request?.autoPrint) {
      window.print();
    }
  }

  private async handleDownload() {
    if (!this.request?.url) return;
    const blob = await fetch(this.request.url).then(r => r.blob());
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = `${this.request.documentNumber}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
  }

  private async handleConvertConfirm() {
    if (!this.request) return;
    this.isConverting = true;
    try {
      await this.cityLedgerService.issueInvoiceFromDraft({ FD_ID: this.request.fdId });
      this.documentConverted.emit();
      this.showConvertDialog = false;
      this.request = null;
    } finally {
      this.isConverting = false;
    }
  }

  private renderPreview() {
    if (!this.request) return null;
    // const { fdTypeCode, documentNumber, agentId, agentName, externalRef } = this.request;
    // const commonProps = {
    //   ticket: this.ticket,
    //   propertyId: this.propertyId,
    //   agentId,
    //   agentName,
    //   documentNumber,
    //   externalRef,
    // };

    // switch (fdTypeCode) {
    //   case FdTypes.Invoice:
    //   case FdTypes.Draft:
    //     return <ir-cl-invoice-preview {...commonProps}></ir-cl-invoice-preview>;
    //   case FdTypes.CreditNote:
    //     return <ir-cl-credit-note-preview {...commonProps}></ir-cl-credit-note-preview>;
    //   case FdTypes.DebitNote:
    //     return <ir-cl-debit-note-preview {...commonProps}></ir-cl-debit-note-preview>;
    //   case FdTypes.Receipt:
    //     return <ir-cl-receipt-preview {...commonProps}></ir-cl-receipt-preview>;
    //   default:
    //     return <ir-cl-invoice-preview {...commonProps}></ir-cl-invoice-preview>;
    // }
    if (this.isFetching) {
      return (
        <div class="preview-loading">
          <ir-spinner></ir-spinner>
        </div>
      );
    }
    return (
      <div class="preview-body">
        <ir-pdf-viewer src={this.request?.url}></ir-pdf-viewer>
      </div>
    );
  }

  render() {
    return (
      <Host>
        <ir-preview-screen-dialog
          hideDefaultAction
          open={this.request !== null}
          label={this.getDialogLabel()}
          action="print"
          onOpenChanged={e => {
            if (!e.detail) this.request = null;
          }}
        >
          <div slot="header-actions" class="header-actions">
            {this.request?.fdTypeCode === FdTypes.Draft && (
              <ir-custom-button onClickHandler={() => (this.showConvertDialog = true)} variant="brand" appearance="accent">
                Convert to invoice
              </ir-custom-button>
            )}
            {this.request?.url && (
              <ir-custom-button size="m" variant="neutral" appearance="plain" onClickHandler={() => this.handleDownload()}>
                <wa-icon name="download" style={{ fontSize: '1.2rem' }} label="Download PDF"></wa-icon>
              </ir-custom-button>
            )}
          </div>
          {this.renderPreview()}
        </ir-preview-screen-dialog>
        <ir-fd-confirm-dialog
          open={this.showConvertDialog}
          action="convert-to-invoice"
          docNumber={this.request?.documentNumber ?? 'this document'}
          isConfirming={this.isConverting}
          onConfirmed={() => this.handleConvertConfirm()}
          onCancelled={() => (this.showConvertDialog = false)}
        ></ir-fd-confirm-dialog>
      </Host>
    );
  }
}
