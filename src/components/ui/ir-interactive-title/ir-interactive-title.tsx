import { Component, Host, Prop, h, Element, Watch } from '@stencil/core';

@Component({
  tag: 'ir-interactive-title',
  styleUrl: 'ir-interactive-title.css',
  scoped: true,
})
export class IrInteractiveTitle {
  @Element() el: HTMLElement;

  /**
   * The full title string that may be cropped in the UI.
   */
  @Prop({ reflect: true }) popoverTitle: string;

  /**
   * CSS offset for the left position of the popover.
   * Used as a CSS variable `--ir-popover-left`.
   */
  @Prop() irPopoverLeft: string = '10px';

  /**
   * Whether to show the housekeeping (HK) status dot.
   */
  @Prop() hkStatus: boolean;

  /**
   * The number of characters to display before cropping the title with ellipsis.
   */
  @Prop() cropSize: number = 15;

  /**
   * The visible title (possibly cropped).
   * Computed during lifecycle based on content overflow.
   */
  private croppedTitle: string;

  /**
   * Reference to the span DOM element that holds the cropped title text.
   */
  private croppedTitleEl: HTMLSpanElement;

  componentWillLoad() {
    this.croppedTitle = this.popoverTitle;
  }

  componentDidLoad() {
    this.initializePopover();
  }

  disconnectedCallback() {
    this.disposePopover();
  }

  @Watch('popoverTitle')
  handleTitleChange(newValue: string, oldValue: string) {
    if (newValue !== oldValue) {
      this.disposePopover();
      this.croppedTitle = newValue;
      this.initializePopover(newValue);
    }
  }

  /**
   * Measures the width of the title and icon to determine if the text overflows.
   * If it does, crops the title and attaches a popover to the title element.
   * Otherwise, removes any existing popover.
   */
  private initializePopover(title?: string) {
    const titleElement = this.el.querySelector('.popover-title') as HTMLElement;
    const iconElement = this.el.querySelector('.hk-dot') as HTMLElement;
    const cropped_title = title ?? this.croppedTitle;
    if (!titleElement || !this.croppedTitleEl) {
      return;
    }
    const containerWidth = titleElement.offsetWidth;
    const textWidth = this.croppedTitleEl.scrollWidth;
    const iconWidth = iconElement ? iconElement.offsetWidth : 0;
    const isOverflowing = textWidth + iconWidth > containerWidth;

    if (isOverflowing) {
      this.croppedTitle = this.popoverTitle.slice(0, this.cropSize) + '...';
      this.croppedTitleEl.innerHTML = cropped_title;
      // this.render();
      $(titleElement).popover({
        trigger: 'hover',
        content: this.popoverTitle,
        placement: 'top',
      });
    } else {
      $(titleElement).popover('dispose');
    }
  }

  /**
   * Disposes of the Bootstrap popover associated with the `.popover-title` element.
   */
  private disposePopover() {
    const titleElement = this.el.querySelector('.popover-title') as HTMLElement;
    if (titleElement) {
      $(titleElement).popover('dispose');
    }
  }

  render() {
    return (
      <Host style={{ '--ir-popover-left': this.irPopoverLeft }}>
        <p
          class="popover-title"
          style={{
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          <span ref={el => (this.croppedTitleEl = el)} class="croppedTitle">
            {this.croppedTitle}
          </span>
          {/* {this.hkStatus && this.hkStatusColors[this.hkStatus] && <div title="occupied" style={{ '--dot-color': this.hkStatusColors[this.hkStatus] }} class={`hk-dot`}></div>} */}
          {this.hkStatus && (
            <div title="This unit is dirty" class={`hk-dot`}>
              <svg xmlns="http://www.w3.org/2000/svg" height="12" width="13.5" viewBox="0 0 576 512">
                <path
                  fill="currentColor"
                  d="M566.6 54.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-192 192-34.7-34.7c-4.2-4.2-10-6.6-16-6.6c-12.5 0-22.6 10.1-22.6 22.6l0 29.1L364.3 320l29.1 0c12.5 0 22.6-10.1 22.6-22.6c0-6-2.4-11.8-6.6-16l-34.7-34.7 192-192zM341.1 353.4L222.6 234.9c-42.7-3.7-85.2 11.7-115.8 42.3l-8 8C76.5 307.5 64 337.7 64 369.2c0 6.8 7.1 11.2 13.2 8.2l51.1-25.5c5-2.5 9.5 4.1 5.4 7.9L7.3 473.4C2.7 477.6 0 483.6 0 489.9C0 502.1 9.9 512 22.1 512l173.3 0c38.8 0 75.9-15.4 103.4-42.8c30.6-30.6 45.9-73.1 42.3-115.8z"
                />
              </svg>
            </div>
          )}
        </p>
      </Host>
    );
  }
}
