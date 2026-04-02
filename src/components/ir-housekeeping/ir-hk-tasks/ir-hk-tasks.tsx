import { CleanTaskEvent, IPendingActions, Task } from '@/models/housekeeping';
import Token from '@/models/Token';
import { HouseKeepingService } from '@/services/housekeeping.service';
import { RoomService } from '@/services/room.service';
import housekeeping_store from '@/stores/housekeeping.store';
import locales from '@/stores/locales.store';
import { Component, Host, Prop, State, h, Element, Watch, Event, EventEmitter, Listen } from '@stencil/core';
import moment from 'moment';
import { v4 } from 'uuid';
import { TaskFilters } from './types';
import { downloadFile } from '@/utils/utils';
import { updateTasks as updateTasksStore, updateSelectedTasks, clearSelectedTasks, hkTasksStore, setLoading } from '@/stores/hk-tasks.store';
import calendar_data from '@/stores/calendar-data';

@Component({
  tag: 'ir-hk-tasks',
  styleUrl: 'ir-hk-tasks.css',
  scoped: true,
})
export class IrHkTasks {
  @Element() el: HTMLElement;

  @Prop() language: string = '';
  @Prop() ticket: string = '';
  @Prop() propertyid: number;
  @Prop() p: string;
  @Prop() baseUrl: string;

  @State() isLoading = false;
  @State() isCleaningLoading = false;
  @State() selectedDuration = '';
  @State() selectedHouseKeeper = '0';
  @State() selectedRoom: IPendingActions | null = null;
  @State() archiveOpened = false;
  @State() property_id: number;
  @State() isSidebarOpen: boolean;
  @State() isApplyFiltersLoading: boolean;
  @State() filters: TaskFilters;
  @State() modalCauses: CleanTaskEvent & { cause: 'skip' | 'clean' };

  @Event({ bubbles: true, composed: true }) clearSelectedHkTasks: EventEmitter<void>;

  private hkNameCache: Record<number, string> = {};
  private roomService = new RoomService();
  private houseKeepingService = new HouseKeepingService();
  private token = new Token();
  private table_sorting: Map<string, 'ASC' | 'DESC'> = new Map();
  private modal: HTMLIrDialogElement;

  componentWillLoad() {
    if (this.baseUrl) {
      this.token.setBaseUrl(this.baseUrl);
    }
    if (this.ticket !== '') {
      this.token.setToken(this.ticket);
      this.init();
    }
  }

  @Watch('ticket')
  ticketChanged(newValue: string, oldValue: string) {
    if (newValue === oldValue) {
      return;
    }
    this.token.setToken(this.ticket);
    this.init();
  }

  @Listen('closeSideBar')
  handleCloseSidebar(e: CustomEvent) {
    e.stopImmediatePropagation();
    e.stopPropagation();
    this.isSidebarOpen = false;
  }
  @Listen('sortingChanged')
  handleSortingChanged(e: CustomEvent) {
    e.stopImmediatePropagation();
    e.stopPropagation();
    const { field, direction } = e.detail;
    console.log(e.detail);
    if (field === 'date') {
      return;
    }
    this.table_sorting.set(field, direction);
  }
  @Listen('skipSelectedTask')
  handleSkipSelectedTask(e: CustomEvent) {
    e.stopImmediatePropagation();
    e.stopPropagation();
    this.modalCauses = { task: e.detail, cause: 'skip' };
    this.modal?.openModal();
  }

