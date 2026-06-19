import { Component, h, State } from '@stencil/core';

@Component({
  tag: 'ir-filter-card',
  styleUrl: 'ir-filter-card.css',
  shadow: true,
})
export class IrFilterCard {
  /** Viewport at/above which the filter body is always shown and the toggle is hidden. */
  private static readonly DESKTOP_QUERY = '(min-width: 1024px)';

  @State() collapsed: boolean = true;
  @State() isDesktop: boolean = false;

  private mediaQuery?: MediaQueryList;

  componentWillLoad() {
    this.mediaQuery = window.matchMedia(IrFilterCard.DESKTOP_QUERY);
    this.isDesktop = this.mediaQuery.matches;
    this.mediaQuery.addEventListener('change', this.handleViewportChange);
  }

  disconnectedCallback() {
    this.mediaQuery?.removeEventListener('change', this.handleViewportChange);
  }

  private handleViewportChange = (e: MediaQueryListEvent) => {
    this.isDesktop = e.matches;
  };

  render() {
    // On desktop the body is always expanded; the collapse state only applies below the breakpoint.
    const expanded = this.isDesktop || !this.collapsed;
    return (
      <wa-card class={expanded ? '' : 'filters__card__collapsed'}>
        <div part="header" class="filters__header" slot="header">
          <div class="filters__title-group">
            <wa-icon name="filter" style={{ fontSize: '1rem' }}></wa-icon>
            <h4 class="filters__title">Filter</h4>
          </div>
          {!this.isDesktop && (
            <ir-custom-button
              appearance="plain"
              class="filters__collapse-btn"
              variant="neutral"
              id="drawer-icon"
              aria-expanded={expanded ? 'true' : 'false'}
              aria-controls="hkTasksFiltersCollapse"
              onClickHandler={() => (this.collapsed = !this.collapsed)}
            >
              <wa-icon style={{ fontSize: '1rem' }} name={expanded ? 'eye-slash' : 'eye'}></wa-icon>
            </ir-custom-button>
          )}
        </div>
        <div part="filter-body" class={'filters__body'}>
          <slot></slot>
        </div>
        <div part="footer" class={'filters__actions'}>
          <slot name="footer"></slot>
        </div>
      </wa-card>
    );
  }
}
