import mqtt from 'mqtt';

/**
 * MQTT Service for browser dashboard connection via HiveMQ Cloud WebSocket.
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

let client = null;
let messageSubscribers = [];
let statusSubscribers = [];
let isConnected = false;

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
 * Resolves when connected & subscribed.
 */
export const connectMqtt = ({
  brokerUrl = MQTT_URL,
  topics = Object.values(TOPICS),
  onError,
} = {}) => {
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
      console.log('[MQTT] ✅ Connected to HiveMQ Cloud');
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
};

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
  if (client) {
    client.end(true);
    client = null;
    notifyStatus(false);
  }
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
