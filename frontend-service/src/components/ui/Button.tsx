'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';

const base =
  'inline-flex items-center justify-center text-sm font-medium rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

const variants = {
  primary:
    'px-6 py-2.5 bg-[var(--brand)] text-white shadow-sm hover:bg-[var(--brand-hover)] focus:ring-[var(--brand)]/30',
  secondary:
    'px-5 py-2.5 bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 focus:ring-neutral-200',
  success:
    'flex-1 py-2.5 bg-[var(--ifs-teal)] text-white hover:opacity-90 focus:ring-[var(--ifs-teal)]/40',
  danger:
    'flex-1 py-2.5 bg-red-500 text-white hover:bg-red-600 focus:ring-red-400/40',
} as const;

export type ButtonVariant = keyof typeof variants;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  children: ReactNode;
}

export default function Button({
  variant = 'primary',
  fullWidth = false,
  className = '',
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${base} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
