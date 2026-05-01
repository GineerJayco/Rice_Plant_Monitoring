import mqtt from 'mqtt';

/**
 * Skeleton MQTT Service for Intelligent Irrigation
 * 
 * Replace 'ws://broker.emqx.io:8083/mqtt' with your actual MQTT broker WebSocket URL.
 * Ensure your broker supports WebSockets (ws:// or wss://) because standard
 * raw TCP MQTT (mqtt://) does not work directly inside a web browser.
 */

// Example configuration
const MQTT_BROKER_URL = import.meta.env.VITE_MQTT_BROKER_URL || 'ws://broker.emqx.io:8083/mqtt';
const MQTT_TOPIC_BASE = 'thesis/intelligent_irrigation';

let client = null;
let subscribers = [];

/**
 * Connect to the MQTT Broker
 */
export const connectMqtt = () => {
  if (client) return;

  console.log(`Connecting to MQTT broker: ${MQTT_BROKER_URL}`);
  
  // You might need username/password here depending on your broker setup
  client = mqtt.connect(MQTT_BROKER_URL, {
    clientId: `react_client_${Math.random().toString(16).slice(3)}`,
    keepalive: 60,
    clean: true,
  });

  client.on('connect', () => {
    console.log('Connected to MQTT Broker!');
    // Subscribe to all topics under the base topic
    client.subscribe(`${MQTT_TOPIC_BASE}/#`, (err) => {
      if (!err) {
        console.log(`Subscribed to ${MQTT_TOPIC_BASE}/#`);
      }
    });
  });

  client.on('message', (topic, message) => {
    // Parse the incoming message
    try {
      const payloadString = message.toString();
      let payload;
      
      // Try to parse JSON if possible, otherwise treat as plain string
      try {
        payload = JSON.parse(payloadString);
      } catch (e) {
        payload = payloadString;
      }

      console.log(`Received message on ${topic}:`, payload);
      
      // Notify all React components that are listening
      subscribers.forEach(callback => callback(topic, payload));
    } catch (error) {
      console.error('Error parsing MQTT message:', error);
    }
  });

  client.on('error', (err) => {
    console.error('MQTT Connection Error:', err);
    client.end();
  });
};

/**
 * Subscribe to MQTT messages in your React components
 * 
 * @param {Function} callback - Function to run when a message arrives
 * @returns {Function} - Unsubscribe function to call in useEffect cleanup
 */
export const subscribeToMqtt = (callback) => {
  subscribers.push(callback);
  
  // Ensure connection exists
  if (!client) connectMqtt();

  // Return unsubscribe function
  return () => {
    subscribers = subscribers.filter(cb => cb !== callback);
  };
};

/**
 * Disconnect from the MQTT broker
 */
export const disconnectMqtt = () => {
  if (client) {
    client.end();
    client = null;
    console.log('Disconnected from MQTT Broker');
  }
};

export default {
  connectMqtt,
  subscribeToMqtt,
  disconnectMqtt
};
