import { Component, Event, EventEmitter, Host, Prop, h } from '@stencil/core';

/**
 * Which preview flow(s) to enable:
 * - `agent` — only the city-ledger fiscal-document preview.
 * - `guest` — only the guest invoice / credit-note preview.
 * - `all`   — both (needed when a list mixes agent and guest documents).
 */
export type FiscalDocumentPreviewMode = 'agent' | 'guest' | 'all';

/**
 * Fiscal Document Preview
 *
 * Thin wrapper that mounts the appropriate preview component(s). Both inner
 * previews are passive, window-event-driven listeners, so the host just needs
 * to render this once. `documentConverted` from the agent preview bubbles
 * through to the host.
 */
@Component({
  tag: 'ir-fiscal-document-preview',
  styleUrl: 'ir-fiscal-document-preview.css',
  scoped: true,
})
export class IrFiscalDocumentPreview {
  @Prop() ticket: string;
  @Prop() propertyId: number;
  /** Which preview flows to enable. Defaults to agent (city-ledger). */
  @Prop() mode: FiscalDocumentPreviewMode = 'agent';

  /** Re-emitted when the agent preview converts a draft into an invoice. */
  @Event() documentConverted: EventEmitter<void>;

  render() {
    const showAgent = this.mode === 'agent' || this.mode === 'all';
    const showGuest = this.mode === 'guest' || this.mode === 'all';
    return (
      <Host>
        {showAgent && (
          <ir-cl-fiscal-document-preview
            ticket={this.ticket}
            propertyId={this.propertyId}
            onDocumentConverted={(e: CustomEvent<void>) => {
              // Stop the inner (bubbling) event and re-emit from the wrapper so
              // the host only sees a single, typed `documentConverted`.
              e.stopPropagation();
              this.documentConverted.emit();
            }}
          ></ir-cl-fiscal-document-preview>
        )}
        {showGuest && <ir-guest-document-preview ticket={this.ticket} propertyId={this.propertyId}></ir-guest-document-preview>}
      </Host>
    );
  }
}
