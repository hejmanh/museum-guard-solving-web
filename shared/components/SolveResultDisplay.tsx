interface SolveResultDisplayProps {
  solveDescription: string | null;
}

export default function SolveResultDisplay({ solveDescription }: SolveResultDisplayProps) {
  if (!solveDescription) return null;

  return (
    <div className="mb-2 sm:mb-3 p-2 sm:p-3 bg-amber-50 border border-amber-300 rounded text-xs sm:text-sm text-gray-800 whitespace-pre-wrap">
      {solveDescription}
    </div>
  );
}
