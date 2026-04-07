import { IHouseKeepers, THousekeepingTrigger } from '@/models/housekeeping';
import housekeeping_store from '@/stores/housekeeping.store';
import locales from '@/stores/locales.store';
import { Component, Listen, State, h, Element } from '@stencil/core';

@Component({
  tag: 'ir-hk-team',
  styleUrls: ['ir-hk-team.css', '../../../common/table.css'],
  scoped: true,
})
export class IrHkTeam {
  @Element() el: HTMLElement;
  @State() currentTrigger: THousekeepingTrigger | null = null;

  private deletionTimout: NodeJS.Timeout;
  private renderAssignedUnits(hk: IHouseKeepers) {
    if (hk.assigned_units.length === 0) {
      return (
        <span>
          0 -{' '}
          <wa-button
            size="small"
            variant="brand"
            appearance="outlined"
            class="hk-team-header__unassigned-btn"
            onClick={() => (this.currentTrigger = { type: 'unassigned_units', user: hk })}
          >
            {locales.entries.Lcz_Assign}
          </wa-button>
        </span>
      );
    }
    return (
      <span>
        {hk.assigned_units.length} -{' '}
        <wa-button
          class="hk-team-header__unassigned-btn"
          size="small"
          variant="brand"
          appearance="outlined"
          onClick={() => (this.currentTrigger = { type: 'unassigned_units', user: hk })}
        >
          {'Edit'}
        </wa-button>
      </span>
    );
  }
  renderCurrentTrigger() {
    switch (this.currentTrigger?.type) {
      case 'unassigned_units':
        return <ir-hk-unassigned-units slot="sidebar-body" user={this.currentTrigger.user}></ir-hk-unassigned-units>;
      // case 'user':
      //   return <ir-hk-user slot="sidebar-body" user={this.currentTrigger.user} isEdit={this.currentTrigger.isEdit}></ir-hk-user>;
      default:
        return null;
    }
  }

  @Listen('closeSideBar')
  handleCloseSideBar(e: CustomEvent) {
    e.stopImmediatePropagation();
    e.stopPropagation();
    this.currentTrigger = null;
  }
  handleDeletion(user) {
    this.currentTrigger = { type: 'delete', user };
    this.deletionTimout = setTimeout(() => {
      const modal = this.el.querySelector('ir-hk-delete-dialog');
      if (!modal) return;
      modal.openModal();
    }, 100);
  }
  disconnectedCallback() {
    clearTimeout(this.deletionTimout);
  }
  render() {
    if (!housekeeping_store.hk_criteria) {
      return null;
    }
    const { assigned, total, un_assigned } = housekeeping_store.hk_criteria.units_assignments;

    return (
      <wa-card>
        <section slot="header" class="hk-team-header">
          <div class="hk-team-header__top">
            <p class="hk-team-header__title">{locales.entries.Lcz_HousekeepingTeam}</p>
            <div class="hk-team-header__stats">
              <p class="hk-team-header__stat hk-team-header__stat--bold">
                {total} {locales.entries.Lcz_TotalUnits}
              </p>
              <p class="hk-team-header__stat">
                {assigned} <span>{locales.entries.Lcz_Assigned}</span>
              </p>
              {un_assigned > 0 && (
                <wa-button
                  onClick={() => (this.currentTrigger = { type: 'unassigned_units', user: null })}
                  size="small"
                  class="hk-team-header__unassigned-btn"
                  variant="brand"
                  appearance="outlined"
                >
                  {un_assigned} {locales.entries.Lcz_Unassigned}
                </wa-button>
              )}
            </div>
          </div>
          <p class="hk-team-header__hint">{locales.entries.Lcz_AsAnOption}</p>
        </section>
        <section class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th class="text-left">{locales.entries.Lcz_Name}</th>
                <th>{locales.entries.Lcz_Mobile}</th>
                <th>{locales.entries.Lcz_Username}</th>
                {/* <th>{locales.entries.Lcz_Note}</th> */}
                <th>{locales.entries.Lcz_UnitsAssigned}</th>
                <th class={'text-left'}>
                  <div class="d-flex justify-content-center">
                    <ir-custom-button
                      onClickHandler={() => {
                        this.currentTrigger = {
                          type: 'user',
                          isEdit: false,
                          user: null,
                        };
                      }}
                      variant="neutral"
                      appearance="plain"
                    >
                      <wa-icon name="plus" style={{ fontSize: '1.2rem' }}></wa-icon>
                    </ir-custom-button>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {housekeeping_store.hk_criteria.housekeepers.map(hk => (
                <tr key={hk.id} class="ir-table-row">
                  <td class="text-left">
                    <div class={'d-flex align-items-center'} style={{ gap: '0.5rem' }}>
                      {hk.name?.length > 25 ? (
                        <ir-popover trigger="hover" content={hk.name}>
                          <span>{hk.name.slice(0, 25)}...</span>
                        </ir-popover>
                      ) : (
                        hk.name
                      )}
                      {hk.note && (
                        <ir-popover content={hk.note}>
                          <ir-button variant="icon" icon_name="note" data-toggle="tooltip" data-placement="bottom" title="Click to view note"></ir-button>
                        </ir-popover>
                      )}
                    </div>
                  </td>
                  <td class="">
                    {hk.phone_prefix} {hk.mobile}
                  </td>
                  <td>{hk.username}</td>
                  <td>{this.renderAssignedUnits(hk)}</td>
                  <td class="">
                    <div class="icons-container">
                      <ir-custom-button
                        onClickHandler={() => {
                          const { assigned_units, is_soft_deleted, is_active, ...user } = hk;
                          this.currentTrigger = {
                            type: 'user',
                            isEdit: true,
                            user,
                          };
                        }}
                        variant="neutral"
                        appearance="plain"
                      >
                        <wa-icon name="edit" style={{ fontSize: '1.2rem' }}></wa-icon>
                      </ir-custom-button>
                      <ir-custom-button onClickHandler={() => this.handleDeletion(hk)} variant="danger" appearance="plain">
                        <wa-icon name="trash-can" style={{ fontSize: '1.2rem' }}></wa-icon>
                      </ir-custom-button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        {/* <ir-sidebar
          showCloseButton={false}
          open={this.currentTrigger !== null && this.currentTrigger.type !== 'delete' && this.currentTrigger.type !== 'user'}
          onIrSidebarToggle={() => (this.currentTrigger = null)}
          style={{
            '--sidebar-width': this.currentTrigger ? (this.currentTrigger.type === 'unassigned_units' ? 'max-content' : '40rem') : 'max-content',
          }}
        >
          {this.renderCurrentTrigger()}
        </ir-sidebar> */}
        <ir-hk-user-drawer open={this.currentTrigger?.type === 'user'} user={this.currentTrigger?.user} isEdit={(this.currentTrigger as any)?.isEdit}></ir-hk-user-drawer>
        <ir-hk-unassigned-units-drawer open={this.currentTrigger?.type === 'unassigned_units'} user={(this.currentTrigger as any)?.user}></ir-hk-unassigned-units-drawer>
        {this.currentTrigger?.type === 'delete' && <ir-hk-delete-dialog user={this.currentTrigger.user}></ir-hk-delete-dialog>}
      </wa-card>
    );
  }
}
