'use client';

import { Room } from '../types';
import { useState, useEffect, useRef } from 'react';

interface RoomNodeProps {
  room: Room;
  onUpdate: (id: number, updates: Partial<Room>) => void;
  onDelete: (id: number) => void;
  onSelect?: (id: number) => void;
  isSelected?: boolean;
}

export default function RoomNode({ room, onUpdate, onDelete, onSelect, isSelected }: RoomNodeProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const hasDraggedRef = useRef(false);
  const dragOriginRef = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    hasDraggedRef.current = false;
    dragOriginRef.current = { x: e.clientX, y: e.clientY };
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
    if (onSelect) return; // don't delete while in door-selection mode
    onDelete(room.id);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - dragOriginRef.current.x;
      const dy = e.clientY - dragOriginRef.current.y;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        hasDraggedRef.current = true;
      }
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
      const wasClick = !hasDraggedRef.current && isDragging;
      setIsDragging(false);
      setIsResizing(false);
      if (wasClick && onSelect) {
        onSelect(room.id);
      }
    };

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dragStart, room.id, room.width, room.height, onUpdate, onSelect]);

  return (
    <div
      className={`absolute border-1 rounded-md cursor-move flex items-center justify-center font-semibold select-none transition-colors ${
        isSelected
          ? 'border-blue-500 bg-blue-200 text-blue-800 ring-2 ring-blue-400'
          : 'border-gray-400 bg-gray-100 text-gray-700'
      }`}
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
