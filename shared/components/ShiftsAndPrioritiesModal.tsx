'use client';

import { useState } from 'react';
import { Room } from '@/shared/types';
import NumberInputBox from './NumberInputBox';
import Button from './Button';

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
  const [nbrOfShifts, setNbrOfShifts] = useState<number | null>(null);
  const [shiftsError, setShiftsError] = useState<string | null>(null);
  const [configStep, setConfigStep] = useState<'shifts' | 'priorities'>('shifts');
  const [shiftsPriorities, setShiftsPriorities] = useState<number[][]>([]);

  const handleShiftsChange = (value: number | null) => {
    setNbrOfShifts(value);
    if (value !== null && (value < 2 || value > 20)) {
      setShiftsError('Number of shifts must be between 2 and 20');
    } else {
      setShiftsError(null);
    }
  };

  const handleConfirmShifts = () => {
    if (nbrOfShifts === null || nbrOfShifts < 2 || nbrOfShifts > 20) {
      setShiftsError('Number of shifts must be between 2 and 20');
      return;
    }
    const initialized = Array.from({ length: nbrOfShifts }, () =>
      Array(rooms.length).fill(0)
    );
    setShiftsPriorities(initialized);
    setConfigStep('priorities');
  };

  const handlePriorityChange = (shiftIndex: number, roomIndex: number, value: number | null) => {
    const updated = shiftsPriorities.map((shift, sIdx) =>
      sIdx === shiftIndex
        ? shift.map((priority, rIdx) => (rIdx === roomIndex ? (value ?? 0) : priority))
        : shift
    );
    setShiftsPriorities(updated);
  };

  const handleOk = () => {
    onConfirm(nbrOfShifts!, shiftsPriorities);
    setConfigStep('shifts');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 shadow-lg max-h-[80vh] overflow-y-auto relative">
        {/* close button */}
        <Button
          onClick={onClose}
          aria-label="Close"
          variant="secondary"
          size="sm"
          className="absolute top-3 right-3 p-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </Button>
        {configStep === 'shifts' ? (
          <form onSubmit={(e) => { e.preventDefault(); handleConfirmShifts(); }}>
            <h2 className="text-lg font-bold text-gray-800 mb-4">Configure Number of Shifts</h2>
            <div className="mb-6">
              <NumberInputBox
                label="How many shifts do you want?"
                value={nbrOfShifts}
                onChange={handleShiftsChange}
                min={2}
                max={20}
                placeholder="Enter number (2–20)"
                autoFocus
              />
              {shiftsError && (
                <p className="text-red-500 text-sm mt-1">{shiftsError}</p>
              )}
            </div>
            <div className="flex gap-4 justify-center">
              <Button
                type="submit"
                variant="primary"
              >
                Next
              </Button>
            </div>
          </form>
        ) : (
          <>
            <h2 className="text-lg font-bold text-gray-800 mb-4">Configure Room Priorities by Shift</h2>
            <div className="space-y-6 mb-6">
              {shiftsPriorities.map((shift, shiftIdx) => (
                <div key={shiftIdx} className="border rounded-lg p-4 bg-gray-50">
                  <h3 className="font-semibold text-gray-700 mb-3">Shift {shiftIdx + 1}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    {rooms.map((room, roomIdx) => (
                      <div key={room.id}>
                        <NumberInputBox
                          label={`Room ${room.id}:`}
                          value={shift[roomIdx]}
                          onChange={(value) => handlePriorityChange(shiftIdx, roomIdx, value)}
                          min={0}
                          size="sm"
                          placeholder="0"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => setConfigStep('shifts')}
                variant="secondary"
              >
                Back
              </Button>
              <Button
                onClick={handleOk}
                variant="success"
              >
                OK
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
