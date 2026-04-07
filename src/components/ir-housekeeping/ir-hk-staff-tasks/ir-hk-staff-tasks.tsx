import { Task } from '@/models/housekeeping';
import Token from '@/models/Token';
import { ConnectedHK, HouseKeepingService } from '@/services/housekeeping.service';
import { UnitHkStatusChangePayload } from '@/components/igloo-calendar/igloo-calendar';
import { Component, Element, Host, Prop, State, Watch, h } from '@stencil/core';
import moment from 'moment/min/moment-with-locales';
import io, { Socket } from 'socket.io-client';
import { v4 } from 'uuid';

const LANGUAGE_KEY = 'ir_language';

const localeMap: Record<string, string> = {
  en: 'en',
  ar: 'ar',
  el: 'el',
};

type Translations = {
  noTasks: string;
  markAsCleaned: string;
  confirm: string;
  anythingToReport: string;
  cancel: string;
};

const translations: Record<string, Translations> = {
  en: {
    noTasks: 'No tasks for this day.',
    markAsCleaned: 'Mark as Cleaned',
    confirm: 'Confirm',
    anythingToReport: 'Anything to report?',
    cancel: 'Cancel',
  },
  ar: {
    noTasks: 'لا توجد مهام لهذا اليوم.',
    markAsCleaned: 'تعليم كمنظّف',
    confirm: 'تأكيد',
    anythingToReport: 'هل هناك ما تريد الإبلاغ عنه؟',
    cancel: 'إلغاء',
  },
  el: {
    noTasks: 'Δεν υπάρχουν εργασίες για αυτή την ημέρα.',
    markAsCleaned: 'Σήμανση ως καθαρισμένο',
    confirm: 'Επιβεβαίωση',
    anythingToReport: 'Κάτι να αναφέρετε;',
    cancel: 'Ακύρωση',
  },
};

function toMomentLocale(lang: string): string {
  return localeMap[lang?.toLowerCase()] ?? 'en';
}

function t(lang: string): Translations {
  return translations[lang?.toLowerCase()] ?? translations.en;
}

type TaskDateGroup = { date: string; formattedDate: string; isFuture: boolean; tasks: Task[] };

@Component({
  tag: 'ir-hk-staff-tasks',
  styleUrl: 'ir-hk-staff-tasks.css',
  scoped: true,
})
export class IrHkStaffTasks {
  @Element() el: HTMLElement;

  @Prop() ticket: string;
  @Prop() baseurl: string;
  @Prop() language: string = 'en';

  private tokenService = new Token();
  private houseKeepingService = new HouseKeepingService();
  // Always use English locale for date keys to avoid Arabic-Indic numerals
  private fromDate = moment().locale('en').format('YYYY-MM-DD');
  private toDate = moment().add(3, 'days').locale('en').format('YYYY-MM-DD');
  private confirmDialog: HTMLIrDialogElement;
  private socket: Socket;
  private hkOverrideTimer: ReturnType<typeof setTimeout> | null = null;

  /** Resolved language: localStorage → language prop → 'en'. @State so render updates on change. */
  @State() activeLanguage: string = 'en';
  @State() selectedTask: Task | null = null;
  @State() connectedHk: ConnectedHK;
  @State() isLoading: boolean = true;
  @State() isConfirmLoading: boolean = false;
  @State() tasksByDate: TaskDateGroup[] = [];
  @State() anythingToReportString = null;

  componentWillLoad() {
    // Language resolution: stored preference wins, then prop, then default 'en'
    this.activeLanguage = localStorage.getItem(LANGUAGE_KEY) || this.language;
    moment.locale(toMomentLocale(this.activeLanguage));
    this.el.setAttribute('dir', this.activeLanguage === 'ar' ? 'rtl' : 'ltr');

    if (this.baseurl) {
      this.tokenService.setBaseUrl(this.baseurl);
    }

    if (this.ticket) {
      this.tokenService.setToken(this.ticket);
      this.loadTasks();
    }
  }

  @Watch('language')
  handleLanguageChange(newLang: string) {
    this.applyLanguage(newLang);
  }

  private applyLanguage(lang: string) {
    if (lang === this.activeLanguage) {
      return;
    }
    this.activeLanguage = lang;
    localStorage.setItem(LANGUAGE_KEY, lang);
    moment.locale(toMomentLocale(lang));
    this.el.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    this.tasksByDate = this.tasksByDate.map(group => ({
      ...group,
      // Use locale('en') clone so display format uses active locale correctly
      formattedDate: moment(group.date).format('ddd, DD MMM'),
    }));
  }

