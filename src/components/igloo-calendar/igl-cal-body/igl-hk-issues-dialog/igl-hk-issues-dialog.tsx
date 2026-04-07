import { HKIssue } from '@/models/housekeeping';
import { HouseKeepingService } from '@/services/housekeeping.service';
import { Component, Event, EventEmitter, Prop, State, Watch, h } from '@stencil/core';
import moment from 'moment';

@Component({
  tag: 'igl-hk-issues-dialog',
  styleUrl: 'igl-hk-issues-dialog.css',
  scoped: true,
})
export class IglHkIssuesDialog {
  @Prop() open: boolean = false;
  @Prop() unitId: number;
  @Prop() unitName: string;
  @Prop() propertyId: number;
  @Prop() issues: HKIssue[];

  @Event() irAfterClose: EventEmitter<void>;

  @State() error: string | null = null;
  @State() isResolving: boolean = false;
  @State() selectedIds: Set<number> = new Set();

  private dialogRef: HTMLIrDialogElement;
  private houseKeepingService = new HouseKeepingService();

  @Watch('open')
  async handleOpenChange(isOpen: boolean) {
    if (isOpen) {
      this.error = null;

      this.dialogRef?.openModal();
    } else {
      this.dialogRef?.closeModal();
    }
  }
  @Watch('issues')
  handleIssuesChange(newIssues: HKIssue[] | null) {
    this.selectedIds = new Set();

    if (newIssues?.length === 1) {
      this.selectedIds = new Set([newIssues[0].id]);
    }
  }

  private toggleIssue(id: number) {
    const next = new Set(this.selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    this.selectedIds = next;
  }

  private handleResolve = async () => {
    if (!this.selectedIds.size || this.isResolving) return;
    this.isResolving = true;
    this.error = null;
    try {
      const payload = Array.from(this.selectedIds);
      await this.houseKeepingService.resolveHKIssue({ issue_ids: payload });
      this.dialogRef?.closeModal();
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to resolve issue. Please try again.';
    } finally {
      this.isResolving = false;
    }
  };

  // private getInitials(name: string): string {
  //   return (name ?? '')
  //     .split(' ')
  //     .map(n => n[0])
  //     .join('')
  //     .toUpperCase()
  //     .slice(0, 2);
  // }

  private renderTicket(issue: HKIssue) {
    const isMultiple = this.issues.length > 1;
    const isSelected = this.selectedIds.has(issue.id);
    // const initials = this.getInitials(issue.housekeeper_name);

    return (
      <div class={`ticket ${isSelected ? 'ticket--selected' : ''}`} key={issue.id} onClick={() => isMultiple && this.toggleIssue(issue.id)}>
        <p class="ticket-description">{issue.description || 'No description provided.'}</p>

        <div class="ticket-footer-row">
          <div class="ticket-reporter">
            {/* <span class="ticket-avatar">{initials}</span> */}
            <span class="ticket-reporter-name">{issue.housekeeper_name}</span>
          </div>
          <div class={'ticket-meta'}>
            <span class="ticket-date">
              {moment(issue.date).format('MMM D, YYYY')}
              {issue.hour != null && issue.minute != null && (
                <span class="ticket-time">
                  {String(issue.hour).padStart(2, '0')}:{String(issue.minute).padStart(2, '0')}
                </span>
              )}
            </span>
            {isMultiple && (
              <wa-checkbox
                checked={isSelected}
                defaultChecked={isSelected}
                onchange={(e: Event) => {
                  e.stopPropagation();
                  this.toggleIssue(issue.id);
                }}
              ></wa-checkbox>
            )}
          </div>
        </div>
      </div>
    );
  }

  private renderContent() {
    if (!this.issues?.length || !this.open) return null;

    return (
      <div class="dialog-body">
        <div class="tickets-list">{this.issues.map(issue => this.renderTicket(issue))}</div>

        {this.error && (
          <div class="error-banner" role="alert">
            <wa-icon name="circle-exclamation"></wa-icon>
            {this.error}
          </div>
        )}
      </div>
    );
  }

  render() {
    const count = this.issues?.length ?? 0;
    const selectedCount = this.selectedIds.size;

    return (
      <ir-dialog ref={el => (this.dialogRef = el)} label={`Reported ${count > 1 ? 'Issues' : 'Issue'}: ${this.unitName}`} onIrDialogAfterHide={() => this.irAfterClose.emit()}>
        {this.renderContent()}

        <div slot="footer" class="dialog-footer">
          <ir-custom-button variant="neutral" size="medium" appearance="filled" onClickHandler={() => this.dialogRef?.closeModal()} disabled={this.isResolving}>
            Close
          </ir-custom-button>
          <ir-custom-button variant="brand" size="medium" appearance="accent" onClickHandler={this.handleResolve} disabled={selectedCount === 0} loading={this.isResolving}>
            Mark as Resolved
          </ir-custom-button>
        </div>
      </ir-dialog>
    );
  }
}
