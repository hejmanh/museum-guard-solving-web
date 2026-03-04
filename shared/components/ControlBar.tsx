import { Algorithm } from "@/shared/types";

interface ControlBarProps {
  selectedAlgorithm: Algorithm;
  onAlgorithmChange: (algorithm: Algorithm) => void;
  onRandomGraph: () => void;
  onAddRoom: () => void;
  onAddDoor: () => void;
  onSolve: () => void;
  onReset: () => void;
}

export default function ControlBar({
  selectedAlgorithm,
  onAlgorithmChange,
  onRandomGraph,
  onAddRoom,
  onAddDoor,
  onSolve,
  onReset,
}: ControlBarProps) {
  return (
    <div className="flex portrait:justify-center landscape:justify-end gap-1 sm:gap-2 mb-2 sm:mb-4 flex-wrap">
      <button
        onClick={onRandomGraph}
        className="px-2 sm:px-3 py-1 sm:py-2 bg-purple-500 text-white text-xs sm:text-sm font-semibold rounded hover:bg-purple-600 transition-colors"
      >
        Random Graph
      </button>
      <button
        onClick={onAddRoom}
        className="px-2 sm:px-3 py-1 sm:py-2 bg-blue-500 text-white text-xs sm:text-sm font-semibold rounded hover:bg-blue-600 transition-colors"
      >
        Add Room
      </button>
      <button
        onClick={onAddDoor}
        className="px-2 sm:px-3 py-1 sm:py-2 bg-blue-500 text-white text-xs sm:text-sm font-semibold rounded hover:bg-blue-600 transition-colors"
      >
        Add Door
      </button>
      <select
        value={selectedAlgorithm}
        onChange={(e) => onAlgorithmChange(e.target.value as Algorithm)}
        className="px-2 sm:px-3 py-1 sm:py-2 pr-6 sm:pr-8 bg-white border border-gray-300 text-xs sm:text-sm font-semibold rounded hover:border-gray-400 transition-colors"
      >
        <option value="greedy">Greedy</option>
        <option value="genetic">Genetic</option>
      </select>
      <button
        onClick={onSolve}
        className="px-2 sm:px-3 py-1 sm:py-2 bg-emerald-500 text-white text-xs sm:text-sm font-semibold rounded hover:bg-emerald-600 transition-colors"
      >
        Solve
      </button>
      <button
        onClick={onReset}
        className="px-2 sm:px-3 py-1 sm:py-2 bg-red-500 text-white text-xs sm:text-sm font-semibold rounded hover:bg-red-600 transition-colors"
      >
        Reset
      </button>
    </div>
  );
}
