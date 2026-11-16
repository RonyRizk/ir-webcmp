import { HKIssue } from '@/models/housekeeping';
import { HouseKeepingService } from '@/services/housekeeping';
import { Component, Event, EventEmitter, Prop, State, Watch, h } from '@stencil/core';
import { formatDate } from '@/utils/date';
import { t } from '@/services/locale/t';
import { formatCount, formatNumber } from '@/utils/number';

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
  handleOpenChange(isOpen: boolean) {
    this.error = null;
    if (isOpen) {
      this.dialogRef?.openModal();
    } else {
      this.dialogRef?.closeModal();
    }
  }

  @Watch('issues')
  handleIssuesChange(newIssues: HKIssue[] | null) {
    // A single issue is the only thing to act on — pre-select it.
    this.selectedIds = newIssues?.length === 1 ? new Set([newIssues[0].id]) : new Set();
  }

  private get isMultiple(): boolean {
    return (this.issues?.length ?? 0) > 1;
  }

  private get allSelected(): boolean {
    return !!this.issues?.length && this.selectedIds.size === this.issues.length;
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

  private toggleSelectAll = () => {
    this.selectedIds = this.allSelected ? new Set() : new Set(this.issues.map(issue => issue.id));
  };

  private handleRowKeyDown = (event: KeyboardEvent, id: number) => {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      this.toggleIssue(id);
    }
  };

  private handleResolve = async () => {
    if (!this.selectedIds.size || this.isResolving) {
      return;
    }
    this.isResolving = true;
    this.error = null;
    try {
      await this.houseKeepingService.resolveHKIssue({ issue_ids: Array.from(this.selectedIds) });
      this.dialogRef?.closeModal();
    } catch (e) {
      this.error = e instanceof Error ? e.message : t('Lcz_FailedToResolveGeneric', { fallback: 'Failed to resolve. Please try again.' });
    } finally {
      this.isResolving = false;
    }
  };

  private formatReportedAt(issue: HKIssue): string {
    const date = formatDate(issue.date, 'MMM D, YYYY');
    if (issue.hour == null || issue.minute == null) {
      return date;
    }
    const pad = { minimumIntegerDigits: 2, useGrouping: false };
    const time = `${formatNumber(issue.hour, pad)}:${formatNumber(issue.minute, pad)}`;
    return `${date} · ${time}`;
  }

  private renderIssue(issue: HKIssue) {
    const selectable = this.isMultiple;
    const isSelected = this.selectedIds.has(issue.id);
    const description = issue.description?.trim();

    return (
      <div
        key={issue.id}
        class={{ 'issue': true, 'issue--selectable': selectable, 'issue--selected': isSelected }}
        role={selectable ? 'checkbox' : undefined}
        aria-checked={selectable ? String(isSelected) : undefined}
        tabindex={selectable ? 0 : undefined}
        onClick={selectable ? () => this.toggleIssue(issue.id) : undefined}
        onKeyDown={selectable ? (event: KeyboardEvent) => this.handleRowKeyDown(event, issue.id) : undefined}
      >
        {selectable && <wa-checkbox class="issue__check" checked={isSelected} tabIndex={-1}></wa-checkbox>}
        <div class="issue__body">
          <p class={{ 'issue__description': true, 'issue__description--empty': !description }}>
            {description || t('Lcz_NoDescriptionProvided', { fallback: 'No description provided.' })}
          </p>
          <p class="issue__meta">
            <span class="issue__reporter">{issue.housekeeper_name || t('Lcz_UnknownHousekeeper', { fallback: 'Unknown housekeeper' })}</span>
            <span class="issue__sep" aria-hidden="true">
              ·
            </span>
            <span class="issue__date">{this.formatReportedAt(issue)}</span>
          </p>
        </div>
      </div>
    );
  }

  private renderBody() {
    if (!this.open) {
      return null;
    }
    if (!this.issues?.length) {
      return <ir-empty-state message={t('Lcz_NoIssuesReportedForUnit', { fallback: 'No issues reported for this unit.' })}></ir-empty-state>;
    }

    return (
      <div class="issues">
        {this.isMultiple && (
          <div class="issues__toolbar">
            <span class="issues__count">{t('Lcz_IssuesReportedCount', { params: [formatCount(this.issues.length)], fallback: `${this.issues.length} issues reported` })}</span>
            <button type="button" class="issues__select-all" onClick={this.toggleSelectAll}>
              {this.allSelected ? t('Lcz_Clear', { fallback: 'Clear' }) : t('Lcz_SelectAll', { fallback: 'Select all' })}
            </button>
          </div>
        )}

        <div class="issues__list" role={this.isMultiple ? 'group' : undefined} aria-label={this.isMultiple ? t('Lcz_ReportedIssues', { fallback: 'Reported Issues' }) : undefined}>
          {this.issues.map(issue => this.renderIssue(issue))}
        </div>

        {this.error && (
          <div class="issues__error" role="alert">
            <wa-callout variant="danger">
              <wa-icon slot="icon" name="circle-exclamation"></wa-icon>
              {this.error}
            </wa-callout>
          </div>
        )}
      </div>
    );
  }

  render() {
    const multiple = (this.issues?.length ?? 0) > 1;
    const selectedCount = this.selectedIds.size;
    const unitSuffix = this.unitName ? ` · ${this.unitName}` : '';

    return (
      <ir-dialog
        ref={el => (this.dialogRef = el)}
        label={`${multiple ? t('Lcz_ReportedIssues', { fallback: 'Reported Issues' }) : t('Lcz_ReportedIssue', { fallback: 'Reported Issue' })}${unitSuffix}`}
        onIrDialogAfterHide={() => this.irAfterClose.emit()}
      >
        {this.renderBody()}

        <div slot="footer" class="footer">
          {multiple && selectedCount > 0 && <span class="footer__hint">{t('Lcz_SelectedItemsCount', { params: [selectedCount], fallback: `${selectedCount} selected` })}</span>}
          <ir-custom-button variant="neutral" size="m" appearance="filled" onClickHandler={() => this.dialogRef?.closeModal()} disabled={this.isResolving}>
            {t('Lcz_Close', { fallback: 'Close' })}
          </ir-custom-button>
          <ir-custom-button variant="brand" size="m" appearance="accent" onClickHandler={this.handleResolve} disabled={selectedCount === 0} loading={this.isResolving}>
            {multiple
              ? selectedCount
                ? t('Lcz_ResolveCount', { params: [selectedCount], fallback: `Resolve ${selectedCount}` })
                : t('Lcz_Resolve', { fallback: 'Resolve' })
              : t('Lcz_MarkAsResolved', { fallback: 'Mark as Resolved' })}
          </ir-custom-button>
        </div>
      </ir-dialog>
    );
  }
}
