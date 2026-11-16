import type { AgentRtNaming } from '@/services/agents/type';

/** Room type id → agent naming (`id` is -1 until the backend persists it). */
export type RoomTypeCodeMap = Record<number, { id: number; name: string }>;

/** Builds an O(1) lookup from the API array shape. */
export function toRoomTypeCodeMap(list?: AgentRtNaming[] | null): RoomTypeCodeMap {
  const map: RoomTypeCodeMap = {};
  for (const { id, room_type_id, name } of list ?? []) {
    map[room_type_id] = { id: id ?? -1, name };
  }
  return map;
}

/**
 * Converts the lookup back to the API array shape.
 * Blank names are dropped so clearing an input removes the mapping.
 */
export function toRoomTypeCodeList(map: RoomTypeCodeMap): AgentRtNaming[] {
  const list: AgentRtNaming[] = [];
  for (const [roomTypeId, { id, name }] of Object.entries(map)) {
    const trimmed = name?.trim();
    if (trimmed) {
      list.push({ id, room_type_id: Number(roomTypeId), name: trimmed });
    }
  }
  return list;
}
