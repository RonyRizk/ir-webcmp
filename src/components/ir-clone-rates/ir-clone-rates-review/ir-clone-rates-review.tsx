import { Component, Event, EventEmitter, Prop, Watch, h } from '@stencil/core';
import { ReviewRow } from '../clone-rates.utils';

@Component({
  tag: 'ir-clone-rates-review',
  styleUrl: 'ir-clone-rates-review.css',
  scoped: true,
})
export class IrCloneRatesReview {
  @Prop() open: boolean = false;
  /** Summary lines rendered as label/value pairs. */
  @Prop() rows: ReviewRow[] = [];
  /** Shows the Confirm button as busy and blocks Go back while the copy request is in flight. */
  @Prop() loading: boolean = false;

  /** Fired by Go back, the close button or Escape. The parent should set `open` to false. */
  @Event() goBack: EventEmitter<void>;
  @Event() confirmClone: EventEmitter<void>;

  private dialogRef: HTMLIrDialogElement;

  componentDidLoad() {
    if (this.open) this.dialogRef?.openModal();
  }

  @Watch('open')
  handleOpenChange(open: boolean) {
    if (open) {
      this.dialogRef?.openModal();
    } else {
      this.dialogRef?.closeModal();
    }
  }

  render() {
    return (
      <ir-dialog label="Review your selections" lightDismiss={false} ref={el => (this.dialogRef = el)} onIrDialogHide={() => this.goBack.emit()}>
        <dl class="clone-rates-review__summary">
          {this.rows.map(row => (
            <div class="clone-rates-review__row" key={row.label}>
              <dt>{row.label}:</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
        <div slot="footer" class="ir-dialog__footer">
          <ir-custom-button size="m" appearance="outlined" variant="neutral" disabled={this.loading} onClickHandler={() => this.goBack.emit()}>
            Go back
          </ir-custom-button>
          <ir-custom-button size="m" variant="brand" loading={this.loading} onClickHandler={() => this.confirmClone.emit()}>
            Confirm
          </ir-custom-button>
        </div>
      </ir-dialog>
    );
  }
}
