import type { Booking } from '@/models/booking.dto';
import {
  computeRevPar,
  countArrivingUnits,
  countBlockedUnits,
  countDepartingUnits,
  countOverdueArrivals,
  countOverdueDepartures,
  countRooms,
  countUnassignedArrivals,
  filterInHouse,
  sumOccupancy,
  sumUnits,
} from '../dashboard.helpers';
import { roomArrivalMinutes, roomDepartureMinutes, sortRoomsByTime } from '@/utils/room-movement-time';

const booking = (rooms: Partial<Booking['rooms'][number]>[]) => ({ rooms }) as unknown as Booking;

describe('dashboard helpers', () => {
  const date = '2026-10-09';
  const bookings = [
    booking([
      { from_date: date, to_date: '2026-10-11', unit: { id: 1, name: '101' } as any },
      { from_date: date, to_date: '2026-10-10', unit: null },
    ]),
    booking([{ from_date: '2026-10-07', to_date: date, unit: { id: 2, name: '102' } as any }]),
  ];

  it('counts units, not bookings', () => {
    expect(countUnassignedArrivals(bookings, date)).toBe(1);
    expect(countDepartingUnits(bookings, date)).toBe(1);
  });

  it('counts unassigned units still waiting to check in, overdue included', () => {
    const inOut = (code: '000' | '001' | '002' | null) => (code ? { code, description: '' } : null);
    const arrivals = [
      booking([
        { from_date: date, unit: null, in_out: inOut('000') },
        { from_date: '2026-10-07', unit: null, in_out: inOut(null) },
        { from_date: date, unit: { id: 1, name: '101' } as any, in_out: inOut('000') },
        { from_date: '2026-10-07', unit: null, in_out: inOut('001') },
        { from_date: '2026-10-12', unit: null, in_out: inOut('000') },
      ]),
    ];
    expect(countUnassignedArrivals(arrivals, date)).toBe(2);
  });

  it('counts overdue arrivals and departures against today', () => {
    const inOut = (code: '000' | '001' | '002' | null) => (code ? { code, description: '' } : null);
    const today = '2026-10-09';
    const rooms = [
      booking([
        { from_date: '2026-10-07', to_date: '2026-10-08', in_out: inOut('000') },
        { from_date: '2026-10-07', to_date: '2026-10-08', in_out: inOut('001') },
        { from_date: '2026-10-06', to_date: '2026-10-08', in_out: inOut('002') },
        { from_date: '2026-10-08', to_date: today, in_out: inOut(null) },
        { from_date: today, to_date: '2026-10-11', in_out: inOut('000') },
        { from_date: '2026-10-07', to_date: today, in_out: inOut('001') },
      ]),
    ];
    expect(countOverdueArrivals(rooms, today)).toBe(2);
    expect(countOverdueDepartures(rooms, today)).toBe(1);
  });

  it('derives RevPAR from ADR and occupancy', () => {
    expect(computeRevPar(100, 50)).toBe(50);
    expect(computeRevPar(100, 0)).toBe(0);
  });

  it('keeps only checked-in rooms whose stay covers the date, departure day included', () => {
    const inOut = (code: '000' | '001' | '002' | null) => (code ? { code, description: '' } : null);
    const mixed = [
      booking([
        { identifier: 'a', from_date: '2026-10-07', to_date: date, in_out: inOut('001') },
        { identifier: 'b', from_date: date, to_date: '2026-10-12', in_out: inOut('001') },
        { identifier: 'c', from_date: '2026-10-07', to_date: '2026-10-12', in_out: inOut('002') },
        { identifier: 'd', from_date: '2026-10-07', to_date: '2026-10-12', in_out: inOut('000') },
        { identifier: 'e', from_date: '2026-10-07', to_date: '2026-10-12', in_out: inOut(null) },
      ]),
      booking([{ identifier: 'f', from_date: '2026-10-10', to_date: '2026-10-12', in_out: inOut('001') }]),
      booking([{ identifier: 'g', from_date: '2026-10-05', to_date: '2026-10-08', in_out: inOut('001') }]),
    ];
    const inHouse = filterInHouse(mixed, date);
    expect(inHouse).toHaveLength(1);
    expect(inHouse[0].rooms.map(r => r.identifier)).toEqual(['a', 'b']);
    expect(countRooms(inHouse)).toBe(2);
  });

  it('sums available and total units from the exposed inventory across room types', () => {
    const inventory = (rts: number, total: number) => ({ is_active: true, exposed_inventory: { rts, total } });
    expect(sumUnits([inventory(3, 10), inventory(2, 8), { is_active: true, exposed_inventory: null }], date)).toEqual({
      available: 5,
      outOfService: 0,
      blocked: 0,
      total: 18,
    });
  });

  it('leaves a total the calendar does not return undefined', () => {
    expect(
      sumUnits(
        [
          { is_active: true, exposed_inventory: { rts: 4 } },
          { is_active: true, exposed_inventory: { rts: 3 } },
        ],
        date,
      ).total,
    ).toBeUndefined();
  });

  it('counts only active room types', () => {
    const blocked = {
      calendar_cell: { left_cell: null, right_cell: { Is_Available: false, STAY_STATUS_CODE: '004', My_Block_Info: { from_date: date, to_date: '2026-10-10' } } as any },
    };
    const roomTypes = [
      { is_active: true, exposed_inventory: { rts: 3, total: 10 }, physicalrooms: [blocked] },
      { is_active: false, exposed_inventory: { rts: 2, total: 8 }, physicalrooms: [blocked] },
    ];
    expect(sumUnits(roomTypes, date)).toEqual({ available: 3, outOfService: 1, blocked: 0, total: 10 });
    expect(countBlockedUnits(roomTypes, date)).toEqual({ outOfService: 1, blocked: 0 });
  });

  describe('blocked units', () => {
    const block = (code: string, from_date: string, to_date: string, Is_Available = false) =>
      ({ Is_Available, STAY_STATUS_CODE: code, My_Block_Info: { from_date, to_date } }) as any;
    const unit = (right_cell?: any, left_cell?: any) => ({ calendar_cell: { left_cell: left_cell ?? null, right_cell: right_cell ?? null } });
    const roomType = (...physicalrooms: any[]) => ({ is_active: true, exposed_inventory: { rts: 0 }, physicalrooms });

    it('counts out-of-service (004) and blocked (002, 003) units across every room type', () => {
      const roomTypes = [
        roomType(unit(block('004', '2026-10-08', '2026-10-11')), unit(block('002', date, '2026-10-10')), unit()),
        roomType(unit(block('003', '2026-10-07', '2026-10-12')), unit(block('004', date, '2026-10-12')), { calendar_cell: null }),
      ];
      expect(countBlockedUnits(roomTypes, date)).toEqual({ outOfService: 2, blocked: 2 });
      expect(sumUnits(roomTypes, date)).toMatchObject({ outOfService: 2, blocked: 2 });
    });

    it('counts a unit once when both halves of its day carry the block', () => {
      const cell = block('002', '2026-10-08', '2026-10-11');
      expect(countBlockedUnits([roomType(unit(cell, cell))], date)).toEqual({ outOfService: 0, blocked: 1 });
    });

    it('ignores a block that ended this morning, but counts a same-day block', () => {
      const ended = unit(undefined, block('004', '2026-10-07', date));
      const sameDay = unit(block('002', date, date));
      expect(countBlockedUnits([roomType(ended, sameDay)], date)).toEqual({ outOfService: 0, blocked: 1 });
    });

    it('ignores bookings and cells still available', () => {
      const booked = unit({ Is_Available: false, STAY_STATUS_CODE: '001', My_Block_Info: null });
      const available = unit(block('002', date, '2026-10-10', true));
      expect(countBlockedUnits([roomType(booked, available)], date)).toEqual({ outOfService: 0, blocked: 0 });
    });
  });

  it('counts the units arriving on the day, without overdue ones', () => {
    const arrivals = [booking([{ from_date: date }, { from_date: '2026-10-07' }]), booking([{ from_date: date }])];
    expect(countArrivingUnits(arrivals, date)).toBe(2);
  });

  it('sums adults, children and infants across the rooms', () => {
    const occupancy = (adult_nbr: number, children_nbr: number, infant_nbr: number | null) => ({ occupancy: { adult_nbr, children_nbr, infant_nbr } });
    const inHouse = [booking([occupancy(2, 1, null), occupancy(1, 0, 1)]), booking([occupancy(3, 2, 0)])];
    expect(sumOccupancy(inHouse)).toEqual({ adults: 6, children: 3, infants: 1 });
    expect(sumOccupancy([])).toEqual({ adults: 0, children: 0, infants: 0 });
  });

  describe('room times', () => {
    const time = (code: string, description: string) => ({ code, description });

    it('reads clock times and treats unset or unparsable ones as unknown', () => {
      expect(roomArrivalMinutes({ arrival_time: time('014', '14:00') } as any)).toBe(14 * 60);
      expect(roomArrivalMinutes({ arrival_time: time('020', '8:30 PM') } as any)).toBe(20 * 60 + 30);
      expect(roomArrivalMinutes({ arrival_time: time('001', 'Not sure yet') } as any)).toBeNull();
      expect(roomArrivalMinutes({ arrival_time: time('099', 'After midnight') } as any)).toBeNull();
      expect(roomArrivalMinutes({} as any)).toBeNull();
      expect(roomDepartureMinutes({ departure_time: time('029', '18:00') } as any)).toBe(18 * 60);
      expect(roomDepartureMinutes({ departure_time: time('000', '') } as any)).toBeNull();
      expect(roomDepartureMinutes({ departure_time: time('', '') } as any)).toBeNull();
    });

    it('lists each room on its own row, rooms without a time first, then by time', () => {
      const room = (identifier: string, description: string | null) => ({ identifier, arrival_time: description ? time('010', description) : time('001', '') });
      const bookings = [
        { booking_nbr: 'A', rooms: [room('a1', '16:00'), room('a2', null)] },
        { booking_nbr: 'B', rooms: [room('b1', '09:00')] },
        { booking_nbr: 'C', rooms: [room('c1', null)] },
      ] as unknown as Booking[];
      const sorted = sortRoomsByTime(bookings, roomArrivalMinutes);
      expect(sorted.map(b => `${b.booking_nbr}:${b.rooms.map(r => r.identifier).join()}`)).toEqual(['A:a2', 'C:c1', 'B:b1', 'A:a1']);
    });
  });
});
