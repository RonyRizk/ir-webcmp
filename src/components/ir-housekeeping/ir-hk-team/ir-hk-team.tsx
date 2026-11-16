import { IHouseKeepers, THousekeepingTrigger } from '@/models/housekeeping';
import housekeeping_store from '@/stores/housekeeping.store';
import { Component, Listen, State, h, Element, Fragment } from '@stencil/core';

import { t } from '@/services/locale/t';
import { formatCount } from '@/utils/number';
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
            size="s"
            variant="brand"
            appearance="outlined"
            class="hk-team-header__unassigned-btn"
            onClick={() => (this.currentTrigger = { type: 'unassigned_units', user: hk })}
          >
            {t('Lcz_Assign', { fallback: 'Assign' })}
          </wa-button>
        </span>
      );
    }
    return (
      <span>
        {formatCount(hk.assigned_units.length)} -{' '}
        <wa-button
          class="hk-team-header__unassigned-btn"
          size="s"
          variant="brand"
          appearance="outlined"
          onClick={() => (this.currentTrigger = { type: 'unassigned_units', user: hk })}
        >
          {t('Lcz_Edit', { fallback: 'Edit' })}
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
      <wa-card appearance="plain" class="hk-team__card">
        <section slot="header" class="hk-team-header">
          <div class="hk-team-header__top">
            <p class="hk-team-header__title">{t('Lcz_HousekeepingTeam', { fallback: 'Housekeeping team' })}</p>
            <div class="hk-team-header__stats">
              <p class="hk-team-header__stat hk-team-header__stat--bold">
                {formatCount(total)} {t('Lcz_TotalUnits', { fallback: 'Total units' })}
              </p>
              <p class="hk-team-header__stat">
                {assigned} <span>{t('Lcz_Assigned', { fallback: 'Assigned' })}</span>
              </p>
              {un_assigned > 0 && (
                <wa-button
                  onClick={() => (this.currentTrigger = { type: 'unassigned_units', user: null })}
                  size="s"
                  class="hk-team-header__unassigned-btn"
                  variant="brand"
                  appearance="outlined"
                >
                  {un_assigned} {t('Lcz_Unassigned', { fallback: 'Unassigned' })}
                </wa-button>
              )}
            </div>
          </div>
          <p class="hk-team-header__hint">
            {t('Lcz_AsAnOption', { fallback: 'As an option, create housekeepers (as individuals or teams) and assign units to them to notify them separately.' })}
          </p>
        </section>
        <section class="table-responsive">
          <table class="table data-table">
            <thead>
              <tr>
                <th class="ir-text-start">{t('Lcz_Name', { fallback: 'Name' })}</th>
                <th>{t('Lcz_Mobile', { fallback: 'Mobile' })}</th>
                <th>{t('Lcz_Username', { fallback: 'Username' })}</th>
                {/* <th>{t('Lcz_Note', { fallback: 'Note' })}</th> */}
                <th>{t('Lcz_UnitsAssigned', { fallback: 'Units assigned' })}</th>
                <th class={'ir-text-start'}>
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
                  <td class="ir-text-start">
                    <div class={'d-flex align-items-center'} style={{ gap: '0.5rem' }}>
                      {hk.name?.length > 25 ? (
                        <Fragment>
                          <wa-tooltip for={hk.id + '_name'}>{hk.name}</wa-tooltip>
                          <span id={hk.id + '_name'}>{hk.name.slice(0, 25)}...</span>
                        </Fragment>
                      ) : (
                        hk.name
                      )}
                      {hk.note && (
                        // <ir-popover content={hk.note}>
                        //   <ir-button variant="icon" icon_name="note" data-toggle="tooltip" data-placement="bottom" title={t('Lcz_ClickToViewNote', { fallback: 'Click to view note' })}></ir-button>
                        // </ir-popover>
                        <Fragment>
                          <wa-tooltip for={hk.id + '_note'}>{hk.note}</wa-tooltip>
                          <wa-icon id={hk.id + '_note'} name="note-sticky" variant="regular"></wa-icon>
                        </Fragment>
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
