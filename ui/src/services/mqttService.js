import mqtt from 'mqtt';

/**
 * MQTT Service for browser dashboard connection via HiveMQ Cloud WebSocket.
 *
 * ── Web Worker Architecture ──
 * The MQTT client now runs inside a Web Worker so that browser tab
 * throttling (which pauses/delays setTimeout/setInterval in inactive
 * tabs) can never prevent the MQTT keep-alive PINGREQ from being sent
 * on time.  This fixes the disconnect that occurred when the browser
 * tab was open but idle and no sensor messages were flowing.
 *
 * The public API is unchanged — connectMqtt, disconnectMqtt,
 * subscribeToMqtt, subscribeToStatus, getConnectionStatus, TOPICS
 * all work exactly as before.
 *
 * Topics (matched to raspicode.txt):
 *   rice/sensors   — global sensor JSON
 *   rice/image     — per-plant base64 JPEG
 *   rice/detection — per-cycle detection summary (all 6 plants)
 */

// ===== HiveMQ Cloud CONFIGURATION =====
const BROKER_HOST = import.meta.env.VITE_MQTT_BROKER || 'd0e0ce8ffc364fe4b5c641f8f84ef0a1.s1.eu.hivemq.cloud';
const BROKER_PORT = import.meta.env.VITE_MQTT_WEBSOCKET_PORT || 8884;
const MQTT_USERNAME = import.meta.env.VITE_MQTT_USERNAME || 'thesis_pi';
const MQTT_PASSWORD = import.meta.env.VITE_MQTT_PASSWORD || 'H@rveypads123';

const MQTT_URL = `wss://${BROKER_HOST}:${BROKER_PORT}/mqtt`;

// ===== MQTT TOPICS (match raspicode.txt) =====
export const TOPICS = {
  sensors: 'rice/sensors',
  image: 'rice/image',
  detection: 'rice/detection',
};

let worker = null;
let messageSubscribers = [];
let statusSubscribers = [];
let isConnected = false;

// ── Fallback flag: use main-thread mqtt if Worker fails ──
let useMainThread = false;
let client = null;

/**
 * Notify all status subscribers of a connection state change.
 */
const notifyStatus = (status) => {
  isConnected = status;
  statusSubscribers.forEach((cb) => cb(status));
};

/**
 * Subscribe to connection status changes.
 * Returns an unsubscribe function.
 */
export const subscribeToStatus = (callback) => {
  statusSubscribers.push(callback);
  return () => {
    statusSubscribers = statusSubscribers.filter((cb) => cb !== callback);
  };
};

/**
 * Connect to HiveMQ Cloud MQTT broker via WebSocket Secure.
 *
 * Primary path: spawns a Web Worker that owns the MQTT client.
 * Fallback:     if Workers are unavailable, connects on the main thread
 *               (original behaviour).
 *
 * Resolves when connected & subscribed.
 */
export const connectMqtt = ({
  brokerUrl = MQTT_URL,
  topics = Object.values(TOPICS),
  onError,
} = {}) => {
  if (isConnected) return Promise.resolve();

  // ── Try Web Worker path ──────────────────────────────────
  if (!useMainThread && typeof Worker !== 'undefined') {
    return connectViaWorker({ brokerUrl, topics, onError });
  }

  // ── Fallback: main-thread connection ─────────────────────
  return connectMainThread({ brokerUrl, topics, onError });
};

// ================================================================
//  WEB WORKER PATH
// ================================================================

