import React from 'react';

/**
 * StatusBadge Component
 * Displays disease status with color coding (dark theme)
 * @param {string} status - Status text (e.g., "Positive", "Negative")
 * @param {string} type - Type of status: 'success', 'danger', 'warning', 'info'
 * @param {string} icon - Optional emoji/icon to display
 */
const StatusBadge = ({ status, type = 'info', icon = '' }) => {
  const typeClasses = {
    success: 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 shadow-lg shadow-emerald-500/10',
    danger: 'bg-red-500/20 border border-red-500/50 text-red-300 shadow-lg shadow-red-500/10',
    warning: 'bg-amber-500/20 border border-amber-500/50 text-amber-300 shadow-lg shadow-amber-500/10',
    info: 'bg-blue-500/20 border border-blue-500/50 text-blue-300 shadow-lg shadow-blue-500/10',
  };

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-[10px] backdrop-blur-sm transition-all hover:scale-[1.05] ${typeClasses[type]}`}>
      {icon && <span className="text-xs">{icon}</span>}
      {status}
    </div>
  );
};

export default StatusBadge;
