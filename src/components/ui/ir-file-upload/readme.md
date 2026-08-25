# ir-file-upload



<!-- Auto Generated Below -->


## Overview

`ir-file-upload` — a form-associated file picker with a click/drag-and-drop
dropzone, modeled after Web Awesome's `wa-file-input` (a Pro component that
is not part of the bundled free package).

Selected files are listed under the dropzone with an image thumbnail (for
image files) or a type icon, the file name, its formatted size and a remove
button. In `multiple` mode new picks/drops are appended (duplicates by
name+size+mtime are skipped); otherwise a new pick replaces the current file.

Form integration: the component is form-associated — when `name` is set the
files are submitted as multipart entries under that name, `required` hooks
into constraint validation (`valueMissing` while no file is selected), and a
form reset clears the selection.

`files` is a mutable prop: reassign it (never mutate it in place) to control
the selection from outside. Every user-driven change emits `filesChange`
with the full current list.

## Properties

| Property   | Attribute  | Description                                                                                                           | Type                                | Default     |
| ---------- | ---------- | --------------------------------------------------------------------------------------------------------------------- | ----------------------------------- | ----------- |
| `accept`   | `accept`   | Accepted file types, same syntax as the native `accept` attribute (e.g. `".pdf,image/*"`). Empty = accept everything. | `string`                            | `''`        |
| `capture`  | `capture`  | Camera/microphone to use for capturing media on mobile devices.                                                       | `"environment" \| "user"`           | `undefined` |
| `disabled` | `disabled` | Disables the dropzone, the file dialog and drops. Reflected for CSS hooks.                                            | `boolean`                           | `false`     |
| `dragging` | `dragging` | True while files are dragged over the dropzone. Reflected so consumers can style `ir-file-upload[dragging]`.          | `boolean`                           | `false`     |
| `files`    | --         | The selected files. Reassign (don't mutate) to control the selection from outside.                                    | `File[]`                            | `[]`        |
| `hint`     | `hint`     | The file input's hint. If you need to display HTML, use the `hint` slot instead.                                      | `string`                            | `''`        |
| `label`    | `label`    | The file input's label. If you need to display HTML, use the `label` slot instead.                                    | `string`                            | `''`        |
| `multiple` | `multiple` | Allows more than one file. New picks/drops are appended; without it a new pick replaces the current file.             | `boolean`                           | `false`     |
| `name`     | `name`     | The name of the file input, submitted with the owning form as multipart entries.                                      | `string`                            | `null`      |
| `required` | `required` | Makes a file selection required for the owning form to submit.                                                        | `boolean`                           | `false`     |
| `size`     | `size`     | The file input's visual size. Reflected for CSS hooks (`ir-file-upload[size='...']`).                                 | `"l" \| "m" \| "s" \| "xl" \| "xs"` | `'m'`       |


## Events

| Event         | Description                                                          | Type                  |
| ------------- | -------------------------------------------------------------------- | --------------------- |
| `filesChange` | Fired with the full file list after every user-driven add or remove. | `CustomEvent<File[]>` |


## Methods

### `resetValidity() => Promise<void>`

Clears a message set with `setCustomValidity`.

#### Returns

Type: `Promise<void>`



### `setBlur() => Promise<void>`

Removes focus from the file input.

#### Returns

Type: `Promise<void>`



### `setCustomValidity(message: string) => Promise<void>`

Applies a custom validation message. Pass an empty string to restore the default validity checks.

#### Parameters

| Name      | Type     | Description |
| --------- | -------- | ----------- |
| `message` | `string` |             |

#### Returns

Type: `Promise<void>`



### `setFocus(options?: FocusOptions) => Promise<void>`

Sets focus on the file input.

#### Parameters

| Name      | Type           | Description |
| --------- | -------------- | ----------- |
| `options` | `FocusOptions` |             |

#### Returns

Type: `Promise<void>`




## Slots

| Slot         | Description                                                                    |
| ------------ | ------------------------------------------------------------------------------ |
| `"dropzone"` | Replaces the default icon + text content of the dropzone.                      |
| `"hint"`     | Text that describes how to use the input. Alternative to the `hint` attribute. |
| `"label"`    | The label. Alternative to the `label` attribute when HTML is needed.           |


## Shadow Parts

| Part                   | Description                                                                                          |
| ---------------------- | ---------------------------------------------------------------------------------------------------- |
| `"base"`               | The component's wrapping container.                                                                  |
| `"dropzone"`           | The droppable/clickable zone (a label wired to the hidden file input).                               |
| `"dropzone-icon"`      | The default upload icon inside the dropzone.                                                         |
| `"dropzone-text"`      | The default instruction text inside the dropzone.                                                    |
| `"file"`               | Each selected-file row.                                                                              |
| `"file-details"`       | The container holding the file name and size.                                                        |
| `"file-icon"`          | The type icon rendered for non-image files.                                                          |
| `"file-image"`         | The `<img>` preview rendered for image files.                                                        |
| `"file-list"`          | The list holding the selected files.                                                                 |
| `"file-name"`          | The file-name text of a row.                                                                         |
| `"file-size"`          | The formatted size text of a row.                                                                    |
| `"file-thumbnail"`     | The thumbnail container of a row (holds the image or the icon).                                      |
| `"form-control-label"` |                                                                                                      |
| `"hint"`               | The hint rendered under the dropzone.                                                                |
| `"label"`              | The label rendered above the dropzone (also exposed as `form-control-label`, like wa form controls). |
| `"remove-button"`      | The per-row remove (×) `wa-button` (its inner base is re-exported as `remove-button__base`).         |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
