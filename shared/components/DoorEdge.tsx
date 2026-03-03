'use client';

import { Door, Room } from '../types';

interface DoorEdgeProps {
  door: Door;
  rooms: Room[];
  onDelete: (id: number) => void;
  isGuarded?: boolean;
}

export default function DoorEdge({ door, rooms, onDelete, isGuarded = false }: DoorEdgeProps) {
  const room1 = rooms.find((r) => r.id === door.room1Id);
  const room2 = rooms.find((r) => r.id === door.room2Id);

  if (!room1 || !room2) return null;

  // Calculate center points of rooms
  const x1 = room1.x + room1.width / 2;
  const y1 = room1.y + room1.height / 2;
  const x2 = room2.x + room2.width / 2;
  const y2 = room2.y + room2.height / 2;

  const handleDoubleClick = () => {
    onDelete(door.id);
  };

  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={isGuarded ? '#F59E0B' : '#3B82F6'}
      strokeWidth={isGuarded ? '3' : '2'}
      className="cursor-pointer hover:stroke-blue-600"
      onDoubleClick={handleDoubleClick}
    />
  );
}
