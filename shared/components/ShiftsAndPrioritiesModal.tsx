'use client';

import { useState } from 'react';
import { Room } from '@/shared/types';

interface ShiftsAndPrioritiesModalProps {
  isOpen: boolean;
  rooms: Room[];
  onConfirm: (nbrOfShifts: number, shiftsPriorities: number[][]) => void;
  onClose: () => void;
}

export default function ShiftsAndPrioritiesModal({
  isOpen,
  rooms,
  onConfirm,
  onClose,
}: ShiftsAndPrioritiesModalProps) {
  const [nbrOfShifts, setNbrOfShifts] = useState(2);
  const [configStep, setConfigStep] = useState<'shifts' | 'priorities'>('shifts');
  const [shiftsPriorities, setShiftsPriorities] = useState<number[][]>([]);

  const handleConfirmShifts = () => {
    if (nbrOfShifts < 1 || nbrOfShifts > 20) {
      alert('Number of shifts must be between 1 and 20');
      return;
    }
    // Initialize priorities array for each shift
    const initialized = Array.from({ length: nbrOfShifts }, () =>
      Array(rooms.length).fill(0)
    );
    setShiftsPriorities(initialized);
    setConfigStep('priorities');
  };

  const handlePriorityChange = (shiftIndex: number, roomIndex: number, value: number) => {
    const updated = shiftsPriorities.map((shift, sIdx) =>
      sIdx === shiftIndex
        ? shift.map((priority, rIdx) => (rIdx === roomIndex ? value : priority))
        : shift
    );
    setShiftsPriorities(updated);
  };

  const handleOk = () => {
    onConfirm(nbrOfShifts, shiftsPriorities);
    setConfigStep('shifts');
    setNbrOfShifts(2);
    setShiftsPriorities([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 shadow-lg max-h-[80vh] overflow-y-auto relative">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 p-1 rounded"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
        {configStep === 'shifts' ? (
          <>
            <h2 className="text-lg font-bold text-gray-800 mb-4">Configure Number of Shifts</h2>
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                How many shifts do you want?
              </label>
              <input
                type="number"
                min="1"
                value={nbrOfShifts}
                onChange={(e) => setNbrOfShifts(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-4 justify-center">
              <button
                onClick={handleConfirmShifts}
                className="px-4 py-2 bg-blue-500 text-white font-semibold rounded hover:bg-blue-600 transition-colors w-auto"
              >
                Next
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-lg font-bold text-gray-800 mb-4">Configure Room Priorities by Shift</h2>
            <div className="space-y-6 mb-6">
              {shiftsPriorities.map((shift, shiftIdx) => (
                <div key={shiftIdx} className="border rounded-lg p-4 bg-gray-50">
                  <h3 className="font-semibold text-gray-700 mb-3">Shift {shiftIdx + 1}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {rooms.map((room, roomIdx) => (
                      <div key={room.id} className="flex items-center gap-2">
                        <label className="text-sm text-gray-700 font-medium min-w-[60px]">
                          Room {room.id}:
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={shift[roomIdx]}
                          onChange={(e) =>
                            handlePriorityChange(
                              shiftIdx,
                              roomIdx,
                              Math.max(0, parseInt(e.target.value) || 0)
                            )
                          }
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setConfigStep('shifts')}
                className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded hover:bg-gray-300 transition-colors w-auto"
              >
                Back
              </button>
              <button
                onClick={handleOk}
                className="px-4 py-2 bg-emerald-500 text-white font-semibold rounded hover:bg-emerald-600 transition-colors w-auto"
              >
                OK
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
