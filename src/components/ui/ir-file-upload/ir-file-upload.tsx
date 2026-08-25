import { AttachInternals, Component, Element, Event, EventEmitter, Host, Method, Prop, Watch, h } from '@stencil/core';

/**
 * `ir-file-upload` — a form-associated file picker with a click/drag-and-drop
 * dropzone, modeled after Web Awesome's `wa-file-input` (a Pro component that
 * is not part of the bundled free package).
 *
 * Selected files are listed under the dropzone with an image thumbnail (for
 * image files) or a type icon, the file name, its formatted size and a remove
 * button. In `multiple` mode new picks/drops are appended (duplicates by
 * name+size+mtime are skipped); otherwise a new pick replaces the current file.
 *
 * Form integration: the component is form-associated — when `name` is set the
 * files are submitted as multipart entries under that name, `required` hooks
 * into constraint validation (`valueMissing` while no file is selected), and a
 * form reset clears the selection.
 *
 * `files` is a mutable prop: reassign it (never mutate it in place) to control
 * the selection from outside. Every user-driven change emits `filesChange`
 * with the full current list.
 *
 * @slot label - The label. Alternative to the `label` attribute when HTML is needed.
 * @slot hint - Text that describes how to use the input. Alternative to the `hint` attribute.
 * @slot dropzone - Replaces the default icon + text content of the dropzone.
 *
 * @part base - The component's wrapping container.
 * @part label - The label rendered above the dropzone (also exposed as `form-control-label`, like wa form controls).
 * @part hint - The hint rendered under the dropzone.
 * @part dropzone - The droppable/clickable zone (a label wired to the hidden file input).
 * @part dropzone-icon - The default upload icon inside the dropzone.
 * @part dropzone-text - The default instruction text inside the dropzone.
 * @part file-list - The list holding the selected files.
 * @part file - Each selected-file row.
 * @part file-thumbnail - The thumbnail container of a row (holds the image or the icon).
 * @part file-image - The `<img>` preview rendered for image files.
 * @part file-icon - The type icon rendered for non-image files.
 * @part file-details - The container holding the file name and size.
 * @part file-name - The file-name text of a row.
 * @part file-size - The formatted size text of a row.
 * @part remove-button - The per-row remove (×) `wa-button` (its inner base is re-exported as `remove-button__base`).
 */
@Component({
  tag: 'ir-file-upload',
  styleUrl: 'ir-file-upload.css',
  shadow: true,
  formAssociated: true,
})
export class IrFileUpload {
  @Element() el: HTMLIrFileUploadElement;

  @AttachInternals() internals: ElementInternals;

  /** The file input's label. If you need to display HTML, use the `label` slot instead. */
  @Prop() label: string = '';

  /** The file input's hint. If you need to display HTML, use the `hint` slot instead. */
  @Prop() hint: string = '';

  /** Accepted file types, same syntax as the native `accept` attribute (e.g. `".pdf,image/*"`). Empty = accept everything. */
  @Prop() accept: string = '';

  /** Camera/microphone to use for capturing media on mobile devices. */
  @Prop() capture?: 'user' | 'environment';

  /** Disables the dropzone, the file dialog and drops. Reflected for CSS hooks. */
  @Prop({ reflect: true }) disabled: boolean = false;

  /** Allows more than one file. New picks/drops are appended; without it a new pick replaces the current file. */
  @Prop() multiple: boolean = false;

  /** The name of the file input, submitted with the owning form as multipart entries. */
  @Prop() name: string | null = null;

  /** Makes a file selection required for the owning form to submit. */
  @Prop({ reflect: true }) required: boolean = false;

  /** The file input's visual size. Reflected for CSS hooks (`ir-file-upload[size='...']`). */
  @Prop({ reflect: true }) size: 'xs' | 's' | 'm' | 'l' | 'xl' = 'm';

  /** The selected files. Reassign (don't mutate) to control the selection from outside. */
  @Prop({ mutable: true }) files: File[] = [];

  /** True while files are dragged over the dropzone. Reflected so consumers can style `ir-file-upload[dragging]`. */
  @Prop({ mutable: true, reflect: true }) dragging: boolean = false;

  /** Fired with the full file list after every user-driven add or remove. */
  @Event() filesChange: EventEmitter<File[]>;

  private inputRef: HTMLInputElement;

  /** dragenter/dragleave fire for every child element; a depth counter keeps `dragging` flicker-free. */
  private dragDepth = 0;

  /** Message set via `setCustomValidity`; takes precedence over the built-in `required` check. */
  private customValidityMessage = '';

  /** Object URLs for image previews, keyed by file; revoked when the file leaves the list. */
  private thumbnails = new Map<File, string>();

