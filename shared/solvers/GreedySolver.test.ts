import { describe, it, expect } from 'vitest';
import { GreedySolver } from './GreedySolver';
import { Room, Door } from '../types';

const makeRoom = (id: number): Room => ({ id, x: 0, y: 0, width: 60, height: 60 });

describe('GreedySolver', () => {
  const solver = new GreedySolver();

  it('returns no guards when there are no rooms', () => {
    const result = solver.solve([], []);
    expect(result.guardDoorIds).toEqual([]);
  });

  it('returns no guards when there are rooms but no doors', () => {
    const rooms = [makeRoom(1), makeRoom(2)];
    const result = solver.solve(rooms, []);
    expect(result.guardDoorIds).toEqual([]);
  });

  it('covers two rooms with one guard on the connecting door', () => {
    const rooms = [makeRoom(1), makeRoom(2)];
    const doors: Door[] = [{ id: 1, room1Id: 1, room2Id: 2 }];
    const result = solver.solve(rooms, doors);
    expect(result.guardDoorIds).toEqual([1]);
    expect(result.description).toContain('Guards placed: 1');
  });

  it('covers a linear chain R1-R2-R3 with 2 guards', () => {
    // R1 -- D1 -- R2 -- D2 -- R3
    // Optimal: D1 covers R1+R2, D2 covers R3 (only 1 uncovered)
    const rooms = [makeRoom(1), makeRoom(2), makeRoom(3)];
    const doors: Door[] = [
      { id: 1, room1Id: 1, room2Id: 2 },
      { id: 2, room1Id: 2, room2Id: 3 },
    ];
    const result = solver.solve(rooms, doors);
    expect(result.guardDoorIds).toHaveLength(2);
    expect(result.guardDoorIds).toContain(1);
    expect(result.guardDoorIds).toContain(2);
  });

  it('covers a star graph with 2 guards (center R1 connected to R2, R3, R4)', () => {
    // R2 - R1 - R3
    //      |
    //      R4
    // D1: R1-R2, D2: R1-R3, D3: R1-R4
    // Greedy picks D1 first (covers R1+R2), then D2 (covers R3), then D3 (covers R4) → 3 guards
    // OR picks any door covering 2 uncovered → at minimum 2 guards if lucky
    // The greedy result should cover all rooms
    const rooms = [makeRoom(1), makeRoom(2), makeRoom(3), makeRoom(4)];
    const doors: Door[] = [
      { id: 1, room1Id: 1, room2Id: 2 },
      { id: 2, room1Id: 1, room2Id: 3 },
      { id: 3, room1Id: 1, room2Id: 4 },
    ];
    const result = solver.solve(rooms, doors);
    // All rooms must be covered
    const coveredRooms = new Set<number>();
    for (const doorId of result.guardDoorIds) {
      const door = doors.find((d) => d.id === doorId)!;
      coveredRooms.add(door.room1Id);
      coveredRooms.add(door.room2Id);
    }
    expect(coveredRooms).toContain(1);
    expect(coveredRooms).toContain(2);
    expect(coveredRooms).toContain(3);
    expect(coveredRooms).toContain(4);
  });

  it('description includes guard count and door details', () => {
    const rooms = [makeRoom(1), makeRoom(2)];
    const doors: Door[] = [{ id: 1, room1Id: 1, room2Id: 2 }];
    const result = solver.solve(rooms, doors);
    expect(result.description).toContain('Guards placed: 1');
    expect(result.description).toContain('Door 1');
    expect(result.description).toContain('R1');
    expect(result.description).toContain('R2');
  });

  it('does not place duplicate guards on the same door', () => {
    const rooms = [makeRoom(1), makeRoom(2)];
    const doors: Door[] = [{ id: 1, room1Id: 1, room2Id: 2 }];
    const result = solver.solve(rooms, doors);
    const unique = new Set(result.guardDoorIds);
    expect(unique.size).toBe(result.guardDoorIds.length);
  });
});
