import { SetupService } from '@/services/setup';
import { showToast } from '@/utils/utils';
import { Component, Event, EventEmitter, Prop, State, h } from '@stencil/core';
import { buildEditSetupParams } from '../../setup-mapping';
import { TranslationTable } from '../../types';

/**
 * Owns the table name draft and saves it directly — the dialog around this
 * form is a dumb open/close shell.
 *
 * Setup only lists tables that already have at least one row, so creating a
 * table and renaming an empty one are purely local (no API call); renaming a
 * non-empty table has to recreate every entry under the new TBL_NAME and
 * soft-delete the old rows, since there's no bulk-rename endpoint.
 */
@Component({
  tag: 'ir-translations-table-form',
  styleUrl: 'ir-translations-table-form.css',
  scoped: true,
})
export class IrTranslationsTableForm {
  @Prop() formId: string;
  @Prop() mode: 'create' | 'edit' = 'create';
  @Prop() table: TranslationTable | null = null;
  /** Names of the other tables, for duplicate detection. */
  @Prop() existingNames: string[] = [];
  @Prop() ownerId: number;
  @Prop() entryUserId: number;

  @Event() tableSaved: EventEmitter<{ id: string; name: string; mode: 'create' | 'edit' }>;
  @Event() tableSaveFailed: EventEmitter<void>;
  @Event() submitDisabledChange: EventEmitter<boolean>;
  @Event() isSubmittingChange: EventEmitter<boolean>;

  @State() name: string = '';
  @State() isSubmitting: boolean = false;

  private nameInputRef?: HTMLIrInputElement;
  private setupService = new SetupService();

  componentWillLoad() {
    this.name = this.table?.name ?? '';
    this.submitDisabledChange.emit(!this.isValid);
  }

  componentDidLoad() {
    requestAnimationFrame(() => this.nameInputRef?.focusInput());
  }

  private get isDuplicateName(): boolean {
    const name = this.name.trim().toLowerCase();
    if (!name) {
      return false;
    }
    return this.existingNames.some(existing => existing.toLowerCase() === name && existing !== this.table?.name);
  }

  private get isValid(): boolean {
    return this.name.trim().length > 0 && !this.isDuplicateName;
  }

  private handleNameChange(value: string) {
    this.name = value ?? '';
    this.submitDisabledChange.emit(!this.isValid);
  }

  private handleSubmit = async (event: Event) => {
    event.preventDefault();
    if (!this.isValid) {
      return;
    }

    const newName = this.name.trim();

    if (this.mode === 'create' || !this.table || this.table.entries.length === 0) {
      this.tableSaved.emit({ id: newName, name: newName, mode: this.mode });
      return;
    }

    const table = this.table;
    this.isSubmitting = true;
    this.isSubmittingChange.emit(true);
    try {
      await Promise.all(
        table.entries.map(entry =>
          this.setupService.editSetup(
            buildEditSetupParams({ ownerId: this.ownerId, entryUserId: this.entryUserId, tableName: newName, key: entry.key, values: entry.values, meta: entry.meta }),
          ),
        ),
      );
      await Promise.all(
        table.entries.map(entry =>
          this.setupService.editSetup(
            buildEditSetupParams({
              ownerId: this.ownerId,
              entryUserId: this.entryUserId,
              tableName: table.name,
              key: entry.key,
              values: entry.values,
              meta: entry.meta,
              isDeleted: true,
            }),
          ),
        ),
      );
      showToast({ type: 'success', title: 'Table renamed' });
      this.tableSaved.emit({ id: newName, name: newName, mode: 'edit' });
    } catch (error) {
      console.error(error);
      showToast({ type: 'error', title: 'Rename may be incomplete — reloading tables' });
      this.tableSaveFailed.emit();
    } finally {
      this.isSubmitting = false;
      this.isSubmittingChange.emit(false);
    }
  };

  render() {
    return (
      <form id={this.formId} class="table-form__body" onSubmit={this.handleSubmit} novalidate>
        <ir-input
          label="Name"
          autocomplete="off"
          value={this.name}
          placeholder="e.g. Booking emails"
          onText-change={e => this.handleNameChange(e.detail)}
          ref={el => (this.nameInputRef = el)}
        ></ir-input>
        {this.isDuplicateName && (
          <p class="table-form__error" role="alert">
            A table with this name already exists.
          </p>
        )}
      </form>
    );
  }
}
