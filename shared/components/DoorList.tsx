'use client';

import { Door } from '../types';

interface DoorListProps {
  doors: Door[];
}

export default function DoorList({ doors }: DoorListProps) {
  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-base font-semibold text-gray-700">Doors</h3>
      </div>
      <div className="p-2 max-h-32 overflow-y-auto bg-white">
        {doors.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No doors added yet</p>
        ) : (
          <ul className="space-y-1">
            {doors.map((door) => (
              <li key={door.id} className="text-sm text-gray-700">
                Door {door.id}: Room {door.room1Id} - Room {door.room2Id}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
