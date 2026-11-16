import { Component, Element, Event, EventEmitter, Host, Prop, State, h } from '@stencil/core';
import { inlineOffset, inlineSign } from '@/utils/direction';

@Component({
  tag: 'ir-channel-header',
  styleUrl: 'ir-channel-header.css',
  scoped: true,
})
export class IrChannelHeader {
  @Element() el: HTMLElement;
  @Prop() headerTitles: { id: string; name: string; disabled: boolean }[] = [];
  @State() selectedIndex: number = 0;
  @Event() tabChanged: EventEmitter<string>;

  private activeIndicator: HTMLSpanElement;
  private animationFrameId: number;

  componentDidLoad() {
    this.updateActiveIndicator();
  }

  disconnectedCallback() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  handleTabSelection(index: number) {
    this.selectedIndex = index;
    this.updateActiveIndicator();
    this.tabChanged.emit(this.headerTitles[this.selectedIndex].id);
  }

  updateActiveIndicator() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    requestAnimationFrame(() => {
      const selectedTab = this.el.querySelector(`li.tab[data-state="selected"]`);
      if (selectedTab) {
        const tabRect = selectedTab.getBoundingClientRect();
        // Measured on the inline axis: the indicator starts at the strip's inline start,
        // which is the right edge under RTL, so a raw physical offset walks it the wrong way.
        const position = inlineOffset(tabRect, this.el.getBoundingClientRect());
        this.activeIndicator.style.width = `${tabRect.width}px`;
        this.activeIndicator.style.transform = `translateX(${position * inlineSign()}px)`;
      }
    });
  }

  render() {
    return (
      <Host>
        <ul class="px-1">
          {this.headerTitles.map((title, index) => (
            <li
              class={`tab ${title.disabled ? 'text-light' : ''}`}
              key={title.id}
              onClick={() => {
                if (!title.disabled) this.handleTabSelection(index);
              }}
              data-disabled={title.disabled}
              data-state={this.selectedIndex === index ? 'selected' : ''}
            >
              {title.name}
            </li>
          ))}
        </ul>
        <span class="active-indicator" ref={el => (this.activeIndicator = el)}></span>
      </Host>
    );
  }
}
