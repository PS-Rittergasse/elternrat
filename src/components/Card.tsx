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
        'rounded-xl border border-primary-200 bg-primary-50 shadow-subtle',
        className
      ].join(' ')}
    >
      {(title || actions) ? (
        <div className="flex items-center justify-between gap-3 border-b border-primary-200 px-4 py-3">
          <div className="text-sm font-semibold text-primary-900">{title}</div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
      <div className="px-4 py-3">{children}</div>
    </div>
  );
}