  private async init() {
    try {
      this.isLoading = true;
      setLoading(true);
      let propertyId = this.propertyid;
      if (!this.propertyid && !this.p) {
        throw new Error('Property ID or username is required');
      }
      // let roomResp = null;
      if (!propertyId) {
        console.log(propertyId);
        const propertyData = await this.roomService.getExposedProperty({
          id: 0,
          aname: this.p,
          language: this.language,
          is_backend: true,
          include_units_hk_status: true,
        });
        // roomResp = propertyData;
        propertyId = propertyData.My_Result.id;
      }
      this.property_id = propertyId;
      const requests = [this.houseKeepingService.getExposedHKSetup(this.property_id), this.roomService.fetchLanguage(this.language)];
      if (this.propertyid) {
        requests.push(
          this.roomService.getExposedProperty({
            id: this.propertyid,
            language: this.language,
            is_backend: true,
            include_units_hk_status: true,
          }),
        );
      }

      await Promise.all(requests);
      const tasksResult = await this.houseKeepingService.getHkTasks({
        property_id: this.property_id,
        from_date: moment().format('YYYY-MM-DD'),
        to_date: moment().format('YYYY-MM-DD'),
        housekeepers: [],
        cleaning_frequency: (calendar_data.cleaning_frequency ?? housekeeping_store?.hk_criteria?.cleaning_frequencies[0])?.code,
        dusty_window: housekeeping_store?.hk_criteria?.dusty_periods[0]?.code,
        highlight_window: housekeeping_store?.hk_criteria?.highlight_checkin_options[0]?.code,
      });

      // updateTaskList();
      if (tasksResult?.tasks) {
        this.updateTasks(tasksResult.tasks);
      }
    } catch (error) {
      console.log(error);
    } finally {
      this.isLoading = false;
      setLoading(false);
    }
  }

