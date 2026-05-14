# 📊 Historical Data Storage - Setup & Deployment Guide

## Overview

This guide covers setting up the **Node.js backend** with **Supabase PostgreSQL** to store hourly sensor, image, and detection data from your Rice Plant Monitoring System.

### Architecture

```
┌─────────────────────┐
│  Vercel (Frontend)  │
│    React Vite       │
└──────────┬──────────┘
           │ (REST calls)
           ▼
┌─────────────────────┐
│   Render (Backend)  │
│   Node.js Express   │ ◄──┐ Subscribes to MQTT
│   Port: 3001        │    │ and stores data
└──────────┬──────────┘    │
           │                │
           ▼                │
┌─────────────────────┐    │
│  Supabase (Database)│    │
│    PostgreSQL       │    │
└─────────────────────┘    │
                           │
                    ┌──────┴─────────┐
                    │                │
            ┌───────▼─────┐   ┌──────▼──────┐
            │ HiveMQ Cloud│   │  ESP32/Pi   │
            │    MQTT     │   │   MQTT      │
            └─────────────┘   └─────────────┘
```

---

## Part 1: Backend Setup (Local Development)

### Prerequisites

- Node.js 16+ installed
- Supabase account (free tier available)
- MQTT credentials (already configured)

### Step 1: Install Dependencies

```bash
cd backend
npm install
```

### Step 2: Set Up Supabase

1. **Create Supabase Project**
   - Go to https://supabase.com
   - Click "New Project"
   - Choose your region (EU recommended for GDPR)
   - Create project

2. **Get Credentials**
   - Go to Project Settings → API
   - Copy:
     - `Project URL` → `SUPABASE_URL`
     - `anon public` key → `SUPABASE_ANON_KEY`
     - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

3. **Create .env file**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your values:

   ```env
   PORT=3001
   NODE_ENV=development

   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

   MQTT_BROKER=d0e0ce8ffc364fe4b5c641f8f84ef0a1.s1.eu.hivemq.cloud
   MQTT_PORT=8883
   MQTT_USERNAME=thesis_pi
   MQTT_PASSWORD=H@rveypads123

   CORS_ORIGIN=http://localhost:5173

   LOG_LEVEL=info
   ```

### Step 3: Initialize Database Schema

**Option A: Using Supabase SQL Editor (Recommended)**

1. In Supabase Dashboard → SQL Editor
2. Click "New Query"
3. Paste the SQL from `src/db/schema.js` (the `SCHEMA_SQL` content)
4. Click "Run"

**Option B: Programmatic (if Option A fails)**

```bash
npm run init-db
```

### Step 4: Test Backend Locally

```bash
npm run dev
```

You should see:
```
🚀 Rice Plant Monitoring Backend Starting...

[DB] Initializing Supabase connection...
[DB] ✅ Supabase connected

[MQTT] Connecting to broker...
[MQTT] ✅ Connected to MQTT

[SERVER] ✅ Listening on port 3001
[SERVER] 🌐 http://localhost:3001
[SERVER] 📊 Dashboard: http://localhost:5173

[INFO] System ready. Collecting and storing sensor data...
```

### Step 5: Test API Endpoints

```bash
# Check health
curl http://localhost:3001/api/health

# Fetch sensor data (last 7 days)
curl "http://localhost:3001/api/history/sensors?startDate=2024-01-01T00:00:00Z&endDate=2024-01-08T23:59:59Z"

# Fetch detection results for plant 1
curl "http://localhost:3001/api/history/detections?plant=1&limit=20"

# Get detection summary
curl "http://localhost:3001/api/history/detections/summary/1?startDate=2024-01-01T00:00:00Z&endDate=2024-01-08T23:59:59Z"
```

---

## Part 2: Frontend Setup (Local Development)

### Update Environment Variables

Edit `ui/.env.local`:

```env
VITE_BACKEND_URL=http://localhost:3001
VITE_API_URL=http://localhost:5000
VITE_MQTT_BROKER=d0e0ce8ffc364fe4b5c641f8f84ef0a1.s1.eu.hivemq.cloud
VITE_MQTT_WEBSOCKET_PORT=8884
VITE_MQTT_USERNAME=thesis_pi
VITE_MQTT_PASSWORD=H@rveypads123
```

### Start Frontend

```bash
cd ui
npm run dev
```

### Access StoredData Component

1. Navigate to http://localhost:5173
2. Click on "Stored Data" sidebar item
3. You should see:
   - **Sensors tab**: Temperature, Humidity, Soil Moisture charts (if data exists)
   - **Detections tab**: Disease detection summary per plant

---

## Part 3: Deployment on Render + Supabase

### Step 1: Push Code to GitHub

```bash
git add .
git commit -m "Add historical data storage with Render + Supabase"
git push origin main
```

### Step 2: Deploy Backend on Render

1. **Create Render Account**
   - Go to https://render.com
   - Sign up

2. **Create New Web Service**
   - Dashboard → Create → Web Service
   - Connect your GitHub repo
   - Select `backend` directory as root
   - Settings:
     - **Name**: `rice-monitoring-backend`
     - **Environment**: Node
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
     - **Plan**: Starter ($7/month, includes 24/7 uptime)

