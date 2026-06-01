import { Component, h, Prop, Event, EventEmitter } from '@stencil/core';
import { GHS_Candidate_Property } from '../../services/ghs/types';

@Component({
  tag: 'ir-ghs-selection-bucket',
  styleUrls: ['ir-ghs-selection-bucket.css', '../../common/table.css'],
  scoped: true,
})
export class IrGhsSelectionBucket {
  @Prop() selectedProperties: GHS_Candidate_Property[] = [];
  @Prop() isGenerating: boolean = false;

  @Event() generateRequest: EventEmitter<void>;
  @Event() removeAll: EventEmitter<void>;
  @Event() removeProperty: EventEmitter<number>;

  render() {
    return (
      <wa-card class="ir-ghs-selection-bucket__container">
          <div slot="header" class="ir-ghs-selection-bucket__header">
            <div class="ir-ghs-selection-bucket__header-left">
              <h3 class="ir-ghs-selection-bucket__title">To be added</h3>
              <wa-badge variant="brand">{this.selectedProperties.length}</wa-badge>
            </div>
            <div class="ir-ghs-selection-bucket__header-right">
              <ir-custom-button 
                type="button"
                size="small" 
                variant="brand" 
                appearance="filled"
                loading={this.isGenerating}
                onClickHandler={(e: CustomEvent) => {
                  const ev = e.detail as MouseEvent;
                  if (ev && typeof ev.preventDefault === 'function') {
                      ev.preventDefault();
                      ev.stopPropagation();
                  }
                  this.generateRequest.emit();
                }} 
                disabled={this.selectedProperties.length === 0}
              >
                Generate request
              </ir-custom-button>
            </div>
         </div>

         <div class="ir-ghs-selection-bucket__body">
            <div class="ir-ghs-selection-bucket__table-wrapper table--container">
              <table class="ir-ghs-selection-bucket__table table align-middle mb-0">
                <thead>
                  <tr class="ir-ghs-selection-bucket__header-row table-header">
                    <th class="ir-ghs-selection-bucket__header-cell">Property name</th>
                    <th class="ir-ghs-selection-bucket__header-cell ir-ghs-selection-bucket__header-cell--end" style={{ width: '50px' }}>
                      {this.selectedProperties.length > 0 && (
                        <wa-button 
                            variant="danger" 
                            appearance="plain" 
                            size="small"
                            onClick={() => this.removeAll.emit()}
                            title="Remove all"
                        >
                            <wa-icon name="trash"></wa-icon>
                        </wa-button>
                      )}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {this.selectedProperties.map(p => (
                    <tr class="ir-ghs-selection-bucket__row ir-table-row">
                      <td class="ir-ghs-selection-bucket__cell ir-ghs-selection-bucket__cell--bold" title={p.NAME}>
                          {p.NAME}
                          <div class="ir-ghs-selection-bucket__property-aname" title={p.aname}>{p.aname}</div>
                      </td>
                      <td class="ir-ghs-selection-bucket__cell ir-ghs-selection-bucket__cell--end">
                          <wa-button 
                              variant="danger" 
                              appearance="plain" 
                              size="small"
                              onClick={() => this.removeProperty.emit(p.AC_ID)}
                              title="Remove from list"
                          >
                              <wa-icon name="trash"></wa-icon>
                          </wa-button>
                      </td>
                    </tr>
                  ))}
                  {this.selectedProperties.length === 0 && (
                    <tr>
                      <td colSpan={2} class="ir-ghs-selection-bucket__empty-state">
                        <p class="ir-ghs-selection-bucket__empty-text">No properties selected yet.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
         </div>
      </wa-card>
    );
  }
}
