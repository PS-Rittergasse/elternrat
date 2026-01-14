import React from 'react';

type Props = React.HTMLAttributes<HTMLDivElement> & {
  title?: string;
  actions?: React.ReactNode;
};

export default function Card({ title, actions, className = '', children, ...props }: Props) {
  return (
    <div
      {...props}
      className={[
        'rounded-2xl border border-primary-200 bg-white/90 shadow-sm',
        className
      ].join(' ')}
    >
      {(title || actions) ? (
        <div className="flex flex-col items-start gap-2 border-b border-primary-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-5 sm:py-4">
          <div className="text-sm font-semibold text-primary-900">{title}</div>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
      <div className="px-4 py-3 sm:px-5 sm:py-4">{children}</div>
    </div>
  );
}
