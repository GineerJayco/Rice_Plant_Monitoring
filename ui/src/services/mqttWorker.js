/**
 * MQTT Web Worker
 *
 * Runs the MQTT client on a separate thread so that browser tab
 * throttling cannot delay keep-alive (PINGREQ) packets.
 *
 * Communication with main thread via postMessage:
 *
 *   Main → Worker:
 *     { type: 'connect',    payload: { brokerUrl, username, password, topics } }
 *     { type: 'disconnect' }
 *
 *   Worker → Main:
 *     { type: 'connected' }
 *     { type: 'subscribed',    payload: [topics] }
 *     { type: 'message',       payload: { topic, data } }
 *     { type: 'reconnecting' }
 *     { type: 'disconnected' }
 *     { type: 'error',         payload: errorMessage }
 */

import mqtt from 'mqtt';

let client = null;

// ── Handle commands from the main thread ────────────────────
self.onmessage = (event) => {
  const { type, payload } = event.data;

  switch (type) {
    case 'connect':
      handleConnect(payload);
      break;
    case 'disconnect':
      handleDisconnect();
      break;
  }
};

// ── Connect to HiveMQ Cloud ────────────────────────────────
function handleConnect({ brokerUrl, username, password, topics }) {
  // Tear down any existing connection first
  if (client) {
    try { client.end(true); } catch (_) { /* ignore */ }
    client = null;
  }

  client = mqtt.connect(brokerUrl, {
    username,
    password,
    clientId: `web_worker_${Date.now()}_${Math.random().toString(16).slice(3)}`,
    reconnectPeriod: 5000,
    keepalive: 60,
    clean: true,
    protocolVersion: 4,
  });

  client.on('connect', () => {
    self.postMessage({ type: 'connected' });

    if (topics && topics.length) {
      client.subscribe(topics, (error) => {
        if (error) {
          self.postMessage({ type: 'error', payload: error.message });
        } else {
          self.postMessage({ type: 'subscribed', payload: topics });
        }
      });
    } else {
      // No topics requested — signal ready immediately
      self.postMessage({ type: 'subscribed', payload: [] });
    }
  });

  client.on('message', (topic, message) => {
    try {
      const payloadString = message.toString();
      let parsed = payloadString;

      try {
        parsed = JSON.parse(payloadString);
      } catch {
        // Keep as raw string if not valid JSON
      }

      self.postMessage({ type: 'message', payload: { topic, data: parsed } });
    } catch (error) {
      self.postMessage({ type: 'error', payload: error.message });
    }
  });

  client.on('reconnect', () => {
    self.postMessage({ type: 'reconnecting' });
  });

  client.on('close', () => {
    self.postMessage({ type: 'disconnected' });
  });

  client.on('error', (error) => {
    self.postMessage({ type: 'error', payload: error.message });
  });
}

// ── Disconnect cleanly ─────────────────────────────────────
function handleDisconnect() {
  if (client) {
    try { client.end(true); } catch (_) { /* ignore */ }
    client = null;
  }
  self.postMessage({ type: 'disconnected' });
}
