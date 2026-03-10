type NumberInputSize = 'sm' | 'md' | 'lg';

interface NumberInputBoxProps {
  value: number | null;
  onChange: (value: number | null) => void;
  min?: number;
  max?: number;
  placeholder?: string;
  label?: string;
  size?: NumberInputSize;
  className?: string;
  autoFocus?: boolean;
}

const sizeClasses: Record<NumberInputSize, string> = {
  sm: 'w-20 px-2 py-1 text-sm',
  md: 'w-full px-3 py-2',
  lg: 'w-full px-4 py-3',
};

const baseClasses =
  'border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500';

export default function NumberInputBox({
  value,
  onChange,
  min,
  max,
  placeholder,
  label,
  size = 'md',
  className,
  autoFocus,
}: NumberInputBoxProps) {
  const sizeClass = sizeClasses[size];
  const finalClassName = className || `${sizeClass} ${baseClasses}`;

  return (
    <>
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {label}
        </label>
      )}
      <input
        type="number"
        min={min}
        max={max}
        placeholder={placeholder}
        value={value ?? ''}
        autoFocus={autoFocus}
        onChange={(e) => {
          const parsed = parseInt(e.target.value, 10);
          onChange(isNaN(parsed) ? null : parsed);
        }}
        className={finalClassName}
      />
    </>
  );
}
