import type { Room, Door } from '../types';

export function findIsolatedRoomIds(rooms: Room[], doors: Door[]): number[] {
  const incidentCount = new Map<number, number>();
  for (const r of rooms) incidentCount.set(r.id, 0);

  for (const d of doors) {
    incidentCount.set(d.room1Id, (incidentCount.get(d.room1Id) ?? 0) + 1);
    incidentCount.set(d.room2Id, (incidentCount.get(d.room2Id) ?? 0) + 1);
  }

  return rooms
    .filter((r) => (incidentCount.get(r.id) ?? 0) === 0)
    .map((r) => r.id);
}
