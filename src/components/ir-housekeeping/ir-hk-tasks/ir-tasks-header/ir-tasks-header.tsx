import { updateSearchField, hkTasksStore } from '@/stores/hk-tasks.store';
import locales from '@/stores/locales.store';
import { Component, Element, Event, EventEmitter, h, Host } from '@stencil/core';
import WaAnimation from '@awesome.me/webawesome/dist/components/animation/animation';

@Component({
  tag: 'ir-tasks-header',
  styleUrl: 'ir-tasks-header.css',
  scoped: true,
})
export class IrTasksHeader {
  @Element() el: HTMLIrTasksHeaderElement;
  @Event() headerButtonPress: EventEmitter<{ name: 'cleaned' | 'export' | 'archive' | 'clean-inspect' }>;

  private cleanAndInspectEl: WaAnimation;
  private cleanEl: WaAnimation;
  private prevSelectedCount = 0;

  componentDidRender() {
    const count = hkTasksStore.selectedTasks.length;
    if (count > this.prevSelectedCount) {
      if (!this.cleanAndInspectEl) {
        this.cleanAndInspectEl = this.el.querySelector('#cleanInspectAnimation') as WaAnimation;
      }
      if (!this.cleanEl) {
        this.cleanEl = this.el.querySelector('#cleanAnimation') as WaAnimation;
      }
      if (this.cleanAndInspectEl) this.cleanAndInspectEl.play = true;
      if (this.cleanEl) this.cleanEl.play = true;
    }
    this.prevSelectedCount = count;
  }

  render() {
    return (
      <Host>
        {/* <h3 class="mb-1 mb-md-0">Housekeeping Tasks</h3> */}
        <div class="search-filter-container" style={{ gap: '1rem' }}>
          <ir-input placeholder="Search unit" class="search-filter-input" value={hkTasksStore.searchField} onText-change={e => updateSearchField(e.detail)}>
            <wa-icon name="magnifying-glass" slot="start"></wa-icon>
          </ir-input>
        </div>
        <div class="action-buttons" style={{ gap: '1rem' }}>
          <ir-custom-button
            appearance="outlined"
            variant="neutral"
            onClickHandler={e => {
              e.stopImmediatePropagation();
              e.stopPropagation();
              this.headerButtonPress.emit({ name: 'export' });
            }}
          >
            <wa-icon slot="end" name="file-excel"></wa-icon>
            {locales.entries.Lcz_Export}
          </ir-custom-button>

          <ir-custom-button
            appearance="outlined"
            variant="neutral"
            onClickHandler={e => {
              e.stopImmediatePropagation();
              e.stopPropagation();
              this.headerButtonPress.emit({ name: 'archive' });
            }}
          >
            {locales.entries.Lcz_Archives}
          </ir-custom-button>
          <wa-animation iterations={1} id="cleanInspectAnimation" class="clean-button" name="rubberBand" easing="ease-in-out" duration={800}>
            <ir-custom-button
              appearance="filled"
              variant="brand"
              onClickHandler={e => {
                e.stopImmediatePropagation();
                e.stopPropagation();
                this.headerButtonPress.emit({ name: 'clean-inspect' });
              }}
              disabled={!(hkTasksStore.selectedTasks.length > 0)}
            >
              Clean & Inspect
            </ir-custom-button>
          </wa-animation>
          <wa-animation iterations={1} id="cleanAnimation" class="clean-button" name="rubberBand" easing="ease-in-out" duration={800}>
            <ir-custom-button
              disabled={!(hkTasksStore.selectedTasks.length > 0)}
              onClickHandler={e => {
                e.stopImmediatePropagation();
                e.stopPropagation();
                this.headerButtonPress.emit({ name: 'cleaned' });
              }}
              variant="brand"
            >
              Cleaned
            </ir-custom-button>
          </wa-animation>
        </div>
      </Host>
    );
  }
}
