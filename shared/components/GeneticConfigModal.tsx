'use client';

interface GeneticConfigModalProps {
  isOpen: boolean;
  onYes: () => void;
  onNo: () => void;
}

export default function GeneticConfigModal({ isOpen, onYes, onNo }: GeneticConfigModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 shadow-lg">
        <h2 className="text-lg font-bold text-gray-800 mb-4 text-center">Configure Genetic Algorithm</h2>
        <p className="text-gray-700 mb-6">
          Would you like to configure multiple shifts or different room priorities?
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={onYes}
            className="px-4 py-2 bg-blue-500 text-white font-semibold rounded hover:bg-blue-600 transition-colors w-auto"
          >
            Yes
          </button>
          <button
            onClick={onNo}
            className="px-4 py-2 bg-gray-500 text-white font-semibold rounded hover:bg-gray-600 transition-colors w-auto"
          >
            No
          </button>
        </div>
      </div>
    </div>
  );
}
