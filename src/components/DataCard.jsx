import React from 'react';

/**
 * SensorCard Component (formerly DataCard)
 * Reusable card for displaying sensor data with dark theme
 * @param {string} title - Card title
 * @param {number|string} value - Sensor value to display
 * @param {string} unit - Unit of measurement (e.g., "°C", "%")
 * @param {string} icon - Emoji/icon to display
 * @param {string} color - Color scheme: 'emerald', 'blue', 'orange', 'red'
 */
const DataCard = ({ title, value, unit = '', icon = '', color = 'emerald' }) => {
  const colorClasses = {
    emerald: 'bg-gradient-to-br from-gray-800 to-gray-800 border-emerald-500/30 hover:border-emerald-500/60',
    blue: 'bg-gradient-to-br from-gray-800 to-gray-800 border-blue-500/30 hover:border-blue-500/60',
    orange: 'bg-gradient-to-br from-gray-800 to-gray-800 border-orange-500/30 hover:border-orange-500/60',
    red: 'bg-gradient-to-br from-gray-800 to-gray-800 border-red-500/30 hover:border-red-500/60',
  };

  const textColorClasses = {
    emerald: 'text-emerald-400',
    blue: 'text-blue-400',
    orange: 'text-orange-400',
    red: 'text-red-400',
  };

  const glowClasses = {
    emerald: 'shadow-lg shadow-emerald-500/10',
    blue: 'shadow-lg shadow-blue-500/10',
    orange: 'shadow-lg shadow-orange-500/10',
    red: 'shadow-lg shadow-red-500/10',
  };

  return (
    <div className={`relative p-6 rounded-2xl border backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] group ${colorClasses[color]} ${glowClasses[color]}`}>
      {/* Glow effect */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity blur-xl -z-10 ${
        color === 'emerald' ? 'bg-emerald-500/10' :
        color === 'blue' ? 'bg-blue-500/10' :
        color === 'orange' ? 'bg-orange-500/10' :
        'bg-red-500/10'
      }`}></div>

      <div className="flex justify-between items-start">
        <div className="flex-1">
          <p className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">{title}</p>
          <div className="flex items-baseline gap-2">
            <span className={`text-4xl font-bold ${textColorClasses[color]}`}>{value}</span>
            {unit && <span className={`text-lg font-semibold ${textColorClasses[color]}/70`}>{unit}</span>}
          </div>
        </div>
        {icon && <div className="text-4xl opacity-80 group-hover:opacity-100 transition-opacity">{icon}</div>}
      </div>
    </div>
  );
};

export default DataCard;
