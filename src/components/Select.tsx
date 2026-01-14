import React from 'react';

type Props = React.SelectHTMLAttributes<HTMLSelectElement>;

export default function Select({ className = '', ...props }: Props) {
  return (
    <select
      {...props}
      className={[
        'w-full rounded-xl border border-primary-200 bg-primary-50 px-3 py-2 text-sm',
        'focus:border-primary-900 focus:ring-0',
        className
      ].join(' ')}
    />
  );
}
