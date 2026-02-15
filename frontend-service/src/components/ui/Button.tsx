'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';

const base =
  'text-sm font-light tracking-wide rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed';

const variants = {
  primary:
    'px-8 py-3 bg-[#48286c] text-white uppercase shadow-[0_1px_2px_rgba(72,40,108,0.15)] hover:bg-[#3a1f59] hover:shadow-[0_2px_4px_rgba(72,40,108,0.2)] focus:ring-[#48286c]/30',
  secondary:
    'px-6 py-3 bg-white border border-[#48286c]/15 text-[#48286c]/70 shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:bg-[#48286c]/[0.02] hover:border-[#48286c]/25 focus:ring-[#48286c]/20',
  success:
    'flex-1 py-3 bg-emerald-600 text-white text-xs uppercase hover:bg-emerald-700 focus:ring-emerald-500/30',
  danger:
    'flex-1 py-3 bg-rose-600 text-white text-xs uppercase hover:bg-rose-700 focus:ring-rose-500/30',
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
