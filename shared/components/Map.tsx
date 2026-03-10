'use client';

import type { Room, Door } from '../types';
import RoomNode from './RoomNode';
import DoorEdge from './DoorEdge';

interface MapProps {
  rooms: Room[];
  doors: Door[];
  guardDoorIds: number[];
  onUpdateRoom: (id: number, updates: Partial<Room>) => void;
  onDeleteRoom: (id: number) => void;
  onDeleteDoor: (id: number) => void;
  onSelectRoom?: (id: number) => void;
  selectedRoomId?: number | null;
}

const noop = () => {};

export default function Map(props?: Partial<MapProps>) {
  const rooms = props?.rooms ?? [];
  const doors = props?.doors ?? [];
  const guardDoorIds = props?.guardDoorIds ?? [];

  const onUpdateRoom = props?.onUpdateRoom ?? noop;
  const onDeleteRoom = props?.onDeleteRoom ?? noop;
  const onDeleteDoor = props?.onDeleteDoor ?? noop;
  const onSelectRoom = props?.onSelectRoom;
  const selectedRoomId = props?.selectedRoomId ?? null;

  const ok =
    Array.isArray(props?.rooms) &&
    Array.isArray(props?.doors) &&
    Array.isArray(props?.guardDoorIds) &&
    typeof props?.onUpdateRoom === 'function' &&
    typeof props?.onDeleteRoom === 'function' &&
    typeof props?.onDeleteDoor === 'function';

  if (!ok) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error('Map received invalid props (likely called as Map())', props);
      // eslint-disable-next-line no-console
      console.trace('Map invalid-props stack');
    }

    return (
      <div className="relative w-full h-full bg-red-50 border-2 border-red-200 rounded overflow-hidden p-3">
        <div className="text-sm font-semibold text-red-700">Map error</div>
        <div className="mt-1 text-xs text-red-700">
          Map received invalid props. Open the browser console and look for
          <span className="font-mono"> Map invalid-props stack</span> to see who called it.
        </div>
      </div>
    );
  }

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
          onSelect={onSelectRoom}
          isSelected={selectedRoomId === room.id}
        />
      ))}
    </div>
  );
}
