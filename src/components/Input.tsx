import React from 'react';

type Props = React.InputHTMLAttributes<HTMLInputElement>;

export default function Input({ className = '', ...props }: Props) {
  return (
    <input
      {...props}
      className={[
        'w-full rounded-xl border border-primary-200 bg-primary-50 px-3 py-2 text-sm',
        'placeholder:text-primary-500',
        'focus:border-primary-900 focus:ring-0',
        className
      ].join(' ')}
    />
  );
}
