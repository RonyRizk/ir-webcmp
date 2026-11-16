import { newSpecPage } from '@stencil/core/testing';
import { h } from '@stencil/core';
import { IrRoomHeader } from '../ir-room-header';
import { Room } from '@/models/booking.dto';

const room = (in_out: Room['in_out'], unit: Room['unit'] = { id: 7, name: '101' } as any): Room =>
  ({
    identifier: 'R-1',
    unit,
    in_out,
    gross_total: 100,
    rateplan: { is_non_refundable: false, meal_plan: { code: '001' } },
  }) as any;

const render = (r: Room, { isEditable = true } = {}) =>
  newSpecPage({
    components: [IrRoomHeader],
    template: () => <ir-room-header room={r} isEditable={isEditable}></ir-room-header>,
  });

const printItem = (page: Awaited<ReturnType<typeof render>>) => page.root.querySelector('wa-dropdown-item[value="print-registration-card"]');

describe('ir-room-header — print registration card', () => {
  it('is offered once the room is checked in', async () => {
    const page = await render(room({ code: '001', description: 'Check-in' }));
    expect(printItem(page)).not.toBeNull();
  });

  it('is still offered after the room is checked out', async () => {
    const page = await render(room({ code: '002', description: 'Check-out' }));
    expect(printItem(page)).not.toBeNull();
  });

  it('is not offered before check-in', async () => {
    expect(printItem(await render(room(null)))).toBeNull();
    expect(printItem(await render(room({ code: '000', description: "Didn't arrive" })))).toBeNull();
  });

  it('is offered even when the booking is not editable', async () => {
    const page = await render(room({ code: '002', description: 'Check-out' }), { isEditable: false });
    expect(printItem(page)).not.toBeNull();
  });

  it('asks the parent to print the registration card when chosen', async () => {
    const page = await render(room({ code: '001', description: 'Check-in' }));
    const onAction = jest.fn();
    page.root.addEventListener('action', (e: CustomEvent) => onAction(e.detail));

    const item = printItem(page);
    page.root.querySelector('wa-dropdown').dispatchEvent(new CustomEvent('wa-select', { detail: { item: { value: item.getAttribute('value') } } }));
    await page.waitForChanges();

    expect(onAction).toHaveBeenCalledWith('print-registration-card');
  });
});
