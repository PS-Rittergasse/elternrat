import React from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: 'sm' | 'md';
};

const base =
  'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition disabled:opacity-50 disabled:pointer-events-none';

const variants: Record<Variant, string> = {
  primary:
    'bg-primary-900 text-primary-50 hover:bg-primary-800 border border-primary-900',
  secondary:
    'bg-primary-100 text-primary-900 hover:bg-primary-200 border border-primary-200',
  ghost: 'bg-transparent text-primary-900 hover:bg-primary-100 border border-transparent',
  destructive:
    'bg-error text-primary-50 hover:bg-error/90 border border-error'
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm'
};

export default function Button({
  variant = 'secondary',
  size = 'md',
  className = '',
  ...props
}: Props) {
  return (
    <button
      {...props}
      className={[base, variants[variant], sizes[size], className].join(' ')}
    />
  );
}
