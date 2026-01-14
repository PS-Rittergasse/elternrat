import React from 'react';

type Props = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export default function Textarea({ className = '', ...props }: Props) {
  return (
    <textarea
      {...props}
      className={[
        'w-full rounded-xl border border-primary-200 bg-primary-50 px-3 py-2 text-sm',
        'placeholder:text-primary-500',
        'focus:border-primary-900 focus:ring-0',
        'min-h-[96px] resize-vertical',
        className
      ].join(' ')}
    />
  );
}
