import React from 'react';

type ButtonSize = 'sm' | 'md' | 'lg';
type ButtonVariant = 'primary' | 'secondary' | 'success';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: ButtonSize;
  variant?: ButtonVariant;
  className?: string;
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-2 py-1 text-sm',
  md: 'px-4 py-2',
  lg: 'px-6 py-3 text-lg',
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-blue-500 text-white hover:bg-blue-600',
  secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
  success: 'bg-emerald-500 text-white hover:bg-emerald-600',
};

const baseClasses = 'font-semibold rounded transition-colors w-auto';

export default function Button({
  children,
  size = 'md',
  variant = 'primary',
  className,
  ...props
}: ButtonProps) {
  const sizeClass = sizeClasses[size];
  const variantClass = variantClasses[variant];
  const finalClassName =
    className || `${sizeClass} ${variantClass} ${baseClasses}`;

  return (
    <button type="button" className={finalClassName} {...props}>
      {children}
    </button>
  );
}
