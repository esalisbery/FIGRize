import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading,
  className = '',
  disabled,
  style,
  ...props
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-lg font-semibold transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed";

  const variantStyles: Record<string, { className: string; style?: React.CSSProperties }> = {
    primary: {
      className: "hover:-translate-y-px active:translate-y-0",
      style: {
        background: 'linear-gradient(180deg,#ff9e58,#f5811f)',
        color: '#1a1206',
        boxShadow: '0 8px 24px -10px rgba(255,140,66,0.6)',
      },
    },
    secondary: {
      className: "bg-app-surface text-app-text-2 border border-app-border hover:bg-app-surface-2 hover:text-app-text hover:border-[rgba(255,140,66,0.45)]",
    },
    ghost: {
      className: "text-app-text-3 hover:bg-app-surface-2 hover:text-app-text-2",
    },
    danger: {
      className: "text-app-danger border border-[rgba(255,107,107,0.3)] bg-[rgba(255,107,107,0.06)] hover:bg-[rgba(255,107,107,0.12)]",
    },
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  const { className: variantClass, style: variantStyle } = variantStyles[variant];

  return (
    <button
      className={`${baseStyles} ${variantClass} ${sizes[size]} ${className}`}
      style={{ ...variantStyle, ...style }}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : null}
      {children}
    </button>
  );
};
