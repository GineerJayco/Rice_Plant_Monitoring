import mqtt from 'mqtt';

/**
 * MQTT Service for browser dashboard connection using WebSockets.
 */

const DEFAULT_MQTT_URL = import.meta.env.VITE_MQTT_BROKER_URL || 'ws://localhost:9001/mqtt';
const DEFAULT_TOPICS = ['rice/sensors', 'rice/image', 'rice/detection'];

let client = null;
let subscribers = [];
let unsubscribeStatus = null;
let unsubscribeError = null;
let isConnected = false;

/**
 * Connect to MQTT broker with explicit URL and topic list.
 */
export const connectMqtt = ({
  brokerUrl = DEFAULT_MQTT_URL,
  topics = DEFAULT_TOPICS,
  onStatus,
  onError
} = {}) => {
  if (client && isConnected) return Promise.resolve();
  if (client && !isConnected) {
    client.end(true);
    client = null;
  }

  client = mqtt.connect(brokerUrl, {
    clientId: `react_client_${Math.random().toString(16).slice(3)}`,
    keepalive: 60,
    clean: true,
    reconnectPeriod: 3000,
  });

  unsubscribeStatus = typeof onStatus === 'function' ? onStatus : null;
  unsubscribeError = typeof onError === 'function' ? onError : null;

  return new Promise((resolve, reject) => {
    client.once('connect', () => {
      isConnected = true;
      if (unsubscribeStatus) unsubscribeStatus(true);

      if (!topics.length) {
        resolve();
        return;
      }

      client.subscribe(topics, (error) => {
        if (error) {
          if (unsubscribeError) unsubscribeError(error);
          reject(error);
          return;
        }
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
          // Keep string payload if not JSON.
        }

        subscribers.forEach((callback) => callback(topic, payload));
      } catch (error) {
        if (unsubscribeError) unsubscribeError(error);
      }
    });

    client.on('close', () => {
      isConnected = false;
      if (unsubscribeStatus) unsubscribeStatus(false);
    });

    client.on('error', (error) => {
      if (unsubscribeError) unsubscribeError(error);
      reject(error);
    });
  });
};

/**
 * Subscribe to MQTT messages in your React components
 */
export const subscribeToMqtt = (callback) => {
  subscribers.push(callback);

  return () => {
    subscribers = subscribers.filter(cb => cb !== callback);
  };
};

/**
 * Disconnect from the MQTT broker
 */
export const disconnectMqtt = () => {
  if (client) {
    client.end(true);
    client = null;
    isConnected = false;
    if (unsubscribeStatus) unsubscribeStatus(false);
  }
};

export const getConnectionStatus = () => isConnected;

export default {
  connectMqtt,
  subscribeToMqtt,
  disconnectMqtt,
  getConnectionStatus
};
