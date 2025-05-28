import { IHouseKeepers, IPropertyHousekeepingAssignment } from '@/models/housekeeping';
import { HouseKeepingService } from '@/services/housekeeping.service';
import calendar_data from '@/stores/calendar-data';
import housekeeping_store from '@/stores/housekeeping.store';
import { isRequestPending } from '@/stores/ir-interceptor.store';
import locales from '@/stores/locales.store';
import { Component, Event, EventEmitter, Prop, State, h } from '@stencil/core';

@Component({
  tag: 'ir-hk-unassigned-units',
  styleUrls: ['ir-hk-unassigned-units.css', '../../../common/sheet.css'],
  scoped: true,
})
export class IrHkUnassignedUnits {
  @Prop() user: IHouseKeepers | null = null;

  @State() renderAgain = false;

  @Event() closeSideBar: EventEmitter<null>;
  @Event() resetData: EventEmitter<null>;

  private assignedUnits: Map<number, IPropertyHousekeepingAssignment> = new Map();
  private housekeepingService = new HouseKeepingService();

  assignUnit(unit_id: number, hk_id: number | null, checked: boolean) {
    if (this.user) {
      const userUnit = this.user.assigned_units.find(unit => unit.id === unit_id);
      if ((checked && userUnit) || (!checked && !userUnit)) {
        this.assignedUnits.delete(unit_id);
      } else if (!checked && userUnit) {
        this.assignedUnits.set(unit_id, { hkm_id: hk_id, is_to_assign: false, unit_id });
      } else if (checked) {
        const assignment: IPropertyHousekeepingAssignment = {
          hkm_id: hk_id,
          is_to_assign: true,
          unit_id,
        };
        this.assignedUnits.set(unit_id, assignment);
      }
    } else {
      if (this.assignedUnits.has(unit_id) && !hk_id) {
        this.assignedUnits.delete(unit_id);
        return;
      } else {
        this.assignedUnits.set(unit_id, {
          hkm_id: hk_id,
          is_to_assign: true,
          unit_id,
        });
      }
    }
    this.renderAgain = !this.renderAgain;
  }

  async assignUnits() {
    try {
      await this.housekeepingService.manageExposedAssignedUnitToHKM(housekeeping_store.default_properties.property_id, [...this.assignedUnits.values()]);
      this.resetData.emit(null);
    } catch (error) {
      console.error(error);
    } finally {
      this.closeSideBar.emit(null);
    }
  }
  renderRooms() {
    if (!this.user) {
      return housekeeping_store.hk_criteria.units_assignments.unassigned_units?.map(unit => (
        <tr key={unit.id}>
          <td class="">{unit.name}</td>
          <td class="sr-only"></td>
          <td class="pl-1">
            <ir-select
              onSelectChange={e => {
                let hk_id = e.detail;
                if (hk_id === '') {
                  hk_id = null;
                } else {
                  hk_id = +hk_id;
                }
                this.assignUnit(unit.id, hk_id, false);
              }}
              LabelAvailable={false}
              data={housekeeping_store.hk_criteria.housekeepers.map(hk => ({ text: hk.name, value: hk.id.toString() }))}
            ></ir-select>
          </td>
        </tr>
      ));
    }
    return calendar_data.roomsInfo.map(roomType => {
      console.log(roomType);
      if (!roomType.is_active) {
        return null;
      }
      return roomType.physicalrooms?.map(physical_room => {
        if (!physical_room['is_active']) {
          return null;
        }
        let taken = !housekeeping_store.hk_criteria.units_assignments.unassigned_units?.find(unit => unit.id.toString() === physical_room.id.toString());
        let housekeeper = [];
        const assignedRoom = this.assignedUnits.get(physical_room.id);
        if (assignedRoom && assignedRoom.is_to_assign) {
          housekeeper = [this.user];
          taken = true;
        } else {
          if (taken) {
            housekeeper = housekeeping_store.hk_criteria.housekeepers.filter(hk => hk.assigned_units.find(unit => unit.id === physical_room.id));
          }
        }
        return (
          <tr key={physical_room.id}>
            <td>{physical_room.name}</td>
            <td>{taken ? housekeeper[0]?.name : ''}</td>
            <td>
              <ir-switch
                onCheckChange={e => {
                  const checked = e.detail;
                  this.assignUnit(physical_room.id, this.user.id, checked);
                }}
                checked={taken && housekeeper[0]?.id === this.user.id}
              ></ir-switch>
            </td>
          </tr>
        );
      });
    });
  }
  render() {
    return (
      <div class="sheet-container">
        <ir-title class="title sheet-header px-1" displayContext="sidebar" label={!this.user ? 'Assingn Units' : `Assignment for ${this.user.name}`}></ir-title>
        <section class="px-1 sheet-body">
          <table>
            <thead>
              <th class="sr-only">{locales.entries.Lcz_RoomName}</th>
              <th class="sr-only">{locales.entries.Lcz_HousekeeperName}</th>
              <th class="sr-only">{locales.entries.Lcz_Actions}</th>
            </thead>
            <tbody>{this.renderRooms()}</tbody>
          </table>
        </section>
        <div class="sheet-footer">
          <ir-button
            onClickHandler={() => this.closeSideBar.emit(null)}
            class="flex-fill"
            btn_styles="w-100 justify-content-center align-items-center"
            btn_color="secondary"
            text={locales.entries.Lcz_Cancel}
          ></ir-button>
          <ir-button
            isLoading={isRequestPending('/Manage_Exposed_Assigned_Unit_To_HKM')}
            onClickHandler={this.assignUnits.bind(this)}
            class="flex-fill"
            btn_styles="w-100  justify-content-center align-items-center"
            text={locales.entries.Lcz_Confirm}
          ></ir-button>
        </div>
      </div>
    );
  }
}
