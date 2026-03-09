'use client';

interface ShiftAndPriorityConfigSectionProps {
  nbrOfShifts: number;
  shiftsPriorities: number[][];
}

export default function ShiftAndPriorityConfigSection({
  nbrOfShifts,
  shiftsPriorities,
}: ShiftAndPriorityConfigSectionProps) {
  return (
    <div className="mt-2 sm:mt-4">
      <div className="flex items-center justify-between mb-1 sm:mb-2">
        <h3 className="text-sm sm:text-base font-semibold text-gray-700">Genetic Config</h3>
      </div>
      <div className="p-2 max-h-24 sm:max-h-32 overflow-y-auto bg-white">
        <div className="space-y-1 text-xs sm:text-sm text-gray-700">
          <div className="font-semibold text-gray-800">Number of shifts: {nbrOfShifts}</div>
          {shiftsPriorities.map((shift, shiftIdx) => (
            <div key={shiftIdx} className="text-xs text-gray-600 sm:text-sm text-gray-700">
              Shift {shiftIdx + 1}: {shift.join(', ')}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