  private buildHousekeeperNameCache() {
    this.hkNameCache = {};
    housekeeping_store.hk_criteria?.housekeepers?.forEach(hk => {
      if (hk.id != null && hk.name != null) {
        this.hkNameCache[hk.id] = hk.name;
      }
    });
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

  private updateTasks(tasks: any[]) {
    this.buildHousekeeperNameCache();
    const mapped: Task[] = tasks.map(t => ({
      ...t,
      id: v4(),
      housekeeper: (() => {
        const name = this.hkNameCache[t.hkm_id];
        if (name) {
          return name;
        }
        const hkName = housekeeping_store.hk_criteria?.housekeepers?.find(hk => hk.id === t.hkm_id)?.name;
        this.hkNameCache[t.hkm_id] = hkName;
        return hkName;
      })(),
    }));
    console.log(this.groupTasks(mapped));
    updateTasksStore([...this.groupTasks(mapped)]);
  }
  @Listen('headerButtonPress')
  async handleHeaderButtonPress(e: CustomEvent) {
    e.stopImmediatePropagation();
    e.stopPropagation();
    const { name } = e.detail;
    switch (name) {
      case 'cleaned':
      case 'clean-inspect':
        this.modal?.openModal();
        this.modalCauses = {
          task: null,
          cause: 'clean',
          status: name === 'clean-inspect' ? '004' : '001',
        };
        break;
      case 'export':
        const sortingArray: { key: string; value: string }[] = Array.from(this.table_sorting.entries()).map(([key, value]) => ({
          key,
          value,
        }));
        console.log(sortingArray);
        const { url } = await this.fetchTasksWithFilters(true);
        downloadFile(url);
        break;
      case 'archive':
        this.isSidebarOpen = true;
        break;
    }
  }
  @Listen('cleanSelectedTask')
  handleSelectedTaskCleaningEvent(e: CustomEvent<CleanTaskEvent>) {
    e.stopImmediatePropagation();
    e.stopPropagation();
    this.modalCauses = { ...e.detail, cause: 'clean' };
    this.modal?.openModal();
  }

  private async handleModalConfirmation() {
    try {
      if (hkTasksStore.selectedTasks.length === 0) {
        return;
      }
      this.isCleaningLoading = true;
      if (this.modalCauses?.cause === 'skip') {
        const { booking_nbr, date, unit, extra_task } = this.modalCauses.task;
        await this.houseKeepingService.skipHKTasks({
          property_id: calendar_data.property.id,
          tasks_to_skip: [{ unit_id: unit.id, booking_nbr, date }, ...(extra_task ?? []).map(t => ({ unit_id: t.unit.id, booking_nbr: t.booking_nbr, date: t.date }))],
        });
      } else {
        await this.houseKeepingService.executeHKAction({
          actions: hkTasksStore.selectedTasks
            .flatMap(t => [t, ...(t.extra_task ?? [])])
            .map(t => ({
              description: 'Cleaned',
              hkm_id: t.hkm_id === 0 ? null : t.hkm_id,
              unit_id: t.unit.id,
              booking_nbr: t.booking_nbr,
              status: this.modalCauses?.status ?? '001',
              hk_task_type_code: t.task_type.code,
            })),
        });
      }
      await this.fetchTasksWithFilters();
    } finally {
      clearSelectedTasks();
      if (this.modalCauses) {
        this.modalCauses = null;
      }
      this.isCleaningLoading = false;
      // this.clearSelectedTasks.emit();
      this.modal.closeModal();
    }
  }

  private async applyFilters(e: CustomEvent) {
    try {
      this.isApplyFiltersLoading = true;
      e.stopImmediatePropagation();
      e.stopPropagation();
      this.filters = { ...e.detail };
      await this.fetchTasksWithFilters();
    } catch (error) {
      console.log(error);
    } finally {
      this.isApplyFiltersLoading = false;
    }
  }

  private async fetchTasksWithFilters(export_to_excel: boolean = false) {
    const { cleaning_periods, housekeepers, cleaning_frequencies, dusty_units, highlight_check_ins } = this.filters ?? {};

    const { tasks, url } = await this.houseKeepingService.getHkTasks({
      housekeepers,
      cleaning_frequency: cleaning_frequencies?.code,
      dusty_window: dusty_units?.code,
      highlight_window: highlight_check_ins?.code,
      property_id: this.property_id,
      from_date: moment().format('YYYY-MM-DD'),
      to_date: cleaning_periods?.code || moment().format('YYYY-MM-DD'),
      is_export_to_excel: export_to_excel,
    });
    console.log(tasks);
    if (tasks) {
      this.updateTasks(tasks);
    }
    return { tasks, url };
  }

  render() {
    if (this.isLoading) {
      return <ir-loading-screen></ir-loading-screen>;
    }
    return (
      <Host data-testid="hk_tasks_base">
        <ir-toast></ir-toast>
        <ir-interceptor></ir-interceptor>
        <section class="ir-page__container ">
          <h3 class="page-title">Housekeeping Tasks</h3>
          <div class="tasks-view">
            <ir-tasks-filters
              isLoading={this.isApplyFiltersLoading}
              onApplyFilters={e => {
                this.applyFilters(e);
              }}
            ></ir-tasks-filters>
            <div class="tasks-table-wrapper">
              <ir-tasks-table
                onRowSelectChange={e => {
                  e.stopImmediatePropagation();
                  e.stopPropagation();
                  updateSelectedTasks(e.detail);
                }}
              ></ir-tasks-table>
              {/* <ir-tasks-table-pagination></ir-tasks-table-pagination> */}
            </div>
          </div>
        </section>
        <ir-dialog ref={el => (this.modal = el)} label={locales.entries.Lcz_Confirmation} lightDismiss={false}>
          <span>
            {this.modalCauses
              ? this.modalCauses?.cause === 'clean'
                ? this.modalCauses.task
                  ? `Update ${this.modalCauses?.task?.unit?.name} to Clean`
                  : 'Update selected unit(s) to Clean'
                : 'Skip cleaning and reschedule for tomorrow.'
              : 'Update selected unit(s) to Clean'}
          </span>
          <div slot="footer" class="ir-dialog__footer">
            <ir-custom-button
              size="medium"
              appearance="filled"
              variant="neutral"
              onClickHandler={() => {
                if (this.modalCauses) {
                  clearSelectedTasks();
                  this.modalCauses = null;
                }
                this.modal.closeModal();
              }}
            >
              {locales.entries.Lcz_Cancel}
            </ir-custom-button>
            <ir-custom-button size="medium" appearance="accent" variant="brand" loading={this.isCleaningLoading} onClickHandler={this.handleModalConfirmation.bind(this)}>
              {locales.entries.Lcz_Confirm}
            </ir-custom-button>
          </div>
        </ir-dialog>
        <ir-sidebar
          open={this.isSidebarOpen}
          id="editGuestInfo"
          onIrSidebarToggle={e => {
            e.stopImmediatePropagation();
            e.stopPropagation();
            this.isSidebarOpen = false;
          }}
          // sidebarStyles={{
          //   width: '80vw',
          // }}
          showCloseButton={false}
        >
          {this.isSidebarOpen && <ir-hk-archive ticket={this.token.getToken()} propertyId={this.property_id} slot="sidebar-body"></ir-hk-archive>}
        </ir-sidebar>
        {/* <ir-title class="d-none d-md-flex" label={locales.entries.Lcz_HousekeepingTasks} justifyContent="space-between">
            <ir-button slot="title-body" text={locales.entries.Lcz_Archive} size="sm"></ir-button>
          </ir-title> */}
      </Host>
    );
  }
}
