import { IToast } from '@/components/ui/ir-toast/toast';
import { ExposedRectifierParamsSchema, PropertyService } from '@/services/property.service';
import calendar_data from '@/stores/calendar-data';
import { Component, Event, EventEmitter, Host, Prop, State, h } from '@stencil/core';
import moment from 'moment';

type RectifierFormState = {
  property_id: number | null;
  room_type_ids: number[];
  from: string | null;
  to: string | null;
};

@Component({
  tag: 'ir-rectifier',
  styleUrl: 'ir-rectifier.css',
  scoped: true,
})
export class IrRectifier {
  @Prop() formId: string;

  @State() form: RectifierFormState = {
    property_id: null,
    room_type_ids: [],
    from: null,
    to: null,
  };
  @State() autoValidate = false;
  @State() showRoomTypeError = false;

  @Event() loadingChanged: EventEmitter<boolean>;
  @Event() closeDrawer: EventEmitter<void>;
  @Event() toast: EventEmitter<IToast>;

  private propertyService = new PropertyService();
  toDateRef: HTMLIrCustomDatePickerElement;

  componentWillLoad() {
    this.form = {
      ...this.form,
      property_id: calendar_data.property?.id ?? calendar_data.id ?? null,
    };
  }

  private updateForm(next: Partial<RectifierFormState>) {
    this.form = {
      ...this.form,
      ...next,
    };
  }

  private normalizeDateRange(next: Partial<RectifierFormState>) {
    const from = next.from ?? this.form.from;
    const to = next.to ?? this.form.to;

    if (from && to && moment(from).isAfter(to, 'day')) {
      if (next.from) {
        return { ...next, to: from };
      }
      if (next.to) {
        return { ...next, from: to };
      }
    }
    return next;
  }

  private updateRoomTypeSelection(roomTypeId: number, checked: boolean) {
    const nextIds = new Set(this.form.room_type_ids);
    if (checked) {
      nextIds.add(roomTypeId);
    } else {
      nextIds.delete(roomTypeId);
    }
    this.showRoomTypeError = false;
    this.updateForm({ room_type_ids: Array.from(nextIds) });
  }

  private async handleSubmit() {
    this.loadingChanged.emit(true);
    this.autoValidate = true;
    this.showRoomTypeError = false;
    try {
      const propertyId = this.form.property_id ?? calendar_data.property?.id ?? calendar_data.id ?? undefined;
      const result = ExposedRectifierParamsSchema.safeParse({
        ...this.form,
        property_id: propertyId,
      });
      if (!result.success) {
        this.showRoomTypeError = result.error.issues.some(issue => issue.path[0] === 'room_type_ids');
        return;
      }
      await this.propertyService.exposedRectifier(result.data);
      this.toast.emit({
        type: 'success',
        title: 'The update is being processed.',
        description: '',
      });
      this.closeDrawer.emit();
    } catch (error) {
      console.error(error);
    } finally {
      this.loadingChanged.emit(false);
    }
  }

  render() {
    const roomTypes = calendar_data.property?.roomtypes ?? [];
    return (
      <Host>
        <form
          onSubmit={e => {
            e.preventDefault();
            this.handleSubmit();
          }}
          class="ir-rectifier__form"
          id={this.formId}
        >
          <wa-callout size="small" appearance="filled" variant="warning">
            <wa-icon slot="icon" name="triangle-exclamation"></wa-icon>
            This will update the total availability of the select room types by calculating: No. of physical rooms - Booked - Blocked - Pending
          </wa-callout>
          <div class="ir-rectifier__roomtypes">
            {roomTypes.map(roomtype => {
              const roomTypeId = Number(roomtype?.id);
              if (!Number.isFinite(roomTypeId)) {
                return null;
              }
              const isSelected = this.form.room_type_ids.includes(roomTypeId);
              return (
                <wa-checkbox
                  class="ir-rectifier__roomtype-checkbox"
                  checked={isSelected}
                  onchange={e => {
                    const checked = (e.target as HTMLInputElement).checked;
                    this.updateRoomTypeSelection(roomTypeId, checked);
                  }}
                >
                  {roomtype.name}
                </wa-checkbox>
              );
            })}
          </div>
          {this.showRoomTypeError && <p class="text-danger m-0">Please select at least one room type.</p>}
          <div class="ir-rectifier__date-range">
            <ir-validator value={this.form.from ?? null} schema={ExposedRectifierParamsSchema.shape.from} autovalidate={this.autoValidate}>
              <ir-custom-date-picker
                class="ir-rectifier__date-picker ir-rectifier__date-picker--from"
                label="Date from"
                emitEmptyDate
                date={this.form.from}
                onDateChanged={e => {
                  const from = e.detail.start?.format('YYYY-MM-DD') ?? null;
                  this.updateForm(this.normalizeDateRange({ from }));
                  requestAnimationFrame(() => this.toDateRef?.openDatePicker());
                }}
              ></ir-custom-date-picker>
            </ir-validator>
            <ir-validator value={this.form.to ?? null} schema={ExposedRectifierParamsSchema.shape.to} autovalidate={this.autoValidate}>
              <ir-custom-date-picker
                class="ir-rectifier__date-picker ir-rectifier__date-picker--to"
                label="To (inclusive)"
                emitEmptyDate
                disabled={!this.form.from}
                ref={el => (this.toDateRef = el)}
                date={this.form.to}
                minDate={this.form.from}
                onDateChanged={e => {
                  const to = e.detail.start?.format('YYYY-MM-DD') ?? null;
                  this.updateForm(this.normalizeDateRange({ to }));
                }}
              ></ir-custom-date-picker>
            </ir-validator>
          </div>
        </form>
      </Host>
    );
  }
}
