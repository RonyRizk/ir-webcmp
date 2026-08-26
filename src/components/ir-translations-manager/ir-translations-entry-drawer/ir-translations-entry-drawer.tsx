import { Component, Event, EventEmitter, Prop, State, h } from '@stencil/core';
import { TranslationEntry, TranslationLanguage } from '../types';

/**
 * Dumb open/close shell — the nested ir-translations-entry-form owns the
 * draft, validation, and the actual save call.
 */
@Component({
  tag: 'ir-translations-entry-drawer',
  styleUrl: 'ir-translations-entry-drawer.css',
  scoped: true,
})
export class IrTranslationsEntryDrawer {
  @Prop() open: boolean = false;
  @Prop() formId: string = 'translations-entry-form';
  @Prop() languages: TranslationLanguage[] = [];
  /** The entry being edited. Null puts the drawer in create mode. */
  @Prop() entry: TranslationEntry | null = null;
  /** Keys already used in the active table, for duplicate detection. */
  @Prop() existingKeys: string[] = [];
  /** DISPLAY_ORDER a brand-new key should get — one past the highest order already in the table. */
  @Prop() nextDisplayOrder: number = 0;
  @Prop() tableName: string;
  @Prop() ownerId: number;
  @Prop() entryUserId: number;

  @Event() closeDrawer: EventEmitter<void>;
  @Event() entrySaved: EventEmitter<void>;

  @State() saveDisabled: boolean = true;
  @State() isSubmitting: boolean = false;

  render() {
    const isEditing = !!this.entry;

    return (
      <ir-drawer label={isEditing ? 'Edit key' : 'New key'} open={this.open} onDrawerHide={() => this.closeDrawer.emit()}>
        {this.open && (
          <ir-translations-entry-form
            formId={this.formId}
            languages={this.languages}
            entry={this.entry}
            existingKeys={this.existingKeys}
            nextDisplayOrder={this.nextDisplayOrder}
            tableName={this.tableName}
            ownerId={this.ownerId}
            entryUserId={this.entryUserId}
            onSubmitDisabledChange={(e: CustomEvent<boolean>) => (this.saveDisabled = e.detail)}
            onIsSubmittingChange={(e: CustomEvent<boolean>) => (this.isSubmitting = e.detail)}
            onEntrySaved={(e: CustomEvent<void>) => {
              e.stopImmediatePropagation();
              e.stopPropagation();
              this.entrySaved.emit();
              this.closeDrawer.emit();
            }}
          ></ir-translations-entry-form>
        )}

        <div slot="footer" class="ir__drawer-footer">
          <ir-custom-button size="m" appearance="outlined" variant="neutral" disabled={this.isSubmitting} onClickHandler={() => this.closeDrawer.emit()}>
            Cancel
          </ir-custom-button>
          <ir-custom-button
            size="m"
            appearance="accent"
            variant="brand"
            form={this.formId}
            type="submit"
            disabled={this.saveDisabled || this.isSubmitting}
            loading={this.isSubmitting}
          >
            Save
          </ir-custom-button>
        </div>
      </ir-drawer>
    );
  }
}
