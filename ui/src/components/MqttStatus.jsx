import React from 'react';

/**
 * MqttStatus Component
 * Displays the MQTT connection status with a pulsing dot indicator.
 * Designed to match the existing dark dashboard aesthetic.
 */
const MqttStatus = ({ isConnected = false, error = null }) => {
  return (
    <div
      className={[
        'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[9px] font-bold backdrop-blur-md transition-all duration-300',
        isConnected
          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 shadow-lg shadow-emerald-500/5'
          : 'border-red-500/30 bg-red-500/10 text-red-300 shadow-lg shadow-red-500/5',
      ].join(' ')}
      title={error || (isConnected ? 'Connected to HiveMQ Cloud' : 'Disconnected from MQTT broker')}
    >
      {/* Pulsing dot */}
      <span
        className={[
          'h-2 w-2 rounded-full animate-pulse',
          isConnected ? 'bg-emerald-400' : 'bg-red-400',
        ].join(' ')}
      />

      {/* Status text */}
      <span className="uppercase tracking-widest">
        {isConnected ? 'HiveMQ Cloud Connected' : 'HiveMQ Cloud Disconnected'}
      </span>

      {/* Error detail */}
      {error && !isConnected && (
        <span className="ml-1 text-[8px] text-red-400/70 truncate max-w-[120px]" title={error}>
          — {error}
        </span>
      )}
    </div>
  );
};

export default MqttStatus;
