import React, { useEffect, useState } from 'react';
import {
  connectMqtt,
  disconnectMqtt,
  getConnectionStatus,
  subscribeToMqtt,
  subscribeToStatus,
  TOPICS,
} from '../services/mqttService';

/**
 * MQTT connection bar.
 * Starts DISCONNECTED — user must click "Connect" to go live.
 * Uses subscribeToStatus for unified state with useMqttData hook.
 */
const Mqtt = ({ onLog, compact = false, showStatus = true, onConnectionChange }) => {
  const [connected, setConnected] = useState(() => getConnectionStatus());
  const [isBusy, setIsBusy] = useState(false);

  // Subscribe to unified status changes from mqttService
  useEffect(() => {
    const unsubscribe = subscribeToStatus((status) => {
      setConnected(status);
    });
    return () => unsubscribe();
  }, []);

  // Notify parent when connection status changes
  useEffect(() => {
    onConnectionChange?.(connected);
  }, [connected, onConnectionChange]);

  // Subscribe to message logging
  useEffect(() => {
    const unsubscribe = subscribeToMqtt((topic, payload) => {
      const payloadPreview = typeof payload === 'string'
        ? payload.slice(0, 60)
        : JSON.stringify(payload).slice(0, 60);
      onLog?.(`MQTT message on ${topic}: ${payloadPreview}`);
    });

    return () => {
      unsubscribe();
    };
  }, [onLog]);

  const handleConnect = async () => {
    if (isBusy || connected) return;
    setIsBusy(true);

    try {
      await connectMqtt({
        topics: Object.values(TOPICS),
        onError: (error) => {
          onLog?.(`MQTT error: ${error?.message || 'Unknown error'}`);
        },
      });
      onLog?.('Connected to HiveMQ Cloud broker.');
      onLog?.(`Subscribed to ${Object.values(TOPICS).join(', ')}.`);
    } catch (error) {
      onLog?.(`Connection failed: ${error?.message || 'Unable to connect'}`);
    } finally {
      setIsBusy(false);
    }
  };

  const handleDisconnect = () => {
    disconnectMqtt();
    onLog?.('Disconnected from MQTT broker.');
  };

  const handleToggle = () => {
    if (connected) {
      handleDisconnect();
    } else {
      handleConnect();
    }
  };

  return (
    <section className={`rounded-xl border border-white/10 bg-gray-900/60 backdrop-blur-md ${
      compact ? 'w-full px-2 py-2' : 'mb-4 px-3 py-2.5'
    }`}>
      <div className="flex w-full items-center gap-2">
        {/* Status dot + label */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
            isBusy ? 'bg-amber-400 animate-pulse' : connected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
          }`} />
          <div className="min-w-0">
            <span className={`text-[10px] font-bold ${
              isBusy ? 'text-amber-300' : connected ? 'text-emerald-300' : 'text-slate-400'
            }`}>
              {isBusy ? 'Connecting to HiveMQ Cloud...' : connected ? 'HiveMQ Cloud Connected' : 'Disconnected — Showing Mock Data'}
            </span>
            {connected && (
              <p className="text-[8px] text-gray-500 truncate">
                {Object.values(TOPICS).join(' · ')}
              </p>
            )}
          </div>
        </div>

        {/* Connect / Disconnect button */}
        <button
          type="button"
          onClick={handleToggle}
          disabled={isBusy}
          className={`${compact ? 'h-7 min-w-[92px] px-3 text-[10px]' : 'h-8 px-4 text-xs'} shrink-0 rounded-md border font-bold transition ${
            connected
              ? 'border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
              : isBusy
              ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
              : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
          } ${isBusy ? 'cursor-not-allowed opacity-60' : ''}`}
        >
          {isBusy ? 'Connecting...' : connected ? 'Disconnect' : 'Connect'}
        </button>
      </div>
    </section>
  );
};

export default Mqtt;
