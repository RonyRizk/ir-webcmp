import type Quill from 'quill';

type ComposedSelection = Selection & { getComposedRanges?: (options: { shadowRoots: ShadowRoot[] }) => StaticRange[] };
type LegacyShadowRoot = ShadowRoot & { getSelection?: () => Selection | null };

/**
 * Quill reads the current selection via `document.getSelection()`, which collapses to the
 * shadow host in Chromium and WebKit. Resolve a real Range from inside the shadow root:
 * Chromium's non-standard `shadowRoot.getSelection()`, then the standard
 * `Selection.getComposedRanges()` (Safari 17+/modern engines), then the plain document
 * selection (Gecko exposes shadow contents there natively).
 */
function getShadowSelectionRange(shadowRoot: ShadowRoot): Range | null {
  const legacyRoot = shadowRoot as LegacyShadowRoot;
  if (typeof legacyRoot.getSelection === 'function') {
    const selection = legacyRoot.getSelection();
    return selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
  }
  const selection = document.getSelection() as ComposedSelection | null;
  if (!selection) {
    return null;
  }
  if (typeof selection.getComposedRanges === 'function') {
    const [staticRange] = selection.getComposedRanges({ shadowRoots: [shadowRoot] });
    if (!staticRange) {
      return null;
    }
    const range = document.createRange();
    range.setStart(staticRange.startContainer, staticRange.startOffset);
    range.setEnd(staticRange.endContainer, staticRange.endOffset);
    return range;
  }
  return selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
}

function composedActiveElement(): Element | null {
  let active = document.activeElement;
  while (active?.shadowRoot?.activeElement) {
    active = active.shadowRoot.activeElement;
  }
  return active;
}

const FORWARDED_EVENTS = ['selectionchange', 'mousedown', 'mouseup', 'click'] as const;
const SHADOW_EVENTS = ['mousedown', 'mouseup', 'click'] as const;

/**
 * Makes a Quill instance functional inside a shadow root. Quill dispatches document-level
 * `selectionchange`/`mousedown`/`mouseup`/`click` events to instances it finds via
 * `document.querySelectorAll('.ql-container')`, which never sees shadow DOM, and its
 * selection/focus checks use `document.getSelection()`/`document.activeElement`, which stop
 * at the shadow boundary. All overrides are instance-level (own properties), never on
 * prototypes. Returns a teardown function that removes the added listeners.
 */
export function patchQuillForShadowDom(quill: Quill, host: HTMLElement): () => void {
  const shadowRoot = host.shadowRoot;
  const selection = quill.selection as any;

  // normalizeNative() already returns null for ranges outside quill.root, so it is safe to
  // hand it any composed range we resolve.
  selection.getNativeRange = () => {
    const nativeRange = getShadowSelectionRange(shadowRoot);
    return nativeRange ? selection.normalizeNative(nativeRange) : null;
  };

  selection.hasFocus = () => {
    const active = composedActiveElement();
    return active === quill.root || (active != null && quill.root.contains(active));
  };

  // Replicates Emitter.handleDOM's target gate (quill@2.0.3 core/emitter.js:62) made
  // composed-aware; `emitter.domListeners` is private Quill API — re-verify on upgrade.
  const dispatchComposed = (event: Event) => {
    const emitter = quill.emitter as any;
    const listeners: { node: Node; handler: (e: Event) => void }[] = emitter?.domListeners?.[event.type] ?? [];
    const target = event.composedPath()[0] as Node;
    listeners.forEach(({ node, handler }) => {
      if (target === node || node.contains(target) || node === document || node.contains(host)) {
        handler(event);
      }
    });
  };
  const onDocumentEvent = (event: Event) => {
    // Events originating inside the shadow root reach the document retargeted to the host;
    // the shadowRoot listener already dispatched them with their true target.
    if (event.type !== 'selectionchange' && event.composedPath().includes(host)) {
      return;
    }
    dispatchComposed(event);
  };
  const onShadowEvent = (event: Event) => dispatchComposed(event);

  FORWARDED_EVENTS.forEach(name => document.addEventListener(name, onDocumentEvent));
  SHADOW_EVENTS.forEach(name => shadowRoot.addEventListener(name, onShadowEvent));

  return () => {
    FORWARDED_EVENTS.forEach(name => document.removeEventListener(name, onDocumentEvent));
    SHADOW_EVENTS.forEach(name => shadowRoot.removeEventListener(name, onShadowEvent));
  };
}
