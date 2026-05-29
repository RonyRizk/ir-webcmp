import { Component, h, Prop, Event, EventEmitter } from '@stencil/core';
import { GHS_Candidate_Property } from '../../services/ghs/types';

@Component({
  tag: 'ir-ghs-selection-bucket',
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
      <div class="card mb-0 overflow-hidden shadow-sm border-0 position-relative" style={{ flex: '0 0 350px' }}>
          <div class="card-header bg-white py-2 px-3 border-bottom d-flex align-items-center justify-content-between flex-nowrap" style={{ gap: '0.5rem' }}>
            <div class="d-flex align-items-center flex-nowrap overflow-hidden" style={{ gap: '0.5rem' }}>
              <h3 class="h6 fw-bold mb-0 text-dark text-nowrap">To be added</h3>
              <span class="badge bg-primary text-white extra-small" style={{ minWidth: '20px' }}>
                  {this.selectedProperties.length}
              </span>
            </div>
            <div class="d-flex align-items-center" style={{ gap: '0.75rem' }}>
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

         <div class="card-body p-0 position-relative overflow-auto" style={{ maxHeight: '600px', minHeight: '400px' }}>
            <div class="table-container p-0 m-0 table-responsive bg-white">
              <table class="table align-middle mb-0">
                <thead>
                  <tr class="table-header bg-light">
                    <th class="ps-3 text-start py-2 small fw-bold">Property name</th>
                    <th class="pe-3 text-end py-2 small fw-bold" style={{ width: '50px' }}>
                      {this.selectedProperties.length > 0 && (
                        <button 
                            type="button"
                            class="btn btn-sm btn-link text-danger p-0 d-inline-flex align-items-center justify-content-end" 
                            onClick={() => this.removeAll.emit()}
                            title="Remove all"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                      )}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {this.selectedProperties.map(p => (
                    <tr class="ir-table-row border-bottom">
                      <td class="ps-3 text-dark text-start py-2 small font-weight-bold">
                          {p.NAME}
                          <div class="text-muted extra-small fw-normal">{p.aname}</div>
                      </td>
                      <td class="pe-3 text-end py-2">
                          <button 
                              type="button"
                              class="btn btn-sm btn-link text-danger p-0 d-inline-flex align-items-center justify-content-end" 
                              onClick={() => this.removeProperty.emit(p.AC_ID)}
                              title="Remove from list"
                          >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                  <polyline points="3 6 5 6 21 6"></polyline>
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              </svg>
                          </button>
                      </td>
                    </tr>
                  ))}
                  {this.selectedProperties.length === 0 && (
                    <tr>
                      <td colSpan={2} class="text-center p-4 text-muted border-0 bg-white">
                        <p class="mb-0 small italic">No properties selected yet.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
         </div>
      </div>
    );
  }
}
