import { Component, Event, EventEmitter, Host, Method, Prop, h } from '@stencil/core';

@Component({
  tag: 'ir-assignment-toggle-dialog',
  styleUrl: 'ir-assignment-toggle-dialog.css',
  scoped: true,
})
export class IrAssignmentToggleDialog {
  /** Dialog header title */
  @Prop() label: string = 'Are you sure?';

  /** Message shown inside the dialog */
  @Prop() message: string;

  /** Confirm button label */
  @Prop() confirmLabel: string = 'Confirm';

  /** Cancel button label */
  @Prop() cancelLabel: string = 'Cancel';

  /** Controls the loading spinner on the confirm button — set by the parent while the async operation runs */
  @Prop() loading: boolean = false;

  /** Emitted when the user clicks confirm */
  @Event() confirmToggle: EventEmitter<void>;

  private dialogRef: HTMLIrDialogElement;

  @Method()
  async openModal() {
    this.dialogRef?.openModal();
  }

  @Method()
  async closeModal() {
    this.dialogRef?.closeModal();
  }

  render() {
    return (
      <Host>
        <ir-dialog
          label={this.label}
          lightDismiss={false}
          ref={el => (this.dialogRef = el)}
          onIrDialogHide={e => {
            e.stopImmediatePropagation();
            e.stopPropagation();
          }}
        >
          <p class="assignment-toggle-dialog__message">
            <slot name="message">{this.message}</slot>
          </p>
          <div slot="footer" class="assignment-toggle-dialog__footer">
            <ir-custom-button appearance="filled" variant="neutral" size="m" data-dialog="close" disabled={this.loading}>
              {this.cancelLabel}
            </ir-custom-button>
            <ir-custom-button variant="brand" size="m" loading={this.loading} onClickHandler={() => this.confirmToggle.emit()}>
              {this.confirmLabel}
            </ir-custom-button>
          </div>
        </ir-dialog>
      </Host>
    );
  }
}
