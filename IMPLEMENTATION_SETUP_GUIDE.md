# 🌾 Complete Implementation Guide: Raspberry Pi + Website Integration

## Table of Contents
1. [System Overview](#system-overview)
2. [HiveMQ Cloud Setup](#1-hivemq-cloud-setup)
3. [Cloudinary Setup](#2-cloudinary-setup)
4. [Raspberry Pi Configuration](#3-raspberry-pi-configuration)
5. [Website Updates](#4-website-updates)
6. [Environment Configuration](#5-environment-configuration)
7. [Testing & Troubleshooting](#6-testing--troubleshooting)
8. [Data Flow Diagram](#7-data-flow-diagram)

---

## System Overview

Your system has **two communication channels**:

```
┌─────────────────────────────────────────────────────────┐
│ SENSOR DATA (Temperature, Humidity, Soil Moisture, etc) │
│ └─→ ESP32 → Raspberry Pi → HiveMQ Cloud → Website      │
│ (via MQTT)                                               │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ CAMERA IMAGES                                           │
│ └─→ Raspberry Pi Camera → Raspberry Pi → Cloudinary    │
│ (image storage & CDN)      → Website                    │
└─────────────────────────────────────────────────────────┘
```

**Key Points:**
- **MQTT (HiveMQ Cloud)**: Real-time sensor data from all 6 plants
- **Cloudinary**: Image hosting for camera photos
- **Website**: Displays real-time data + images, user can select Plant 1-6 with buttons
- **No automatic rotation** — user manually selects which plant to view

---

---

# 1. HiveMQ Cloud Setup

## Step 1.1: Create HiveMQ Cloud Account

1. Go to: **https://www.hivemq.com/mqtt-cloud-broker/**
2. Click **"Start Free"** or **"Sign Up"**
3. Create an account with your email
4. Verify your email
5. Log in to your HiveMQ Cloud dashboard

## Step 1.2: Create a Free Cluster

1. In the dashboard, click **"Create New Cluster"**
2. Choose **"Free Cluster"** plan
3. Give it a name: `rice-monitoring-cluster` (or similar)
4. Choose a region closest to you
5. Click **"Create"** and wait for it to be ready (2-3 minutes)

## Step 1.3: Get Your HiveMQ Cloud Credentials

Once your cluster is created, you'll see this information. **Copy and save these:**

| Item | Where to find |
|------|---|
| **Broker Host** | Cluster details page, labeled "Broker Host" | e.g., `abc123456.s1.eu.hivemq.cloud` |
| **Port** | `8883` (for MQTT with TLS) |
| **WebSocket Port** | `8884` (for browser connections with TLS) |
| **Username** | Create in "Access Management" → "Credentials" |
| **Password** | Create in "Access Management" → "Credentials" |

### Creating Credentials in HiveMQ Cloud:

1. In your cluster dashboard, go to **"Access Management"** (left sidebar)
2. Click **"Create Credentials"**
3. Username: `raspi_publisher` (or any name)
4. Password: Create a strong password (e.g., `RaspPi@123!Monitor`)
5. Click **"Create"** and save the credentials

**Your HiveMQ Details (SAVE THESE!):**
```
Broker Host:      [YOUR_CLUSTER].s1.eu.hivemq.cloud
MQTT Port:        8883
WebSocket Port:   8884
Username:         raspi_publisher
Password:         [YOUR_PASSWORD]
```

---

# 2. Cloudinary Setup

## Step 2.1: Create Cloudinary Account

1. Go to: **https://cloudinary.com/users/register/free**
2. Sign up with email (or GitHub/Google)
3. Verify your email
4. Log in to your Cloudinary dashboard

## Step 2.2: Get Your Cloudinary Credentials

In your Cloudinary dashboard, go to **Settings** (⚙️ icon, top right):

1. Click **"Dashboard"** or **"Settings"** (⚙️)
2. Find and copy these values:

| Item | Where to find |
|------|---|
| **Cloud Name** | Under "Account" section, labeled "Cloud name" |
| **API Key** | Under "Account" section |
| **API Secret** | Under "Account" section (⚠️ Keep secret!) |

**Your Cloudinary Details (SAVE THESE!):**
```
Cloud Name:       [YOUR_CLOUD_NAME]
API Key:          [YOUR_API_KEY]
API Secret:       [YOUR_API_SECRET]
Upload Preset:    rice_plant_images (we'll create this next)
```

## Step 2.3: Create an Upload Preset (Optional but Recommended)

1. In Cloudinary dashboard, go to **Settings** → **Upload**
2. Under "Upload Presets", click **"Add upload preset"**
3. Set these values:
   - **Name**: `rice_plant_images`
   - **Signing Mode**: `Unsigned` (easier for the Pi)
   - **Resource Type**: `Image`
4. Click **"Save"**

---

---

# 3. Raspberry Pi Configuration

## Step 3.1: Install Required Python Packages

SSH into your Raspberry Pi and run:

```bash
pip3 install paho-mqtt cloudinary pillow python-dotenv
```

**What each package does:**
- `paho-mqtt` — Connect to HiveMQ Cloud
- `cloudinary` — Upload images to Cloudinary
- `pillow` — Image processing
- `python-dotenv` — Read environment variables from `.env` file

## Step 3.2: Create Environment File on Raspberry Pi

Create a file called `.env` in your Pi's working directory:

```bash
nano /home/pi/.env
```

Paste this content (replace with YOUR actual credentials):

```bash
# HiveMQ Cloud Credentials
MQTT_BROKER=YOUR_BROKER_HOST_HERE.s1.eu.hivemq.cloud
MQTT_PORT=8883
MQTT_USERNAME=raspi_publisher
MQTT_PASSWORD=YOUR_HIVEMQ_PASSWORD_HERE

# Cloudinary Credentials
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
CLOUDINARY_UPLOAD_PRESET=rice_plant_images

# Serial Port (ESP32 Connection)
SERIAL_PORT=/dev/ttyUSB0
SERIAL_BAUDRATE=115200
```

Save the file (`Ctrl+X` → `Y` → `Enter`)

## Step 3.3: Main Publisher Script

Create a file called `rice_monitor.py` on your Raspberry Pi:

```bash
nano /home/pi/rice_monitor.py
```

Paste this code:

```python
#!/usr/bin/env python3
"""
Rice Plant Monitoring System - Raspberry Pi Publisher
Connects to:
  - ESP32 via Serial (receive sensor data)
  - HiveMQ Cloud (publish to MQTT)
  - Cloudinary (upload camera images)
"""

import os
import json
import time
import serial
import traceback
from datetime import datetime
from dotenv import load_dotenv
import paho.mqtt.client as mqtt
import cloudinary
import cloudinary.uploader
from pathlib import Path

# Load environment variables
load_dotenv()

# ==================== CONFIGURATION ====================
MQTT_BROKER = os.getenv('MQTT_BROKER', 'YOUR_BROKER.s1.eu.hivemq.cloud')
MQTT_PORT = int(os.getenv('MQTT_PORT', 8883))
MQTT_USERNAME = os.getenv('MQTT_USERNAME', 'raspi_publisher')
MQTT_PASSWORD = os.getenv('MQTT_PASSWORD', '')
MQTT_KEEPALIVE = 60

SERIAL_PORT = os.getenv('SERIAL_PORT', '/dev/ttyUSB0')
SERIAL_BAUDRATE = int(os.getenv('SERIAL_BAUDRATE', 115200))
SERIAL_TIMEOUT = 1

CLOUDINARY_CLOUD_NAME = os.getenv('CLOUDINARY_CLOUD_NAME', '')
CLOUDINARY_API_KEY = os.getenv('CLOUDINARY_API_KEY', '')
CLOUDINARY_API_SECRET = os.getenv('CLOUDINARY_API_SECRET', '')
CLOUDINARY_UPLOAD_PRESET = os.getenv('CLOUDINARY_UPLOAD_PRESET', 'rice_plant_images')

# Configure Cloudinary
cloudinary.config(
    cloud_name=CLOUDINARY_CLOUD_NAME,
    api_key=CLOUDINARY_API_KEY,
    api_secret=CLOUDINARY_API_SECRET
)

# ==================== GLOBAL STATE ====================
mqtt_client = None
serial_connection = None
is_connected = False
current_plant = 1  # Track which plant camera is currently viewing

# ==================== MQTT CALLBACKS ====================

def on_mqtt_connect(client, userdata, flags, rc):
    """Called when MQTT client connects"""
    global is_connected
    if rc == 0:
        is_connected = True
        print(f"[MQTT] ✅ Connected to HiveMQ Cloud: {MQTT_BROKER}")
        # Subscribe to topics (for future commands, if needed)
        client.subscribe('rice_monitor/commands/#')
    else:
        print(f"[MQTT] ❌ Connection failed with code {rc}")
        is_connected = False

def on_mqtt_disconnect(client, userdata, rc):
    """Called when MQTT client disconnects"""
    global is_connected
    is_connected = False
    if rc != 0:
        print(f"[MQTT] ⚠️ Unexpected disconnection with code {rc}")
    else:
        print(f"[MQTT] Disconnected gracefully")

def on_mqtt_message(client, userdata, msg):
    """Called when an MQTT message is received"""
    try:
        payload = json.loads(msg.payload.decode())
        print(f"[MQTT] Received command on {msg.topic}: {payload}")
        # Handle future commands here
    except Exception as e:
        print(f"[MQTT] Error processing message: {e}")

# ==================== SERIAL COMMUNICATION ====================

def init_serial():
    """Initialize serial connection to ESP32"""
    global serial_connection
    try:
        serial_connection = serial.Serial(
            port=SERIAL_PORT,
            baudrate=SERIAL_BAUDRATE,
            timeout=SERIAL_TIMEOUT
        )
        print(f"[SERIAL] ✅ Connected to ESP32 on {SERIAL_PORT} @ {SERIAL_BAUDRATE} baud")
        return True
    except Exception as e:
        print(f"[SERIAL] ❌ Failed to open serial port: {e}")
        return False

def read_serial_data():
    """Read data from ESP32"""
    try:
        if serial_connection and serial_connection.in_waiting > 0:
            line = serial_connection.readline().decode('utf-8').strip()
            if line:
                return line
    except Exception as e:
        print(f"[SERIAL] Error reading data: {e}")
    return None

# ==================== MQTT PUBLISHING ====================

def publish_sensor_data(plant_id, sensor_data):
    """
    Publish sensor data for a specific plant to MQTT
    
    sensor_data should contain:
    {
        "temperature": 25.5,
        "humidity": 65.3,
        "soil_moisture": 45,
        "water_level": 150,
        "disease_detected": False,
        "disease_confidence": 0.0,
        "timestamp": "2024-01-15T10:30:45Z"
    }
    """
    global mqtt_client, is_connected
    
    if not is_connected or not mqtt_client:
        print(f"[MQTT] ⚠️ Not connected, cannot publish data")
        return False
    
    try:
        topic = f"rice_monitor/plant/{plant_id}/sensors"
        payload = json.dumps(sensor_data, indent=2)
        result = mqtt_client.publish(topic, payload, qos=1)
        
        if result.rc == mqtt.MQTT_ERR_SUCCESS:
            print(f"[MQTT] ✅ Published plant {plant_id} data to {topic}")
            return True
        else:
            print(f"[MQTT] ❌ Failed to publish (code {result.rc})")
            return False
    except Exception as e:
        print(f"[MQTT] ❌ Error publishing data: {e}")
        return False

def publish_global_data(global_data):
    """
    Publish shared sensor data (temp, humidity, water level)
    
    global_data should contain:
    {
        "temperature": 25.5,
        "humidity": 65.3,
        "water_level": 150,
        "timestamp": "2024-01-15T10:30:45Z"
    }
    """
    global mqtt_client, is_connected
    
    if not is_connected or not mqtt_client:
        return False
    
    try:
        topic = "rice_monitor/global/sensors"
        payload = json.dumps(global_data, indent=2)
        result = mqtt_client.publish(topic, payload, qos=1)
        
        if result.rc == mqtt.MQTT_ERR_SUCCESS:
            print(f"[MQTT] ✅ Published global sensor data")
            return True
        else:
            print(f"[MQTT] ❌ Failed to publish global data")
            return False
    except Exception as e:
        print(f"[MQTT] ❌ Error publishing global data: {e}")
        return False

def publish_camera_image_url(plant_id, image_url):
    """
    Publish the Cloudinary image URL for a specific plant
    """
    global mqtt_client, is_connected
    
    if not is_connected or not mqtt_client:
        return False
    
    try:
        topic = f"rice_monitor/plant/{plant_id}/camera"
        payload = json.dumps({
            "plant_id": plant_id,
            "image_url": image_url,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }, indent=2)
        result = mqtt_client.publish(topic, payload, qos=1)
        
        if result.rc == mqtt.MQTT_ERR_SUCCESS:
            print(f"[MQTT] ✅ Published camera image URL for plant {plant_id}")
            return True
        else:
            print(f"[MQTT] ❌ Failed to publish camera URL")
            return False
    except Exception as e:
        print(f"[MQTT] ❌ Error publishing camera URL: {e}")
        return False

def publish_active_plant(plant_id):
    """
    Publish which plant the camera is currently viewing
    """
    global mqtt_client, is_connected
    
    if not is_connected or not mqtt_client:
        return False
    
    try:
        topic = "rice_monitor/camera/active_plant"
        payload = json.dumps({
            "active_plant": plant_id,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }, indent=2)
        result = mqtt_client.publish(topic, payload, qos=1)
        
        if result.rc == mqtt.MQTT_ERR_SUCCESS:
            print(f"[MQTT] ✅ Published active plant: {plant_id}")
            return True
        else:
            print(f"[MQTT] ❌ Failed to publish active plant")
            return False
    except Exception as e:
        print(f"[MQTT] ❌ Error publishing active plant: {e}")
        return False

# ==================== CLOUDINARY IMAGE UPLOAD ====================

def upload_image_to_cloudinary(image_path, plant_id):
    """
    Upload an image to Cloudinary and return the public URL
    
    Args:
        image_path (str): Path to the image file on Raspberry Pi
        plant_id (int): Plant ID (1-6)
    
    Returns:
        str: Public URL of the uploaded image, or None if failed
    """
    try:
        print(f"[CLOUDINARY] 📤 Uploading image for plant {plant_id}...")
        
        if not Path(image_path).exists():
            print(f"[CLOUDINARY] ❌ Image file not found: {image_path}")
            return None
        
        # Upload to Cloudinary with public ID for easy reference
        public_id = f"rice_monitoring/plant_{plant_id}_{int(time.time())}"
        
        response = cloudinary.uploader.upload(
            image_path,
            public_id=public_id,
            folder='rice_monitoring',
            resource_type='image',
            overwrite=False,  # Keep backup of each image
            tags=['rice_monitor', f'plant_{plant_id}']
        )
        
        image_url = response['secure_url']
        print(f"[CLOUDINARY] ✅ Image uploaded: {image_url}")
        
        return image_url
    except Exception as e:
        print(f"[CLOUDINARY] ❌ Error uploading image: {e}")
        traceback.print_exc()
        return None

# ==================== MOCK DATA GENERATOR (FOR TESTING) ====================

def generate_mock_sensor_data(plant_id):
    """
    Generate mock sensor data for testing.
    Replace this with real sensor data from ESP32 when ready.
    """
    import random
    
    base_temp = 25 + random.uniform(-2, 2)
    base_humidity = 65 + random.uniform(-5, 5)
    base_moisture = 50 + random.uniform(-10, 10)
    base_water = 150 + random.uniform(-20, 20)
    disease = random.choice([True, False])
    
    return {
        "plant_id": plant_id,
        "temperature": round(base_temp, 1),
        "humidity": round(base_humidity, 1),
        "soil_moisture": round(base_moisture, 1),
        "water_level": round(base_water, 1),
        "disease_detected": disease,
        "disease_confidence": round(random.uniform(0, 1), 3) if disease else 0.0,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }

# ==================== MAIN LOOP ====================

def main():
    """Main loop: read from ESP32, publish to MQTT & Cloudinary"""
    global mqtt_client, current_plant
    
    print("\n" + "="*60)
    print("🌾 Rice Plant Monitoring System - Starting...")
    print("="*60 + "\n")
    
    # Initialize MQTT
    try:
        mqtt_client = mqtt.Client(
            client_id=f"raspi_publisher_{int(time.time())}",
            protocol=mqtt.MQTTv311
        )
        mqtt_client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)
        mqtt_client.tls_set()  # Enable TLS
        mqtt_client.on_connect = on_mqtt_connect
        mqtt_client.on_disconnect = on_mqtt_disconnect
        mqtt_client.on_message = on_mqtt_message
        
        print("[MQTT] 🔌 Connecting to HiveMQ Cloud...")
        mqtt_client.connect(MQTT_BROKER, MQTT_PORT, MQTT_KEEPALIVE)
        mqtt_client.loop_start()  # Start MQTT network loop in background
        
        # Wait for connection
        for i in range(10):
            if is_connected:
                break
            time.sleep(1)
        
        if not is_connected:
            print("[MQTT] ⚠️ Warning: Not connected to MQTT broker yet, will retry...")
    except Exception as e:
        print(f"[MQTT] ❌ Failed to initialize MQTT: {e}")
        return
    
    # Initialize Serial
    if not init_serial():
        print("[MAIN] ⚠️ Warning: Serial not initialized, will use mock data for testing")
    
    print("\n[MAIN] 🚀 Main loop started. Press Ctrl+C to exit.\n")
    
    try:
        while True:
            # ===== EXAMPLE 1: Publish sensor data for plant 1 =====
            # In real operation, you'd read this from ESP32 via serial
            
            sensor_data = generate_mock_sensor_data(1)  # Replace with real data from ESP32
            publish_sensor_data(1, sensor_data)
            
            # ===== EXAMPLE 2: Publish global data (shared temp/humidity) =====
            global_data = {
                "temperature": sensor_data["temperature"],
                "humidity": sensor_data["humidity"],
                "water_level": sensor_data["water_level"],
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
            publish_global_data(global_data)
            
            # ===== EXAMPLE 3: Publish active plant =====
            publish_active_plant(1)
            
            # ===== EXAMPLE 4: Upload image (if camera captured one) =====
            # Example image path (replace with actual camera image path)
            # example_image = "/home/pi/plant_1_photo.jpg"
            # if Path(example_image).exists():
            #     image_url = upload_image_to_cloudinary(example_image, 1)
            #     if image_url:
            #         publish_camera_image_url(1, image_url)
            
            time.sleep(5)  # Publish every 5 seconds
    
    except KeyboardInterrupt:
        print("\n[MAIN] 🛑 Shutting down gracefully...")
    except Exception as e:
        print(f"[MAIN] ❌ Error in main loop: {e}")
        traceback.print_exc()
    finally:
        if mqtt_client:
            mqtt_client.loop_stop()
            mqtt_client.disconnect()
        if serial_connection:
            serial_connection.close()
        print("[MAIN] ✅ Shutdown complete.")

if __name__ == '__main__':
    main()
```

**Save the file** (`Ctrl+X` → `Y` → `Enter`)

**Make it executable:**
```bash
chmod +x /home/pi/rice_monitor.py
```

## Step 3.4: Test the Script

Run the script to verify it connects:

```bash
python3 /home/pi/rice_monitor.py
```

You should see output like:
```
[MQTT] 🔌 Connecting to HiveMQ Cloud...
[MQTT] ✅ Connected to HiveMQ Cloud: abc123456.s1.eu.hivemq.cloud
[SERIAL] ✅ Connected to ESP32 on /dev/ttyUSB0 @ 115200 baud
[MAIN] 🚀 Main loop started. Press Ctrl+C to exit.
```

If there are errors, check:
1. Environment variables in `.env` are correct
2. Raspberry Pi has internet connection
3. Serial port is correct (`/dev/ttyUSB0` may differ on your Pi)

**To stop:** Press `Ctrl+C`

## Step 3.5: Run on Raspberry Pi Boot (Auto-start)

Create a systemd service file:

```bash
sudo nano /etc/systemd/system/rice_monitor.service
```

Paste this:

```ini
[Unit]
Description=Rice Plant Monitor - MQTT Publisher
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi
ExecStart=/usr/bin/python3 /home/pi/rice_monitor.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable rice_monitor
sudo systemctl start rice_monitor
```

Check if it's running:
```bash
sudo systemctl status rice_monitor
```

---

---

# 4. Website Updates

Your website will subscribe to MQTT topics and display data from HiveMQ Cloud.

## Step 4.1: Update MQTT Service

Update your `src/services/mqttService.js` file to connect to HiveMQ Cloud:

```javascript
import mqtt from 'mqtt';

/**
 * MQTT Service for HiveMQ Cloud connection
 */

// ===== CONFIGURATION =====
// Read from environment variables
const BROKER_HOST = import.meta.env.VITE_MQTT_BROKER || 'YOUR_BROKER.s1.eu.hivemq.cloud';
const BROKER_PORT = import.meta.env.VITE_MQTT_WEBSOCKET_PORT || 8884; // WebSocket Secure port
const MQTT_USERNAME = import.meta.env.VITE_MQTT_USERNAME || 'raspi_publisher';
const MQTT_PASSWORD = import.meta.env.VITE_MQTT_PASSWORD || '';

const MQTT_URL = `wss://${BROKER_HOST}:${BROKER_PORT}/mqtt`;

// MQTT Topics
const TOPICS = {
  plantSensors: (plantId) => `rice_monitor/plant/${plantId}/sensors`,
  plantCamera: (plantId) => `rice_monitor/plant/${plantId}/camera`,
  globalSensors: 'rice_monitor/global/sensors',
  activeCamera: 'rice_monitor/camera/active_plant',
};

// ===== STATE =====
let client = null;
let subscribers = [];
let isConnected = false;

/**
 * Connect to HiveMQ Cloud broker
 */
export const connectMqtt = async (onConnect, onError, onMessage) => {
  if (client && isConnected) {
    console.log('[MQTT] Already connected');
    return Promise.resolve();
  }

  if (client && !isConnected) {
    client.end(true);
    client = null;
  }

  return new Promise((resolve, reject) => {
    try {
      console.log(`[MQTT] Connecting to ${BROKER_HOST}:${BROKER_PORT}...`);

      client = mqtt.connect(MQTT_URL, {
        clientId: `website_${Math.random().toString(16).slice(3)}`,
        username: MQTT_USERNAME,
        password: MQTT_PASSWORD,
        keepalive: 60,
        clean: true,
        reconnectPeriod: 3000,
        protocolVersion: 4,
      });

      client.on('connect', () => {
        console.log('[MQTT] ✅ Connected to HiveMQ Cloud!');
        isConnected = true;

        // Subscribe to all relevant topics
        const topicsToSubscribe = [
          TOPICS.globalSensors,
          TOPICS.activeCamera,
          ...Array.from({ length: 6 }, (_, i) => TOPICS.plantSensors(i + 1)),
          ...Array.from({ length: 6 }, (_, i) => TOPICS.plantCamera(i + 1)),
        ];

        client.subscribe(topicsToSubscribe, (error) => {
          if (error) {
            console.error('[MQTT] ❌ Subscribe error:', error);
            reject(error);
          } else {
            console.log('[MQTT] ✅ Subscribed to all topics');
            resolve();
          }
        });

        if (onConnect) onConnect();
      });

      client.on('message', (topic, message) => {
        try {
          const payload = message.toString();
          const data = JSON.parse(payload);
          console.log(`[MQTT] Received on ${topic}:`, data);

          if (onMessage) {
            onMessage(topic, data);
          }

          // Notify all subscribers
          subscribers.forEach((callback) => callback(topic, data));
        } catch (error) {
          console.error('[MQTT] ❌ Message parse error:', error);
        }
      });

      client.on('error', (error) => {
        console.error('[MQTT] ❌ Connection error:', error);
        isConnected = false;
        if (onError) onError(error);
        reject(error);
      });

      client.on('close', () => {
        console.log('[MQTT] ℹ️ Connection closed');
        isConnected = false;
      });
    } catch (error) {
      console.error('[MQTT] ❌ Connection failed:', error);
      reject(error);
    }
  });
};

/**
 * Subscribe to MQTT messages
 */
export const subscribeToMqtt = (callback) => {
  subscribers.push(callback);
  return () => {
    subscribers = subscribers.filter((cb) => cb !== callback);
  };
};

/**
 * Get connection status
 */
export const isMqttConnected = () => isConnected;

/**
 * Disconnect from MQTT
 */
export const disconnectMqtt = () => {
  if (client) {
    client.end();
    client = null;
    isConnected = false;
  }
};

/**
 * Publish message (for future commands)
 */
export const publishMqtt = (topic, payload) => {
  if (!client || !isConnected) {
    console.error('[MQTT] ❌ Not connected');
    return false;
  }
  client.publish(topic, JSON.stringify(payload));
  return true;
};

// Export topic constants
export { TOPICS };
```

## Step 4.2: Create a New Component to Handle MQTT Data

Create a new file: `src/hooks/useMqttData.js`

```javascript
import { useEffect, useState, useCallback } from 'react';
import { connectMqtt, subscribeToMqtt, isMqttConnected } from '../services/mqttService';

/**
 * Custom hook to manage MQTT data for all plants
 */
export const useMqttData = () => {
  const [plantData, setPlantData] = useState({
    1: { sensors: null, camera: null },
    2: { sensors: null, camera: null },
    3: { sensors: null, camera: null },
    4: { sensors: null, camera: null },
    5: { sensors: null, camera: null },
    6: { sensors: null, camera: null },
  });

  const [globalData, setGlobalData] = useState(null);
  const [activePlant, setActivePlant] = useState(1);
  const [mqttError, setMqttError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // Handle incoming MQTT messages
  const handleMqttMessage = useCallback((topic, data) => {
    // Parse plant sensors: rice_monitor/plant/1/sensors
    const plantSensorMatch = topic.match(/rice_monitor\/plant\/(\d)\/sensors/);
    if (plantSensorMatch) {
      const plantId = parseInt(plantSensorMatch[1]);
      setPlantData((prev) => ({
        ...prev,
        [plantId]: { ...prev[plantId], sensors: data },
      }));
      return;
    }

    // Parse plant camera: rice_monitor/plant/1/camera
    const plantCameraMatch = topic.match(/rice_monitor\/plant\/(\d)\/camera/);
    if (plantCameraMatch) {
      const plantId = parseInt(plantCameraMatch[1]);
      setPlantData((prev) => ({
        ...prev,
        [plantId]: { ...prev[plantId], camera: data },
      }));
      return;
    }

    // Global sensors
    if (topic === 'rice_monitor/global/sensors') {
      setGlobalData(data);
      return;
    }

    // Active camera plant
    if (topic === 'rice_monitor/camera/active_plant') {
      setActivePlant(data.active_plant);
      return;
    }
  }, []);

  // Connect to MQTT on component mount
  useEffect(() => {
    let unsubscribe = null;

    const connect = async () => {
      try {
        await connectMqtt(
          () => {
            console.log('[useMqttData] Connected to MQTT');
            setIsConnected(true);
            setMqttError(null);
          },
          (error) => {
            console.error('[useMqttData] MQTT error:', error);
            setMqttError(error.message || 'Connection failed');
          },
          handleMqttMessage
        );

        // Subscribe to all messages
        unsubscribe = subscribeToMqtt(handleMqttMessage);
      } catch (error) {
        console.error('[useMqttData] Connection error:', error);
        setMqttError(error.message || 'Failed to connect');
      }
    };

    connect();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [handleMqttMessage]);

  return {
    plantData,
    globalData,
    activePlant,
    setActivePlant,
    mqttError,
    isConnected,
  };
};
```

## Step 4.3: Update Dashboard Component

Update your `src/components/Dashboard.jsx` to use MQTT data:

```javascript
import React, { useState, useEffect, useMemo } from 'react';
import { useMqttData } from '../hooks/useMqttData';
import EspReadings from './EspReadings';
import CameraView from './CameraView';
import DiseaseDetection from './DiseaseDetection';
import SetupIndicator from './SetupIndicator';

const Dashboard = () => {
  const {
    plantData,
    globalData,
    activePlant,
    setActivePlant,
    mqttError,
    isConnected,
  } = useMqttData();

  const [selectedPlant, setSelectedPlant] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  // Get current plant data
  const currentPlantData = useMemo(
    () => plantData[selectedPlant] || {},
    [plantData, selectedPlant]
  );

  const sensorData = currentPlantData.sensors;
  const cameraData = currentPlantData.camera;
  const imageUrl = cameraData?.image_url || `/images/plant${selectedPlant}.svg`;

  // Handle plant selection (button click)
  const handlePlantSelect = (plantId) => {
    setSelectedPlant(plantId);
  };

  return (
    <main className="flex-1 h-full flex flex-col overflow-y-auto overflow-x-hidden px-2 py-2 sm:px-4 lg:px-6 custom-scrollbar">
      <div className="flex flex-col min-h-full pb-6">
        {/* Header */}
        <div className="mb-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-white">Dashboard</h2>
              <p className="text-sm text-gray-400">
                {isConnected ? '✅ Live MQTT' : '❌ Offline'}
              </p>
            </div>
            {mqttError && (
              <div className="text-red-400 text-sm">{mqttError}</div>
            )}
          </div>
        </div>

        {/* Plant Selection Buttons */}
        <div className="mb-4 flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5, 6].map((plantId) => (
            <button
              key={plantId}
              onClick={() => handlePlantSelect(plantId)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                selectedPlant === plantId
                  ? 'bg-emerald-500 text-white shadow-lg'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Plant {plantId}
            </button>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Camera View */}
          <div className="lg:col-span-2">
            <CameraView
              imageUrl={imageUrl}
              activePlant={selectedPlant}
              isLoading={false}
              source={isConnected ? 'live' : 'demo'}
            />
          </div>

          {/* Sensor Data */}
          <div className="lg:col-span-1">
            {sensorData ? (
              <EspReadings
                temperature={sensorData.temperature}
                humidity={sensorData.humidity}
                soilMoisture={sensorData.soil_moisture}
                waterLevel={sensorData.water_level}
                disease={sensorData.disease_detected}
              />
            ) : (
              <div className="text-gray-400">Waiting for sensor data...</div>
            )}
          </div>
        </div>

        {/* Global Data */}
        {globalData && (
          <div className="mt-4 p-4 bg-gray-900 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">
              Global Sensors
            </h3>
            <p className="text-xs text-gray-400">
              Shared Temp: {globalData.temperature}°C | Humidity:{' '}
              {globalData.humidity}% | Water Level: {globalData.water_level}cm
            </p>
          </div>
        )}
      </div>
    </main>
  );
};

export default Dashboard;
```

---

---

# 5. Environment Configuration

Create or update your `.env.example` and `.env` files in the `ui/` folder.

## Step 5.1: Create `.env` in `ui/` folder

```bash
cd /path/to/ui/
nano .env
```

Add these values:

```env
# HiveMQ Cloud MQTT Configuration
VITE_MQTT_BROKER=YOUR_BROKER_HOST.s1.eu.hivemq.cloud
VITE_MQTT_WEBSOCKET_PORT=8884
VITE_MQTT_USERNAME=raspi_publisher
VITE_MQTT_PASSWORD=YOUR_HIVEMQ_PASSWORD

# Cloudinary Configuration (for image display)
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_API_KEY=your_api_key

# API Configuration (if using REST API as fallback)
VITE_API_URL=http://localhost:5000
VITE_USE_MOCK=false
```

**IMPORTANT:** Do NOT commit `.env` to git. It should be in `.gitignore`.

## Step 5.2: Update `.env.example`

```bash
nano .env.example
```

```env
# HiveMQ Cloud MQTT Configuration
VITE_MQTT_BROKER=your_cluster_name.s1.eu.hivemq.cloud
VITE_MQTT_WEBSOCKET_PORT=8884
VITE_MQTT_USERNAME=raspi_publisher
VITE_MQTT_PASSWORD=your_password_here

# Cloudinary Configuration
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_API_KEY=your_api_key

# API Configuration
VITE_API_URL=http://localhost:5000
VITE_USE_MOCK=false
```

---

---

# 6. Testing & Troubleshooting

## Step 6.1: Test MQTT Connection

Use an online MQTT client to verify data is being published:

1. Go to: **http://mqtt-explorer.com/** (or install MQTT Explorer)
2. Connection Settings:
   - **Host**: `YOUR_BROKER.s1.eu.hivemq.cloud`
   - **Port**: `8883`
   - **Username**: `raspi_publisher`
   - **Password**: `YOUR_PASSWORD`
   - **Protocol**: `MQTT with TLS`
3. Click **CONNECT**
4. You should see topics appearing:
   - `rice_monitor/plant/1/sensors`
   - `rice_monitor/plant/2/sensors`
   - etc.

## Step 6.2: Test Website

1. Build and start the website:
```bash
cd /path/to/ui/
npm install
npm run dev
```

2. Open in browser: `http://localhost:5173`
3. You should see:
   - Plant selection buttons (1-6)
   - Real-time sensor data from MQTT
   - Camera images from Cloudinary
   - Green "✅ Live MQTT" indicator if connected

## Step 6.3: Troubleshooting

### Issue: MQTT Not Connecting

**Check these:**
- ✅ Internet connection on Raspberry Pi
- ✅ HiveMQ credentials are correct in `.env`
- ✅ Firewall not blocking port 8883 (MQTT) or 8884 (WebSocket)
- ✅ Run: `python3 /home/pi/rice_monitor.py` manually to see errors

**Test connectivity:**
```bash
# On Raspberry Pi
ping 8.8.8.8  # Check internet
telnet YOUR_BROKER.s1.eu.hivemq.cloud 8883  # Check MQTT port
```

### Issue: Images Not Uploading to Cloudinary

**Check these:**
- ✅ Cloudinary credentials correct in `.env`
- ✅ Image file exists at the path specified
- ✅ Raspberry Pi has internet connection
- ✅ Check Cloudinary dashboard for upload errors

**Test manually:**
```bash
python3 -c "
import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv
import os

load_dotenv()
cloudinary.config(
    cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key=os.getenv('CLOUDINARY_API_KEY'),
    api_secret=os.getenv('CLOUDINARY_API_SECRET')
)
result = cloudinary.uploader.upload('test.jpg')
print(result['secure_url'])
"
```

### Issue: Website Shows Mock Data

**Check these:**
- ✅ `VITE_USE_MOCK=false` in website `.env`
- ✅ MQTT credentials correct
- ✅ Browser console (F12) for JavaScript errors
- ✅ Check if Raspberry Pi is publishing data

---

---

# 7. Data Flow Diagram

```
┌────────────────────────────────────────────────────────────────────┐
│                        SYSTEM DATA FLOW                             │
└────────────────────────────────────────────────────────────────────┘

SENSOR DATA (Real-time):
┌─────────────┐
│   ESP32     │
│  Sensors:   │
│  - Temp     │
│  - Humidity │──── UART/Serial ────┐
│  - Moisture │                      │
│  - Level    │                      │
└─────────────┘                      ▼
                            ┌──────────────────┐
                            │  Raspberry Pi    │
                            │                  │
                            │  rice_monitor.py │───── WiFi/Internet ────┐
                            │                  │                         │
                            └──────────────────┘                         ▼
                                    │                           ┌─────────────────────┐
                                    │                           │  HiveMQ Cloud       │
                                    │                           │  Broker             │
                                    └──── Publish MQTT ────────▶│                     │
                                                                │  Topics:            │
                                                                │  plant/1/sensors    │
                                                                │  plant/2/sensors    │
                                                                │  ...                │
                                                                └─────────────────────┘
                                                                          ▲
                                                                          │
                                                                   Subscribe (WebSocket)
                                                                          │
                                                                ┌─────────┴──────────┐
                                                                │                    │
                                                        ┌───────────────┐  ┌────────────────┐
                                                        │   Browser     │  │   Mobile App   │
                                                        │   Dashboard   │  │   (Future)     │
                                                        └───────────────┘  └────────────────┘

CAMERA IMAGES:
┌──────────────────┐
│ Raspberry Pi     │
│ Camera           │───── Capture Image ───┐
│ (YOLOv8)         │                       │
└──────────────────┘                       ▼
                            ┌──────────────────────┐
                            │  rice_monitor.py     │
                            │  (upload_image_to_   │
                            │   cloudinary())      │
                            └──────────────────────┘
                                    │
                            (REST API Upload)
                                    ▼
                            ┌──────────────────────┐
                            │  Cloudinary          │
                            │  (Image Storage)     │
                            └──────────────────────┘
                                    │
                        (Publish Cloudinary URL via MQTT)
                                    │
                            ┌───────┴──────────────┐
                            │                      │
                    ┌───────────────┐      ┌─────────────────┐
                    │  HiveMQ Cloud │      │  Browser        │
                    │  plant/X/     │─────▶│  (Display Image)│
                    │  camera topic │      └─────────────────┘
                    └───────────────┘
```

---

---

## Quick Reference: Your Credentials

**Print this for your client and fill in:**

```
🌾 RICE PLANT MONITORING - CREDENTIALS CHECKLIST
================================================

HiveMQ Cloud:
  Broker Host:        _____________________________________
  MQTT Port:          8883
  WebSocket Port:     8884
  Username:           _____________________________________
  Password:           _____________________________________

Cloudinary:
  Cloud Name:         _____________________________________
  API Key:            _____________________________________
  API Secret:         _____________________________________
  Upload Preset:      rice_plant_images

Raspberry Pi:
  Hostname/IP:        _____________________________________
  Serial Port:        /dev/ttyUSB0 (or ___________________)
  Baud Rate:          115200

Website:
  URL:                http://localhost:5173 (dev) or _____
  Environment File:   ui/.env

ESP32:
  Serial Connection:  UART to Raspberry Pi
```

---

## Summary

You now have:

1. ✅ **Raspberry Pi Script** (`rice_monitor.py`) that:
   - Reads sensor data from ESP32 via Serial
   - Publishes to HiveMQ Cloud via MQTT
   - Uploads camera images to Cloudinary
   - Publishes Cloudinary URLs via MQTT

2. ✅ **Website** that:
   - Connects to HiveMQ Cloud via WebSocket
   - Displays real-time sensor data
   - Shows Cloudinary images
   - Has 6 buttons to select plants manually

3. ✅ **Cloud Services**:
   - HiveMQ Cloud for real-time data
   - Cloudinary for image storage

**Next Steps for Your Client:**
1. Set up HiveMQ Cloud account & get credentials
2. Set up Cloudinary account & get credentials
3. SSH to Raspberry Pi and run the setup steps
4. Update website `.env` with credentials
5. Test with MQTT Explorer to verify data flow
6. Deploy website

Good luck! 🚀
