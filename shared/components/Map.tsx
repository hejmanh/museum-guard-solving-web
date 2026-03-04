'use client';

import { Room, Door } from '../types';
import RoomNode from './RoomNode';
import DoorEdge from './DoorEdge';

interface MapProps {
  rooms: Room[];
  doors: Door[];
  guardDoorIds: number[];
  onUpdateRoom: (id: number, updates: Partial<Room>) => void;
  onDeleteRoom: (id: number) => void;
  onDeleteDoor: (id: number) => void;
}

export default function Map({ rooms, doors, guardDoorIds, onUpdateRoom, onDeleteRoom, onDeleteDoor }: MapProps) {
  const guardedDoorSet = new Set(guardDoorIds);

  return (
    <div className="relative w-full h-full bg-gray-50 border-2 border-gray-300 rounded overflow-hidden">
      {/* SVG layer for doors (edges) */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <g className="pointer-events-auto">
          {doors.map((door) => (
            <DoorEdge
              key={door.id}
              door={door}
              rooms={rooms}
              onDelete={onDeleteDoor}
              isGuarded={guardedDoorSet.has(door.id)}
            />
          ))}
        </g>
      </svg>

      {/* Room nodes */}
      {rooms.map((room) => (
        <RoomNode
          key={room.id}
          room={room}
          onUpdate={onUpdateRoom}
          onDelete={onDeleteRoom}
        />
      ))}
    </div>
  );
}
