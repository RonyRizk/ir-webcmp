import { Component, Host, Prop, h, Element, Listen } from '@stencil/core';

@Component({
  tag: 'ir-popover',
  styleUrl: 'ir-popover.css',
  shadow: false,
})
export class IrPopover {
  @Element() el: HTMLElement;
  /**
   * Content to display inside the popover.
   * Can be plain text or HTML depending on `renderContentAsHtml`.
   */
  @Prop() content: string;

  /**
   * Horizontal offset (left) of the popover from its trigger.
   * Used in inline style as `--ir-popover-left`.
   */
  @Prop() irPopoverLeft: string = '10px';

  /**
   * Position of the popover relative to the trigger.
   * Options: `'top'`, `'bottom'`, `'left'`, `'right'`, `'auto'`.
   */
  @Prop() placement: 'top' | 'bottom' | 'left' | 'right' | 'auto' = 'auto';

  /**
   * Event that triggers the popover.
   * Options: `'focus'`, `'click'`, `'hover'`.
   */
  @Prop() trigger: 'focus' | 'click' | 'hover' = 'focus';

  /**
   * Whether to treat `content` as raw HTML.
   * When true, `content` will be injected with `html: true` in jQuery popover.
   */
  @Prop() renderContentAsHtml: boolean = false;

  /**
   * Internal flag to ensure popover is only initialized once.
   */
  private initialized: boolean = false;

  /**
   * Reference to the HTML element that triggers the popover.
   */
  private popoverTrigger: HTMLElement;

  @Listen('keydown', { target: 'window' })
  handleKeyDown(ev: KeyboardEvent) {
    if (ev.key === 'Escape') {
      this.closePopover();
    }
  }

  @Listen('click', { target: 'window' })
  handleWindowClick(ev: MouseEvent) {
    if (this.trigger !== 'click') return;
    
    const target = ev.target as HTMLElement;
    
    // 1. If we clicked the trigger itself, let Bootstrap's native toggle logic handle it.
    if (this.popoverTrigger && this.popoverTrigger.contains(target)) {
      return;
    }
    
    // 2. Check if the click was inside any active popover element (usually appended to body).
    // Bootstrap 4 uses the '.popover' class.
    const activePopovers = document.querySelectorAll('.popover.show');
    let clickedInsidePopover = false;
    activePopovers.forEach(p => {
      if (p.contains(target)) {
        clickedInsidePopover = true;
      }
    });

    // 3. If we clicked outside both the trigger AND the popover content, hide it.
    if (!clickedInsidePopover) {
      this.closePopover();
    }
  }

  componentDidLoad() {
    if (this.initialized) {
      return;
    }
    this.initializePopover();
  }

  private closePopover() {
    if (this.popoverTrigger) {
      // Use jQuery to hide the Bootstrap popover
      $(this.popoverTrigger).popover('hide');
    }
  }

  /**
   * Initializes the jQuery popover on the trigger element using configured props.
   */
  private initializePopover() {
    $(this.popoverTrigger).popover({
      trigger: this.trigger,
      content: this.content,
      placement: this.placement,
      html: this.renderContentAsHtml,
    });
    this.initialized = true;
  }

  disconnectedCallback() {
    $(this.popoverTrigger).popover('dispose');
  }

  render() {
    return (
      <Host style={{ '--ir-popover-left': this.irPopoverLeft }}>
        {this.trigger !== 'focus' ? (
          <p
            ref={el => (this.popoverTrigger = el)}
            class="popover-title m-0 p-0"
            style={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              cursor: 'pointer',
            }}
          >
            <slot />
          </p>
        ) : (
          <button tabindex="0" class="popover-trigger" ref={el => (this.popoverTrigger = el)}>
            <slot />
          </button>
        )}
      </Host>
    );
  }
}
