import { useEffect, useState, useRef } from 'react';
import {
  subscribeToMqtt,
  getConnectionStatus,
  subscribeToStatus,
  TOPICS,
} from '../services/mqttService';

/**
 * Custom hook to manage all MQTT data from the Raspberry Pi.
 *
 * IMPORTANT: This hook does NOT initiate any connection.
 * It only listens to messages and tracks connection status.
 * Connection is controlled exclusively by the Mqtt.jsx component.
 *
 * Provides:
 *   sensors         – global readings (temp, hum, soil_1..6, water levels)
 *   plantImages     – { [plantId]: base64String } latest image per plant
 *   plantDetections – { [plantId]: { healthy, sheath_blight, detections[] } }
 *   detectionSummary – latest full detection cycle summary
 *   isConnected     – MQTT connection status
 *   error           – last error message (string | null)
 *   lastSensorTime  – Date of last sensor update
 */
export const useMqttData = () => {
  const [sensors, setSensors] = useState({
    temp: null,
    hum: null,
    soil_1: null,
    soil_2: null,
    soil_3: null,
    soil_4: null,
    soil_5: null,
    soil_6: null,
    water_level_healthy: null,
    water_level_diseased: null,
    timestamp: null,
  });

  // Store latest image per plant  { 1: "base64...", 2: "base64...", ... }
  const [plantImages, setPlantImages] = useState({});

  // Store latest detection per plant { 1: { healthy, sheath_blight, detections[] }, ... }
  const [plantDetections, setPlantDetections] = useState({});

  // Full detection summary from rice/detection topic
  const [detectionSummary, setDetectionSummary] = useState(null);

  const [isConnected, setIsConnected] = useState(() => getConnectionStatus());
  const [error, setError] = useState(null);
  const [lastSensorTime, setLastSensorTime] = useState(null);

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    // ── Listen for connection status changes ──
    const unsubscribeStatus = subscribeToStatus((status) => {
      if (!mountedRef.current) return;
      setIsConnected(status);
      if (status) setError(null);

      // When disconnecting, clear all MQTT data so mock can show again
      if (!status) {
        setSensors({
          temp: null, hum: null,
          soil_1: null, soil_2: null, soil_3: null,
          soil_4: null, soil_5: null, soil_6: null,
          water_level_healthy: null, water_level_diseased: null,
          timestamp: null,
        });
        setPlantImages({});
        setPlantDetections({});
        setDetectionSummary(null);
        setLastSensorTime(null);
      }
    });

    // ── Listen for incoming messages ──
    const handleMessage = (topic, payload) => {
      if (!mountedRef.current) return;

      // ── rice/sensors ──
      if (topic === TOPICS.sensors) {
        setSensors({
          temp: payload.temp ?? null,
          hum: payload.hum ?? null,
          soil_1: payload.soil_1 ?? null,
          soil_2: payload.soil_2 ?? null,
          soil_3: payload.soil_3 ?? null,
          soil_4: payload.soil_4 ?? null,
          soil_5: payload.soil_5 ?? null,
          soil_6: payload.soil_6 ?? null,
          water_level_healthy: payload.water_level_healthy ?? null,
          water_level_diseased: payload.water_level_diseased ?? null,
          timestamp: payload.timestamp ?? null,
        });
        setLastSensorTime(new Date());
      }

      // ── rice/image ──
      if (topic === TOPICS.image) {
        const plantId = payload.plant;
        const imageData = payload.image;
        if (plantId && imageData) {
          setPlantImages((prev) => ({ ...prev, [plantId]: imageData }));
        }
      }

      // ── rice/detection ──
      // raspicode.txt publishes a summary with { plants: [...], total_healthy, total_sheath_blight }
      if (topic === TOPICS.detection) {
        setDetectionSummary(payload);

        // Extract per-plant detections from the "plants" array
        if (Array.isArray(payload.plants)) {
          setPlantDetections((prev) => {
            const next = { ...prev };
            payload.plants.forEach((p) => {
              next[p.plant] = {
                healthy: p.healthy ?? 0,
                sheath_blight: p.sheath_blight ?? 0,
                detections: p.detections ?? [],
                inference_ms: p.inference_ms ?? 0,
                error: p.error ?? null,
              };
            });
            return next;
          });
        }
      }
    };

    const unsubscribeMessages = subscribeToMqtt(handleMessage);

    return () => {
      mountedRef.current = false;
      unsubscribeStatus();
      unsubscribeMessages();
    };
  }, []);

  return {
    sensors,
    plantImages,
    plantDetections,
    detectionSummary,
    isConnected,
    error,
    lastSensorTime,
  };
};

export default useMqttData;