function connectViaWorker({ brokerUrl, topics, onError }) {
  // Tear down stale worker
  if (worker) {
    try { worker.terminate(); } catch (_) { /* ignore */ }
    worker = null;
  }

  try {
    worker = new Worker(
      new URL('./mqttWorker.js', import.meta.url),
      { type: 'module' }
    );
  } catch (err) {
    // Worker creation failed (e.g. browser doesn't support module workers).
    // Fall back to main-thread connection permanently for this session.
    console.warn('[MQTT] Web Worker creation failed, falling back to main thread:', err.message);
    useMainThread = true;
    return connectMainThread({ brokerUrl, topics, onError });
  }

  return new Promise((resolve, reject) => {
    let settled = false;

    worker.onmessage = (event) => {
      const { type, payload } = event.data;

      switch (type) {
        case 'connected':
          console.log('[MQTT] ✅ Connected to HiveMQ Cloud (via Worker)');
          notifyStatus(true);
          break;

        case 'subscribed':
          console.log('[MQTT] Subscribed to:', (payload || []).join(', '));
          if (!settled) { settled = true; resolve(); }
          break;

        case 'message':
          messageSubscribers.forEach((cb) => cb(payload.topic, payload.data));
          break;

        case 'reconnecting':
          console.log('[MQTT] Reconnecting...');
          break;

        case 'disconnected':
          notifyStatus(false);
          break;

        case 'error':
          console.error('[MQTT] Worker error:', payload);
          notifyStatus(false);
          if (typeof onError === 'function') onError(new Error(payload));
          if (!settled) { settled = true; reject(new Error(payload)); }
          break;
      }
    };

    worker.onerror = (error) => {
      console.error('[MQTT] Worker runtime error:', error);
      notifyStatus(false);
      if (typeof onError === 'function') onError(error);
      if (!settled) { settled = true; reject(error); }
    };

    // Tell the worker to connect
    worker.postMessage({
      type: 'connect',
      payload: {
        brokerUrl,
        username: MQTT_USERNAME,
        password: MQTT_PASSWORD,
        topics,
      },
    });
  });
}

// ================================================================
//  MAIN-THREAD FALLBACK (original behaviour, kept as safety net)
// ================================================================

function connectMainThread({ brokerUrl, topics, onError }) {
  if (client && isConnected) return Promise.resolve();

  // Tear down stale client
  if (client && !isConnected) {
    client.end(true);
    client = null;
  }

  client = mqtt.connect(brokerUrl, {
    username: MQTT_USERNAME,
    password: MQTT_PASSWORD,
    clientId: `web_client_${Date.now()}_${Math.random().toString(16).slice(3)}`,
    reconnectPeriod: 5000,
    keepalive: 60,
    clean: true,
    protocolVersion: 4,
  });

  return new Promise((resolve, reject) => {
    client.once('connect', () => {
      console.log('[MQTT] ✅ Connected to HiveMQ Cloud (main thread fallback)');
      notifyStatus(true);

      if (!topics.length) {
        resolve();
        return;
      }

      client.subscribe(topics, (error) => {
        if (error) {
          console.error('[MQTT] Subscribe error:', error);
          if (typeof onError === 'function') onError(error);
          reject(error);
          return;
        }
        console.log('[MQTT] Subscribed to:', topics.join(', '));
        resolve();
      });
    });

    client.on('message', (topic, message) => {
      try {
        const payloadString = message.toString();
        let payload = payloadString;

        try {
          payload = JSON.parse(payloadString);
        } catch {
          // Keep string payload if not valid JSON
        }

        messageSubscribers.forEach((callback) => callback(topic, payload));
      } catch (error) {
        console.error('[MQTT] Message handling error:', error);
        if (typeof onError === 'function') onError(error);
      }
    });

    client.on('reconnect', () => {
      console.log('[MQTT] Reconnecting...');
    });

    client.on('close', () => {
      notifyStatus(false);
    });

    client.on('error', (error) => {
      console.error('[MQTT] Connection error:', error);
      notifyStatus(false);
      if (typeof onError === 'function') onError(error);
      reject(error);
    });
  });
}

/**
 * Subscribe to incoming MQTT messages.
 * Returns an unsubscribe function.
 */
export const subscribeToMqtt = (callback) => {
  messageSubscribers.push(callback);
  return () => {
    messageSubscribers = messageSubscribers.filter((cb) => cb !== callback);
  };
};

/**
 * Disconnect from the MQTT broker
 */
export const disconnectMqtt = () => {
  // Worker path
  if (worker) {
    worker.postMessage({ type: 'disconnect' });
    // Allow the worker a moment to clean up, then terminate
    setTimeout(() => {
      if (worker) {
        try { worker.terminate(); } catch (_) { /* ignore */ }
        worker = null;
      }
    }, 500);
  }

  // Main-thread fallback path
  if (client) {
    client.end(true);
    client = null;
  }

  notifyStatus(false);
};

/**
 * Get current connection status
 */
export const getConnectionStatus = () => isConnected;

export default {
  connectMqtt,
  subscribeToMqtt,
  subscribeToStatus,
  disconnectMqtt,
  getConnectionStatus,
  TOPICS,
};
