# 🌾 Remote Connection Guide — Rice Plant Monitoring System
### Connecting Your Raspberry Pi Hardware to the Website Remotely

---

## 📋 Table of Contents
1. [System Architecture Overview](#1-system-architecture-overview)
2. [Understanding the Current Setup](#2-understanding-the-current-setup)
3. [The Core Problem: Remote Access Across Networks](#3-the-core-problem-remote-access-across-networks)
4. [Option A — MQTT over the Internet via a Cloud Broker (Recommended)](#4-option-a--mqtt-over-the-internet-via-a-cloud-broker-recommended)
5. [Option B — Ngrok / Cloudflare Tunnel (No Cloud Broker Needed)](#5-option-b--ngrok--cloudflare-tunnel-no-cloud-broker-needed)
6. [Option C — VPN (ZeroTier / Tailscale)](#6-option-c--vpn-zerotier--tailscale)
7. [Step-by-Step: Setting Up Option A (HiveMQ Cloud + MQTT.js)](#7-step-by-step-setting-up-option-a-hivemq-cloud--mqttjs)
8. [Raspberry Pi Camera (MJPEG Stream) — Remote Access](#8-raspberry-pi-camera-mjpeg-stream--remote-access)
9. [Full Data Flow Summary](#9-full-data-flow-summary)
10. [Frequently Asked Questions](#10-frequently-asked-questions)

---

## 1. System Architecture Overview

Your system has three layers:

```
[ ESP32 Sensors ]
   │  (Serial / UART / local Wi-Fi)
   ▼
[ Raspberry Pi 4B ]   ◄── Raspberry Pi Camera (MJPEG stream + YOLOv8 disease detection)
   │  (MQTT Publisher + HTTP stream server)
   ▼
[ MQTT Broker ]       ◄── This is the "relay" that needs to be accessible from anywhere
   │
   ▼
[ Website / Dashboard ]
   (Browser runs MQTT.js WebSocket client → subscribes to topics → shows live data)
```

### Sensors and What Sends Them

| Parameter | Sensor | Sender | Notes |
|---|---|---|---|
| Temperature | DHT22 | ESP32 → Raspberry Pi | 1 sensor shared across all 6 plants |
| Humidity | DHT22 | ESP32 → Raspberry Pi | Same sensor as temperature |
| Soil Moisture | Capacitive sensor | ESP32 → Raspberry Pi | 6 sensors, 1 per plant |
| Water Level / Reservoir | Ultrasonic sensor | ESP32 → Raspberry Pi | 1 shared sensor |
| Disease Detection | Raspberry Pi Camera | Raspberry Pi (YOLOv8) | Camera rotates among 6 setups |
| Live Camera Feed | Raspberry Pi Camera | Raspberry Pi | MJPEG stream |

> **Key Design Decision (Per Your Update):** The ESP32 sends all sensor data to the Raspberry Pi via Serial/UART. The Raspberry Pi alone connects to Wi-Fi and handles all publishing to MQTT. This is the correct and recommended approach — the ESP32 does NOT need its own internet connection.

---

## 2. Understanding the Current Setup

From the dashboard image you provided, the website currently expects:

- **MQTT Broker IP**: `192.168.1.100` (your Pi's local IP)
- **Port**: `9001` (WebSocket port for MQTT)

**This works ONLY when:**
- The browser (your laptop/phone) and the Raspberry Pi are on the **same Wi-Fi network**.

**This FAILS when:**
- You are at school, the Pi is at the greenhouse (5 barangays away), different networks — the IP `192.168.1.100` is a **private/local IP** and is **not reachable from the internet**.

This is exactly the problem you need to solve.

---

## 3. The Core Problem: Remote Access Across Networks

### Why Local IPs Don't Work Remotely

Every home/office router assigns **private IP addresses** (e.g., `192.168.x.x`) to devices. These addresses are:
- **Only visible within that local network**
- **Invisible from outside** (the internet only sees the router's public IP)
- **Dynamic** — the public IP of the router at the greenhouse can change every day

So when you type `192.168.1.100` into the website while you're at school, the browser has no idea where to find that Pi — it looks for it on your school's local network, not the greenhouse network.

### The Solution: A "Relay" or "Tunnel"

You need something that sits **in between** — accessible from both the greenhouse Pi AND your school browser. Here are your three best options:

---

## 4. Option A — MQTT over the Internet via a Cloud Broker (Recommended)

### How It Works

Instead of the Pi being its own MQTT broker, you use a **free cloud MQTT broker** (e.g., HiveMQ Cloud, EMQX Cloud, or broker.hivemq.com). Both the Pi and the website connect to this cloud broker.

```
[ Raspberry Pi @ Greenhouse ]
   │  Publishes to: mqtt.hivemq.com:8883 (TLS)
   ▼
[ HiveMQ Cloud Broker ] ◄──── hosted on the internet, always reachable
   ▼
[ Your Browser @ School ]
   │  Subscribes via WebSocket: wss://mqtt.hivemq.com:8884
   ▼
[ Dashboard shows live data ]
```

### Pros
- ✅ **Free tier available** (HiveMQ Cloud free plan)
- ✅ **No port forwarding** on your router required
- ✅ Works from any internet connection worldwide
- ✅ Reliable, always-on, professionally maintained
- ✅ Secure (TLS encryption)
- ✅ No dynamic IP problem — cloud URL is always the same
- ✅ Works perfectly with your existing MQTT.js setup on the website

### Cons
- ❌ Requires internet at the greenhouse (Wi-Fi or mobile data hotspot on the Pi)
- ❌ Free tier has message rate limits (usually sufficient for your use case)
- ❌ Camera MJPEG stream needs a separate solution (see Section 8)

### Difficulty: ⭐⭐ (Easy)

---

## 5. Option B — Ngrok / Cloudflare Tunnel (No Cloud Broker Needed)

### How It Works

You keep your **local MQTT broker on the Pi** (Mosquitto), and use a tunneling tool like **ngrok** or **Cloudflare Tunnel** to create a secure public URL that points directly to your Pi's ports.

```
[ Raspberry Pi @ Greenhouse ]
   │  Runs: Mosquitto (local broker) + ngrok
   ▼
[ ngrok servers ]  →  gives you a URL like: tcp://0.tcp.ngrok.io:12345
   ▼
[ Your Browser @ School ]
   │  Connects to: 0.tcp.ngrok.io:12345
   ▼
[ Dashboard shows live data ]
```

### Pros
- ✅ No need to change MQTT broker — keep using Mosquitto on the Pi
- ✅ Can also tunnel the camera stream (two tunnels: one for MQTT, one for MJPEG)
- ✅ Quick to set up (15 minutes)

### Cons
- ❌ **Free ngrok URLs change every time ngrok restarts** — you'd need to update the website IP/port each time
- ❌ Paid ngrok plan required for static URLs (~$10/month)
- ❌ Adds extra latency (data goes Pi → ngrok servers → browser)
- ❌ If the Pi reboots, ngrok must be restarted

### Difficulty: ⭐⭐ (Easy to Medium)

---

## 6. Option C — VPN (ZeroTier / Tailscale)

### How It Works

You install a **VPN software** on both the Raspberry Pi and your laptop/phone. This creates a **virtual private network** — it's as if both devices are on the same local network, even if they're physically far apart.

```
[ Raspberry Pi @ Greenhouse ] ─── ZeroTier VPN ───► Virtual IP: 172.22.xx.xx
[ Your Laptop @ School ]      ─── ZeroTier VPN ───► Virtual IP: 172.22.yy.yy
                                                 ↑
                              Both devices are on the same virtual LAN
                              You can use 172.22.xx.xx directly in the website!
```

### Pros
- ✅ **Free** for up to 25 devices (ZeroTier) or personal use (Tailscale)
- ✅ Works with your existing local setup — no changes to MQTT config needed
- ✅ Also gives you SSH access to the Pi remotely
- ✅ Can stream camera feed directly over VPN

### Cons
- ❌ Requires installing ZeroTier/Tailscale app on **every device** that will view the dashboard
- ❌ If classmates/professors need to view the dashboard, they each need the VPN app installed
- ❌ Slightly complex initial setup
- ❌ Not ideal if the dashboard is meant to be publicly accessible

### Difficulty: ⭐⭐⭐ (Medium)

---

## 7. Step-by-Step: Setting Up Option A (HiveMQ Cloud + MQTT.js)

> **This is the most recommended option** for a thesis project — free, reliable, no special software on viewer devices, and works from anywhere.

---

### Step 1: Create a Free HiveMQ Cloud Account

1. Go to: **https://www.hivemq.com/mqtt-cloud-broker/**
2. Click **"Start Free"** and register an account
3. Create a new **Free Cluster**
4. Note your credentials:
   - **Host**: something like `abc123.s1.eu.hivemq.cloud`
   - **Username**: (you set this)
   - **Password**: (you set this)
   - **WebSocket Port**: `8884` (for browser WebSocket with TLS)
   - **MQTT Port**: `8883` (for Pi/Mosquitto with TLS)

---

### Step 2: Configure Mosquitto on the Raspberry Pi as a Bridge (Forward to Cloud)

You have two options here. **Option 2A is simpler.**

#### Option 2A: Use Python `paho-mqtt` to publish directly (Simplest)

Instead of Mosquitto being the broker, your Pi Python script publishes directly to the cloud broker.

Install paho-mqtt on the Pi:
```bash
pip3 install paho-mqtt
```

Example Pi Python publisher script:
```python
import paho.mqtt.client as mqtt
import serial
import json
import time

# HiveMQ Cloud credentials
BROKER = "YOUR_CLUSTER.s1.eu.hivemq.cloud"
PORT = 8883
USERNAME = "your_username"
PASSWORD = "your_password"

# Serial connection to ESP32
ser = serial.Serial('/dev/ttyUSB0', 115200, timeout=1)

client = mqtt.Client(client_id="raspberry_pi", protocol=mqtt.MQTTv5)
client.username_pw_set(USERNAME, PASSWORD)
client.tls_set()  # Enable TLS for secure connection
client.connect(BROKER, PORT, keepalive=60)
client.loop_start()

def publish_sensor_data(plant_id, temp, humidity, soil_moisture, water_level, disease_detected):
    payload = json.dumps({
        "plant_id": plant_id,
        "temperature": temp,
        "humidity": humidity,
        "soil_moisture": soil_moisture,
        "water_level": water_level,
        "disease_detected": disease_detected,
        "timestamp": time.time()
    })
    client.publish(f"rice_monitor/plant/{plant_id}/sensors", payload, qos=1)
    print(f"Published plant {plant_id}: {payload}")

# Also publish a global topic for shared sensors
def publish_global_data(temp, humidity, water_level):
    payload = json.dumps({
        "temperature": temp,
        "humidity": humidity,
        "water_level": water_level,
        "timestamp": time.time()
    })
    client.publish("rice_monitor/global/sensors", payload, qos=1)

# Main loop: read from ESP32, parse, publish
while True:
    line = ser.readline().decode('utf-8').strip()
    if line:
        # Parse your ESP32 serial format here
        # Example ESP32 output: "P1,28.5,80,45,HIGH,0"
        # (plant_id, temp, humidity, soil_moisture, water_level, disease)
        parts = line.split(',')
        if len(parts) == 6:
            plant_id = int(parts[0][1:])  # "P1" → 1
            temp = float(parts[1])
            humidity = float(parts[2])
            soil_moisture = int(parts[3])
            water_level = parts[4]
            disease = int(parts[5])
            publish_sensor_data(plant_id, temp, humidity, soil_moisture, water_level, disease)
    time.sleep(0.5)
```

#### Option 2B: Mosquitto Bridge (Advanced)

If you already run Mosquitto as a broker on the Pi, add a bridge config to forward all messages to the cloud:

Edit `/etc/mosquitto/conf.d/bridge.conf`:
```ini
connection hivemq_bridge
address YOUR_CLUSTER.s1.eu.hivemq.cloud:8883
bridge_cafile /etc/ssl/certs/ca-certificates.crt
remote_username your_username
remote_password your_password
topic rice_monitor/# out 1
cleansession true
```

Then restart Mosquitto:
```bash
sudo systemctl restart mosquitto
```

---

### Step 3: Update the Website Dashboard

In your dashboard's MQTT connection settings, update the broker to the cloud broker.

In your React/dashboard code, change the MQTT broker settings from the local IP input to the cloud broker:

```javascript
// OLD (local only):
// const BROKER_IP = "192.168.1.100";
// const PORT = 9001;

// NEW (cloud - works from anywhere):
const BROKER_HOST = "YOUR_CLUSTER.s1.eu.hivemq.cloud";
const PORT = 8884;  // WebSocket Secure port
const USERNAME = "your_username";
const PASSWORD = "your_password";

// MQTT.js connection options
const options = {
  hostname: BROKER_HOST,
  port: PORT,
  protocol: 'wss',       // WebSocket Secure (wss://)
  username: USERNAME,
  password: PASSWORD,
  clientId: `dashboard_${Math.random().toString(16).slice(2)}`,
  clean: true,
  reconnectPeriod: 3000,
};

const client = mqtt.connect(`wss://${BROKER_HOST}:${PORT}/mqtt`, options);

client.on('connect', () => {
  console.log('Connected to HiveMQ Cloud!');
  // Subscribe to all plants
  client.subscribe('rice_monitor/plant/+/sensors');
  client.subscribe('rice_monitor/global/sensors');
});

client.on('message', (topic, message) => {
  const data = JSON.parse(message.toString());
  const plantMatch = topic.match(/plant\/(\d+)\/sensors/);
  if (plantMatch) {
    const plantId = parseInt(plantMatch[1]);
    updatePlantData(plantId, data);  // your UI update function
  }
});
```

---

### Step 4: MQTT Topic Structure

Use a clear, organized topic hierarchy:

| Topic | Publisher | Subscriber | Content |
|---|---|---|---|
| `rice_monitor/plant/1/sensors` | Raspberry Pi | Dashboard | Temp, Humidity, Soil Moisture, Water Level, Disease for Plant 1 |
| `rice_monitor/plant/2/sensors` | Raspberry Pi | Dashboard | Same, for Plant 2 |
| `rice_monitor/plant/3/sensors` | Raspberry Pi | Dashboard | Same, for Plant 3 |
| `rice_monitor/plant/4/sensors` | Raspberry Pi | Dashboard | Same, for Plant 4 |
| `rice_monitor/plant/5/sensors` | Raspberry Pi | Dashboard | Same, for Plant 5 |
| `rice_monitor/plant/6/sensors` | Raspberry Pi | Dashboard | Same, for Plant 6 |
| `rice_monitor/global/sensors` | Raspberry Pi | Dashboard | Shared Temp, Humidity, Water Level |
| `rice_monitor/camera/active_plant` | Raspberry Pi | Dashboard | Which plant the camera is currently viewing (1–6) |

---

### Step 5: Run Everything Automatically on Boot (Pi)

So the Pi starts publishing automatically when powered on:

```bash
sudo nano /etc/systemd/system/rice_monitor.service
```

Paste this:
```ini
[Unit]
Description=Rice Plant Monitor Publisher
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/rice_monitor
ExecStart=/usr/bin/python3 /home/pi/rice_monitor/publisher.py
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable rice_monitor
sudo systemctl start rice_monitor
```

---

## 8. Raspberry Pi Camera (MJPEG Stream) — Remote Access

The MQTT broker solution handles all **sensor data**. But the **live camera feed** (MJPEG stream) is a separate HTTP stream that needs its own remote access solution.

### The Problem

Your Pi runs an MJPEG stream server, for example:
```
http://192.168.1.100:8080/stream
```

This also uses a local IP — same problem as MQTT. You need to expose this remotely.

### Solution A: Cloudflare Tunnel for the Camera Stream (Free)

1. Install Cloudflare Tunnel on the Pi:
```bash
# Download cloudflared
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64.deb
sudo dpkg -i cloudflared-linux-arm64.deb
```

2. Authenticate and create a tunnel:
```bash
cloudflared login
cloudflared tunnel create rice-camera
```

3. Create config at `~/.cloudflared/config.yml`:
```yaml
tunnel: rice-camera
credentials-file: /home/pi/.cloudflared/<tunnel-id>.json

ingress:
  - hostname: camera.yourdomain.com   # or use a free trycloudflare URL
    service: http://localhost:8080
  - service: http_status:404
```

4. Run the tunnel:
```bash
cloudflared tunnel run rice-camera
```

This gives you a permanent public URL like `https://camera.yourdomain.com/stream` that your website can embed directly.

### Solution B: mjpg-streamer + ngrok (Quick and Free for Testing)

On the Pi:
```bash
# Install ngrok
wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-arm.tgz
tar xvzf ngrok-v3-stable-linux-arm.tgz

# Authenticate ngrok
./ngrok config add-authtoken YOUR_NGROK_TOKEN

# Expose camera stream
./ngrok http 8080
```

ngrok will give you a URL like `https://abc123.ngrok.io` — use this as the camera stream URL in the dashboard.

**Note:** Free ngrok URLs change every restart. For a stable URL, use the paid plan or Cloudflare Tunnel.

### Solution C: WebRTC (Advanced, Best Quality)

For the best real-time camera quality, use WebRTC with a STUN/TURN server. This is more complex but gives sub-second latency. Tools like `mediamtx` (formerly rtsp-simple-server) can handle this.

---

## 9. Full Data Flow Summary

Here is the complete recommended data flow for your remote monitoring system:

```
ESP32 Sensors
  ├── DHT22 (Temp/Humidity) ──────┐
  ├── Soil Moisture × 6 ─────────┤  Serial/UART (USB cable)
  └── Ultrasonic (Water Level) ──┘
                                  │
                                  ▼
                         Raspberry Pi 4B
                         ┌──────────────────────────────────┐
                         │ 1. Reads ESP32 serial data        │
                         │ 2. Runs YOLOv8 disease detection  │
                         │ 3. Captures MJPEG camera frames   │
                         │ 4. Publishes to MQTT cloud broker │
                         │ 5. Serves MJPEG HTTP stream       │
                         └──────────────────────────────────┘
                                  │
              ┌───────────────────┼─────────────────────────┐
              ▼                                             ▼
    HiveMQ Cloud MQTT Broker                  Cloudflare Tunnel
    (wss://yourcluster.hivemq.cloud)          (https://camera.yourdomain.com)
              │                                             │
              ▼                                             ▼
         Dashboard Website (Browser)
         ┌──────────────────────────────────────────────────┐
         │  MQTT.js subscribes to sensor topics             │
         │  Displays: Temp, Humidity, Soil, Water, Disease  │
         │  Embeds: Camera stream via <img src="...">       │
         │  User clicks Plant 1–6 buttons to switch view    │
         └──────────────────────────────────────────────────┘
```

### Network Requirements

| Location | Requirement |
|---|---|
| Greenhouse (Pi location) | Stable Wi-Fi or mobile data (4G/LTE hotspot), minimum 2 Mbps upload for camera stream |
| School / Viewer location | Any internet connection (Wi-Fi, mobile data) |
| MQTT data (sensor only) | Very low bandwidth — a few KB per second |
| Camera stream (MJPEG 480p) | ~500 KB/s to 2 MB/s upload from Pi |

---

## 10. Frequently Asked Questions

### ❓ Do I need a static public IP at the greenhouse?

**No.** With a cloud MQTT broker (Option A) and Cloudflare Tunnel, the Pi connects *outward* to the cloud — just like how your phone connects to YouTube. The Pi doesn't need to be "found" by anyone; it's the one reaching out. This means a dynamic IP at the greenhouse is perfectly fine.

### ❓ What if the internet goes down at the greenhouse?

Data will stop flowing to the dashboard. The MQTT client on the Pi should be configured with `reconnect: true` so it automatically reconnects when internet is restored.

### ❓ Can I use mobile data (SIM card) for the Pi instead of Wi-Fi?

Yes. You can connect a USB 4G LTE dongle to the Pi. Many researchers do this for field deployments. Just make sure the SIM has enough data — the camera stream is the heaviest consumer.

### ❓ Is the data secure?

- With HiveMQ Cloud, all MQTT data is encrypted with **TLS (MQTT port 8883, WebSocket port 8884)**.
- Your broker requires **username and password** authentication.
- Make sure to **not hard-code credentials** in the frontend — use environment variables in production.

### ❓ The camera shows which plant is active — how does the website know?

Your Raspberry Pi knows which plant the camera is currently pointing at (it controls the camera rotation). It publishes to:
```
rice_monitor/camera/active_plant  →  payload: {"active_plant": 3}
```
The website subscribes to this topic and automatically highlights Plant 3's panel and displays the camera feed with Plant 3's data.

### ❓ What about the 6 plant buttons in the dashboard?

Since the camera rotates through all plants and the Pi pre-processes all data, all sensor readings for all 6 plants are always available in real-time via MQTT (one topic per plant). The 6 buttons simply switch **which plant's data is displayed** on the dashboard — no need to wait for data to arrive. It's all already there.

### ❓ Which option should I use for a thesis defense demo?

**Option A (HiveMQ Cloud MQTT + Cloudflare Tunnel for camera)** is the most reliable for a live demo:
- No need to connect to the same Wi-Fi as the Pi
- Works from any mobile data or school Wi-Fi
- Free and stable
- Impressive: you can pull out your phone and show real-time data from a greenhouse 5 barangays away

---

## ✅ Quick Summary: Recommended Setup

| Component | Technology | Why |
|---|---|---|
| **Sensor Data Transport** | HiveMQ Cloud MQTT (free tier) | Free, always-on, works anywhere, no port forwarding |
| **Camera Stream** | Cloudflare Tunnel (free) | Free, stable URL, no port forwarding |
| **Pi → MQTT** | Python `paho-mqtt` with TLS | Simple, reliable, well-documented |
| **Browser → MQTT** | MQTT.js over `wss://` | Works in any modern browser, no plugins |
| **Pi Auto-Start** | systemd service | Starts automatically on power-on |
| **Network at Greenhouse** | Wi-Fi router OR 4G LTE hotspot | Any internet connection works |

---

*Guide prepared for: Rice Plant Intelligent Irrigation Monitoring System*
*Hardware: ESP32 + Raspberry Pi 4B + Raspberry Pi Camera + DHT22 + Capacitive Soil Moisture × 6 + Ultrasonic Sensor*

