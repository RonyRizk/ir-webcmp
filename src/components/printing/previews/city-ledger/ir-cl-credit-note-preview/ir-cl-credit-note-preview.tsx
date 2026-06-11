import { Component, Event, EventEmitter, Host, Prop, State, h } from '@stencil/core';
import type { IProperty } from '@/models/property';
import type { ClTx } from '@/services/city-ledger';
import { ClFiscalDocumentService } from '../cl-fiscal-document.service';

@Component({
  tag: 'ir-cl-credit-note-preview',
  styleUrl: 'ir-cl-credit-note-preview.css',
  shadow: true,
})
export class IrClCreditNotePreview {
  @Prop() propertyId: number;
  @Prop() ticket: string;
  @Prop() baseurl: string;
  @Prop() agentId: number;
  @Prop() agentName: string;
  @Prop() documentNumber: string;
  @Prop() externalRef: string;

  @State() private isLoading: boolean = false;
  @State() private error: string | null = null;
  @State() private property: IProperty | null = null;
  @State() private transactions: ClTx[] = [];

  @Event({ bubbles: true, composed: true }) clPreviewReady: EventEmitter<void>;

  private dataService = new ClFiscalDocumentService();
  private hasEmitted: boolean = false;

  componentWillLoad() {
    if (!this.ticket) {
      this.error = 'Authentication ticket is required.';
      return;
    }
    this.dataService.init(this.baseurl, this.ticket);
    return this.fetchData();
  }
  componentDidRender() {
    if (!this.isLoading && !this.error && !this.hasEmitted) {
      this.hasEmitted = true;
      requestAnimationFrame(() => {
        this.clPreviewReady.emit();
      });
    }
  }

  private async fetchData() {
    this.isLoading = true;
    this.error = null;
    try {
      const { property, transactions } = await this.dataService.fetchData(this.propertyId, this.agentId, this.externalRef);
      this.property = property;
      this.transactions = transactions;
    } catch (e: any) {
      this.error = e?.message ?? 'Failed to load credit note data.';
    } finally {
      this.isLoading = false;
    }
  }

  render() {
    if (!this.ticket) {
      return (
        <Host>
          <div class="document-state document-state--error">Authentication ticket is required.</div>
        </Host>
      );
    }
    if (this.isLoading) {
      return (
        <Host>
          <div class="document-state">
            <ir-spinner></ir-spinner>
          </div>
        </Host>
      );
    }
    if (this.error) {
      return (
        <Host>
          <div class="document-state document-state--error">{this.error}</div>
        </Host>
      );
    }
    return (
      <Host>
        <div class="document">
          <ir-cl-document-header
            style={{ marginBottom: '2.5rem' }}
            property={this.property as any}
            documentNumber={this.documentNumber}
            agentName={this.agentName}
            documentType="creditnote"
          ></ir-cl-document-header>
          <ir-cl-fiscal-document-table transactions={this.transactions} currencySymbol={this.property?.currency?.symbol ?? '$'} invertAmounts={true}></ir-cl-fiscal-document-table>
        </div>
      </Host>
    );
  }
}
