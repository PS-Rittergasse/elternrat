import React from 'react';

type Variant = 'neutral' | 'success' | 'warning' | 'error';

type Props = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: Variant;
};

const variants: Record<Variant, string> = {
  neutral: 'bg-primary-100 text-primary-900 border-primary-200',
  success: 'bg-success/15 text-success border-success/30',
  warning: 'bg-warning/15 text-warning border-warning/30',
  error: 'bg-error/15 text-error border-error/30'
};

export default function Badge({ variant = 'neutral', className = '', children, ...props }: Props) {
  return (
    <span
      {...props}
      className={[
        'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium',
        variants[variant],
        className
      ].join(' ')}
    >
      {children}
    </span>
  );
}
