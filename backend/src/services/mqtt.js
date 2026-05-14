/**
 * MQTT Service
 * Subscribes to HiveMQ Cloud and stores all data in Supabase
 */

import mqtt from 'mqtt';
import dotenv from 'dotenv';
import {
  storeSensorReading,
  storePlantImage,
  storeDetectionResult,
} from '../db/supabase.js';

dotenv.config();

const BROKER_HOST = process.env.MQTT_BROKER || 'd0e0ce8ffc364fe4b5c641f8f84ef0a1.s1.eu.hivemq.cloud';
const BROKER_PORT = process.env.MQTT_PORT || 8883;
const MQTT_USERNAME = process.env.MQTT_USERNAME || 'thesis_pi';
const MQTT_PASSWORD = process.env.MQTT_PASSWORD || 'your-mqtt-password';
const MQTT_URL = `mqtts://${BROKER_HOST}:${BROKER_PORT}`;

const TOPICS = {
  sensors: 'rice/sensors',
  image: 'rice/image',
  detection: 'rice/detection',
};

let client = null;

/**
 * Connect to MQTT broker
 */
export const connectMqtt = () => {
  return new Promise((resolve, reject) => {
    try {
      client = mqtt.connect(MQTT_URL, {
        username: MQTT_USERNAME,
        password: MQTT_PASSWORD,
        clientId: `backend_${Date.now()}_${Math.random().toString(16).slice(3)}`,
        reconnectPeriod: 5000,
        keepalive: 60,
        clean: true,
        rejectUnauthorized: false,
      });

      client.on('connect', () => {
        console.log('[MQTT] ✅ Connected to HiveMQ Cloud');
        
        // Subscribe to all topics
        const topicList = Object.values(TOPICS);
        client.subscribe(topicList, (error) => {
          if (error) {
            console.error('[MQTT] Subscribe error:', error);
            reject(error);
            return;
          }
          console.log('[MQTT] 📡 Subscribed to:', topicList.join(', '));
          resolve();
        });
      });

      client.on('message', async (topic, message) => {
        try {
          const payload = JSON.parse(message.toString());
          await handleMqttMessage(topic, payload);
        } catch (error) {
          console.error(`[MQTT] Error processing message from ${topic}:`, error.message);
        }
      });

      client.on('error', (error) => {
        console.error('[MQTT] Connection error:', error.message);
        reject(error);
      });

      client.on('reconnect', () => {
        console.log('[MQTT] 🔄 Reconnecting...');
      });

      client.on('close', () => {
        console.log('[MQTT] ⚠️  Connection closed');
      });

    } catch (error) {
      console.error('[MQTT] Setup error:', error.message);
      reject(error);
    }
  });
};

/**
 * Handle incoming MQTT messages
 */
const handleMqttMessage = async (topic, payload) => {
  try {
    // ── rice/sensors ──
    if (topic === TOPICS.sensors) {
      console.log(`[MQTT] 📊 Sensor data received at ${new Date().toISOString()}`);
      await storeSensorReading(payload);
      console.log(`[MQTT] ✅ Stored in database`);
    }

    // ── rice/image ──
    else if (topic === TOPICS.image) {
      const plantId = payload.plant;
      if (plantId && payload.image) {
        console.log(`[MQTT] 📸 Image from plant ${plantId}`);
        await storePlantImage(plantId, payload.image);
        console.log(`[MQTT] ✅ Stored image for plant ${plantId}`);
      }
    }

    // ── rice/detection ──
    else if (topic === TOPICS.detection) {
      console.log(`[MQTT] 🎯 Detection summary received`);
      
      // Store per-plant detections
      if (Array.isArray(payload.plants)) {
        for (const plant of payload.plants) {
          const plantId = plant.plant;
          if (plantId) {
            await storeDetectionResult(plantId, plant);
            console.log(`[MQTT] ✅ Stored detection for plant ${plantId}`);
          }
        }
      }
    }

  } catch (error) {
    console.error(`[MQTT] Error handling message:`, error.message);
  }
};

/**
 * Disconnect from MQTT broker
 */
export const disconnectMqtt = () => {
  if (client) {
    client.end(true);
    client = null;
    console.log('[MQTT] Disconnected');
  }
};

/**
 * Check if connected
 */
export const isConnected = () => {
  return client && client.connected;
};

export default {
  connectMqtt,
  disconnectMqtt,
  isConnected,
  TOPICS,
};
