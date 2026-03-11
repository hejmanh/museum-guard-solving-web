'use client';

interface SelectBoxOption {
  value: number | string;
  label: string;
}

interface SelectBoxProps {
  options: SelectBoxOption[];
  value: number | string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}

const sizeClasses = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-2 text-sm',
};

export default function SelectBox({
  options,
  value,
  onChange,
  placeholder,
  label,
  size = 'md',
  className = '',
}: SelectBoxProps) {
  return (
    <div className={`inline-flex flex-col ${className}`}>
      {label && (
        <span className="text-xs text-gray-500 mb-0.5">{label}</span>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${sizeClasses[size]} border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white`}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
