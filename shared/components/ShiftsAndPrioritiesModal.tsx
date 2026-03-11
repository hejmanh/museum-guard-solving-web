'use client';

import { useState } from 'react';
import { Room } from '@/shared/types';
import Button from './Button';
import ShiftConfigStep from './ShiftConfigStep';
import PriorityConfigStep from './PriorityConfigStep';

interface ShiftsAndPrioritiesModalProps {
  isOpen: boolean;
  rooms: Room[];
  initialConfig?: { nbrOfShifts: number; shiftsPriorities: number[][] } | null;
  onConfirm: (nbrOfShifts: number, shiftsPriorities: number[][]) => void;
  onClose: () => void;
}

export default function ShiftsAndPrioritiesModal({
  isOpen,
  rooms,
  initialConfig,
  onConfirm,
  onClose,
}: ShiftsAndPrioritiesModalProps) {
  const [nbrOfShifts, setNbrOfShifts] = useState<number | null>(
    initialConfig?.nbrOfShifts ?? null
  );
  const [shiftsError, setShiftsError] = useState<string | null>(null);
  const [configStep, setConfigStep] = useState<'shifts' | 'priorities'>(
    initialConfig ? 'priorities' : 'shifts'
  );
  const [shiftsPriorities, setShiftsPriorities] = useState<number[][]>(
    initialConfig ? initialConfig.shiftsPriorities.map((s) => [...s]) : []
  );
  const [activeShift, setActiveShift] = useState(0);

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
    setActiveShift(0);
    setConfigStep('priorities');
  };

  const handleOk = () => {
    onConfirm(nbrOfShifts!, shiftsPriorities);
    setConfigStep('shifts');
  };

  if (!isOpen) return null;

  const shiftOptions = nbrOfShifts
    ? Array.from({ length: nbrOfShifts }, (_, i) => ({ value: i, label: `Shift ${i + 1}` }))
    : [];

  return (
    <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-lg w-full mx-4 shadow-lg max-h-[80vh] overflow-y-auto">
        {/* close button */}
        <div className="flex items-center justify-end gap-2 px-4 pt-3 pb-1">
          <Button
            onClick={onClose}
            aria-label="Close"
            variant="secondary"
            style={{ padding: '4px' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Button>
        </div>
        {/* Content */}
        <div className="px-6 pb-6">
          {configStep === 'shifts' ? (
            <ShiftConfigStep
              value={nbrOfShifts}
              onChange={handleShiftsChange}
              error={shiftsError}
              onConfirm={handleConfirmShifts}
            />
          ) : (
            <PriorityConfigStep
              key={activeShift}
              rooms={rooms}
              shiftsPriorities={shiftsPriorities}
              onChange={setShiftsPriorities}
              shiftOptions={shiftOptions}
              onActiveShiftChange={(s) => setActiveShift(s)}
              onBack={() => setConfigStep('shifts')}
              onConfirm={handleOk}
              activeShift={activeShift}
            />
          )}
        </div>
      </div>
    </div>
  );
}
