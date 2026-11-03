import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Alert({ type = 'info', message, onClose, className = '' }) {
  if (!message) return null;

  const styles = {
    success: 'bg-emerald-50 border-emerald-300 text-emerald-800',
    error: 'bg-rose-50 border-rose-300 text-rose-800',
    info: 'bg-sky-50 border-sky-300 text-sky-800',
    warning: 'bg-amber-50 border-amber-300 text-amber-800',
  };

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />,
    info: <Info className="w-5 h-5 text-sky-600 flex-shrink-0" />,
    warning: <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />,
  };

  return (
    <div
      className={`flex items-start justify-between p-4 mb-4 text-sm border rounded-lg ${styles[type] || styles.info} ${className}`}
      role="alert"
    >
      <div className="flex items-center gap-3">
        {icons[type] || icons.info}
        <div className="font-medium leading-relaxed">{message}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          type="button"
          className="ml-auto -mx-1.5 -my-1.5 p-1.5 inline-flex h-8 w-8 rounded-lg hover:bg-black/5 focus:outline-none"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