  componentWillLoad() {
    this.syncFiles();
  }

  disconnectedCallback() {
    this.thumbnails.forEach(url => URL.revokeObjectURL(url));
    this.thumbnails.clear();
  }

  formResetCallback() {
    this.files = [];
  }

  @Watch('files')
  @Watch('required')
  @Watch('name')
  syncFiles() {
    this.pruneThumbnails();
    this.syncFormValue();
    this.updateValidity();
    this.setCustomState('blank', this.files.length === 0);
  }

  /** Sets focus on the file input. */
  @Method()
  async setFocus(options?: FocusOptions): Promise<void> {
    this.inputRef?.focus(options);
  }

  /** Removes focus from the file input. */
  @Method()
  async setBlur(): Promise<void> {
    this.inputRef?.blur();
  }

  /** Applies a custom validation message. Pass an empty string to restore the default validity checks. */
  @Method()
  async setCustomValidity(message: string): Promise<void> {
    this.customValidityMessage = message;
    this.updateValidity();
  }

  /** Clears a message set with `setCustomValidity`. */
  @Method()
  async resetValidity(): Promise<void> {
    this.customValidityMessage = '';
    this.updateValidity();
  }

  private handleInputChange = (e: globalThis.Event) => {
    const input = e.target as HTMLInputElement;
    if (input.files?.length) {
      this.addFiles(Array.from(input.files));
    }
    // Clearing the value lets the user re-pick a file they just removed.
    input.value = '';
  };

  private handleDragEnter = (e: DragEvent) => {
    e.preventDefault();
    if (this.disabled) return;
    this.dragDepth++;
    this.setDragging(true);
  };

  private handleDragOver = (e: DragEvent) => {
    // preventDefault is what marks the zone as a valid drop target.
    e.preventDefault();
  };