  @Watch('ticket')
  async handleTicketChange(newValue: string, oldValue: string) {
    if (newValue === oldValue) {
      return;
    }
    if (this.ticket) {
      this.tokenService.setToken(this.ticket);
      this.loadTasks();
    }
  }

  private groupTasks(tasks: Task[]): Task[] {
    const groups = new Map<string, Task[]>();

    for (const task of tasks) {
      const key = `${task.date}__${task.unit.id}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key).push(task);
    }

    const result: Task[] = [];

    for (const group of groups.values()) {
      const cln = group.find(t => t.task_type?.code === 'CLN');
      const t1 = group.find(t => t.task_type?.code === 'T1');
      const t2 = group.find(t => t.task_type?.code === 'T2');

      if (cln) {
        const extra: Task[] = [];
        if (t1) extra.push(t1);
        if (t2) extra.push(t2);
        result.push({ ...cln, extra_task: extra.length > 0 ? extra : null });
      } else if (t1) {
        result.push({ ...t1, extra_task: t2 ? [t2] : null });
      } else if (t2) {
        result.push({ ...t2, extra_task: null });
      }
    }

    return result;
  }

  private groupByDate(tasks: Task[]): TaskDateGroup[] {
    // Always use 'en' locale for date keys/comparisons — Arabic locale formats
    // dates with Arabic-Indic numerals which breaks string matching against API dates.
    const today = moment().locale('en').format('YYYY-MM-DD');

    const dateMap = new Map<string, TaskDateGroup>();
    const cursor = moment(this.fromDate);
    const end = moment(this.toDate);
    while (cursor.isSameOrBefore(end, 'day')) {
      const dateStr = cursor.clone().locale('en').format('YYYY-MM-DD');
      dateMap.set(dateStr, {
        date: dateStr,
        formattedDate: cursor.format('ddd, DD MMM'), // uses active global locale for display
        isFuture: dateStr > today,
        tasks: [],
      });
      cursor.add(1, 'day');
    }

    // Fill in actual tasks
    for (const task of tasks) {
      if (dateMap.has(task.date)) {
        dateMap.get(task.date).tasks.push(task);
      }
    }

    return Array.from(dateMap.values());
  }

  /** Fetches HK data and populates tasksByDate. Does NOT touch isLoading. */
  private async loadTasks() {
    try {
      this.isLoading = true;
      this.connectedHk = await this.houseKeepingService.getConnectedHk();
      const { tasks } = await this.houseKeepingService.getHkTasks({
        from_date: this.fromDate,
        to_date: this.toDate,
        property_id: this.connectedHk.AC_ID,
        housekeepers: [{ id: this.connectedHk.HKM_ID }],
        cleaning_frequency: '001',
        dusty_window: '000',
        highlight_window: '000',
      });

      if (tasks) {
        const mapped: Task[] = tasks.map((task: Task) => ({ ...task, id: v4() }));
        this.tasksByDate = this.groupByDate(this.groupTasks(mapped));
      }
      this.isLoading = false;
      this.connectSocket();
    } catch (error) {
      console.error(error);
    }
  }

  private connectSocket() {
    if (this.socket) {
      return;
    }
    this.socket = io('https://realtime.igloorooms.com/');
    this.socket.on('MSG', async (msg: string) => {
      const parsed = JSON.parse(msg);
      if (!parsed) {
        return;
      }
      const { REASON, KEY, PAYLOAD } = parsed;
      if (KEY.toString() !== this.connectedHk.AC_ID.toString()) {
        return;
      }
      if (REASON === 'UNIT_HK_STATUS_CHANGED') {
        const result: UnitHkStatusChangePayload = JSON.parse(PAYLOAD);
        if (result.HKM_ID === this.connectedHk.HKM_ID) {
          await this.refreshTasks();
        }
      } else if (REASON === 'HK_TASK_OVERRIDE') {
        const result = JSON.parse(PAYLOAD);
        // Relevant if assigned to us (HKM_ID matches) or removed from someone (HKM_ID null — could be us)
        const affectsUs = result.HKM_ID === this.connectedHk.HKM_ID || result.HKM_ID === null;
        // Only refresh if the date falls within our displayed window
        const inRange = result.DATE >= this.fromDate && result.DATE <= this.toDate;
        if (affectsUs && inRange) {
          this.scheduleTaskRefresh();
        }
      }
    });
  }

  disconnectedCallback() {
    if (this.hkOverrideTimer !== null) {
      clearTimeout(this.hkOverrideTimer);
      this.hkOverrideTimer = null;
    }
    this.socket?.disconnect();
    this.socket = null;
  }

  private scheduleTaskRefresh() {
    if (this.hkOverrideTimer !== null) {
      clearTimeout(this.hkOverrideTimer);
    }
    this.hkOverrideTimer = setTimeout(async () => {
      this.hkOverrideTimer = null;
      await this.refreshTasks();
    }, 300);
  }

  private async handleConfirm() {
    if (!this.selectedTask) {
      return;
    }
    try {
      this.isConfirmLoading = true;
      const comment = this.anythingToReportString?.value?.trim() || '';
      const allTasks = [this.selectedTask, ...(this.selectedTask.extra_task ?? [])];
      await this.houseKeepingService.executeHKAction({
        actions: allTasks.map((task: Task, i) => ({
          description: comment || 'Cleaned',
          hkm_id: task.hkm_id === 0 ? null : task.hkm_id,
          unit_id: task.unit.id,
          booking_nbr: task.booking_nbr,
          status: '001',
          hk_task_type_code: task.task_type.code,
          comment: i === 0 ? this.anythingToReportString || undefined : undefined,
        })),
      });
      await this.refreshTasks();
    } catch (error) {
      console.error(error);
    } finally {
      this.isConfirmLoading = false;
      this.confirmDialog.closeModal();
    }
  }

  private async refreshTasks() {
    const { tasks } = await this.houseKeepingService.getHkTasks({
      from_date: this.fromDate,
      to_date: this.toDate,
      property_id: this.connectedHk.AC_ID,
      housekeepers: [{ id: this.connectedHk.HKM_ID }],
      cleaning_frequency: '001',
      dusty_window: '000',
      highlight_window: '000',
    });
    if (tasks) {
      const mapped: Task[] = tasks.map((task: Task) => ({ ...task, id: v4() }));
      this.tasksByDate = this.groupByDate(this.groupTasks(mapped));
    }
  }

  render() {
    if (this.isLoading) {
      return <ir-loading-screen></ir-loading-screen>;
    }
    const i18n = t(this.activeLanguage);
    return (
      <Host>
        <ir-hk-staff-tasks-header connectedHK={this.connectedHk} language={this.activeLanguage} onLanguageChanged={e => this.applyLanguage(e.detail)}></ir-hk-staff-tasks-header>
        <div class="tasks__container">
          {this.tasksByDate.map(group => (
            <section key={group.date} class={`tasks__section${group.isFuture ? ' tasks__section--future' : ''}`} aria-label={`Tasks for ${group.formattedDate}`}>
              <header class="tasks__header">
                <h3 class="tasks__date">{group.formattedDate}</h3>
                <wa-badge
                  pill
                  style={{ fontSize: '0.875rem', fontWeight: 'bold' }}
                  variant={group.isFuture ? 'neutral' : 'brand'}
                  appearance={group.isFuture ? 'filled' : 'accent'}
                >
                  {group.tasks.length}
                </wa-badge>
              </header>
              {group.tasks.length > 0 ? (
                <div class="tasks-grid" role="list">
                  {group.tasks.map(task => (
                    <ir-hk-staff-task
                      onTaskClick={e => {
                        this.selectedTask = e.detail;
                        this.confirmDialog.openModal();
                      }}
                      future={group.isFuture}
                      task={task}
                      key={task.id}
                      role="listitem"
                    ></ir-hk-staff-task>
                  ))}
                </div>
              ) : (
                <p class="tasks__empty">{i18n.noTasks}</p>
              )}
            </section>
          ))}
        </div>
        <ir-dialog
          class="hk-staff-tasks__dialog"
          ref={el => (this.confirmDialog = el)}
          label={this.selectedTask ? `${this.selectedTask.unit.name} — ${i18n.markAsCleaned}` : i18n.confirm}
          onIrDialogAfterHide={() => {
            this.selectedTask = null;
            if (this.anythingToReportString) {
              this.anythingToReportString = null;
            }
          }}
        >
          <wa-textarea
            value={this.anythingToReportString}
            onchange={e => (this.anythingToReportString = (e.target as HTMLTextAreaElement).value)}
            defaultValue={this.anythingToReportString}
            placeholder={i18n.anythingToReport}
            maxlength={500}
          ></wa-textarea>
          <div slot="footer" class="ir-dialog__footer">
            <ir-custom-button variant="neutral" appearance="filled" onClickHandler={() => this.confirmDialog.closeModal()}>
              {i18n.cancel}
            </ir-custom-button>
            <ir-custom-button variant="brand" appearance="accent" loading={this.isConfirmLoading} onClickHandler={this.handleConfirm.bind(this)}>
              {i18n.confirm}
            </ir-custom-button>
          </div>
        </ir-dialog>
      </Host>
    );
  }
}
