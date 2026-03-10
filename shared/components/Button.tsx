import React from 'react';

type ButtonSize = 'sm' | 'md' | 'lg' | 'responsive';
type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'purple';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: ButtonSize;
  variant?: ButtonVariant;
  className?: string;
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-2 py-1 text-sm',
  md: 'px-4 py-2',
  lg: 'px-6 py-3 text-lg',
  responsive: 'px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm',
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-blue-500 text-white hover:bg-blue-600',
  secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
  success: 'bg-emerald-500 text-white hover:bg-emerald-600',
  danger: 'bg-red-500 text-white hover:bg-red-600',
  warning: 'bg-yellow-500 text-white hover:bg-yellow-600',
  purple: 'bg-purple-500 text-white hover:bg-purple-600',
};

const baseClasses = 'font-semibold rounded transition-colors w-auto disabled:opacity-50 disabled:cursor-not-allowed';

export default function Button({
  children,
  size = 'md',
  variant = 'primary',
  className,
  ...props
}: ButtonProps) {
  const sizeClass = sizeClasses[size];
  const variantClass = variantClasses[variant];
  const finalClassName = [sizeClass, variantClass, baseClasses, className]
    .filter(Boolean)
    .join(' ');

  return (
    <button type="button" className={finalClassName} {...props}>
      {children}
    </button>
  );
}
