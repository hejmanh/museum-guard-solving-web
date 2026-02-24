'use client';

import { Room } from '../types';
import { useState, useEffect } from 'react';

interface RoomNodeProps {
  room: Room;
  onUpdate: (id: number, updates: Partial<Room>) => void;
  onDelete: (id: number) => void;
}

export default function RoomNode({ room, onUpdate, onDelete }: RoomNodeProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).classList.contains('resize-handle')) {
      setIsResizing(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    } else {
      setIsDragging(true);
      setDragStart({ x: e.clientX - room.x, y: e.clientY - room.y });
    }
    e.preventDefault();
  };

  const handleDoubleClick = () => {
    onDelete(room.id);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        onUpdate(room.id, {
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        });
      } else if (isResizing) {
        const deltaX = e.clientX - dragStart.x;
        const deltaY = e.clientY - dragStart.y;
        onUpdate(room.id, {
          width: Math.max(60, room.width + deltaX),
          height: Math.max(60, room.height + deltaY),
        });
        setDragStart({ x: e.clientX, y: e.clientY });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dragStart, room.id, room.width, room.height, onUpdate]);

  return (
    <div
      className="absolute border-1 border-gray-400 rounded-md bg-gray-100 cursor-move flex items-center justify-center text-gray-700 font-semibold select-none"
      style={{
        left: `${room.x}px`,
        top: `${room.y}px`,
        width: `${room.width}px`,
        height: `${room.height}px`,
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
    >
      R{room.id}
      <div
        className="resize-handle absolute bottom-0 right-0 w-3 h-3 cursor-se-resize"
        style={{ cursor: 'se-resize' }}
      />
    </div>
  );
}
