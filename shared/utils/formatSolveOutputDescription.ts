import { Door } from '../types';

export function formatSolveOutputDescription(
  guardDoorIds: number[],
  doors: Door[]
): string {
  if (guardDoorIds.length === 0) {
    return 'No guards needed (no rooms or no doors).';
  }

  const placementLines = guardDoorIds.map((id) => {
    const door = doors.find((d) => d.id === id)!;
    return `Door ${door.id} (R${door.room1Id} ↔ R${door.room2Id})`;
  });

  return `Guards placed: ${guardDoorIds.length}\n${placementLines.join(', ')}`;
}