  private handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    this.dragDepth = Math.max(0, this.dragDepth - 1);
    if (this.dragDepth === 0) {
      this.setDragging(false);
    }
  };

  private handleDrop = (e: DragEvent) => {
    e.preventDefault();
    this.dragDepth = 0;
    this.setDragging(false);
    if (this.disabled) return;
    // Drops bypass the native picker's `accept` filtering, so filter here.
    const dropped = Array.from(e.dataTransfer?.files ?? []).filter(file => this.matchesAccept(file));
    if (dropped.length) {
      this.addFiles(dropped);
    }
  };

  private addFiles(incoming: File[]) {
    if (!this.multiple) {
      this.files = incoming.slice(0, 1);
    } else {
      const added = incoming.filter(file => !this.isDuplicate(file));
      if (!added.length) return;
      this.files = [...this.files, ...added];
    }
    this.filesChange.emit([...this.files]);
  }

  private removeFile(index: number) {
    this.files = this.files.filter((_, i) => i !== index);
    this.filesChange.emit([...this.files]);
  }

  private setDragging(dragging: boolean) {
    this.dragging = dragging;
    this.setCustomState('dragging', dragging);
  }

  private matchesAccept(file: File): boolean {
    if (!this.accept.trim()) {
      return true;
    }
    const name = file.name.toLowerCase();
    const type = (file.type || '').toLowerCase();
    return this.accept
      .split(',')
      .map(rule => rule.trim().toLowerCase())
      .filter(Boolean)
      .some(rule => {
        if (rule.startsWith('.')) return name.endsWith(rule);
        if (rule.endsWith('/*')) return type.startsWith(rule.slice(0, -1));
        return type === rule;
      });
  }

  private isDuplicate(file: File): boolean {
    return this.files.some(f => f.name === file.name && f.size === file.size && f.lastModified === file.lastModified);
  }

  /* The optional calls guard against partial ElementInternals implementations (e.g. Stencil's test mock). */

  private syncFormValue() {
    if (!this.name || this.files.length === 0) {
      this.internals?.setFormValue?.(null);
      return;
    }
    const formData = new FormData();
    this.files.forEach(file => formData.append(this.name, file));
    this.internals?.setFormValue?.(formData);
  }

  private updateValidity() {
    if (this.customValidityMessage) {
      this.internals?.setValidity?.({ customError: true }, this.customValidityMessage, this.inputRef);
    } else if (this.required && this.files.length === 0) {
      this.internals?.setValidity?.({ valueMissing: true }, this.multiple ? 'Please select one or more files.' : 'Please select a file.', this.inputRef);
    } else {
      this.internals?.setValidity?.({});
    }
  }

  /** Mirrors wa-file-input's `:state(blank)` / `:state(dragging)`; no-op where CustomStateSet is unsupported. */
  private setCustomState(state: string, on: boolean) {
    const states = (this.internals as ElementInternals & { states?: Set<string> }).states;
    if (!states) return;
    if (on) states.add(state);
    else states.delete(state);
  }

  private pruneThumbnails() {
    this.thumbnails.forEach((url, file) => {
      if (!this.files.includes(file)) {
        URL.revokeObjectURL(url);
        this.thumbnails.delete(file);
      }
    });
  }

  private getThumbnail(file: File): string | null {
    if (!file.type.startsWith('image/')) {
      return null;
    }
    if (!this.thumbnails.has(file)) {
      this.thumbnails.set(file, URL.createObjectURL(file));
    }
    return this.thumbnails.get(file);
  }

  /** Same type → icon mapping wa-file-input uses. */
  private fileIconName(file: File): string {
    const type = (file.type || '').toLowerCase();
    if (type === 'application/pdf') return 'file-pdf';
    if (type.startsWith('video/')) return 'file-video';
    if (type.startsWith('audio/')) return 'file-audio';
    if (type.includes('zip') || type.includes('compressed')) return 'file-zipper';
    if (type.includes('word')) return 'file-word';
    if (type.includes('excel') || type.includes('spreadsheet')) return 'file-excel';
    if (type.includes('powerpoint') || type.includes('presentation')) return 'file-powerpoint';
    if (type === 'text/csv') return 'file-csv';
    if (type.startsWith('text/')) return 'file-code';
    return 'file';
  }

  private hasSlot(name: string): boolean {
    return !!this.el.querySelector(`[slot="${name}"]`);
  }

  render() {
    const hasLabel = !!this.label || this.hasSlot('label');
    const hasHint = !!this.hint || this.hasSlot('hint');

    /* Markup mirrors wa-file-input: the dropzone is a <label> wired to the
       visually-hidden file input, so click-to-browse and keyboard activation
       are native behavior, and the focus ring is driven by the input's
       :focus-visible (see the CSS). */
    return (
      <Host>
        {hasLabel && (
          <label part="form-control-label label" class="label" htmlFor="file-input">
            <slot name="label">{this.label}</slot>
          </label>
        )}

        <div part="base" class="file-input">
          <label
            id="dropzone"
            part="dropzone"
            htmlFor="file-input"
            class={{ dropzone: true, dragging: this.dragging, disabled: this.disabled }}
            onDragEnter={this.handleDragEnter}
            onDragOver={this.handleDragOver}
            onDragLeave={this.handleDragLeave}
            onDrop={this.handleDrop}
          >
            <slot name="dropzone">
              <wa-icon part="dropzone-icon" class="dropzone-icon" name="upload" aria-hidden="true"></wa-icon>
              <span part="dropzone-text" class="dropzone-text">
                {this.multiple ? 'Drop files here or click to browse' : 'Drop file here or click to browse'}
              </span>
            </slot>

            <input
              id="file-input"
              type="file"
              class="hidden-input"
              accept={this.accept || undefined}
              capture={this.capture}
              multiple={this.multiple}
              disabled={this.disabled}
              aria-describedby={hasHint ? 'hint' : undefined}
              ref={el => (this.inputRef = el)}
              onChange={this.handleInputChange}
            />
          </label>

          {hasHint && (
            <div id="hint" part="hint" class="hint">
              <slot name="hint">{this.hint}</slot>
            </div>
          )}

          {this.files.length > 0 && (
            <ul part="file-list" class="file-list" role="list">
              {this.files.map((file, index) => {
                const thumbnail = this.getThumbnail(file);
                return (
                  <li part="file" class="file" key={`${file.name}-${file.size}-${file.lastModified}`}>
                    <span part="file-thumbnail" class="file-thumbnail">
                      {thumbnail ? (
                        <img part="file-image" class="file-image" src={thumbnail} alt="" />
                      ) : (
                        <wa-icon part="file-icon" name={this.fileIconName(file)} aria-hidden="true"></wa-icon>
                      )}
                    </span>
                    <span part="file-details" class="file-details">
                      <span part="file-name" class="file-name" title={file.name}>
                        {file.name}
                      </span>
                      <span part="file-size" class="file-size">
                        <wa-format-bytes value={file.size}></wa-format-bytes>
                      </span>
                    </span>
                    <wa-button
                      part="remove-button"
                      exportparts="base:remove-button__base"
                      class="remove-button"
                      appearance="plain"
                      variant="neutral"
                      size={this.size}
                      disabled={this.disabled}
                      onClick={() => this.removeFile(index)}
                    >
                      <wa-icon name="xmark" label={`Remove ${file.name}`}></wa-icon>
                    </wa-button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </Host>
    );
  }
}
