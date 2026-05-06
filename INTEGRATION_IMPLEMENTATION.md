# 🌾 Rice Plant Monitoring - Complete Integration Implementation Guide

**Last Updated:** May 2026  
**Status:** Hardware + Website Integration  
**Camera Mode:** Periodic Image Capture (60s intervals, NO Live Feed)

---

## Table of Contents

1. [Connection Overview](#1-connection-overview)
2. [Are They Connected? YES](#2-are-they-connected-yes)
3. [Complete Data Flow](#3-complete-data-flow)
4. [Implementation Steps](#4-implementation-steps)
5. [Website Components - Required Changes](#5-website-components---required-changes)
6. [MQTT Topics Reference](#6-mqtt-topics-reference)
7. [Testing Checklist](#7-testing-checklist)

---

## 1. Connection Overview

### Hardware Stack (CONNECTED ✅)

```
┌─────────────────────────────────────────────────────────────────┐
│                      HARDWARE LAYER                              │
└─────────────────────────────────────────────────────────────────┘

ESP32 (espcode.ino)
├─ DHT22 Sensor (Temp/Humidity)
├─ Ultrasonic Sensors × 2 (Water Level)
├─ Soil Moisture Sensors × 6 (One per plant)
├─ Relay Pins × 6 (Pump Control)
├─ Stepper Motor (Camera positioning - NOTE: Not used in raspicode.txt)
└─ WiFi Connection

        ↓↓↓ UART Serial Connection (115200 baud) ↓↓↓

Raspberry Pi 4B (raspicode.txt)
├─ Reads sensor data from ESP32 via /dev/ttyUSB0
├─ USB Webcam (captures images every 60 seconds)
├─ YOLOv8 ONNX Model (disease detection)
├─ Publishes to HiveMQ Cloud MQTT Broker
└─ NO Cloudinary (images already in base64 via MQTT)

        ↓↓↓ WiFi + MQTT over Internet ↓↓↓

Website (React/Vite)
├─ Subscribes to MQTT topics
├─ Displays sensor readings (real-time)
├─ Shows captured images (periodic)
├─ Displays disease detection results
└─ Plant selection buttons (1-6)
```

---

## 2. Are They Connected? YES ✅

### YES, They Are Fully Connected

**ESP32 → Raspberry Pi:**
- ✅ Connected via UART Serial (`/dev/ttyUSB0` @ 115200 baud)
- ✅ ESP32 sends JSON sensor data every 10 seconds
- ✅ Pi receives health status commands (`HEALTH:N:1` or `HEALTH:N:0`)
- ✅ Pi sends pump control back to ESP32

**Raspberry Pi → Website:**
- ✅ Connected via MQTT (HiveMQ Cloud)
- ✅ Pi publishes sensor data, images, and detection results
- ✅ Website subscribes to all topics
- ✅ Website receives updates in real-time

**Image Handling:**
- ✅ **NO Cloudinary needed** — images already sent as base64 JPEG via MQTT
- ✅ Raspberry Pi captures image → runs detection → encodes as base64 → publishes to MQTT
- ✅ Website receives base64 string → displays directly in `<img>` tag
- ✅ New image every 60 seconds (configurable in `LOOP_INTERVAL`)

---

## 3. Complete Data Flow

### Per-Cycle Flow (Repeats Every 60 Seconds)

```
SECOND 0-10: Sensor Reading
  └─ Pi: "Waiting for sensor JSON..."
  └─ ESP32: Sends → {"temp": 25.5, "hum": 65, "depth1": 5, "soil_pct": [0, 45, 50, ...], ...}
  └─ Pi: Receives and parses JSON
  └─ Pi → MQTT Topic "rice/sensors": Publishes sensor data
  └─ Website: Receives updated sensor readings (temp, humidity, water level)

SECOND 10-25: Image Capture & Detection
  └─ Pi: Captures frame from USB webcam
  └─ Pi: Runs YOLOv8 ONNX inference (640×640 input)
  └─ Pi: Gets detections (bounding boxes, class, confidence)
  └─ Pi: Annotates image with bounding boxes and labels
  └─ Pi: Encodes image as base64 JPEG (640×640, quality 80)

SECOND 25-40: Result Publishing
  └─ Pi → ESP32: Sends "HEALTH:1:1\n" (Plant 1 is healthy)
  └─ Pi → MQTT Topic "rice/image": {"plant": 1, "image": "<base64>", "timestamp": "..."}
  └─ Pi → MQTT Topic "rice/detection": 
      {
        "plant": 1,
        "timestamp": "2026-05-07_120000",
        "healthy": 1,
        "sheath_blight": 0,
        "detections": [{"class": "Healthy", "confidence": 0.95, "box": [...]}]
      }
  └─ Website: Receives image and detections → displays current plant's image & results

SECOND 40-60: Repeat for Plants 2-6
  └─ Same cycle for plants 2, 3, 4, 5, 6
  └─ Pi waits 3 seconds between plants (CAPTURE_DELAY) for user to reposition if needed
  └─ After all 6 plants: Print cycle summary

SECOND 60+: Loop Starts Again
```

---

## 4. Implementation Steps

### Step 4.1: Raspberry Pi Setup (Already in raspicode.txt)

Your **raspicode.txt** is already complete! It:
- ✅ Reads from ESP32 via Serial
- ✅ Captures images every cycle
- ✅ Runs YOLOv8 detection
- ✅ Publishes to MQTT with base64 images
- ✅ Sends health status to ESP32

**What you need to do:**

1. Install dependencies on Pi:
```bash
pip3 install paho-mqtt opencv-python numpy onnxruntime pyserial
```

2. Set up environment file (`.env` in Pi's working directory):
```bash
MQTT_BROKER=d0e0ce8ffc364fe4b5c641f8f84ef0a1.s1.eu.hivemq.cloud
MQTT_PORT=8883
MQTT_USER=thesis_pi
MQTT_PASSWORD=H@rveypads123
SERIAL_PORT=/dev/ttyUSB0
SERIAL_BAUD=115200
```

3. Ensure model file exists:
```bash
/home/harveypadsece1/Desktop/THESIS/best.onnx
```

4. Run the script:
```bash
python3 raspicode.txt
```

### Step 4.2: HiveMQ Cloud Setup

✅ **Your HiveMQ Cloud Credentials (Already Created)**

**Broker Host:** `d0e0ce8ffc364fe4b5c641f8f84ef0a1.s1.eu.hivemq.cloud`
**WebSocket Port:** `8884`
**Username:** `thesis_pi`
**Password:** `H@rveypads123`

✅ Use these credentials in your Raspberry Pi `.env` file and website `.env` file

### Step 4.3: Website Setup

See [Section 5](#5-website-components---required-changes) for detailed component changes.

---

## 5. Website Components - Required Changes

### Overview of What's Needed

```
ui/src/
├── services/
│   └── mqttService.js          [MODIFY] - Add image and detection topics
├── hooks/
│   └── useMqttData.js           [CREATE] - Hook to manage MQTT subscriptions
├── components/
│   ├── Dashboard.jsx            [MODIFY] - Main layout component
│   ├── CameraView.jsx           [CREATE/MODIFY] - Display periodic image
│   ├── DiseaseDetection.jsx     [MODIFY] - Show detection results
│   ├── EspReadings.jsx          [MODIFY] - Display sensor data
│   ├── PlantSelector.jsx        [CREATE] - Plant selection buttons (1-6)
│   └── MqttStatus.jsx           [CREATE] - Connection indicator
└── assets/
    └── (no changes needed)
```

---

### 5.1 MODIFY: `src/services/mqttService.js`

**Why:** Current file references Cloudinary. We need to handle base64 images instead.

**Changes Needed:**

```javascript
import mqtt from 'mqtt';

// ===== HiveMQ CONFIGURATION =====
const BROKER_HOST = import.meta.env.VITE_MQTT_BROKER || 'd0e0ce8ffc364fe4b5c641f8f84ef0a1.s1.eu.hivemq.cloud';
const BROKER_PORT = import.meta.env.VITE_MQTT_WEBSOCKET_PORT || 8884; // WebSocket Secure
const MQTT_USERNAME = import.meta.env.VITE_MQTT_USERNAME || 'thesis_pi';
const MQTT_PASSWORD = import.meta.env.VITE_MQTT_PASSWORD || 'H@rveypads123';

const MQTT_URL = `wss://${BROKER_HOST}:${BROKER_PORT}/mqtt`;

// ===== MQTT TOPICS (Match raspicode.txt) =====
const TOPICS = {
  sensors: 'rice/sensors',           // {"temp": 25.5, "hum": 65, "depth1": 5, "soil_pct": [...], ...}
  image: 'rice/image',               // {"plant": N, "image": "<base64>", "timestamp": "..."}
  detection: 'rice/detection',       // {"plant": N, "healthy": X, "sheath_blight": Y, "detections": [...]}
};

let client = null;
let subscribers = [];
let isConnected = false;

/**
 * Connect to HiveMQ Cloud MQTT broker
 */
export const connectMqtt = async (onMessageCallback, onErrorCallback) => {
  try {
    console.log(`[MQTT] Connecting to ${BROKER_HOST}:${BROKER_PORT}...`);
    
    client = mqtt.connect(MQTT_URL, {
      username: MQTT_USERNAME,
      password: MQTT_PASSWORD,
      clientId: `web_client_${Date.now()}`,
      reconnectPeriod: 5000,
      keepalive: 60,
    });

    client.on('connect', () => {
      console.log('[MQTT] ✅ Connected to HiveMQ Cloud');
      isConnected = true;
      
      // Subscribe to all topics
      client.subscribe(TOPICS.sensors, (err) => {
        if (!err) console.log(`[MQTT] Subscribed to ${TOPICS.sensors}`);
      });
      client.subscribe(TOPICS.image, (err) => {
        if (!err) console.log(`[MQTT] Subscribed to ${TOPICS.image}`);
      });
      client.subscribe(TOPICS.detection, (err) => {
        if (!err) console.log(`[MQTT] Subscribed to ${TOPICS.detection}`);
      });
    });

    client.on('message', (topic, message) => {
      try {
        const payload = JSON.parse(message.toString());
        onMessageCallback({ topic, payload });
      } catch (e) {
        console.error(`[MQTT] Parse error on ${topic}:`, e);
      }
    });

    client.on('error', (error) => {
      console.error('[MQTT] Connection error:', error);
      isConnected = false;
      onErrorCallback && onErrorCallback(error);
    });

    client.on('disconnect', () => {
      console.log('[MQTT] Disconnected');
      isConnected = false;
    });

  } catch (error) {
    console.error('[MQTT] Setup error:', error);
    onErrorCallback && onErrorCallback(error);
  }
};

/**
 * Check if connected
 */
export const isMqttConnected = () => isConnected;

/**
 * Disconnect
 */
export const disconnectMqtt = () => {
  if (client) {
    client.end();
    isConnected = false;
  }
};

export { TOPICS };
```

---

### 5.2 CREATE: `src/hooks/useMqttData.js`

**Why:** Custom hook to manage all MQTT subscriptions and state updates.

```javascript
import { useEffect, useState, useCallback } from 'react';
import { connectMqtt, isMqttConnected, disconnectMqtt, TOPICS } from '../services/mqttService';

/**
 * Custom hook to manage MQTT data
 * 
 * Returns:
 * {
 *   sensors: { temp, hum, soil_1...soil_6, water_level_healthy, water_level_diseased },
 *   currentImage: "<base64>",
 *   currentImagePlant: N,
 *   detection: { plant, healthy, sheath_blight, detections: [] },
 *   isConnected: bool,
 *   error: null || string,
 * }
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

  const [currentImage, setCurrentImage] = useState(null);
  const [currentImagePlant, setCurrentImagePlant] = useState(null);
  
  const [detection, setDetection] = useState({
    plant: null,
    healthy: 0,
    sheath_blight: 0,
    detections: [],
    timestamp: null,
  });

  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleMessage = ({ topic, payload }) => {
      console.log(`[MQTT] Received on ${topic}:`, payload);

      if (topic === TOPICS.sensors) {
        setSensors({
          temp: payload.temp,
          hum: payload.hum,
          soil_1: payload.soil_1,
          soil_2: payload.soil_2,
          soil_3: payload.soil_3,
          soil_4: payload.soil_4,
          soil_5: payload.soil_5,
          soil_6: payload.soil_6,
          water_level_healthy: payload.water_level_healthy,
          water_level_diseased: payload.water_level_diseased,
          timestamp: payload.timestamp,
        });
      }

      if (topic === TOPICS.image) {
        setCurrentImage(payload.image);
        setCurrentImagePlant(payload.plant);
      }

      if (topic === TOPICS.detection) {
        setDetection({
          plant: payload.plant,
          healthy: payload.healthy,
          sheath_blight: payload.sheath_blight,
          detections: payload.detections || [],
          timestamp: payload.timestamp,
        });
      }
    };

    const handleError = (err) => {
      setError(err.message);
      setIsConnected(false);
    };

    connectMqtt(handleMessage, handleError);
    setIsConnected(true);

    return () => {
      disconnectMqtt();
    };
  }, []);

  return {
    sensors,
    currentImage,
    currentImagePlant,
    detection,
    isConnected,
    error,
  };
};
```

---

### 5.3 MODIFY: `src/components/Dashboard.jsx`

**Why:** Main component needs to orchestrate plant selection and display all data.

**Key Changes:**
- Add plant selector state (1-6)
- Display current plant's sensor readings
- Display current plant's image
- Display current plant's detection results
- Show MQTT connection status

```javascript
import React, { useState } from 'react';
import { useMqttData } from '../hooks/useMqttData';
import CameraView from './CameraView';
import DiseaseDetection from './DiseaseDetection';
import EspReadings from './EspReadings';
import PlantSelector from './PlantSelector';
import MqttStatus from './MqttStatus';

const Dashboard = () => {
  const [selectedPlant, setSelectedPlant] = useState(1);
  const { sensors, currentImage, currentImagePlant, detection, isConnected, error } = useMqttData();

  return (
    <div className="dashboard">
      {/* Header with MQTT status */}
      <div className="header">
        <h1>🌾 Rice Plant Monitoring System</h1>
        <MqttStatus isConnected={isConnected} error={error} />
      </div>

      {/* Plant selection buttons */}
      <PlantSelector selectedPlant={selectedPlant} onSelectPlant={setSelectedPlant} />

      {/* Main content grid */}
      <div className="grid">
        {/* Left: Sensor readings */}
        <div className="section">
          <h2>Sensor Readings (Global)</h2>
          <EspReadings 
            temp={sensors.temp}
            hum={sensors.hum}
            soilArray={[
              sensors.soil_1,
              sensors.soil_2,
              sensors.soil_3,
              sensors.soil_4,
              sensors.soil_5,
              sensors.soil_6,
            ]}
            waterHealthy={sensors.water_level_healthy}
            waterDiseased={sensors.water_level_diseased}
          />
        </div>

        {/* Right: Camera image */}
        <div className="section">
          <h2>Plant {selectedPlant} - Current Image</h2>
          {currentImage && currentImagePlant === selectedPlant ? (
            <CameraView 
              base64Image={currentImage}
              plantId={selectedPlant}
              timestamp={detection.timestamp}
            />
          ) : (
            <p>Waiting for image capture...</p>
          )}
        </div>
      </div>

      {/* Bottom: Disease detection results */}
      <div className="section full-width">
        <h2>Plant {selectedPlant} - Disease Detection Results</h2>
        {detection && detection.plant === selectedPlant ? (
          <DiseaseDetection 
            detection={detection}
            plantId={selectedPlant}
          />
        ) : (
          <p>Waiting for detection results...</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
```

---

### 5.4 CREATE: `src/components/PlantSelector.jsx`

**Why:** Allow user to select which plant (1-6) to view.

```javascript
import React from 'react';
import './PlantSelector.css';

const PlantSelector = ({ selectedPlant, onSelectPlant }) => {
  return (
    <div className="plant-selector">
      <h3>Select Plant to Monitor:</h3>
      <div className="button-group">
        {[1, 2, 3, 4, 5, 6].map((plantId) => (
          <button
            key={plantId}
            className={`plant-button ${selectedPlant === plantId ? 'active' : ''}`}
            onClick={() => onSelectPlant(plantId)}
          >
            Plant {plantId}
          </button>
        ))}
      </div>
    </div>
  );
};

export default PlantSelector;
```

**Create** `src/components/PlantSelector.css`:
```css
.plant-selector {
  padding: 20px;
  background: #f5f5f5;
  border-radius: 8px;
  margin-bottom: 20px;
}

.plant-selector h3 {
  margin: 0 0 15px 0;
  font-size: 16px;
}

.button-group {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.plant-button {
  padding: 10px 20px;
  border: 2px solid #ddd;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.plant-button:hover {
  border-color: #66bb6a;
  background: #f1f8f6;
}

.plant-button.active {
  background: #66bb6a;
  color: white;
  border-color: #66bb6a;
}
```

---

### 5.5 CREATE: `src/components/CameraView.jsx`

**Why:** Display the base64 image received from MQTT.

```javascript
import React from 'react';
import './CameraView.css';

const CameraView = ({ base64Image, plantId, timestamp }) => {
  if (!base64Image) {
    return <div className="camera-placeholder">Loading image...</div>;
  }

  const imageSrc = `data:image/jpeg;base64,${base64Image}`;

  return (
    <div className="camera-view">
      <img 
        src={imageSrc} 
        alt={`Plant ${plantId} captured image`}
        className="camera-image"
      />
      <div className="image-info">
        <p className="timestamp">
          📸 Captured: {timestamp ? new Date(timestamp).toLocaleString() : 'N/A'}
        </p>
        <p className="plant-id">Plant #{plantId}</p>
      </div>
    </div>
  );
};

export default CameraView;
```

**Create** `src/components/CameraView.css`:
```css
.camera-view {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  background: #000;
}

.camera-image {
  width: 100%;
  height: auto;
  display: block;
  border-radius: 8px;
}

.image-info {
  padding: 10px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  font-size: 12px;
}

.image-info p {
  margin: 3px 0;
}

.timestamp {
  font-weight: bold;
}

.camera-placeholder {
  width: 100%;
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f5f5, #e0e0e0);
  border-radius: 8px;
  color: #999;
  font-size: 14px;
}
```

---

### 5.6 CREATE: `src/components/MqttStatus.jsx`

**Why:** Display MQTT connection status.

```javascript
import React from 'react';
import './MqttStatus.css';

const MqttStatus = ({ isConnected, error }) => {
  return (
    <div className={`mqtt-status ${isConnected ? 'connected' : 'disconnected'}`}>
      <span className="status-dot"></span>
      <span className="status-text">
        {isConnected ? '✅ MQTT Connected' : '❌ MQTT Disconnected'}
      </span>
      {error && <span className="error-text">{error}</span>}
    </div>
  );
};

export default MqttStatus;
```

**Create** `src/components/MqttStatus.css`:
```css
.mqtt-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 15px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
}

.mqtt-status.connected {
  background: #c8e6c9;
  color: #2e7d32;
}

.mqtt-status.disconnected {
  background: #ffcdd2;
  color: #c62828;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  animation: pulse 1.5s infinite;
}

.mqtt-status.connected .status-dot {
  background: #2e7d32;
}

.mqtt-status.disconnected .status-dot {
  background: #c62828;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.error-text {
  margin-left: 8px;
  font-size: 12px;
}
```

---

### 5.7 MODIFY: `src/components/EspReadings.jsx`

**Why:** Update to display sensor data from MQTT (remove API calls).

**Key Changes:**
- Accept props instead of fetching from API
- Display soil moisture for all 6 plants
- Show water level for healthy and diseased pots

```javascript
import React from 'react';

const EspReadings = ({ temp, hum, soilArray, waterHealthy, waterDiseased }) => {
  const formatValue = (value) => value !== null ? value.toFixed(1) : 'N/A';

  return (
    <div className="esp-readings">
      {/* Temperature & Humidity */}
      <div className="reading-item">
        <span className="label">🌡️ Temperature</span>
        <span className="value">{formatValue(temp)}°C</span>
      </div>

      <div className="reading-item">
        <span className="label">💧 Humidity</span>
        <span className="value">{formatValue(hum)}%</span>
      </div>

      {/* Water Levels */}
      <div className="reading-item">
        <span className="label">🚰 Water Level (Healthy)</span>
        <span className="value">{formatValue(waterHealthy)}%</span>
      </div>

      <div className="reading-item">
        <span className="label">🚰 Water Level (Diseased)</span>
        <span className="value">{formatValue(waterDiseased)}%</span>
      </div>

      {/* Soil Moisture for each plant */}
      <h4>Soil Moisture (%)</h4>
      <div className="soil-grid">
        {soilArray.map((value, idx) => (
          <div key={idx} className="soil-item">
            <span className="plant-label">Plant {idx + 1}</span>
            <span className="soil-value">{formatValue(value)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EspReadings;
```

---

### 5.8 MODIFY: `src/components/DiseaseDetection.jsx`

**Why:** Display detection results from MQTT instead of mock data.

**Key Changes:**
- Accept detection object from props
- Show healthy/diseased count
- List all detections with confidence scores

```javascript
import React from 'react';

const DiseaseDetection = ({ detection, plantId }) => {
  if (!detection || !detection.plant) {
    return <p>No detection data available</p>;
  }

  const totalDetections = (detection.healthy || 0) + (detection.sheath_blight || 0);
  const healthyPercent = totalDetections > 0 ? ((detection.healthy / totalDetections) * 100).toFixed(0) : 0;
  const diseasedPercent = totalDetections > 0 ? ((detection.sheath_blight / totalDetections) * 100).toFixed(0) : 0;

  return (
    <div className="disease-detection">
      <div className="detection-summary">
        <div className="summary-item healthy">
          <span className="count">{detection.healthy || 0}</span>
          <span className="label">Healthy</span>
          <span className="percent">{healthyPercent}%</span>
        </div>

        <div className="summary-item diseased">
          <span className="count">{detection.sheath_blight || 0}</span>
          <span className="label">Sheath Blight</span>
          <span className="percent">{diseasedPercent}%</span>
        </div>
      </div>

      {detection.detections && detection.detections.length > 0 && (
        <div className="detection-details">
          <h4>Detected Objects:</h4>
          <table>
            <thead>
              <tr>
                <th>Label</th>
                <th>Confidence</th>
                <th>Box (x1, y1, x2, y2)</th>
              </tr>
            </thead>
            <tbody>
              {detection.detections.map((det, idx) => (
                <tr key={idx} className={det.class_id === 0 ? 'healthy' : 'diseased'}>
                  <td>{det.label}</td>
                  <td>{(det.confidence * 100).toFixed(1)}%</td>
                  <td>{det.box.map(v => Math.round(v)).join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DiseaseDetection;
```

---

### 5.9 UPDATE: `.env` in `ui/` folder

**Why:** Configure MQTT connection to HiveMQ Cloud.

```env
# HiveMQ Cloud MQTT Configuration
VITE_MQTT_BROKER=d0e0ce8ffc364fe4b5c641f8f84ef0a1.s1.eu.hivemq.cloud
VITE_MQTT_WEBSOCKET_PORT=8884
VITE_MQTT_USERNAME=thesis_pi
VITE_MQTT_PASSWORD=H@rveypads123
```

---

## 6. MQTT Topics Reference

### Topics Published by Raspberry Pi

| Topic | Frequency | Payload | Notes |
|-------|-----------|---------|-------|
| `rice/sensors` | Every 10 seconds | JSON sensor data | Global (not per-plant) |
| `rice/image` | Every 60s per plant | Base64 JPEG image | New image every ~10 min per plant |
| `rice/detection` | Every 60s per plant | Detection results | Healthy/diseased counts |

### Sensor Data Example
```json
{
  "timestamp": "2026-05-07_120000",
  "temp": 25.5,
  "hum": 65.0,
  "soil_1": 45.2,
  "soil_2": 48.5,
  "soil_3": 42.1,
  "soil_4": 50.0,
  "soil_5": 46.8,
  "soil_6": 44.5,
  "water_level_healthy": 45.0,
  "water_level_diseased": 52.3
}
```

### Image Data Example
```json
{
  "plant": 1,
  "timestamp": "2026-05-07_120000",
  "image": "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEB... (truncated, full base64 string)"
}
```

### Detection Data Example
```json
{
  "plant": 1,
  "timestamp": "2026-05-07_120000",
  "healthy": 1,
  "sheath_blight": 0,
  "detections": [
    {
      "class_id": 0,
      "label": "Healthy",
      "confidence": 0.95,
      "box": [100, 150, 300, 350]
    }
  ]
}
```

---

## 7. Testing Checklist

### Pre-Launch Verification

- [ ] **Raspberry Pi Setup**
  - [ ] `raspicode.txt` downloaded and dependencies installed
  - [ ] `.env` file created with correct HiveMQ credentials
  - [ ] Model file `best.onnx` exists at correct path
  - [ ] Serial connection to ESP32 working (`ls /dev/ttyUSB*`)
  - [ ] Script runs without errors: `python3 raspicode.txt`
  - [ ] Topics visible in MQTT Explorer

- [ ] **HiveMQ Cloud**
  - [ ] Account created and cluster running
  - [ ] Credentials created (`thesis_pi` user)
  - [ ] Test connection: `telnet broker_host 8883`

- [ ] **Website Setup**
  - [ ] `.env` file in `ui/` with correct HiveMQ credentials
  - [ ] All new components created (PlantSelector, MqttStatus, CameraView)
  - [ ] MQTT service updated with correct topics
  - [ ] No build errors: `npm run build`
  - [ ] Dev server starts: `npm run dev`

- [ ] **Real-Time Testing**
  - [ ] Start Raspberry Pi script
  - [ ] Open website in browser
  - [ ] Check MQTT status shows "Connected"
  - [ ] Sensor readings appear and update every 10 seconds
  - [ ] Image appears within 60 seconds
  - [ ] Click plant buttons (1-6) to switch between plants
  - [ ] Detection results show on each image
  - [ ] Browser console has no errors (F12)

### Troubleshooting During Testing

| Issue | Check |
|-------|-------|
| Website won't connect to MQTT | Check `.env` uses `d0e0ce8ffc364fe4b5c641f8f84ef0a1.s1.eu.hivemq.cloud` and port `8884` |
| No images appearing | Check Pi script is running, camera connected, YOLOv8 model exists |
| Sensor data not updating | Check ESP32 is sending data, Pi can read serial, MQTT topic spelled correctly |
| Old image still showing | Refresh browser, check Pi is publishing new images to `rice/image` topic |
| Plant buttons don't switch images | Check `useMqttData` hook, verify `currentImagePlant` matches selected plant |

---

## Summary: What Changed From Original Guide

### ❌ REMOVED
- ~~Cloudinary integration~~ — Not needed, images in base64 via MQTT
- ~~REST API backend~~ — Direct MQTT subscription in browser
- ~~Image URL storage~~ — Embedded base64 in JSON payload

### ✅ ADDED
- `PlantSelector` component for manual plant selection
- `CameraView` component for base64 image display
- `MqttStatus` component for connection indicator
- `useMqttData` hook for centralized subscription management
- Direct WebSocket connection from browser to HiveMQ

### 🔄 MODIFIED
- Dashboard to use MQTT data instead of API
- EspReadings to display global + per-plant sensor data
- DiseaseDetection to show detection results from MQTT

---

## Quick Start Command

**On Raspberry Pi:**
```bash
# 1. Set up environment
pip3 install paho-mqtt opencv-python numpy onnxruntime pyserial

# 2. Create .env with your HiveMQ credentials
nano ~/.env

# 3. Run the monitor
python3 raspicode.txt
```

**On Website:**
```bash
# 1. Install dependencies
cd ui && npm install

# 2. Set up environment
nano .env  # Add HiveMQ credentials

# 3. Start dev server
npm run dev
```

**Then open:** http://localhost:5173

---

## Architecture Summary

```
System: Fully Connected ✅
├─ ESP32 → Raspberry Pi (Serial UART)
├─ Raspberry Pi → HiveMQ Cloud (MQTT)
└─ Website ← HiveMQ Cloud (WebSocket MQTT)

Image Flow: NO EXTERNAL STORAGE ✅
├─ Raspberry Pi captures image
├─ Encodes as base64 JPEG
├─ Publishes to MQTT
└─ Website receives and displays directly

Update Frequency: ✅
├─ Sensors: Every 10 seconds
├─ Images: Every 60 seconds total (10 seconds per plant × 6 plants)
└─ Detection: With each image

Manual Control: ✅
├─ Plant selector buttons (1-6)
├─ User can view any plant's data
└─ No automatic rotation needed
```

---

**This is your complete integration guide. Follow steps 4.1-4.3 on Raspberry Pi, then 5.1-5.9 on Website, then test using Section 7.**

Good luck! 🚀
