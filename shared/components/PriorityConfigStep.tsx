'use client';

import { useState, useRef } from 'react';
import type { Room } from '@/shared/types';
import Button from './Button';
import RoomMultiInput from './RoomMultiInput';
import NumberInputBox from './NumberInputBox';
import SelectBox from './SelectBox';

interface PriorityConfigStepProps {
  rooms: Room[];
  shiftsPriorities: number[][];
  onChange: (updated: number[][]) => void;
  onBack: () => void;
  onConfirm: () => void;
  activeShift: number;
  shiftOptions?: { value: number; label: string }[];
  onActiveShiftChange?: (shift: number) => void;
}

function parseRoomIds(input: string): number[] {
  return input
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => parseInt(s, 10))
    .filter((n) => !isNaN(n));
}

export default function PriorityConfigStep({
  rooms,
  shiftsPriorities,
  onChange,
  onBack,
  onConfirm,
  activeShift,
  shiftOptions = [],
  onActiveShiftChange,
}: PriorityConfigStepProps) {
  const [roomsInput, setRoomsInput] = useState('');
  const [priorityInput, setPriorityInput] = useState<number | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);
  const roomsInputRef = useRef<HTMLInputElement>(null);

  const roomIdSet = new Set(rooms.map((r) => r.id));
  const currentPriorities = shiftsPriorities[activeShift] ?? [];

  const priorityEntries = rooms
    .map((room, idx) => ({ room, idx, priority: currentPriorities[idx] ?? 0 }))
    .filter((e) => e.priority !== 0);

  const handleApply = () => {
    setApplyError(null);
    const ids = parseRoomIds(roomsInput);
    if (ids.length === 0) {
      setApplyError('Enter at least one room number');
      return;
    }
    const invalid = ids.filter((id) => !roomIdSet.has(id));
    if (invalid.length > 0) {
      setApplyError(`Unknown room(s): ${invalid.join(', ')}`);
      return;
    }
    const priority = priorityInput ?? 0;
    const updated = shiftsPriorities.map((shift, sIdx) => {
      if (sIdx !== activeShift) return shift;
      const next = [...shift];
      for (const id of ids) {
        const idx = rooms.findIndex((r) => r.id === id);
        next[idx] = priority;
      }
      return next;
    });
    onChange(updated);
    setRoomsInput('');
    setPriorityInput(null);
    roomsInputRef.current?.focus();
  };

  const handleRemoveEntry = (roomIdx: number) => {
    const updated = shiftsPriorities.map((shift, sIdx) => {
      if (sIdx !== activeShift) return shift;
      const next = [...shift];
      next[roomIdx] = 0;
      return next;
    });
    onChange(updated);
  };

  const handleClearShift = () => {
    const updated = shiftsPriorities.map((shift, sIdx) => {
      if (sIdx !== activeShift) return shift;
      return Array(rooms.length).fill(0);
    });
    onChange(updated);
  };

  return (
    <>
      <h2 className="text-lg font-bold text-gray-800 mb-4">Configure Room Priorities</h2>
      {shiftOptions.length > 0 && onActiveShiftChange && (
        <div className="flex items-start mb-3">
          <SelectBox
            options={shiftOptions}
            value={activeShift}
            onChange={(v) => onActiveShiftChange(Number(v))}
            placeholder="Select shift"
            size="md"
            className="flex-none"
          />
        </div>
      )}
      {/* Assign row: rooms + priority + apply — all same height via py-2 */}
      <div className="flex gap-2 items-end flex-wrap mb-1">
        <div className="flex-1 min-w-36">
          <label className="block text-xs font-semibold text-gray-600 mb-1">Rooms</label>
          <RoomMultiInput
            rooms={rooms}
            value={roomsInput}
            onChange={setRoomsInput}
            autoFocus
            inputRef={roomsInputRef}
            onEnterWithNoSuggestions={handleApply}
          />
        </div>
        <div className="w-24">
          <label className="block text-xs font-semibold text-gray-600 mb-1">Priority</label>
          <NumberInputBox
            value={priorityInput}
            onChange={setPriorityInput}
            min={0}
            placeholder="0"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleApply();
              }
            }}
          />
        </div>
        <Button
          onClick={handleApply}
          variant="primary"
          className="px-3 py-2 text-sm font-semibold rounded bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50 self-end"
        >
          Apply
        </Button>
      </div>
      {applyError && <p className="text-red-500 text-xs mb-3">{applyError}</p>}

      {/* Current priorities for active shift */}
      <div className="mb-6 min-h-14 mt-3">
        {priorityEntries.length === 0 ? (
          <p className="text-sm text-gray-400 italic">
            All rooms use default priority (0) for Shift {activeShift + 1}.
          </p>
        ) : (
          <>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Custom priorities — Shift {activeShift + 1}
              </span>
              <button
                onClick={handleClearShift}
                className="text-xs text-red-400 hover:text-red-600 transition-colors"
              >
                Clear all
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {priorityEntries.map(({ room, idx, priority }) => (
                <span
                  key={room.id}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded"
                >
                  R{room.id}: {priority}
                  <button
                    onClick={() => handleRemoveEntry(idx)}
                    aria-label={`Remove Room ${room.id}`}
                    className="ml-0.5 leading-none hover:text-red-600 transition-colors"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="flex gap-4 justify-center">
        <Button onClick={onBack} variant="secondary">
          Back
        </Button>
        <Button onClick={onConfirm} variant="success">
          OK
        </Button>
      </div>
    </>
  );
}
