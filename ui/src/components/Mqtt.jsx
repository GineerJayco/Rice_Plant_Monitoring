import React, { useEffect, useState } from 'react';
import {
  connectMqtt,
  disconnectMqtt,
  getConnectionStatus,
  subscribeToMqtt
} from '../services/mqttService';

/**
 * MQTT connection bar styled to match the client reference dashboard.
 */
const Mqtt = ({ onLog, compact = false, showStatus = true, onConnectionChange }) => {
  const [brokerIp, setBrokerIp] = useState('192.168.1.100');
  const [port, setPort] = useState('9001');
  const [connected, setConnected] = useState(getConnectionStatus());
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    onConnectionChange?.(connected);
  }, [connected, onConnectionChange]);

  useEffect(() => {
    const unsubscribe = subscribeToMqtt((topic, payload) => {
      const payloadPreview = typeof payload === 'string'
        ? payload.slice(0, 60)
        : JSON.stringify(payload).slice(0, 60);
      onLog?.(`MQTT message on ${topic}: ${payloadPreview}`);
    });

    return () => {
      unsubscribe();
      disconnectMqtt();
    };
  }, [onLog]);

  const handleConnectToggle = async () => {
    if (isBusy) return;

    if (connected) {
      disconnectMqtt();
      setConnected(false);
      onLog?.('Disconnected from MQTT broker.');
      return;
    }

    setIsBusy(true);
    const url = `ws://${brokerIp}:${port}/mqtt`;

    try {
      await connectMqtt({
        brokerUrl: url,
        topics: ['rice/sensors', 'rice/image', 'rice/detection'],
        onStatus: (status) => {
          setConnected(status);
        },
        onError: (error) => {
          onLog?.(`MQTT error: ${error?.message || 'Unknown error'}`);
        }
      });
      setConnected(true);
      onLog?.(`Connected to broker ${brokerIp}:${port}.`);
      onLog?.('Subscribed to rice/sensors, rice/image, and rice/detection.');
    } catch (error) {
      setConnected(false);
      onLog?.(`Connection failed: ${error?.message || 'Unable to connect'}`);
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <section className={`rounded-xl border border-white/10 bg-gray-900/60 backdrop-blur-md ${
      compact ? 'w-full px-2 py-2' : 'mb-4 px-3 py-2.5'
    }`}>
      {showStatus ? (
        <div className={`${compact ? 'mb-1' : 'mb-2'} flex items-center justify-end`}>
          <span className={`rounded-full border px-2.5 py-1 text-[9px] font-bold ${
            connected
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
              : 'border-slate-600/40 bg-slate-800/70 text-slate-300'
          }`}>
            {connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      ) : null}

      <div className="flex w-full items-center gap-2">
        <label className={`shrink-0 font-semibold text-slate-300 ${compact ? 'text-[9px] min-w-[74px]' : 'text-[10px] md:min-w-[180px]'}`}>
          MQTT Broker
        </label>
        <input
          type="text"
          value={brokerIp}
          onChange={(e) => setBrokerIp(e.target.value)}
          className={`rounded-md border border-white/10 bg-gray-950/90 px-2 text-xs text-gray-100 outline-none transition focus:border-emerald-500/40 ${
            compact ? 'h-7 min-w-0 flex-1' : 'h-8 flex-1'
          }`}
          placeholder="e.g. 192.168.1.100"
        />
        <label className={`shrink-0 font-semibold text-slate-300 ${compact ? 'text-[9px]' : 'text-[10px]'}`}>Port</label>
        <input
          type="number"
          value={port}
          onChange={(e) => setPort(e.target.value)}
          className={`rounded-md border border-white/10 bg-gray-950/90 px-2 text-xs text-gray-100 outline-none transition focus:border-emerald-500/40 ${
            compact ? 'h-7 w-[72px]' : 'h-8 w-full md:w-28'
          }`}
        />
        <button
          type="button"
          onClick={handleConnectToggle}
          disabled={isBusy}
          className={`${compact ? 'h-7 min-w-[92px] px-3 text-[10px]' : 'h-8 px-4 text-xs'} shrink-0 rounded-md border font-bold transition ${
            connected
              ? 'border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
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
