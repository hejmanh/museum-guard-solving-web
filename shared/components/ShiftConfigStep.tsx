'use client';

import Button from './Button';
import NumberInputBox from './NumberInputBox';

interface ShiftConfigStepProps {
  value: number | null;
  onChange: (value: number | null) => void;
  error: string | null;
  onConfirm: () => void;
}

export default function ShiftConfigStep({
  value,
  onChange,
  error,
  onConfirm,
}: ShiftConfigStepProps) {
  return (
    <form onSubmit={(e) => { e.preventDefault(); onConfirm(); }}>
      <h2 className="text-lg font-bold text-gray-800 mb-4">Configure Number of Shifts</h2>
      <div className="mb-6">
        <NumberInputBox
          label="How many shifts do you want?"
          value={value}
          onChange={onChange}
          min={2}
          max={20}
          placeholder="Enter number (2–20)"
          autoFocus
        />
        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      </div>
      <div className="flex gap-4 justify-center">
        <Button type="submit" variant="primary">
          Next
        </Button>
      </div>
    </form>
  );
}
