import Button from './Button';
import { Algorithm } from "@/shared/types";

interface ControlBarProps {
  selectedAlgorithm: Algorithm;
  onAlgorithmChange: (algorithm: Algorithm) => void;
  onRandomGraph: () => void;
  onAddRoom: () => void;
  onSolve: () => void;
  onReset: () => void;
  onUndo: () => void;
  canUndo: boolean;
  onGeneticConfig?: () => void;
}

export default function ControlBar({
  selectedAlgorithm,
  onAlgorithmChange,
  onRandomGraph,
  onAddRoom,
  onSolve,
  onReset,
  onUndo,
  canUndo,
  onGeneticConfig,
}: ControlBarProps) {
  return (
    <div className="flex portrait:justify-center landscape:justify-end gap-1 sm:gap-2 mb-2 sm:mb-4 flex-wrap">
      <Button size="responsive" variant="secondary" onClick={onUndo} disabled={!canUndo}>
        Undo
      </Button>
      <Button size="responsive" variant="purple" onClick={onRandomGraph}>
        Random Graph
      </Button>
      <Button size="responsive" variant="primary" onClick={onAddRoom}>
        Add Room
      </Button>
      <select
        value={selectedAlgorithm}
        onChange={(e) => onAlgorithmChange(e.target.value as Algorithm)}
        className="px-2 sm:px-3 py-1 sm:py-2 pr-6 sm:pr-8 bg-white border border-gray-300 text-xs sm:text-sm font-semibold rounded hover:border-gray-400 transition-colors"
      >
        <option value="greedy">Greedy</option>
        <option value="genetic">Genetic</option>
      </select>
      {selectedAlgorithm === 'genetic' && (
        <Button size="responsive" variant="warning" onClick={onGeneticConfig}>
          Genetic Config
        </Button>
      )}
      <Button size="responsive" variant="success" onClick={onSolve}>
        Solve
      </Button>
      <Button size="responsive" variant="danger" onClick={onReset}>
        Reset
      </Button>
    </div>
  );
}
