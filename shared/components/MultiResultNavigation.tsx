'use client';

interface MultiResultNavigationProps {
  current: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}

export default function MultiResultNavigation({ current, total, onPrev, onNext }: MultiResultNavigationProps) {
  if (total <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mb-3">
      <button
        onClick={onPrev}
        className="px-3 py-1 sm:px-4 sm:py-2 text-slate-400 text-sm sm:text-base font-semibold rounded hover:text-slate-500 transition-colors"
        aria-label="Previous result"
      >
        ◀
      </button>
      <span className="text-sm sm:text-base font-semibold text-gray-700">
        Result {current + 1} of {total}
      </span>
      <button
        onClick={onNext}
        className="px-3 py-1 sm:px-4 sm:py-2 text-slate-400 text-sm sm:text-base font-semibold rounded hover:text-slate-500 transition-colors"
        aria-label="Next result"
      >
        ▶
      </button>
    </div>
  );
}
