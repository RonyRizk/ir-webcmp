import { Component, Element, Host, Listen, Method, Prop, Watch, h } from '@stencil/core';

@Component({
  tag: 'ir-menu',
  styleUrl: 'ir-menu.css',
  shadow: true,
})
export class IrMenu {
  @Element() el: HTMLElement;

  private menuGroups: HTMLIrMenuGroupElement[] = [];
  private menuItems: HTMLIrMenuItemElement[] = [];

  @Prop({ reflect: true, mutable: true }) selectedHref?: string;

  componentWillLoad() {
    const initialHref = this.selectedHref ?? this.getCurrentLocation();
    this.selectedHref = this.normalizeHref(initialHref);
  }

  componentDidLoad() {
    this.handleSlotChange();
  }

  @Listen('popstate', { target: 'window' })
  handleLocationChange() {
    this.updateSelectedHref(this.getCurrentLocation());
  }

  @Method()
  async setSelectedHref(href?: string) {
    this.updateSelectedHref(href);
  }

  @Watch('selectedHref')
  handleSelectedHrefChange(newValue?: string) {
    this.applySelection(newValue);
  }

  private handleSlotChange = () => {
    this.menuGroups = Array.from(this.el.querySelectorAll('ir-menu-group'));
    this.menuItems = Array.from(this.el.querySelectorAll('ir-menu-item'));
    this.applySelection(this.selectedHref);
  };

  private updateSelectedHref(href?: string) {
    const normalized = this.normalizeHref(href);
    if (normalized !== this.selectedHref) {
      this.selectedHref = normalized;
    }
  }

  private getCurrentLocation(): string | undefined {
    if (typeof window === 'undefined') return undefined;
    const { pathname, search, hash } = window.location;
    const cleanPath = pathname.replace(/\/+$/, '') || '/';
    let lastSegment = cleanPath.split('/').pop() ?? cleanPath;
    if (lastSegment === '') {
      lastSegment = '/';
    }
    return `${lastSegment}${search}${hash}`;
  }

  private normalizeHref(href?: string): string | undefined {
    if (!href) return undefined;
    if (typeof window === 'undefined') return href;

    try {
      const url = new URL(href, window.location.origin);
      const normalizedPath = url.pathname.replace(/\/+$/, '') || '/';
      return `${normalizedPath}${url.search}${url.hash}`;
    } catch {
      return href;
    }
  }

  private applySelection(targetHref?: string) {
    const normalizedTarget = this.normalizeHref(targetHref);
    this.menuItems.forEach(item => {
      const itemHref = this.normalizeHref(item.href);
      const shouldSelect = !!normalizedTarget && itemHref === normalizedTarget;

      if (item.selected !== shouldSelect) {
        item.selected = shouldSelect;
      }
    });
  }

  private openGroupForSelectedHref(targetHref?: string) {
    const normalizedTarget = this.normalizeHref(targetHref);
    if (!normalizedTarget) return;

    for (const item of this.menuItems) {
      const itemHref = this.normalizeHref(item.href);
      if (itemHref === normalizedTarget) {
        const group = item.closest('ir-menu-group') as HTMLIrMenuGroupElement | null;
        if (group && !group.open) {
          group.open = true;
        }
        break;
      }
    }
  }

  @Listen('click', { capture: true })
  handleItemClick(event: Event) {
    const path = event.composedPath();
    const menuItem = path.find(node => {
      if (!(node instanceof HTMLElement)) return false;
      return node.tagName?.toLowerCase() === 'ir-menu-item';
    }) as HTMLIrMenuItemElement | undefined;

    if (menuItem?.href) {
      this.updateSelectedHref(menuItem.href);
    }
  }

  @Listen('openChanged')
  handleGroupOpen(e: CustomEvent<boolean>) {
    if (!e.detail) return;

    const openedGroup = e.target as HTMLIrMenuGroupElement;
    const groupName = openedGroup.groupName;

    for (const group of this.menuGroups) {
      if (group !== openedGroup && group.groupName === groupName && group.open) {
        group.open = false;
      }
    }
  }

  @Listen('menuOpenChanged', { target: 'body' })
  handleOpenChange(e: CustomEvent<boolean>) {
    e.stopImmediatePropagation();
    e.stopPropagation();
    if (e.detail) {
      const href = this.selectedHref ?? this.getCurrentLocation();
      this.openGroupForSelectedHref(href);

    }
  }


  render() {
    return (
      <Host>
        <slot onSlotchange={this.handleSlotChange} />
      </Host>
    );
  }
}
