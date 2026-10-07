import React from 'react';

interface NotificationToastProps {
  message: string | null;
  type?: 'info' | 'error' | 'success';
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  message,
  type = 'info'
}) => {
  if (!message) return null;

  let bg = 'bg-slate-900/90 border-slate-700 text-white';
  if (type === 'error') {
    bg = 'bg-rose-950/95 border-rose-700/80 text-rose-200 shadow-rose-900/30';
  } else if (type === 'success') {
    bg = 'bg-emerald-950/95 border-emerald-700/80 text-emerald-200 shadow-emerald-900/30';
  }

  return (
    <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 pointer-events-none animate-in fade-in slide-in-from-top-2 duration-150">
      <div className={`px-4 py-2 rounded-2xl border shadow-xl backdrop-blur-md text-xs font-semibold max-w-md text-center ${bg}`}>
        {message}
      </div>
    </div>
  );
};