3. **Add Environment Variables**
   - Go to Service → Environment
   - Add all variables from `.env.example`:
     ```
     PORT=3001
     NODE_ENV=production
     SUPABASE_URL=...
     SUPABASE_ANON_KEY=...
     SUPABASE_SERVICE_ROLE_KEY=...
     MQTT_BROKER=...
     MQTT_PORT=8883
     MQTT_USERNAME=...
     MQTT_PASSWORD=...
     CORS_ORIGIN=https://your-app.vercel.app
     ```

4. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment (~2 min)
   - Copy the service URL (e.g., `https://rice-monitoring-backend.onrender.com`)

### Step 3: Deploy Frontend on Vercel

1. **Create Vercel Account**
   - Go to https://vercel.com
   - Import your GitHub repo

2. **Configure Build**
   - Root Directory: `ui`
   - Build Command: `npm run build`
   - Output Directory: `dist`

3. **Set Environment Variables**
   - Add to Project Settings → Environment Variables:
     ```
     VITE_BACKEND_URL=https://rice-monitoring-backend.onrender.com
     VITE_API_URL=https://your-pi-api.com (if you have one)
     VITE_MQTT_BROKER=d0e0ce8ffc364fe4b5c641f8f84ef0a1.s1.eu.hivemq.cloud
     VITE_MQTT_WEBSOCKET_PORT=8884
     VITE_MQTT_USERNAME=thesis_pi
     VITE_MQTT_PASSWORD=H@rveypads123
     ```

4. **Deploy**
   - Click "Deploy"
   - Wait for deployment (~3 min)
   - Get your Vercel URL

### Step 4: Update Render CORS

Update the Render backend's `CORS_ORIGIN` environment variable with your Vercel URL.

---

## Part 4: Verify Everything Works

### Test Backend on Render

```bash
curl https://rice-monitoring-backend.onrender.com/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "mqtt": {
    "connected": true,
    "broker": "d0e0ce8ffc364fe4b5c641f8f84ef0a1.s1.eu.hivemq.cloud"
  },
  "uptime": 3600
}
```

### Test Frontend on Vercel

1. Navigate to your Vercel app
2. Go to "Stored Data" page
3. You should see:
   - ✅ Backend connection status
   - 📊 Charts (if data exists)
   - 🎯 Detection summaries

---

## Part 5: Database Cost & Optimization

### Free Tier Limits

| Service | Free Tier | Limit |
|---------|-----------|-------|
| **Supabase** | 500MB storage | Plenty for ~1 year of hourly data |
| **Render** | None (but sleeps) | Starter ($7/mo): 24/7 uptime |
| **Vercel** | Free | ~3 deployments/month |

### Data Size Estimation

- **Per sensor reading**: ~200 bytes
- **Hourly**: ~200 bytes
- **Daily**: ~4.8 KB
- **Monthly**: ~144 KB
- **Yearly**: ~1.7 MB ✅ (well within free tier)

### To Reduce Costs Further

1. **Downgrade Render if possible** (but you need 24/7 for MQTT)
2. **Archive old data** (move to S3 after 1 year)
3. **Use SQLite locally** (if you don't need cloud access)

---

## Part 6: Troubleshooting

### Backend won't connect to MQTT

1. Check MQTT credentials in `.env`
2. Ensure HiveMQ Cloud is accessible
3. Check firewall/network settings

### Backend won't connect to Supabase

1. Verify `SUPABASE_URL` and keys are correct
2. Ensure tables exist (run init-db script)
3. Check if service role key has proper permissions

### Frontend can't reach backend

1. Verify `VITE_BACKEND_URL` is set correctly
2. Check CORS settings in backend (should match Vercel URL)
3. Check browser console for errors

### No data showing up

1. Verify MQTT is publishing data
2. Check Supabase tables have data:
   - Go to Supabase SQL Editor
   - Run: `SELECT * FROM sensor_readings LIMIT 10;`
3. Ensure backend is running (check Render logs)

---

## API Endpoints Reference

### Health Check

```
GET /api/health
```

Returns: `{ status, mqtt, uptime }`

### Sensor History

```
GET /api/history/sensors?startDate=2024-01-01T00:00:00Z&endDate=2024-01-31T23:59:59Z&limit=100
```

Returns: `{ success, count, data: [{temp, hum, soil_1-6, water_level_*}] }`

### Plant Images

```
GET /api/history/images?plant=1&limit=50
```

Returns: `{ success, count, data: [{id, plant_id, timestamp}] }`

### Detection Results

```
GET /api/history/detections?plant=1&limit=50
```

Returns: `{ success, count, data: [{healthy_count, sheath_blight_count, inference_ms}] }`

### Detection Summary

```
GET /api/history/detections/summary/1?startDate=2024-01-01T00:00:00Z&endDate=2024-01-31T23:59:59Z
```

Returns: `{ success, summary: {total_healthy, total_sheath_blight, detection_count, avg_inference_ms} }`

---

## Monitoring & Logs

### View Render Logs

- Dashboard → Service → Logs
- Filter by time range

### View Supabase Query Performance

- Dashboard → SQL Editor
- Run queries with `EXPLAIN ANALYZE`

### Monitor Disk Usage

- Supabase Dashboard → Usage
- Check storage under 500MB

---

## Next Steps

1. ✅ Backend stores data every hour
2. ✅ Frontend displays historical charts
3. 📋 Optional: Add data export (CSV)
4. 📋 Optional: Add alerts (e.g., if plant is diseased)
5. 📋 Optional: Add real-time notifications

---

**Questions?** Check the logs, verify environment variables, and ensure all services are connected.
